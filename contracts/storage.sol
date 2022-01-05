// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './utils.sol';

/**
 * @dev Storage functional for a BorrowingLending contract,
 * functions names are self explanatory
 */
contract StorageContract is UtilsContract {
    event BorrowingLiquidation (
        address indexed userAddress, address indexed liquidatorAddress,
        uint256 borrowingIndex, uint256 timestamp
    );
    event CollateralLiquidation (
        address indexed userAddress, address indexed liquidatorAddress,
        uint256 collateralIndex, uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == _owner, '62');
        _;
    }
    modifier onlyManager() {
        require(_managers[msg.sender], '63');
        _;
    }
    modifier onlyLiquidationManager() {
        require(msg.sender == _liquidationManager, '77');
        _;
    }
    modifier onlyLiquidator() {
        require(_liquidators[msg.sender], '78');
        _;
    }
    modifier onlyNftCollateralContract() {
        require(msg.sender == address(_nftCollateralContract), '79');
        _;
    }

    struct BorrowingProfile {
        address contractAddress;
        uint256 usdRate; // *= 10000
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
    struct CollateralProfile {
        address contractAddress;
        uint256 usdRate; // *= 10000
        uint256 borrowingFactor;
        uint256 liquidationFactor;
        uint256 total;
        uint8 collateralType; // 0 - native, 1 - erc20, 2 - ETNA, 3 - NETNA
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
    struct Collateral {
        address userAddress;
        uint256 collateralProfileIndex;
        uint256 amount;
        uint256 prevCollateral;
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
    mapping (uint256 => BorrowingProfile) internal _borrowingProfiles;
    mapping (uint256 => CollateralProfile) internal _collateralProfiles;
    mapping (uint256 => Borrowing) internal _borrowings;
    mapping (uint256 => Lending) internal _lendings;
    mapping (uint256 => Collateral) internal _collaterals;
    mapping (address => uint256) internal _liquidationTime;
    mapping (address => bool) internal _liquidators;
    mapping (address => bool) internal _managers;
    mapping (address => mapping(uint256 => uint256)) internal _usersBorrowingIndexes;
    // userAddress => borrowingProfileIndex => borrowingIndex
    mapping (address => mapping(uint256 => uint256)) internal _usersLendingIndexes;
    // userAddress => borrowingProfileIndex => lendingIndex
    mapping (address => mapping(uint256 => uint256)) internal _usersCollateralIndexes;
    // userAddress => collateralProfileIndex => collateralIndex
    mapping (address => uint256) internal _adminWithdraw;
    mapping (address => uint256) internal _adminReplenish;
    mapping (address => bool) internal _isUser;
    mapping (uint8 => bool) internal _noFee;

    IERC20 internal _etnaContract;
    IERC20 internal _nEtnaContract;
    INftCollateral internal _nftCollateralContract;
    address internal _owner;
    address internal _liquidationManager;
    uint256 internal _totalUsers;
    uint256 internal _borrowingProfilesNumber;
    uint256 internal _collateralProfilesNumber;
    uint256 internal _borrowingsNumber;
    uint256 internal _collateralsNumber;
    uint256 internal _lendingsNumber;
    uint256 internal constant _year = 365 * 24 * 3600;
    uint256 internal constant _marketIndexShift = 1 ether; // market index exponent shifting when calculation with decimals
    uint256 internal constant _percentShift = 10000; // percents exponent shifting when calculation with decimals
    uint256 internal _lockTime = 86400; // period when withdraw lending is prohibited
    uint256 internal _liquidationFee = 1000; // fee that will be paid for liquidation (% * 100)
    uint256 internal _liquidatorPercentage = 500;
    // part of the liquidation fee that will be paid to liquidators (the rest to admin) (% * 100)
    uint256 internal _liquidationFlagMargin = 1000;
    // margin that is added to the collateral amount calculation for removing liquidation flag
    uint256 internal _liquidationPeriod = 86400;
    // period when user can add Collateral or return borrowing to avoid liquidation
    uint16 internal _aprBorrowingMin; // % * 100
    uint16 internal _aprBorrowingMax; // % * 100
    uint16 internal _aprBorrowingFix; // % * 100
    uint16 internal _aprLendingMin; // % * 100
    uint16 internal _aprLendingMax; // % * 100

    function addBorrowingProfile (
        address contractAddress,
        uint256 usdRate
    ) external onlyManager returns (bool) {
        require(contractAddress != address(0), '64');
        _borrowingProfilesNumber ++;
        _borrowingProfiles[_borrowingProfilesNumber].contractAddress = contractAddress;
        _borrowingProfiles[_borrowingProfilesNumber].usdRate = usdRate;
        _borrowingProfiles[_borrowingProfilesNumber].borrowingMarketIndex = _marketIndexShift;
        _borrowingProfiles[_borrowingProfilesNumber].borrowingMarketIndexLastTime = block.timestamp;
        _borrowingProfiles[_borrowingProfilesNumber].lendingMarketIndex = _marketIndexShift;
        _borrowingProfiles[_borrowingProfilesNumber].lendingMarketIndexLastTime = block.timestamp;
        _borrowingProfiles[_borrowingProfilesNumber].active = true;
        return true;
    }

    function addCollateralProfile (
        address contractAddress,
        uint256 usdRate,
        uint256 borrowingFactor,
        uint256 liquidationFactor
    ) external onlyManager returns (bool) {
        uint8 collateralType;
        if (contractAddress == address(0)) collateralType = 0;
        else if (contractAddress == address(_etnaContract)) collateralType = 2;
        else if (contractAddress == address(_nEtnaContract)) collateralType = 3;
        else collateralType = 1;
        _collateralProfilesNumber ++;
        _collateralProfiles[_collateralProfilesNumber].contractAddress = contractAddress;
        _collateralProfiles[_collateralProfilesNumber].usdRate = usdRate;
        _collateralProfiles[_collateralProfilesNumber].borrowingFactor = borrowingFactor;
        _collateralProfiles[_collateralProfilesNumber].liquidationFactor = liquidationFactor;
        _collateralProfiles[_collateralProfilesNumber].collateralType = collateralType;
        _collateralProfiles[_collateralProfilesNumber].active = true;
        return true;
    }

    function setBorrowingProfileRate (
        uint256 borrowingProfileIndex, uint256 usdRate
    ) external onlyManager returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '65');
        _borrowingProfiles[borrowingProfileIndex].usdRate = usdRate;
        return true;
    }

    /**
     * @dev Helper function that allows manager to change liquidation status manually
     */
    function setCollateralLiquidationStatus (
        uint256 collateralIndex, bool liquidated
    ) external onlyManager returns (bool) {
        require(collateralIndex > 0 && collateralIndex <= _collateralsNumber,
            '66');
        _collaterals[collateralIndex].liquidated = liquidated;
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

    /**
     * @dev Helper function that allows manager to change status manually
     */
    function setBorrowingProfileStatus (
        uint256 borrowingProfileIndex, bool active
    ) external onlyManager returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '68');
        _borrowingProfiles[borrowingProfileIndex].active = active;
        return true;
    }

    function setCollateralProfileRate (
        uint256 collateralProfileIndex, uint256 usdRate
    ) external onlyManager returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex <= _collateralProfilesNumber,
            '69');
        _collateralProfiles[collateralProfileIndex].usdRate = usdRate;
        return true;
    }

    /**
     * @dev Helper function that allows manager to change status manually
     */
    function setCollateralProfileStatus (
        uint256 collateralProfileIndex, bool active
    ) external onlyManager returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex <= _collateralProfilesNumber,
            '70');
        _collateralProfiles[collateralProfileIndex].active = active;
        return true;
    }

    function setCollateralProfileBorrowingFactor (
        uint256 collateralProfileIndex, uint256 borrowingFactor
    ) external onlyManager returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex <= _collateralProfilesNumber,
            '71');
        _collateralProfiles[collateralProfileIndex].borrowingFactor = borrowingFactor;
        return true;
    }

    function setCollateralProfileLiquidationFactor (
        uint256 collateralProfileIndex, uint256 liquidationFactor
    ) external onlyManager returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex <= _collateralProfilesNumber,
            '72');
        _collateralProfiles[collateralProfileIndex].liquidationFactor = liquidationFactor;
        return true;
    }

    function setAprSettings (
        uint16 aprBorrowingMax,
        uint16 aprBorrowingMin,
        uint16 aprBorrowingFix,
        uint16 aprLendingMax,
        uint16 aprLendingMin
    ) external onlyManager returns (bool) {
        _aprBorrowingMin = aprBorrowingMin;
        _aprBorrowingMax = aprBorrowingMax;
        _aprBorrowingFix = aprBorrowingFix;
        _aprLendingMin = aprLendingMin;
        _aprLendingMax = aprLendingMax;
        return true;
    }

    function setLockTime (
        uint256 lockTime
    ) external onlyManager returns (bool) {
        _lockTime = lockTime;
        return true;
    }

    function setLiquidationFee (
        uint256 liquidationFee
    ) external onlyManager returns (bool) {
        _liquidationFee = liquidationFee;
        return true;
    }

    function setLiquidatorPercentage (
        uint256 liquidatorPercentage
    ) external onlyManager returns (bool) {
        _liquidatorPercentage = liquidatorPercentage;
        return true;
    }

    function setLiquidationFlagMargin (
        uint256 liquidationFlagMargin
    ) external onlyManager returns (bool) {
        _liquidationFlagMargin = liquidationFlagMargin;
        return true;
    }

    function setLiquidationPeriod (
        uint256 liquidationPeriod
    ) external onlyManager returns (bool) {
        _liquidationPeriod = liquidationPeriod;
        return true;
    }

    function setEtnaContract (
        address etnaContractAddress
    ) external onlyManager returns (bool) {
        require(etnaContractAddress != address(0), '73');
        _etnaContract = IERC20(etnaContractAddress);
        return true;
    }

    function setNEtnaContract (
        address nEtnaContractAddress
    ) external onlyManager returns (bool) {
        require(nEtnaContractAddress != address(0), '74');
        _nEtnaContract = IERC20(nEtnaContractAddress);
        return true;
    }

    function setNftCollateralContract (
        address nftCollateralContractAddress
    ) external onlyManager returns (bool) {
        require(nftCollateralContractAddress != address(0), '75');
        _nftCollateralContract = INftCollateral(nftCollateralContractAddress);
        return true;
    }

    function transferOwnership(address newOwner) public onlyOwner returns (bool) {
        require(newOwner != address(0), 'newOwner should not be zero address');
        _owner = newOwner;
        return true;
    }

    function setNoFee (uint8 collateralType, bool noFee) external onlyOwner returns (bool) {
        _noFee[collateralType] = noFee;
        return true;
    }
    function addToLiquidators (
        address userAddress
    ) external onlyOwner returns (bool) {
        _liquidators[userAddress] = true;
        return true;
    }

    function removeFromLiquidators (
        address userAddress
    ) external onlyOwner returns (bool) {
        _liquidators[userAddress] = false;
        return true;
    }

    function setLiquidationManager (
        address userAddress
    ) external onlyOwner returns (bool) {
        require(userAddress != address(0), '76');
        _liquidationManager = userAddress;
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

    function getCollateralsNumber () external view returns (uint256) {
        return _collateralsNumber;
    }

    function getCollateral (uint256 collateralIndex) external view returns (
        address userAddress, uint256 collateralProfileIndex,
        uint256 amount, uint256 prevCollateral, bool liquidated
    ) {
        return (
            _collaterals[collateralIndex].userAddress,
            _collaterals[collateralIndex].collateralProfileIndex,
            _collaterals[collateralIndex].amount,
            _collaterals[collateralIndex].prevCollateral,
            _collaterals[collateralIndex].liquidated
        );
    }

    function getUsersCollateralIndex (
        address userAddress, uint256 collateralProfileIndex
    ) public view returns (uint256) {
        if (
            _collaterals[
            _usersCollateralIndexes[userAddress][collateralProfileIndex]
            ].liquidated
        ) return 0;
        return _usersCollateralIndexes[userAddress][collateralProfileIndex];
    }

    function getBorrowingProfilesNumber () external view returns (uint256) {
        return _borrowingProfilesNumber;
    }

    function getBorrowingProfile (uint256 borrowingProfileIndex) external view returns (
        address contractAddress, uint256 usdRate, uint256 totalBorrowed,
        uint256 totalLent, uint256 totalLiquidated,
        uint256 totalReturned, bool active
    ) {
        return (
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            _borrowingProfiles[borrowingProfileIndex].usdRate,
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

    function getCollateralProfilesNumber () external view returns (uint256) {
        return _collateralProfilesNumber;
    }

    function getCollateralProfile (uint256 collateralProfileIndex) external view returns (
        address contractAddress, uint256 usdRate, uint256 borrowingFactor,
        uint256 liquidationFactor, uint256 total, uint8 collateralType, bool active
    ) {
        return (
            _collateralProfiles[collateralProfileIndex].contractAddress,
            _collateralProfiles[collateralProfileIndex].usdRate,
            _collateralProfiles[collateralProfileIndex].borrowingFactor,
            _collateralProfiles[collateralProfileIndex].liquidationFactor,
            _collateralProfiles[collateralProfileIndex].total,
            _collateralProfiles[collateralProfileIndex].collateralType,
            _collateralProfiles[collateralProfileIndex].active
        );
    }

    function getLockTime () external view returns (uint256) {
        return _lockTime;
    }

    function getLiquidationManager () external view returns (address) {
        return _liquidationManager;
    }

    function getLiquidationFee () external view returns (uint256) {
        return _liquidationFee;
    }

    function getLiquidatorPercentage () external view returns (uint256) {
        return _liquidatorPercentage;
    }

    function getLiquidationFlagMargin () external view returns (uint256) {
        return _liquidationFlagMargin;
    }

    function getLiquidationPeriod () external view returns (uint256) {
        return _liquidationPeriod;
    }

    function getAprSettings () external view returns (
        uint16 aprBorrowingMax, uint16 aprBorrowingMin, uint16 aprBorrowingFix,
        uint16 aprLendingMax, uint16 aprLendingMin
    ) {
        return (
            _aprBorrowingMax, _aprBorrowingMin, _aprBorrowingFix, _aprLendingMax, _aprLendingMin
        );
    }

    function getTokenBalance (
        address tokenContractAddress
    ) external view returns (uint256) {
        IERC20 tokenContract = IERC20(tokenContractAddress);
        return tokenContract.balanceOf(address(this));
    }

    function getEtnaContract () external view returns (address) {
        return address(_etnaContract);
    }

    function getNEtnaContract () external view returns (address) {
        return address(_nEtnaContract);
    }

    function getNftCollateralContract () external view returns (address) {
        return address(_nftCollateralContract);
    }

    function isManager (
        address userAddress
    ) external view returns (bool) {
        return _managers[userAddress];
    }

    function isLiquidator (
        address userAddress
    ) external view returns (bool) {
        return _liquidators[userAddress];
    }

    function liquidationTime (
        address userAddress
    ) external view returns (uint256) {
        return _liquidationTime[userAddress];
    }

    function isUser (
        address userAddress
    ) external view returns (bool) {
        return _isUser[userAddress];
    }

    function getTotalUsers () external view returns (uint256) {
        return _totalUsers;
    }

    function getNoFee (uint8 collateralType) external view returns (bool) {
        return _noFee[collateralType];
    }

    function getAdminReplenish (address tokenAddress) external view returns (uint256) {
        return _adminReplenish[tokenAddress];
    }

    function getAdminWithdraw (address tokenAddress) external view returns (uint256) {
        return _adminWithdraw[tokenAddress];
    }

    function owner() external view returns (address) {
        return _owner;
    }
}