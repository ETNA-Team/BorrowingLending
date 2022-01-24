// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import 'hardhat/console.sol';
import './marketing-indexes.sol';
import './collateral.sol';

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
        require(_borrowings[borrowingIndex].userAddress == msg.sender,
            '16.1');
        uint256 borrowingProfileIndex = _borrowings[borrowingIndex].borrowingProfileIndex;
        _proceedMarketingIndexes(borrowingProfileIndex);
        _updateBorrowingFee(borrowingIndex);
        require(
            _borrowings[borrowingIndex].amount
                + _borrowings[borrowingIndex].accumulatedFee >= amount,
            '14'
        );
        require(!_borrowings[borrowingIndex].liquidated,
            '15');
        require(_borrowingProfiles[borrowingProfileIndex].active, '16');
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