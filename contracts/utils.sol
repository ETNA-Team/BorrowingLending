// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @dev Partial interface of the ERC20 standard.
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient, uint256 amount
    ) external returns (bool);
    function transferFrom(
        address sender, address recipient, uint256 amount
    ) external returns (bool);
    function allowance(
        address owner, address spender
    ) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @dev Partial interface of the NftCollateral contract.
 */
interface INftCollateral {
    function setToLiquidation (
        address userAddress
    ) external returns (bool);
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, '80');

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

/**
 * @dev Contract utils implement helper functions for the assets transfer
 */
contract UtilsContract is ReentrancyGuard {
    /**
     * @dev helper function to get paid in Erc20 tokens
     */
    function _takeAsset (
        address tokenAddress, address fromAddress, uint256 amount
    ) internal returns (bool) {
        require(tokenAddress != address(0), '81');
        IERC20 tokenContract = IERC20(tokenAddress);

        tokenContract.transferFrom(fromAddress, address(this), amount);

        return true;
    }

    /**
    * @dev Assets sending, both native currency (when tokenAddreess is set to zero) and erc20 tokens
    */
    function _sendAsset (
        address tokenAddress, address toAddress, uint256 amount
    ) internal nonReentrant returns (bool) {
        if (tokenAddress == address(0)) {
            require(address(this).balance >= amount, '82');
            payable(toAddress).transfer(amount);
        } else {
            IERC20 tokenContract = IERC20(tokenAddress);
            tokenContract.transfer(toAddress, amount);
        }
        return true;
    }
}