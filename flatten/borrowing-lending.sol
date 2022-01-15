// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @dev Partial interface of the ERC20 standard.
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient, uint256 amount
    ) external returns (bool);
    function transferFrom(
        address sender, address recipient, uint256 amount
    ) external returns (bool);
    function allowance(
        address owner, address spender
    ) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @dev Partial interface of the NftCollateral contract.
 */
interface INftCollateral {
    function setToLiquidation (
        address userAddress
    ) external returns (bool);
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, '80');

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

/**
 * @dev Contract utils implement helper functions for the assets transfer
 */
contract UtilsContract is ReentrancyGuard {
    /**
     * @dev helper function to get paid in Erc20 tokens
     */
    function _takeAsset (
        address tokenAddress, address fromAddress, uint256 amount
    ) internal returns (bool) {
        require(tokenAddress != address(0), '81');
        IERC20 tokenContract = IERC20(tokenAddress);

        require(tokenContract.transferFrom(fromAddress, address(this), amount));

        return true;
    }

    /**
    * @dev Assets sending, both native currency (when tokenAddreess is set to zero) and erc20 tokens
    */
    function _sendAsset (
        address tokenAddress, address toAddress, uint256 amount
    ) internal nonReentrant returns (bool) {
        if (tokenAddress == address(0)) {
            require(address(this).balance >= amount, '82');
            payable(toAddress).transfer(amount);
        } else {
            IERC20 tokenContract = IERC20(tokenAddress);
            require(tokenContract.transfer(toAddress, amount));
        }
        return true;
    }
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

/**
 * @dev Implementation of the marketing indexes calculation
 * in order to calculate fees and yield with dynamically changed APR
 */
contract MarketingIndexesContract is StorageContract {
    function _proceedMarketingIndexes (
        uint256 borrowingProfileIndex
    ) internal returns (bool) {
        uint256 borrowingPeriod = block.timestamp
            - _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndexLastTime;
        uint256 borrowingMarketFactor = _marketIndexShift;
        if (_borrowingProfiles[borrowingProfileIndex].totalLent > 0) {
            borrowingMarketFactor += _marketIndexShift * getBorrowingApr(borrowingProfileIndex)
            * borrowingPeriod / _percentShift / _year;
        }
        _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndex *= borrowingMarketFactor;
        _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndex /= _marketIndexShift;
        _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndexLastTime = block.timestamp;

        uint256 lendingPeriod = block.timestamp
            - _borrowingProfiles[borrowingProfileIndex].lendingMarketIndexLastTime;
        uint256 lendingMarketFactor = _marketIndexShift + (
            _marketIndexShift * getLendingApr(borrowingProfileIndex)
            * lendingPeriod / _percentShift / _year
        );

        _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex *= lendingMarketFactor;
        _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex /= _marketIndexShift;
        _borrowingProfiles[borrowingProfileIndex].lendingMarketIndexLastTime = block.timestamp;

        return true;
    }

    function getBorrowingApr (
        uint256 borrowingProfileIndex
    ) public view returns (uint256) {
        require(
            _borrowingProfiles[borrowingProfileIndex].totalLent > 0,
            '60'
        );
        uint256 borrowingPercentage = _borrowingProfiles[borrowingProfileIndex].totalBorrowed
            * _percentShift
            / _borrowingProfiles[borrowingProfileIndex].totalLent;
        require(borrowingPercentage <= 9500,
            '61'
        );
        return _aprBorrowingMin + (
        borrowingPercentage * (_aprBorrowingMax - _aprBorrowingMin) / 9500
        );
    }

    function getLendingApr (uint256 borrowingProfileIndex) public view returns (uint256) {
        uint256 lendingApr = _aprLendingMin;
        if (_borrowingProfiles[borrowingProfileIndex].totalLent > 0) {
            uint256 borrowingPercentage = _borrowingProfiles[borrowingProfileIndex].totalBorrowed
                * _percentShift
                / _borrowingProfiles[borrowingProfileIndex].totalLent;
            if (borrowingPercentage < 9500) {
                lendingApr = _aprLendingMin + (
                    borrowingPercentage * (_aprLendingMax - _aprLendingMin) / 9500
                );
            }
        }
        return lendingApr;
    }

    function updateMarketingIndexes () external onlyManager returns (bool) {
        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            _proceedMarketingIndexes(i);
        }
        return true;
    }
}

/**
 * @dev Functions for the borrowing fee treating and helper functions
 * used in both Borrowing and Collateral contracts
 */
