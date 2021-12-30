// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './marketing-indexes.sol';

/**
 * @dev Implementation of the lending treating functional,
 * functions names are self explanatory
 */
contract Lending is MarketingIndexes {
    function lend (
        uint256 borrowingProfileIndex, uint256 amount
    ) external returns (bool) {
        require(_liquidationTime[msg.sender] == 0,
            '41');
        require(borrowingProfileIndex > 0 && borrowingProfileIndex <= _borrowingProfilesNumber,
            '42');
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
            _lendings[lendingIndex].amount += amount;
            if (_lendings[lendingIndex].unlock > block.timestamp){
                _lendings[lendingIndex].unlock = block.timestamp + _lockTime;
            }
            _lendings[lendingIndex].lastMarketIndex = _borrowingProfiles
                [borrowingProfileIndex].lendingMarketIndex;
            _lendings[lendingIndex].updatedAt = block.timestamp;
        }
        _borrowingProfiles[borrowingProfileIndex].totalLent += amount;

        _takeAsset(
            _borrowingProfiles[borrowingProfileIndex].contractAddress,
            msg.sender,
            amount
        );

        return true;
    }

    function withdrawLending (
        uint256 borrowingProfileIndex, uint256 amount
    ) external returns (bool) {
        require(_liquidationTime[msg.sender] == 0,
            '43');
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