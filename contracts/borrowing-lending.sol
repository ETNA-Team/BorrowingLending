// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './borrowing.sol';
import './lending.sol';
import './admin.sol';

/**
 * @dev Main BorrowingLending contract
 */
contract BorrowingLendingContract is BorrowingContract, LendingContract, AdminContract {
    /**
     * Error messages:
     * borrowing-lending.sol
     * 1 - Owner address can not be zero
     * 2 - Etna contract address can not be zero
     * 3 - Max APR should be greater or equal than min APR
     * admin.sol
     * 4 - Message value should be zero for an ERC20 replenish
     * 5 - Amount should be greater than zero
     * 6 - Message value should be greater than zero
     * borrowing.sol
     * 7 - Borrowing profile is not found
     * 8 - Borrowing profile is blocked
     * 9 - Message sender is flagged for liquidation
     * 10 - No assets to borrow
     * 11 - Not enough assets to borrow
     * 12 - Not enough collateral
     * 13 - Borrowing is not found
     * 14 - Amount can not be greater than borrowing amount
     * 15 - This borrowing is liquidated
     * 16 - Borrowing profile is blocked
     * 16.1 - Sender is not the Borrowing owner
     * collateral.sol
     * 17 - Collateral profile is not found
     * 18 - Collateral profile is blocked
     * 19 - For this type of collateral only internal transfers available
     * 20 - Message value should be greater than zero
     * 21 - Message value should be zero for an ERC20 collateral
     * 22 - Amount should be greater than zero
     * 23 - Wrong collateral profile
     * 27 - Collateral profile is not found
     * 28 - Collateral profile is blocked
     * 29 - Not enough NETNA to withdraw
     * 30 - Not enough available to withdraw collateral
     * 31 - This collateral is liquidated
     * lending.sol
     * 41 - Message sender is flagged for liquidation
     * 42 - Borrowing profile is not found
     * 43 - Message sender is flagged for liquidation
     * 44 - Lending is not found
     * 45 - Borrowing profile is not found
     * 46 - Amount should be greater than zero
     * 47 - Not enough lending amount
     * 47.1 - This lending can not be withdrawn at the moment
     * 48 - Message sender is flagged for liquidation
     * 49 - Lending is not found
     * 50 - Borrowing profile is not found
     * 51 - Amount should be greater than zero
     * 52 - Not enough yield
     * liquidation.sol
     * 53 - Liquidation requirements is not met
     * 54 - User is already flagged for liquidation
     * 55 - User is at liquidation
     * 56 - User is not flagged for liquidation
     * 57 - User was not flagged for a liquidation
     * 58 - Liquidation period is not over yet
     * 59 - Liquidation requirements is not met
     * marketing-indexes.sol
     * 60 - Borrowing apr can not be calculated when nothing is lent
     * 61 - Borrowing apr can not be calculated when not enough assets to borrow
     * storage.sol
     * 62 - caller is not the owner
     * 63 - caller is not the manager
     * 631 - caller is neither the manager nor liquidation contract
     * 64 - Contract address should not be zero
     * 65 - Borrowing profile is not found
     * 66 - Collateral record is not found
     * 67 - Borrowing record is not found
     * 68 - Borrowing profile is not found
     * 69 - Collateral profile is not found
     * 70 - Collateral profile is not found
     * 71 - Collateral profile is not found
     * 72 - Collateral profile is not found
     * 73 - Etna contract address can not be zero
     * 74 - Etna contract address can not be zero
     * 75 - Etna contract address can not be zero
     * 76 - Liquidation manager address can not be zero
     * 77 - caller is not the liquidation manager
     * 78 - caller is not the liquidator
     * 79 - caller is not the nft collateral contract
     * 791 - caller is not the collateral contract
     * 792 - caller is not the access vault contract
     * 793 - Owner address can not be zero
     * 794 - Amount exceeds contract balance
     * utils.sol
     * 80 - ReentrancyGuard: reentrant call
     * 81 - Token address should not be zero
     * 82 - Not enough contract balance
     */
    constructor (
        address newOwner,
        uint16 aprBorrowingMin,
        uint16 aprBorrowingMax,
        uint16 aprBorrowingFixed,
        uint16 aprLendingMin,
        uint16 aprLendingMax
    ) {
        require(newOwner != address(0), '1');
        require(aprBorrowingMax >= aprBorrowingMin, '3');
        require(aprLendingMax >= aprLendingMin, '3');

        _owner = newOwner;
        _managers[newOwner] = true;
        _aprBorrowingMin = aprBorrowingMin;
        _aprBorrowingMax = aprBorrowingMax;
        _aprBorrowingFixed = aprBorrowingFixed;
        _aprLendingMin = aprLendingMin;
        _aprLendingMax = aprLendingMax;
    }
}