contract BorrowingFeeContract is MarketingIndexesContract {
    /**
     * @dev External getter of the borrowing fee
     */
    function getBorrowingFee (
        uint256 borrowingIndex, bool addAccumulated
    ) external view returns (uint256) {
        uint256 borrowingFee = _getBorrowingFee(borrowingIndex);
        if (addAccumulated) borrowingFee += _borrowings[borrowingIndex].accumulatedFee;
        return borrowingFee;
    }

    /**
     * @dev Updating of the borrowing fee (is proceeded each time when total borrowed amount
     * or total lent amount is changed)
     */
    function _updateBorrowingFee (uint256 borrowingIndex) internal returns (bool) {
        if (_borrowings[borrowingIndex].liquidated) return false;
        uint256 fee = _getBorrowingFee(borrowingIndex);
        _borrowings[borrowingIndex].accumulatedFee += fee;
        _borrowings[borrowingIndex].updatedAt = block.timestamp;
        _borrowings[borrowingIndex].lastMarketIndex =
            _borrowingProfiles[_borrowings[borrowingIndex].borrowingProfileIndex]
            .borrowingMarketIndex;

        return true;
    }

    /**
     * @dev Calculating of the borrowing fee
     */
    function _getBorrowingFee (uint256 borrowingIndex) internal view returns (uint256) {
        if (
            borrowingIndex == 0 || borrowingIndex > _borrowingsNumber
            || _borrowings[borrowingIndex].liquidated
        ) return 0;

        uint256 totalCollateralUsdAmount;
        uint256 feeCollateralUsdAmount;
        address userAddress = _borrowings[borrowingIndex].userAddress;
        for (uint256 i = 1; i <= _collateralProfilesNumber; i ++) {
            uint256 collateralIndex = _usersCollateralIndexes[userAddress][i];
            if (
                collateralIndex == 0 || _collaterals[collateralIndex].liquidated
                || _collaterals[collateralIndex].amount == 0
            ) continue;
            totalCollateralUsdAmount += _collaterals[collateralIndex].amount
                * _collateralProfiles[i].usdRate;
            if (!_noFee[_collateralProfiles[i].collateralType]) {
                feeCollateralUsdAmount += _collaterals[collateralIndex].amount
                    * _collateralProfiles[i].usdRate;
            }
        }
        if (feeCollateralUsdAmount == 0) return 0;

        if (_borrowings[borrowingIndex].fixedApr > 0) {
            return _getFixedFee(borrowingIndex) * feeCollateralUsdAmount
                / totalCollateralUsdAmount;
        } else {
            return _getDynamicFee(borrowingIndex) * feeCollateralUsdAmount
                / totalCollateralUsdAmount;
        }
    }

    /**
     * @dev Calculating fixed fee
     */
    function _getFixedFee (uint256 borrowingIndex) internal view returns (uint256) {
        if (_borrowings[borrowingIndex].liquidated) return 0;
        uint256 period = block.timestamp - _borrowings[borrowingIndex].updatedAt;
        uint256 fee = _borrowings[borrowingIndex].amount
            * _borrowings[borrowingIndex].fixedApr
            * period
            / _marketIndexShift
            / _year;
        return fee;
    }

    /**
     * @dev Calculating non fixed fee
     */
    function _getDynamicFee (
        uint256 borrowingIndex
    ) internal view returns (uint256) {
        if (_borrowings[borrowingIndex].liquidated) return 0;
        uint256 profileIndex = _borrowings[borrowingIndex].borrowingProfileIndex;
        uint256 marketIndex = _borrowingProfiles[profileIndex].borrowingMarketIndex;
        uint256 extraPeriodStartTime =
            _borrowingProfiles[profileIndex].borrowingMarketIndexLastTime;
        if (extraPeriodStartTime < _borrowings[borrowingIndex].updatedAt) {
            extraPeriodStartTime = _borrowings[borrowingIndex].updatedAt;
        }
        uint256 extraPeriod = block.timestamp - extraPeriodStartTime;

        if (extraPeriod > 0) {
            uint256 marketFactor = _marketIndexShift +
                _marketIndexShift * getBorrowingApr(
                    _borrowings[borrowingIndex].borrowingProfileIndex
                )
                * extraPeriod / _percentShift / _year;
            marketIndex = marketIndex * marketFactor / _marketIndexShift;
        }

        uint256 newAmount = _borrowings[borrowingIndex].amount
            * marketIndex
            / _borrowings[borrowingIndex].lastMarketIndex;

        return newAmount - _borrowings[borrowingIndex].amount;
    }

    /**
     * @dev Helper function for getting amount borrowed by user in USD
     */
    function getBorrowedUsdAmount (address userAddress) public view returns (uint256) {
        uint256 borrowedUsdAmount;
        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            uint256 borrowingIndex = _usersBorrowingIndexes[userAddress][i];
            borrowedUsdAmount += getBorrowingUsdAmount(borrowingIndex);
        }

        return borrowedUsdAmount;
    }

    /**
     * @dev Helper function for getting borrowing amount of the specific
     * borrowing record in USD
     */
    function getBorrowingUsdAmount (
        uint256 borrowingIndex
    ) public view returns (uint256) {
        if (
            borrowingIndex == 0 || _borrowings[borrowingIndex].liquidated
            || _borrowings[borrowingIndex].amount == 0
        ) return 0;
        uint256 borrowingProfileIndex = _borrowings[borrowingIndex].borrowingProfileIndex;

        return (
        _borrowings[borrowingIndex].amount + _borrowings[borrowingIndex].accumulatedFee
        + _getBorrowingFee(borrowingIndex)
        ) * _borrowingProfiles[borrowingProfileIndex].usdRate;
    }

    /**
     * @dev Helper function Checking if user meet requirements for a liquidation
     */
    function userLiquidation (
        address userAddress, bool margin
    ) public view returns (bool) {
        uint256 borrowedUsdAmount = getBorrowedUsdAmount(userAddress);
        if (borrowedUsdAmount == 0) return false;
        uint256 collateralLiquidationUsdAmount;
        for (uint256 i = 1; i <= _collateralProfilesNumber; i ++) {
            uint256 collateralIndex = _usersCollateralIndexes[userAddress][i];
            if (
                collateralIndex == 0 || _collaterals[collateralIndex].liquidated
                || _collaterals[collateralIndex].amount == 0
            ) continue;
            uint256 factor = _percentShift + _collateralProfiles[i].liquidationFactor;
            if (margin) factor += _liquidationFlagMargin;
            collateralLiquidationUsdAmount += _collaterals[collateralIndex].amount
            * _collateralProfiles[i].usdRate * _percentShift / factor;
        }

        return collateralLiquidationUsdAmount <= borrowedUsdAmount;
    }
}

