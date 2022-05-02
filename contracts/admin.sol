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
        return true;
    }
}