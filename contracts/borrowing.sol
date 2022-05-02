// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './marketing-indexes.sol';
import './borrowing-fee.sol';

/**
 * @dev Borrowing functional implementation
 */
contract BorrowingContract is MarketingIndexesContract, BorrowingFeeContract {
    /**
     * @dev Borrowing of the specified amount of assets defined by the borrowing profile
     */
    function borrow (
        uint256 borrowingProfileIndex,
        uint256 amount,
        bool isFixedApr
    ) public returns (bool) {
        require(borrowingProfileIndex > 0 && borrowingProfileIndex
            <= _borrowingProfilesNumber, '7');
        require(_borrowingProfiles[borrowingProfileIndex].active,
            '8');
        require(_borrowingProfiles[borrowingProfileIndex].totalLent > 0,
            '10');
        require(
            (_borrowingProfiles[borrowingProfileIndex].totalBorrowed + amount)
                * DECIMALS
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
            fixedApr += _aprBorrowingFixed;
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
            if (
                _borrowings[borrowingIndex].amount == 0
                    && _borrowings[borrowingIndex].accumulatedFee == 0
            ) _borrowings[borrowingIndex].fixedApr = fixedApr;
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
        uint256 borrowingIndex, uint256 amount, bool returnAll
    ) external returns (bool) {
        require(borrowingIndex > 0 && borrowingIndex
            <= _borrowingsNumber, '13');
        require(_borrowings[borrowingIndex].userAddress == msg.sender,
            '16.1');
        uint256 borrowingProfileIndex = _borrowings[borrowingIndex].borrowingProfileIndex;
        require(!_borrowings[borrowingIndex].liquidated,
            '15');
        require(_borrowingProfiles[borrowingProfileIndex].active, '16');
        _proceedMarketingIndexes(borrowingProfileIndex);
        _updateBorrowingFee(borrowingIndex);
        if (returnAll) {
            amount = _borrowings[borrowingIndex].amount
                + _borrowings[borrowingIndex].accumulatedFee;
        } else {
            require(
                _borrowings[borrowingIndex].amount
                + _borrowings[borrowingIndex].accumulatedFee >= amount,
                '14'
            );
        }
        _takeAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        if (amount <= _borrowings[borrowingIndex].accumulatedFee) {
            _borrowings[borrowingIndex].accumulatedFee -= amount;
        } else {
            amount -= _borrowings[borrowingIndex].accumulatedFee;
            _borrowings[borrowingIndex].accumulatedFee = 0;
            _borrowingProfiles[borrowingProfileIndex].totalBorrowed -= amount;
            _borrowings[borrowingIndex].amount -= amount;
        }

        return true;
    }

    function liquidateBorrowing (
        address userAddress
    ) external onlyCollateralContract returns (uint256) {
        uint256 borrowedUsdAmount;
        for (uint256 i = 1; i <= _borrowingProfilesNumber; i ++) {
            uint256 borrowingIndex = _usersBorrowingIndexes[userAddress][i];
            if (
                borrowingIndex == 0 || _borrowings[borrowingIndex].liquidated
                || _borrowings[borrowingIndex].amount == 0
            ) continue;
            borrowedUsdAmount += (_borrowings[borrowingIndex].amount
                + _borrowings[borrowingIndex].accumulatedFee
                + _getBorrowingFee(borrowingIndex))
                * getUsdRate(_borrowingProfiles[i].contractAddress)
                / SHIFT;

            _updateBorrowingFee(borrowingIndex);
            _borrowingProfiles[i].totalLiquidated += (_borrowings[borrowingIndex].amount
                + _borrowings[borrowingIndex].accumulatedFee);
            _borrowings[borrowingIndex].liquidated = true;

            emit BorrowingLiquidation(
                userAddress, msg.sender, borrowingIndex, block.timestamp
            );
        }
        return borrowedUsdAmount;
    }

    /**
     * @dev Returning of the liquidated assets, let keep accounting
     * of the liquidated and returned assets
     */
    function returnLiquidatedBorrowing (
        uint256 borrowingProfileIndex, uint256 amount
    ) external returns (bool) {
        require(
            msg.sender == _collateralContract.getLiquidationManager(),
            '77'
        );
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

    /**
     * @dev Return maximum available for borrowing assets amount
     */
    function getAvailableBorrowingUsdAmount (
        address userAddress, uint256 borrowingProfileIndex
    ) public view returns (uint256) {
        if (!_borrowingProfiles[borrowingProfileIndex].active) return 0;
        uint256 borrowedUsdAmount = getBorrowedUsdAmount(userAddress);
        uint256 collateralUsdAmount = _collateralContract
        .getUserCollateralUsdAmount(userAddress, true);
        if (collateralUsdAmount <= borrowedUsdAmount) return 0;
        return collateralUsdAmount - borrowedUsdAmount;
    }

    /**
     * @dev Return maximum available for borrowing assets amount
     */
    function getAvailableBorrowingAmount (
        address userAddress, uint256 borrowingProfileIndex
    ) public view returns (uint256) {
        uint256 usdAmount = getAvailableBorrowingUsdAmount(
            userAddress,
            borrowingProfileIndex
        );
        if (usdAmount == 0) return 0;
        return usdAmount
            * SHIFT
            / getUsdRate(_borrowingProfiles[borrowingProfileIndex].contractAddress);
    }
}