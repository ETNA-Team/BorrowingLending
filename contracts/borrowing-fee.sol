// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './marketing-indexes.sol';

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

        address userAddress = _borrowings[borrowingIndex].userAddress;
        (uint256 totalCollateralUsdAmount, uint256 feeCollateralUsdAmount) =
            _collateralContract.getTotalCollateralUsdAmounts(userAddress);

        if (feeCollateralUsdAmount * totalCollateralUsdAmount == 0) return 0;

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
            / DECIMALS
            / YEAR;
        return fee;
    }

    /**
     * @dev Calculating non fixed fee
     */
    function _getDynamicFee (
        uint256 borrowingIndex
    ) internal view returns (uint256) {
        uint256 profileIndex = _borrowings[borrowingIndex].borrowingProfileIndex;
        uint256 marketIndex = _borrowingProfiles[profileIndex].borrowingMarketIndex;
        uint256 extraPeriodStartTime =
            _borrowingProfiles[profileIndex].borrowingMarketIndexLastTime;
        if (extraPeriodStartTime < _borrowings[borrowingIndex].updatedAt) {
            extraPeriodStartTime = _borrowings[borrowingIndex].updatedAt;
        }
        uint256 extraPeriod = block.timestamp - extraPeriodStartTime;

        if (extraPeriod > 0) {
            uint256 marketFactor = SHIFT +
                SHIFT * getBorrowingApr(
                    _borrowings[borrowingIndex].borrowingProfileIndex
                )
                * extraPeriod / DECIMALS / YEAR;
            marketIndex = marketIndex * marketFactor / SHIFT;
        }

        uint256 newAmount = _borrowings[borrowingIndex].amount
            * marketIndex
            / _borrowings[borrowingIndex].lastMarketIndex;

        return newAmount - _borrowings[borrowingIndex].amount;
    }

    /**
     * @dev Helper function for getting amount borrowed by user in USD
     */
    function getBorrowedUsdAmount (
        address userAddress
    ) public view returns (uint256) {
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
        return (_borrowings[borrowingIndex].amount + _borrowings[borrowingIndex].accumulatedFee
                + _getBorrowingFee(borrowingIndex))
            * getUsdRate(_borrowingProfiles[borrowingProfileIndex].contractAddress)
            / SHIFT;
    }

    function _updateAllBorrowingFees (
        address userAddress
    ) internal returns (bool) {
        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            uint256 borrowingIndex =
                _usersBorrowingIndexes[userAddress][i];
            if (borrowingIndex == 0) continue;
            _updateBorrowingFee(borrowingIndex);
        }
        return true;
    }

    function updateAllBorrowingFees (
        address userAddress
    ) external onlyCollateralContract returns (bool) {
        return _updateAllBorrowingFees(userAddress);
    }
}