// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @dev Access control contract,
 * functions names are self explanatory
 */
abstract contract AccessControl {
    modifier onlyOwner() {
        require(msg.sender == _owner, 'Caller is not the owner');
        _;
    }
    modifier onlyManager() {
        require(_managers[msg.sender], 'Caller is not the manager');
        _;
    }

    mapping (address => bool) private _managers;
    address private _owner;

    constructor () {
        _owner = msg.sender;
        _managers[_owner] = true;
    }

    // admin functions
    function transferOwnership(address newOwner) public onlyOwner returns (bool) {
        require(newOwner != address(0), 'newOwner should not be zero address');
        _owner = newOwner;
        return true;
    }

    function addToManagers (
        address userAddress
    ) public onlyOwner returns (bool) {
        _managers[userAddress] = true;
        return true;
    }

    function removeFromManagers (
        address userAddress
    ) public onlyOwner returns (bool) {
        _managers[userAddress] = false;
        return true;
    }

    /**
     * @dev If true - user has manager role
     */
    function isManager (
        address userAddress
    ) external view returns (bool) {
        return _managers[userAddress];
    }

    /**
     * @dev Owner address getter
     */
    function owner() public view returns (address) {
        return _owner;
    }
}