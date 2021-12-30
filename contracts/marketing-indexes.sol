// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './storage.sol';

/**
 * @dev Implementation of the marketing indexes calculation
 * in order to calculate fees and yield with dynamically changed APR
 */
contract MarketingIndexes is Storage {
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