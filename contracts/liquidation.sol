// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './collateral.sol';

/**
 * @dev Implementation of the liquidation functional,
 * functions names are self explanatory
 */
contract Liquidation is Collateral {
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