/**
 * @dev Implementation of the collateral treating functional,
 * functions names are self explanatory
 */
contract CollateralContract is StorageContract, BorrowingFeeContract {
    function depositCollateral (
        uint256 collateralProfileIndex, uint256 amount
    ) external payable returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex
            <= _collateralProfilesNumber, '17');
        require(_collateralProfiles[collateralProfileIndex].active,
            '18');
        require(_collateralProfiles[collateralProfileIndex].collateralType != 3,
            '19');
        if (!_isUser[msg.sender]) {
            _totalUsers ++;
            _isUser[msg.sender] = true;
        }

        if (
            _collateralProfiles[collateralProfileIndex].contractAddress == address(0)
        ) {
            amount = msg.value;
            require(amount > 0, '20');
        } else {
            require(msg.value == 0, '21');
            require(amount > 0, '22');
            _takeAsset(
                _collateralProfiles[collateralProfileIndex].contractAddress,
                msg.sender,
                amount
            );
        }
        _collateralProfiles[collateralProfileIndex].total += amount;
        uint256 collateralIndex = _usersCollateralIndexes[msg.sender][collateralProfileIndex];
        if (collateralIndex == 0 || _collaterals[collateralIndex].liquidated) {
            _addNewCollateral(msg.sender, collateralProfileIndex, amount, 0);
        } else {
            _collaterals[collateralIndex].amount += amount;
        }
        if (
            _liquidationTime[msg.sender] > 0 && !userLiquidation(msg.sender, true)
        ) delete _liquidationTime[msg.sender];

        return true;
    }

    function withdrawCollateral (
        uint256 collateralProfileIndex, uint256 amount
    ) external returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex
            <= _collateralProfilesNumber, '27');
        require(_collateralProfiles[collateralProfileIndex].active,
            '28');
        require(_collateralProfiles[collateralProfileIndex].collateralType != 3,
            '19');
        require(getAvailableCollateralAmount(msg.sender, collateralProfileIndex) >= amount,
            '30');

        _collateralProfiles[collateralProfileIndex].total -= amount;
        uint256 collateralIndex = _usersCollateralIndexes[msg.sender][collateralProfileIndex];
        require(!_collaterals[collateralIndex].liquidated, '31');
        _collaterals[collateralIndex].amount -= amount;

        _sendAsset(
            _collateralProfiles[collateralProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    function withdrawWholeCollateral (
        uint256 collateralProfileIndex
    ) external returns (bool) {
        require(collateralProfileIndex > 0 && collateralProfileIndex
            <= _collateralProfilesNumber, '27');
        require(_collateralProfiles[collateralProfileIndex].active,
            '28');
        require(_collateralProfiles[collateralProfileIndex].collateralType != 3,
            '19');
        uint256 amount = getAvailableCollateralAmount(msg.sender, collateralProfileIndex);

        uint256 collateralIndex = _usersCollateralIndexes[msg.sender][collateralProfileIndex];
        require(!_collaterals[collateralIndex].liquidated, '31');
        _collateralProfiles[collateralProfileIndex].total -= amount;
        _collaterals[collateralIndex].amount -= amount;

        _sendAsset(
            _collateralProfiles[collateralProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    function depositNetna (
        address userAddress, uint256 nEtnaProfileIndex, uint256 amount
    ) external onlyNftCollateralContract returns (bool) {
        require(
            _collateralProfiles[nEtnaProfileIndex].collateralType == 3,
            '23'
        );
        uint256 collateralIndex = getUsersCollateralIndex(userAddress, nEtnaProfileIndex);
        if (collateralIndex > 0) {
            _collaterals[collateralIndex].amount += amount;
        } else {
            _addNewCollateral(userAddress, nEtnaProfileIndex, amount, 0);
        }
        return true;
    }

    function withdrawNetna (
        address userAddress, uint256 nEtnaProfileIndex, uint256 amount
    ) external onlyNftCollateralContract returns (bool) {
        require(
            _collateralProfiles[nEtnaProfileIndex].collateralType == 3,
            '23'
        );
        require(getAvailableCollateralAmount(userAddress, nEtnaProfileIndex) >= amount,
            '30');
        uint256 collateralIndex = getUsersCollateralIndex(userAddress, nEtnaProfileIndex);
        require(collateralIndex > 0, '66');
        require(_collaterals[collateralIndex].amount >= amount, '29');
        _collaterals[collateralIndex].amount -= amount;
        _sendAsset(
            address(_nEtnaContract),
            address(_nftCollateralContract),
            amount
        );
        return true;
    }

    function _addNewCollateral (
        address userAddress, uint256 collateralProfileIndex, uint256 amount, uint256 prevCollateral
    ) internal returns (bool) {
        _collateralsNumber ++;
        _collaterals[_collateralsNumber].userAddress = userAddress;
        _collaterals[_collateralsNumber].collateralProfileIndex = collateralProfileIndex;
        _collaterals[_collateralsNumber].amount = amount;
        _collaterals[_collateralsNumber].prevCollateral = prevCollateral;
        _usersCollateralIndexes[userAddress][collateralProfileIndex] = _collateralsNumber;

        return true;
    }

    function getCollateralIndex (
        address userAddress, uint256 collateralProfileIndex
    ) external view returns (uint256) {
        return _usersCollateralIndexes[userAddress][collateralProfileIndex];
    }

    function getCollateralAmount (
        uint256 collateralIndex
    ) external view returns (uint256) {
        if (_collaterals[collateralIndex].liquidated) return 0;
        return _collaterals[collateralIndex].amount;
    }

    function getCollateralUsdAmount (
        uint256 collateralIndex
    ) public view returns (uint256) {
        if (
            collateralIndex == 0 || _collaterals[collateralIndex].liquidated
        ) return 0;
        uint256 collateralProfileIndex = _collaterals[collateralIndex].collateralProfileIndex;
        return _collaterals[collateralIndex].amount
            * _collateralProfiles[collateralProfileIndex].usdRate;
    }

    function getDepositedCollateralUsdAmount (
        address userAddress
    ) external view returns (uint256) {
        uint256 depositedCollateralUsdAmount;
        for (uint256 i = 1; i <= _collateralProfilesNumber; i ++) {
            if (!_collateralProfiles[i].active) continue;
            depositedCollateralUsdAmount += getCollateralUsdAmount(
                _usersCollateralIndexes[userAddress][i]
            );
        }
        return depositedCollateralUsdAmount;
    }

    function getAvailableCollateralAmount (
        address userAddress, uint256 collateralProfileIndex
    ) public view returns (uint256) {
        if (!_collateralProfiles[collateralProfileIndex].active) return 0;
        uint256 borrowedUsdAmount = getBorrowedUsdAmount(userAddress);

        uint256 collateralUsdAmount;
        uint256 availableCollateralUsdAmount;
        for (uint256 i = 1; i <= _collateralProfilesNumber; i ++) {
            if (!_collateralProfiles[i].active) continue;
            uint256 collateralIndex = _usersCollateralIndexes[userAddress][i];
            if (
                _collaterals[collateralIndex].liquidated
                || _collaterals[collateralIndex].amount == 0
            ) continue;
            if (collateralIndex == 0) continue;
            uint256 amount = _collaterals[collateralIndex].amount
                * _collateralProfiles[i].usdRate * _collateralProfiles[i].borrowingFactor
                / _percentShift;
            collateralUsdAmount += amount;
            if (i == collateralProfileIndex) availableCollateralUsdAmount = amount;
        }

        if (collateralUsdAmount <= borrowedUsdAmount) return 0;
        uint256 diff = collateralUsdAmount - borrowedUsdAmount;

        if (availableCollateralUsdAmount > diff) availableCollateralUsdAmount = diff;

        return availableCollateralUsdAmount
            * _percentShift
            / _collateralProfiles[collateralProfileIndex].usdRate
            / _collateralProfiles[collateralProfileIndex].borrowingFactor;
    }
}

/**
 * @dev Borrowing functional implementation
 */
contract BorrowingContract is MarketingIndexesContract, CollateralContract {
    /**
     * @dev Borrowing of the specified amount of assets defined by the borrowing profile
     */
    function borrow (
        uint256 borrowingProfileIndex, uint256 amount,
        bool isFixedApr
    ) public returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex
            <= _borrowingProfilesNumber, '7');
        require(_borrowingProfiles[borrowingProfileIndex].active,
            '8');
        require(_liquidationTime[msg.sender] == 0,
            '9');
        require(_borrowingProfiles[borrowingProfileIndex].totalLent > 0,
            '10');
        require(
            _borrowingProfiles[borrowingProfileIndex].totalBorrowed
            * _percentShift
            / _borrowingProfiles[borrowingProfileIndex].totalLent <= 9500,
            '11'
        );
        require(
            getAvailableBorrowingAmount(
                msg.sender, borrowingProfileIndex
            ) >= amount,
            '12'
        );

        _proceedMarketingIndexes(borrowingProfileIndex);

        uint256 fixedApr;
        if (isFixedApr) {
            fixedApr += _aprBorrowingFix;
            fixedApr += getBorrowingApr(borrowingProfileIndex);
        }

        _borrowingProfiles[borrowingProfileIndex].totalBorrowed += amount;

        uint256 borrowingIndex = _usersBorrowingIndexes[msg.sender][borrowingProfileIndex];
        if (
            borrowingIndex == 0 || _borrowings[borrowingIndex].liquidated
        ) {
            _borrowingsNumber ++;
            borrowingIndex = _borrowingsNumber;
            _borrowings[borrowingIndex].userAddress = msg.sender;
            _borrowings[borrowingIndex].borrowingProfileIndex = borrowingProfileIndex;
            _borrowings[borrowingIndex].lastMarketIndex =
                _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndex;
            _borrowings[borrowingIndex].updatedAt = block.timestamp;
            _borrowings[borrowingIndex].accumulatedFee = 0;
            _borrowings[borrowingIndex].fixedApr = fixedApr;

            _usersBorrowingIndexes[msg.sender][borrowingProfileIndex] = borrowingIndex;
        } else {
            _updateBorrowingFee(borrowingIndex);
        }
        _borrowings[borrowingIndex].amount += amount;

        _sendAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    /**
     * @dev Borrowing of available amount of assets defined by the borrowing profile
     */
    function borrowAvailable (
        uint256 borrowingProfileIndex, bool isFixedApr
    ) external returns (bool) {
        return borrow(
            borrowingProfileIndex,
            getAvailableBorrowingAmount(
                msg.sender, borrowingProfileIndex
            ),
            isFixedApr
        );
    }

    /**
     * @dev returning of the specified amount of assets
     */
    function returnBorrowing (
        uint256 borrowingIndex, uint256 amount
    ) external returns (bool) {
        require(borrowingIndex > 0 && borrowingIndex
            <= _borrowingsNumber, '13');
        require(_borrowings[borrowingIndex].amount >= amount,
            '14');
        require(!_borrowings[borrowingIndex].liquidated,
            '15');
        uint256 borrowingProfileIndex = _borrowings[borrowingIndex].borrowingProfileIndex;
        require(_borrowingProfiles[borrowingProfileIndex].active,
            '16');

        _proceedMarketingIndexes(borrowingProfileIndex);
        _takeAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        _updateBorrowingFee(borrowingIndex);
        _borrowingProfiles[borrowingProfileIndex].totalBorrowed -= amount;
        _borrowings[borrowingIndex].amount -= amount;

        if (
            _liquidationTime[msg.sender] > 0 && !userLiquidation(msg.sender, true)
        ) delete _liquidationTime[msg.sender];

        return true;
    }


    /**
     * @dev Return maximum available for borrowing assets amount
     */
    function getAvailableBorrowingAmount (
        address userAddress, uint256 borrowingProfileIndex
    ) public view returns (uint256) {
        if (!_borrowingProfiles[borrowingProfileIndex].active) return 0;
        uint256 borrowedUsdAmount = getBorrowedUsdAmount(userAddress);
        uint256 collateralUsdAmount;
        for (uint256 i = 1; i <= _collateralProfilesNumber; i ++) {
            uint256 collateralIndex = _usersCollateralIndexes[userAddress][i];
            if (
                collateralIndex == 0 || _collaterals[collateralIndex].liquidated
                || _collaterals[collateralIndex].amount == 0
            ) continue;
            collateralUsdAmount += _collaterals[collateralIndex].amount
                * _collateralProfiles[i].usdRate * _collateralProfiles[i].borrowingFactor
                / _percentShift;
        }
        if (collateralUsdAmount <= borrowedUsdAmount) return 0;
        uint256 diff = collateralUsdAmount - borrowedUsdAmount;

        return diff / _borrowingProfiles[borrowingProfileIndex].usdRate;
    }
}

/**
 * @dev Implementation of the lending treating functional,
 * functions names are self explanatory
 */
contract LendingContract is MarketingIndexesContract {
    function lend (
        uint256 borrowingProfileIndex, uint256 amount
    ) external returns (bool) {
        _checkLending(borrowingProfileIndex);
        if (!_isUser[msg.sender]) {
            _totalUsers ++;
            _isUser[msg.sender] = true;
        }

        _proceedMarketingIndexes(borrowingProfileIndex);

        if (_usersLendingIndexes[msg.sender][borrowingProfileIndex] == 0) {
            _lendingsNumber ++;
            _lendings[_lendingsNumber] = Lending({
                userAddress: msg.sender,
                borrowingProfileIndex: borrowingProfileIndex,
                amount: amount,
                unlock: block.timestamp + _lockTime,
                lastMarketIndex: _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex,
                updatedAt: block.timestamp,
                accumulatedYield: 0
            });

            _usersLendingIndexes[msg.sender][borrowingProfileIndex] = _lendingsNumber;
        } else {
            uint256 lendingIndex = _usersLendingIndexes[msg.sender][borrowingProfileIndex];
            _updateLendingYield(lendingIndex);

            _addToLending(lendingIndex, borrowingProfileIndex, amount);
        }
        _borrowingProfiles[borrowingProfileIndex].totalLent += amount;

        _takeAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    /**
     * @dev Lend accumulated yield to the contract
     */
    function compound (uint256 borrowingProfileIndex) external returns (bool) {
        _checkLending(borrowingProfileIndex);
        uint256 lendingIndex = _usersLendingIndexes[msg.sender][borrowingProfileIndex];
        require(lendingIndex > 0, '44');
        _updateLendingYield(lendingIndex);

        uint256 yield = _lendings[lendingIndex].accumulatedYield;
        _lendings[lendingIndex].accumulatedYield = 0;

        _addToLending(lendingIndex, borrowingProfileIndex, yield);

        _borrowingProfiles[borrowingProfileIndex].totalLent += yield;
        return true;
    }

    function withdrawLending (
        uint256 borrowingProfileIndex, uint256 amount
    ) external returns (bool) {
        _checkLending(borrowingProfileIndex);
        uint256 lendingIndex = _usersLendingIndexes[msg.sender][borrowingProfileIndex];
        require(lendingIndex > 0, '44');

        require(_borrowingProfiles[borrowingProfileIndex].contractAddress != address(0),
            '45');
        require(amount > 0, '46');
        _proceedMarketingIndexes(borrowingProfileIndex);
        _updateLendingYield(lendingIndex);
        require(_lendings[lendingIndex].amount >= amount, '47');

        _lendings[lendingIndex].amount -= amount;
        _borrowingProfiles[borrowingProfileIndex].totalLent -= amount;

        _sendAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    function withdrawLendingYield (
        uint256 borrowingProfileIndex, uint256 amount
    ) external returns (bool) {
        require(_liquidationTime[msg.sender] == 0,
            '48');
        uint256 lendingIndex = _usersLendingIndexes[msg.sender][borrowingProfileIndex];
        require(lendingIndex > 0, '49');

        require(_borrowingProfiles[borrowingProfileIndex].contractAddress != address(0),
            '50');
        require(amount > 0, '51');
        _updateLendingYield(lendingIndex);
        require(_lendings[lendingIndex].accumulatedYield >= amount, '52');

        _lendings[lendingIndex].accumulatedYield -= amount;

        _sendAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    function _addToLending (
        uint256 lendingIndex,
        uint256 borrowingProfileIndex,
        uint256 amount
    ) internal returns (bool) {
        _lendings[lendingIndex].amount += amount;
        if (_lendings[lendingIndex].unlock > block.timestamp){
            _lendings[lendingIndex].unlock = block.timestamp + _lockTime;
        }
        _lendings[lendingIndex].lastMarketIndex = _borrowingProfiles
            [borrowingProfileIndex].lendingMarketIndex;
        _lendings[lendingIndex].updatedAt = block.timestamp;
        return true;
    }

    function _checkLending (
        uint256 borrowingProfileIndex
    ) internal view returns (bool) {
        require(_liquidationTime[msg.sender] == 0,
            '41');
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '42');
        return true;
    }

    function _updateLendingYield (uint256 lendingIndex) internal returns (bool) {
        uint256 yield = _getLendingYield(lendingIndex);
        _lendings[lendingIndex].accumulatedYield += yield;
        _lendings[lendingIndex].updatedAt = block.timestamp;
        _lendings[lendingIndex].lastMarketIndex =
            _borrowingProfiles[_lendings[lendingIndex].borrowingProfileIndex].lendingMarketIndex;

        return true;
    }

    function getLendingYield (uint256 lendingIndex, bool addAccumulated) external view returns (uint256) {
        uint256 lendingYield = _getLendingYield(lendingIndex);
        if (addAccumulated) lendingYield += _lendings[lendingIndex].accumulatedYield;
        return lendingYield;
    }

    function _getLendingYield (uint256 lendingIndex) internal view returns (uint256) {
        uint256 borrowingProfileIndex = _lendings[lendingIndex].borrowingProfileIndex;

        uint256 marketIndex = _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex;

        uint256 extraPeriodStartTime =
            _borrowingProfiles[borrowingProfileIndex].lendingMarketIndexLastTime;
        if (extraPeriodStartTime < _lendings[lendingIndex].updatedAt) {
            extraPeriodStartTime = _lendings[lendingIndex].updatedAt;
        }
        uint256 extraPeriod = block.timestamp - extraPeriodStartTime;

        if (extraPeriod > 0) {
            uint256 marketFactor = _marketIndexShift +
                _marketIndexShift * getLendingApr(borrowingProfileIndex)
                * extraPeriod / _percentShift / _year;
            marketIndex = marketIndex * marketFactor / _marketIndexShift;
        }

        uint256 newAmount = _lendings[lendingIndex].amount
            * marketIndex
            / _lendings[lendingIndex].lastMarketIndex;

        return newAmount - _lendings[lendingIndex].amount;
    }
}

/**
 * @dev Implementation of the liquidation functional,
 * functions names are self explanatory
 */
contract LiquidationContract is CollateralContract {
    /**
     * @dev user should be flagged for a liquidation
     * before actual liquidation can be proceeded
     * functions names are self explanatory
     */
    function addFlagForLiquidation (
        address userAddress
    ) external onlyLiquidationManager returns (bool) {
        require(userLiquidation(userAddress, false), '53');
        require(_liquidationTime[msg.sender] == 0, '54');
        _liquidationTime[userAddress] = block.timestamp + _liquidationPeriod;

        return true;
    }

    function removeFlagForLiquidation (
        address userAddress
    ) external onlyLiquidationManager returns (bool) {
        require(!userLiquidation(userAddress, true), '55');
        require(_liquidationTime[msg.sender] > 0, '56');
        delete _liquidationTime[userAddress];

        return true;
    }

    function liquidate (
        address userAddress
    ) external onlyLiquidator returns (uint256) {
        require(_liquidationTime[userAddress] > 0,
            '57');
        require(_liquidationTime[userAddress] < block.timestamp,
            '58');
        uint256[] memory collateralIndexes = new uint256[](4);
        uint256[] memory erc20CollateralIndexes = new uint256[](_collateralProfilesNumber);
        uint256 erc20CollateralsNumber;
        uint256 borrowedUsdAmount;

        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            uint256 borrowingIndex = _usersBorrowingIndexes[userAddress][i];
            if (
                borrowingIndex == 0 || _borrowings[borrowingIndex].liquidated
                || _borrowings[borrowingIndex].amount == 0
            ) continue;
            borrowedUsdAmount += (
                _borrowings[borrowingIndex].amount + _borrowings[borrowingIndex].accumulatedFee
                + _getBorrowingFee(borrowingIndex)
            ) * _borrowingProfiles[i].usdRate;

            _updateBorrowingFee(borrowingIndex);
            _borrowingProfiles[i].totalLiquidated += _borrowings[borrowingIndex].amount
                + _borrowings[borrowingIndex].accumulatedFee;
            _borrowings[borrowingIndex].liquidated = true;

            emit BorrowingLiquidation(
                userAddress, msg.sender, borrowingIndex, block.timestamp
            );
        }

        uint256 collateralLiquidationUsdAmount;
        for (uint256 i = 1; i <= _collateralProfilesNumber; i ++) {
            uint256 collateralIndex = _usersCollateralIndexes[userAddress][i];
            if (
                collateralIndex == 0 || _collaterals[collateralIndex].liquidated
                || _collaterals[collateralIndex].amount == 0
            ) continue;
            uint256 collateralProfileIndex = _collaterals[collateralIndex]
                .collateralProfileIndex;
            if (
                _collateralProfiles[collateralProfileIndex].collateralType != 1
            ) {
                collateralIndexes[
                    _collateralProfiles[collateralProfileIndex].collateralType
                ] = collateralIndex;
            } else {
                erc20CollateralIndexes[erc20CollateralsNumber] = collateralIndex;
                erc20CollateralsNumber ++;
            }
            collateralLiquidationUsdAmount += _collaterals[collateralIndex].amount
                * _percentShift
                / (_percentShift + _collateralProfiles[i].liquidationFactor);
            emit CollateralLiquidation(
                userAddress, msg.sender, collateralIndex, block.timestamp
            );
        }
        require(
            borrowedUsdAmount > 0 && collateralLiquidationUsdAmount <= borrowedUsdAmount,
            '59'
        );
        uint256 liquidationUsdAmount = borrowedUsdAmount * (
            _percentShift + _liquidationFee
        ) / _percentShift;
        if (collateralIndexes[0] > 0) {
            liquidationUsdAmount = _proceedCollateralLiquidation(
                userAddress, msg.sender, collateralIndexes[0], liquidationUsdAmount
            );
        }
        if (liquidationUsdAmount > 0 && erc20CollateralsNumber > 0) {
            for (uint256 i = 0; i < erc20CollateralsNumber; i ++) {
                if (liquidationUsdAmount == 0) break;
                liquidationUsdAmount = _proceedCollateralLiquidation(
                    userAddress, msg.sender, erc20CollateralIndexes[i], liquidationUsdAmount
                );
            }
        }
        if (liquidationUsdAmount > 0 && collateralIndexes[2] > 0) {
            liquidationUsdAmount = _proceedCollateralLiquidation(
                userAddress, msg.sender, collateralIndexes[2], liquidationUsdAmount
            );
        }
        if (liquidationUsdAmount > 0 && collateralIndexes[3] > 0) {
            _collaterals[collateralIndexes[3]].liquidated = true;
            _sendAsset(
                address(_nEtnaContract),
                address(_nftCollateralContract),
                _collaterals[collateralIndexes[3]].amount
            );
            _nftCollateralContract.setToLiquidation(userAddress);
            liquidationUsdAmount = 0;
        }
        delete _liquidationTime[userAddress];

        return liquidationUsdAmount;
    }

    function _proceedCollateralLiquidation (
        address userAddress,
        address liquidatorAddress,
        uint256 collateralIndex,
        uint256 liquidationUsdAmount
    ) internal returns (uint256) {
        uint256 toBeSent;
        uint256 liquidatorsPart;
        uint256 collateralProfileIndex = _collaterals[collateralIndex]
            .collateralProfileIndex;
        uint256 usdRate = _collateralProfiles[collateralProfileIndex].usdRate;
        uint256 amount = liquidationUsdAmount / usdRate;
        address contractAddress = _collateralProfiles[collateralProfileIndex].contractAddress;
        _collaterals[collateralIndex].liquidated = true;
        if (amount >= _collaterals[collateralIndex].amount) {
            toBeSent = _collaterals[collateralIndex].amount;
            liquidationUsdAmount -= toBeSent * usdRate;
        } else {
            _addNewCollateral(
                userAddress, collateralProfileIndex,
                _collaterals[collateralIndex].amount - amount, collateralIndex
            );
            toBeSent = amount;
            liquidationUsdAmount = 0;
        }
        liquidatorsPart = toBeSent * _liquidatorPercentage / _percentShift;
        _collateralProfiles[collateralProfileIndex].total -= toBeSent;
        _sendAsset(contractAddress, liquidatorAddress, liquidatorsPart);
        _sendAsset(contractAddress, _liquidationManager, toBeSent - liquidatorsPart);

        return liquidationUsdAmount;
    }

    /**
     * @dev Returning of the liquidated assets, let keep accounting
     * of the liquidated and returned assets
     */
    function returnLiquidatedBorrowing (
        uint256 borrowingProfileIndex, uint256 amount
    ) external onlyLiquidationManager returns (bool) {
        _takeAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );
        _borrowingProfiles[borrowingProfileIndex].totalReturned += amount;
        _proceedMarketingIndexes(borrowingProfileIndex);
        if (_borrowingProfiles[borrowingProfileIndex].totalBorrowed > amount) {
            _borrowingProfiles[borrowingProfileIndex].totalBorrowed -= amount;
        } else {
            _borrowingProfiles[borrowingProfileIndex].totalBorrowed = 0;
        }

        return true;
    }
}

/**
 * @dev Specific functions for administrator.
 */
contract AdminContract is StorageContract {
    /**
     * @dev Function for withdrawing assets, both native currency and erc20 tokens.
     */
    function adminWithdraw (
        address tokenAddress, uint256 amount
    ) external onlyOwner returns (bool) {
        _sendAsset(tokenAddress, msg.sender, amount);
        _adminWithdraw[tokenAddress] += amount;
        return true;
    }

    /**
     * @dev Function for replenishing assets balance, both native currency and erc20 tokens.
     */
    function adminReplenish (
        address tokenAddress, uint256 amount
    ) external payable onlyOwner returns (bool) {
        if (tokenAddress != address(0)) {
            require(msg.value == 0, '4');
            require(amount > 0, '5');
            _takeAsset(tokenAddress, msg.sender, amount);
        } else {
            amount = msg.value;
            require(amount > 0, '6');
        }
        _adminReplenish[tokenAddress] += amount;
        return true;
    }
}

/**
 * @dev Main BorrowingLending contract
 */
contract BorrowingLending is BorrowingContract, LendingContract, LiquidationContract, AdminContract {
    /**
     * Error messages:
     * borrowing-lending.sol
     * 1 - Owner address can not be zero
     * 2 - Etna contract address can not be zero
     * 3 - Max APR should be greater or equal than min APR
     * admin.sol
     * 4 - Message value should be zero for an ERC20 replenish
     * 5 - Amount should be greater than zero
     * 6 - Message value should be greater than zero
     * borrowing.sol
     * 7 - Borrowing profile is not found
     * 8 - Borrowing profile is blocked
     * 9 - Message sender is flagged for liquidation
     * 10 - No assets to borrow
     * 11 - Not enough assets to borrow
     * 12 - Not enough collateral
     * 13 - Borrowing is not found
     * 14 - Amount can not be greater than borrowing amount
     * 15 - This borrowing is liquidated
     * 16 - Borrowing profile is blocked
     * collateral.sol
     * 17 - Collateral profile is not found
     * 18 - Collateral profile is blocked
     * 19 - For this type of collateral only internal transfers available
     * 20 - Message value should be greater than zero
     * 21 - Message value should be zero for an ERC20 collateral
     * 22 - Amount should be greater than zero
     * 23 - Wrong collateral profile
     * 27 - Collateral profile is not found
     * 28 - Collateral profile is blocked
     * 29 - Not enough NETNA to withdraw
     * 30 - Not enough available to withdraw collateral
     * 31 - This collateral is liquidated
     * lending.sol
     * 41 - Message sender is flagged for liquidation
     * 42 - Borrowing profile is not found
     * 43 - Message sender is flagged for liquidation
     * 44 - Lending is not found
     * 45 - Borrowing profile is not found
     * 46 - Amount should be greater than zero
     * 47 - Not enough lending amount
     * 48 - Message sender is flagged for liquidation
     * 49 - Lending is not found
     * 50 - Borrowing profile is not found
     * 51 - Amount should be greater than zero
     * 52 - Not enough yield
     * liquidation.sol
     * 53 - Liquidation requirements is not met
     * 54 - User is already flagged for liquidation
     * 55 - User is at liquidation
     * 56 - User is not flagged for liquidation
     * 57 - User was not flagged for a liquidation
     * 58 - Liquidation period is not over yet
     * 59 - Liquidation requirements is not met
     * marketing-indexes.sol
     * 60 - Borrowing apr can not be calculated when nothing is lent
     * 61 - Borrowing apr can not be calculated when not enough assets to borrow
     * storage.sol
     * 62 - caller is not the owner
     * 63 - caller is not the manager
     * 631 - caller is neither the manager nor liquidation contract
     * 64 - Contract address should not be zero
     * 65 - Borrowing profile is not found
     * 66 - Collateral record is not found
     * 67 - Borrowing record is not found
     * 68 - Borrowing profile is not found
     * 69 - Collateral profile is not found
     * 70 - Collateral profile is not found
     * 71 - Collateral profile is not found
     * 72 - Collateral profile is not found
     * 73 - Etna contract address can not be zero
     * 74 - Etna contract address can not be zero
     * 75 - Etna contract address can not be zero
     * 76 - Liquidation manager address can not be zero
     * 77 - caller is not the liquidation manager
     * 78 - caller is not the liquidator
     * 79 - caller is not the nft collateral contract
     * utils.sol
     * 80 - ReentrancyGuard: reentrant call
     * 81 - Token address should not be zero
     * 82 - Not enough contract balance
     */
    constructor (
        address etnaContractAddress,
        address newOwner,
        uint16 aprBorrowingMin,
        uint16 aprBorrowingMax,
        uint16 aprBorrowingFix,
        uint16 aprLendingMin,
        uint16 aprLendingMax
    ) {
        require(newOwner != address(0), '1');
        require(etnaContractAddress != address(0), '2');
        require(aprBorrowingMax >= aprBorrowingMin, '3');
        require(aprLendingMax >= aprLendingMin, '3');

        _owner = newOwner;
        _liquidationManager = newOwner;
        _etnaContract = IERC20(etnaContractAddress);
        _aprBorrowingMin = aprBorrowingMin;
        _aprBorrowingMax = aprBorrowingMax;
        _aprBorrowingFix = aprBorrowingFix;
        _aprLendingMin = aprLendingMin;
        _aprLendingMax = aprLendingMax;

        _noFee[2] = true;
        _noFee[3] = true;
    }
}
