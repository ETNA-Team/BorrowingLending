// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './storage.sol';

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
        uint256 borrowingMarketFactor = SHIFT;
        if (_borrowingProfiles[borrowingProfileIndex].totalLent > 0) {
            borrowingMarketFactor += SHIFT * getBorrowingApr(borrowingProfileIndex)
            * borrowingPeriod / DECIMALS / YEAR;
        }
        _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndex *= borrowingMarketFactor;
        _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndex /= SHIFT;
        _borrowingProfiles[borrowingProfileIndex].borrowingMarketIndexLastTime = block.timestamp;

        uint256 lendingPeriod = block.timestamp
            - _borrowingProfiles[borrowingProfileIndex].lendingMarketIndexLastTime;
        uint256 lendingMarketFactor = SHIFT + (
            SHIFT * getLendingApr(borrowingProfileIndex)
            * lendingPeriod / DECIMALS / YEAR
        );

        _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex *= lendingMarketFactor;
        _borrowingProfiles[borrowingProfileIndex].lendingMarketIndex /= SHIFT;
        _borrowingProfiles[borrowingProfileIndex].lendingMarketIndexLastTime = block.timestamp;

        return true;
    }

    function setAprSettings (
        uint16 aprBorrowingMin,
        uint16 aprBorrowingMax,
        uint16 aprBorrowingFixed,
        uint16 aprLendingMin,
        uint16 aprLendingMax
    ) external onlyManager returns (bool) {
        for (uint256 i; i < _borrowingProfilesNumber; i ++) {
            _proceedMarketingIndexes(i + 1);
        }
        _aprBorrowingMin = aprBorrowingMin;
        _aprBorrowingMax = aprBorrowingMax;
        _aprBorrowingFixed = aprBorrowingFixed;
        _aprLendingMin = aprLendingMin;
        _aprLendingMax = aprLendingMax;
        return true;
    }

    function getBorrowingApr (
        uint256 borrowingProfileIndex
    ) public view returns (uint256) {
        if (_borrowingProfiles[borrowingProfileIndex].totalLent == 0) return 0;
        uint256 borrowingPercentage = _borrowingProfiles[borrowingProfileIndex].totalBorrowed
            * DECIMALS
            / _borrowingProfiles[borrowingProfileIndex].totalLent;
        if (borrowingPercentage > 9500) return _aprBorrowingMax;
        return _aprBorrowingMin + (
            borrowingPercentage * (_aprBorrowingMax - _aprBorrowingMin) / 9500
        );
    }

    function getLendingApr (uint256 borrowingProfileIndex) public view returns (uint256) {
        uint256 lendingApr = _aprLendingMin;
        if (_borrowingProfiles[borrowingProfileIndex].totalLent > 0) {
            uint256 borrowingPercentage = _borrowingProfiles[borrowingProfileIndex].totalBorrowed
                * DECIMALS
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