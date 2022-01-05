// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './storage.sol';

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