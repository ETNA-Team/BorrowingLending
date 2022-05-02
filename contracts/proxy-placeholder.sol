// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './access-control.sol';


contract ProxyPlaceholder is AccessControl {
    mapping (address => uint256) internal _usdRates;

    constructor (
        address newOwner
    ) {
        require(newOwner != address(0), 'Owner address can not be zero');
        addToManagers(newOwner);
        transferOwnership(newOwner);
    }

    function setUsdRate (
        address contractAddress,
        uint256 rate
    ) external onlyManager returns (bool) {
        _usdRates[contractAddress] = rate;
        return true;
    }

    function getUsdRate (
        address contractAddress
    ) external view returns (uint256) {
        return _usdRates[contractAddress];
    }
}