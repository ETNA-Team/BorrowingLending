// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './utils.sol';

/**
 * @dev Partial interface of the NftCollateral contract.
 */
interface ICollateral {
    function getTotalCollateralUsdAmounts (
        address userAddress
    ) external view returns (uint256, uint256);

    function getLiquidationManager () external view returns (address);

    function getUserCollateralUsdAmount (
        address userAddress,
        bool borrowingPower
    ) external view returns (uint256);
}

/**
 * @dev Interface of the Proxy contract.
 */
interface IProxy {
    function getUsdRate (
        address contractAddress
    ) external view returns (uint256);
}

/**
 * @dev Interface of the Proxy contract.
 */
interface IReward {
    function updateRewardData (
        address userAddress,
        uint256 profileId,
        uint256 lent,
        uint256 totalLent
    ) external returns (bool);
}

/**
 * @dev Storage functional for a BorrowingLending contract,
 * functions names are self explanatory
 */
contract StorageContract is UtilsContract {
    event BorrowingLiquidation (
        address indexed userAddress, address indexed liquidatorAddress,
        uint256 borrowingIndex, uint256 timestamp
    );
    event AccessVaultWithdraw (
        address tokenAddress,  uint256 amount, uint256 timestamp
    );
    event AccessVaultReplenish (
        address tokenAddress,  uint256 amount, uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == _owner, '62');
        _;
    }
    modifier onlyManager() {
        require(_managers[msg.sender], '63');
        _;
    }
    modifier onlyCollateralContract() {
        require(msg.sender == address(_collateralContract), '791');
        _;
    }
    modifier onlyAccessVault() {
        require(msg.sender == _accessVault, '792');
        _;
    }

    struct BorrowingProfile {
        address contractAddress;
        uint256 borrowingMarketIndex;
        uint256 borrowingMarketIndexLastTime;
        uint256 lendingMarketIndex;
        uint256 lendingMarketIndexLastTime;
        uint256 totalBorrowed;
        uint256 totalLent;
        uint256 totalLiquidated;
        uint256 totalReturned;
        bool active;
    }
    struct Borrowing {
        address userAddress;
        uint256 borrowingProfileIndex;
        uint256 amount;
        uint256 lastMarketIndex;
        uint256 updatedAt; // timestamp, is resettled to block.timestamp when changed
        uint256 accumulatedFee; // used to store fee when changed
        uint256 fixedApr;
        bool liquidated;
    }
    struct Lending {
        address userAddress;
        uint256 borrowingProfileIndex;
        uint256 amount;
        uint256 unlock;
        uint256 lastMarketIndex;
        uint256 updatedAt; // timestamp, is resettled to block.timestamp when changed
        uint256 accumulatedYield; // used to store reward when changed
    }
    struct UsdRate {
        uint256 rate;
        uint256 updatedAt;
        bool proxy;
    }
    mapping (uint256 => BorrowingProfile) internal _borrowingProfiles;
    mapping (uint256 => Borrowing) internal _borrowings;
    mapping (uint256 => Lending) internal _lendings;
    mapping (address => UsdRate) internal _usdRates;
    mapping (address => bool) internal _managers;
    mapping (address => mapping(uint256 => uint256)) internal _usersBorrowingIndexes;
    // userAddress => borrowingProfileIndex => borrowingIndex
    mapping (address => mapping(uint256 => uint256)) internal _usersLendingIndexes;
    // userAddress => borrowingProfileIndex => lendingIndex
    mapping (address => bool) internal _isUser;

    ICollateral internal _collateralContract;
    IProxy internal _proxyContract;
    IReward internal _rewardContract;
    address internal _owner;
    address internal _accessVault;
    uint256 internal _totalUsers;
    uint256 internal _borrowingProfilesNumber;
    uint256 internal _borrowingsNumber;
    uint256 internal _lendingsNumber;
    uint256 internal constant YEAR = 365 * 24 * 3600;
    uint256 internal constant SHIFT = 1 ether;
    // exponent shifting when calculation with decimals for market index and usd rate
    uint256 internal constant DECIMALS = 10000;
    // exponent shifting when calculation with decimals for percents
    uint256 internal _lockTime = 0; // period when withdraw lending is prohibited
    uint16 internal _aprBorrowingMin; // % * 100
    uint16 internal _aprBorrowingMax; // % * 100
    uint16 internal _aprBorrowingFixed; // % * 100
    uint16 internal _aprLendingMin; // % * 100
    uint16 internal _aprLendingMax; // % * 100

    function addBorrowingProfile (
        address contractAddress
    ) external onlyManager returns (bool) {
        require(contractAddress != address(0), '64');
        _borrowingProfilesNumber ++;
        _borrowingProfiles[_borrowingProfilesNumber].contractAddress = contractAddress;
        _borrowingProfiles[_borrowingProfilesNumber].borrowingMarketIndex = SHIFT;
        _borrowingProfiles[_borrowingProfilesNumber].borrowingMarketIndexLastTime = block.timestamp;
        _borrowingProfiles[_borrowingProfilesNumber].lendingMarketIndex = SHIFT;
        _borrowingProfiles[_borrowingProfilesNumber].lendingMarketIndexLastTime = block.timestamp;
        _borrowingProfiles[_borrowingProfilesNumber].active = true;
        return true;
    }

    function setBorrowingProfileStatus (
        uint256 borrowingProfileIndex,
        bool active
    ) external onlyManager returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '65');
        _borrowingProfiles[borrowingProfileIndex].active = active;
        return true;
    }

    /**
     * @dev Helper function that allows manager to change liquidation status manually
     */
    function setBorrowingLiquidationStatus (
        uint256 borrowingIndex, bool liquidated
    ) external onlyManager returns (bool) {
        require(borrowingIndex > 0 && borrowingIndex <= _borrowingsNumber,
            '67');
        _borrowings[borrowingIndex].liquidated = liquidated;

        return true;
    }

    function setLockTime (
        uint256 lockTime
    ) external onlyManager returns (bool) {
        _lockTime = lockTime;
        return true;
    }

    function setUsdRateData (
        address contractAddress,
        uint256 rate,
        bool proxy
    ) external onlyManager returns (bool) {
        _usdRates[contractAddress].rate = rate;
        _usdRates[contractAddress].proxy = proxy;
        _usdRates[contractAddress].updatedAt = block.timestamp;
        return true;
    }

    function setCollateralContract (
        address collateralContractAddress
    ) external onlyManager returns (bool) {
        require(collateralContractAddress != address(0), '75');
        _collateralContract = ICollateral(collateralContractAddress);
        return true;
    }

    function setProxyContract (
        address proxyContractAddress
    ) external onlyManager returns (bool) {
        _proxyContract = IProxy(proxyContractAddress);
        return true;
    }

    function setRewardContract (
        address rewardContractAddress
    ) external onlyManager returns (bool) {
        _rewardContract = IReward(rewardContractAddress);
        return true;
    }

    function setAccessVault (
        address accessVault
    ) external onlyManager returns (bool) {
        _accessVault = accessVault;
        return true;
    }

    function accessVaultWithdraw(
        uint256 borrowingProfileIndex,
        uint256 amount
    ) external onlyAccessVault returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '65');
        IERC20 tokenContract = IERC20(
            _borrowingProfiles[borrowingProfileIndex].contractAddress
        );
        require(tokenContract.balanceOf(address(this)) >= amount, '794');
        _sendAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            _accessVault,
            amount
        );
        emit AccessVaultWithdraw(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            amount,
            block.timestamp
        );
        return true;
    }

    function accessVaultReplenish(
        uint256 borrowingProfileIndex,
        uint256 amount
    ) external onlyAccessVault returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '65');
        _takeAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            _accessVault,
            amount
        );
        emit AccessVaultReplenish(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            amount,
            block.timestamp
        );
        return true;
    }

    function transferOwnership(address newOwner) public onlyOwner returns (bool) {
        require(newOwner != address(0), '793');
        _owner = newOwner;
        return true;
    }

    function addToManagers (
        address userAddress
    ) external onlyOwner returns (bool) {
        _managers[userAddress] = true;
        return true;
    }

    function removeFromManagers (
        address userAddress
    ) external onlyOwner returns (bool) {
        _managers[userAddress] = false;
        return true;
    }

    function updateUsersList (
        address userAddress
    ) external onlyCollateralContract returns (bool) {
        if (!_isUser[userAddress]) {
            _totalUsers ++;
            _isUser[userAddress] = true;
        }
        return true;
    }

    // view functions
    function getBorrowingsNumber () external view returns (uint256) {
        return _borrowingsNumber;
    }

    function getUsersBorrowingIndex (
        address userAddress, uint256 borrowingProfileIndex
    ) external view returns (uint256) {
        if (
            _borrowings[
                _usersBorrowingIndexes[userAddress][borrowingProfileIndex]
            ].liquidated
        ) return 0;
        return _usersBorrowingIndexes[userAddress][borrowingProfileIndex];
    }

    function getBorrowing (uint256 borrowingIndex) external view returns (
        address userAddress, uint256 borrowingProfileIndex,
        uint256 amount, uint256 accumulatedFee, bool liquidated
    ) {
        return (
            _borrowings[borrowingIndex].userAddress,
            _borrowings[borrowingIndex].borrowingProfileIndex,
            _borrowings[borrowingIndex].amount,
            _borrowings[borrowingIndex].accumulatedFee,
            _borrowings[borrowingIndex].liquidated
        );
    }

    function getBorrowingMarketIndex (uint256 borrowingIndex) external view returns (
        uint256 lastMarketIndex, uint256 updatedAt, uint256 fixedApr
    ) {
        return (
            _borrowings[borrowingIndex].lastMarketIndex,
            _borrowings[borrowingIndex].updatedAt,
            _borrowings[borrowingIndex].fixedApr
        );
    }

    function getLendingsNumber () external view returns (uint256) {
        return _lendingsNumber;
    }

    function getUsersLendingIndex (
        address userAddress, uint256 borrowingProfileIndex
    ) external view returns (uint256) {
        return _usersLendingIndexes[userAddress][borrowingProfileIndex];
    }

    function getLending (uint256 lendingIndex) external view returns (
        address userAddress, uint256 borrowingProfileIndex, uint256 amount,
        uint256 unlock, uint256 accumulatedYield
    ) {
        return (
            _lendings[lendingIndex].userAddress,
            _lendings[lendingIndex].borrowingProfileIndex,
            _lendings[lendingIndex].amount,
            _lendings[lendingIndex].unlock,
            _lendings[lendingIndex].accumulatedYield
        );
    }

    function getLendingMarketIndex (uint256 lendingIndex) external view returns (
        uint256 lastMarketIndex, uint256 updatedAt
    ) {
        return (
            _lendings[lendingIndex].lastMarketIndex,
            _lendings[lendingIndex].updatedAt
        );
    }

    function getBorrowingProfilesNumber () external view returns (uint256) {
        return _borrowingProfilesNumber;
    }

    function getBorrowingProfile (uint256 borrowingProfileIndex) external view returns (
        address contractAddress, uint256 totalBorrowed,
        uint256 totalLent, uint256 totalLiquidated,
        uint256 totalReturned, bool active
    ) {
        return (
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            _borrowingProfiles[borrowingProfileIndex].totalBorrowed,
            _borrowingProfiles[borrowingProfileIndex].totalLent,
            _borrowingProfiles[borrowingProfileIndex].totalLiquidated,
            _borrowingProfiles[borrowingProfileIndex].totalReturned,
            _borrowingProfiles[borrowingProfileIndex].active
        );
    }

    function getBorrowingProfileMarketIndexes (
        uint256 borrowingProfileIndex
    ) external view returns (
        uint256 borrowingMarketIndex, uint256 borrowingMarketIndexLastTime,
        uint256 lendingMarketIndex, uint256 lendingMarketIndexLastTime
    ) {
        return (
            _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndex,
            _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndexLastTime,
            _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex,
            _borrowingProfiles[borrowingProfileIndex].lendingMarketIndexLastTime
        );
    }

    function getCollateralContract () external view returns (address) {
        return address(_collateralContract);
    }

    function getProxyContract () external view returns (address) {
        return address(_proxyContract);
    }

    function getRewardContract () external view returns (address) {
        return address(_rewardContract);
    }

    function getAccessVault () external view returns (address) {
        return _accessVault;
    }

    function getUsdRateData (
        address contractAddress
    ) external view returns (
        uint256 rate, uint256 updatedAt, bool proxy
    ) {
        return (
            _usdRates[contractAddress].rate,
            _usdRates[contractAddress].updatedAt,
            _usdRates[contractAddress].proxy
        );
    }

    function getUsdRate (
        address contractAddress
    ) public view returns (uint256) {
        if (!_usdRates[contractAddress].proxy) return _usdRates[contractAddress].rate;
        return _proxyContract.getUsdRate(contractAddress);
    }

    function getLockTime () external view returns (uint256) {
        return _lockTime;
    }

    function getAprSettings () external view returns (
        uint16 aprBorrowingMin,
        uint16 aprBorrowingMax,
        uint16 aprBorrowingFixed,
        uint16 aprLendingMin,
        uint16 aprLendingMax
    ) {
        return (
            _aprBorrowingMin,
            _aprBorrowingMax,
            _aprBorrowingFixed,
            _aprLendingMin,
            _aprLendingMax
        );
    }

    function getTokenBalance (
        address tokenContractAddress
    ) external view returns (uint256) {
        IERC20 tokenContract = IERC20(tokenContractAddress);
        return tokenContract.balanceOf(address(this));
    }

    function isManager (
        address userAddress
    ) external view returns (bool) {
        return _managers[userAddress];
    }

    function isUser (
        address userAddress
    ) external view returns (bool) {
        return _isUser[userAddress];
    }

    function getTotalUsers () external view returns (uint256) {
        return _totalUsers;
    }

    function owner () external view returns (address) {
        return _owner;
    }

    /**
    * Migrating borrowing data from another contract
    * uint256 values collected into a single array "number" with
    * length 5 times greater than "userAddresses" array
    * Data in "number" array ordered as follows
    * 1 borrowingProfileIndexes
    * 2 amounts
    * 3 fees
    * 4 fixedApr
    * 5 liquidated (if > 0 -> true)
    */
    function migrateBorrowings (
        address[] calldata userAddresses,
        uint256[] calldata numbers
    ) external onlyManager returns (bool) {
        uint256[] memory totalBorrowed = new uint256[](_borrowingProfilesNumber);
        require(
            userAddresses.length * 5 == numbers.length,
            'numbers array length mismatch'
        );
        for (uint256 i; i < userAddresses.length; i ++) {
            if (i > 100) break;
            if (
                _usersBorrowingIndexes[userAddresses[i]]
                    [numbers[i]] > 0
            ) continue;
            _borrowingsNumber ++;
            _borrowings[_borrowingsNumber].userAddress = userAddresses[i];
            _borrowings[_borrowingsNumber].borrowingProfileIndex =
                numbers[i];
            _borrowings[_borrowingsNumber].lastMarketIndex =
                _borrowingProfiles[numbers[i]].borrowingMarketIndex;
            _borrowings[_borrowingsNumber].updatedAt = block.timestamp;
            _borrowings[_borrowingsNumber].amount =
                numbers[i + userAddresses.length];
            _borrowings[_borrowingsNumber].accumulatedFee =
                numbers[i + userAddresses.length * 2];
            _borrowings[_borrowingsNumber].fixedApr =
                numbers[i + userAddresses.length * 3];
            _borrowings[_borrowingsNumber].liquidated =
                numbers[i + userAddresses.length * 4] > 0;
            _usersBorrowingIndexes[userAddresses[i]]
                [numbers[i]] = _borrowingsNumber;
            totalBorrowed[numbers[i] - 1] += numbers[i + userAddresses.length];
        }
        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            if (totalBorrowed[i - 1] == 0) continue;
            _borrowingProfiles[i].totalBorrowed += totalBorrowed[i - 1];
        }
        return true;
    }

    /**
    * Migrating lending data from another contract
    * uint256 values collected into a single array "number" with
    * length 4 times greater than "userAddresses" array
    * Data in "number" array ordered as follows
    * 1 borrowingProfileIndexes
    * 2 amounts
    * 3 yields
    * 4 unlock
    */
    function migrateLendings (
        address[] calldata userAddresses,
        uint256[] calldata numbers
    ) external onlyManager returns (bool) {
        uint256[] memory totalLent = new uint256[](_borrowingProfilesNumber);
        require(
            userAddresses.length * 4 == numbers.length,
            'numbers array length mismatch'
        );
        for (uint256 i; i < userAddresses.length; i ++) {
            if (i > 100) break;
            if (
                _usersLendingIndexes[userAddresses[i]]
                    [numbers[i]] > 0
            ) continue;
            _lendingsNumber ++;
            _lendings[_lendingsNumber].userAddress = userAddresses[i];
            _lendings[_lendingsNumber].borrowingProfileIndex =
                numbers[i];
            _lendings[_lendingsNumber].lastMarketIndex =
                _borrowingProfiles[numbers[i]].lendingMarketIndex;
            _lendings[_lendingsNumber].updatedAt = block.timestamp;
            _lendings[_lendingsNumber].amount =
                numbers[i + userAddresses.length];
            _lendings[_lendingsNumber].accumulatedYield =
                numbers[i + userAddresses.length * 2];
            _lendings[_lendingsNumber].unlock =
                numbers[i + userAddresses.length * 3];
            _usersLendingIndexes[userAddresses[i]]
                [numbers[i]] = _lendingsNumber;
            totalLent[numbers[i] - 1] += numbers[i + userAddresses.length];
        }
        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            if (totalLent[i - 1] == 0) continue;
            _borrowingProfiles[i].totalLent += totalLent[i - 1];
        }
        return true;
    }
}