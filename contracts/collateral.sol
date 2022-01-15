// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './storage.sol';
import './borrowing-fee.sol';

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