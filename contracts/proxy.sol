// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
import './access-control.sol';

/**
 * @dev Partial interface of the external contract (for the case if some new logic will be needed).
 */
interface IExternal {
    function getUsdRate(address contractAddress) external view returns (uint256);
}

/**
 * @dev Partial interface of the ERC20 standard according to the needs of the e2p contract.
 */
interface IERC20_LP {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function getReserves() external view returns (uint112, uint112, uint32);
}

/*
 * This contract utilizes usd rate calculation for specific token contract using LP pairs
 * with possibility of adding external contracts with a new logic for specific tokens
 */
contract Proxy is AccessControl {
    struct Rate {
        address externalContractAddress; // possibility to add some new logic if needed
        address lpAddress; // LP pair contract
        uint256 rate; // manually set rate (is used if both externalContractAddress and
        // lpAddress are zero
        uint8 rateType; // 0 - for a cross rate between token0 and token1
        // 1, 2 - for a rate between lp token itself and token0 or token1
        uint8 decimals; // decimals of the token
        uint8 decimals0; // decimals of token0
        uint8 decimals1; // decimals of token1
        bool reverse; // order of the token0 and token1 when rate is calculated
    }
    mapping (address => Rate) internal _usdRates;
    uint256 internal constant SHIFT = 1 ether;

    constructor (
        address newOwner
    ) {
        require(newOwner != address(0), 'Owner address can not be zero');
        addToManagers(newOwner);
        transferOwnership(newOwner);
    }

    /**
     * Setting of all necessary data for rate calculation for specific token
     */
    function setUsdRateData (
        address contractAddress,
        address externalContractAddress,
        address lpAddress,
        uint256 rate,
        uint8 rateType,
        uint8 decimals,
        uint8 decimals0,
        uint8 decimals1,
        bool reverse
    ) external onlyManager returns (bool) {
        _usdRates[contractAddress].externalContractAddress = externalContractAddress;
        _usdRates[contractAddress].lpAddress = lpAddress;
        _usdRates[contractAddress].rate = rate;
        _usdRates[contractAddress].rateType = rateType;
        _usdRates[contractAddress].decimals = decimals;
        _usdRates[contractAddress].decimals0 = decimals0;
        _usdRates[contractAddress].decimals1 = decimals1;
        _usdRates[contractAddress].reverse = reverse;
        return true;
    }

    /**
     * Getting of rate data set for specific token
     */
    function getUsdRateData (
        address contractAddress
    ) external view returns (
        address externalContractAddress,
        address lpAddress,
        uint256 rate,
        uint8 rateType,
        bool reverse
    ) {
        return (
            _usdRates[contractAddress].externalContractAddress,
            _usdRates[contractAddress].lpAddress,
            _usdRates[contractAddress].rate,
            _usdRates[contractAddress].rateType,
            _usdRates[contractAddress].reverse
        );
    }

    /**
     * Getting of the decimals data for specific token
     */
    function getUsdRateDecimals (
        address contractAddress
    ) external view returns (
        uint8 decimals,
        uint8 decimals0,
        uint8 decimals1
    ) {
        return (
            _usdRates[contractAddress].decimals,
            _usdRates[contractAddress].decimals0,
            _usdRates[contractAddress].decimals1
        );
    }

    /**
     * Getting of the usd rate for specific token. Rate is given using
     * decimals point shifting. Decimal exponent uses formula
     * 18 + (18 - token decimals). For example if rate is 1.2 and
     * token decimals is 6 rate will be 1.2 * 10**30
     */
    function getUsdRate (
        address contractAddress
    ) external view returns (uint256) {
        if (_usdRates[contractAddress].externalContractAddress != address(0)) {
            IExternal externalContract =
                IExternal(_usdRates[contractAddress].externalContractAddress);
            return externalContract.getUsdRate(contractAddress);
        }
        if (_usdRates[contractAddress].lpAddress == address(0)) {
            return _usdRates[contractAddress].rate;
        }
        IERC20_LP lpToken = IERC20_LP(
            _usdRates[contractAddress].lpAddress
        );
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1,) = lpToken.getReserves();
        if (reserve0 == 0 || reserve1 == 0) return 0;
        if (_usdRates[contractAddress].decimals0 < 18) {
            reserve0 *= uint112(10 ** (18 - _usdRates[contractAddress].decimals0));
        }
        if (_usdRates[contractAddress].decimals1 < 18) {
            reserve1 *= uint112(10 ** (18 - _usdRates[contractAddress].decimals1));
        }
        uint256 rate;
        if (_usdRates[contractAddress].reverse) {
            rate = SHIFT
                * uint256(reserve1) / uint256(reserve0);
        } else {
            rate = SHIFT
                * uint256(reserve0) / uint256(reserve1);
        }
        if (_usdRates[contractAddress].decimals < 18) {
            rate *= 10 ** (18 - _usdRates[contractAddress].decimals);
        }
        if (_usdRates[contractAddress].rateType == 0) {
            return rate;
        } else {
            IERC20_LP lpMain = IERC20_LP(contractAddress);
            (reserve0, reserve1,) = lpMain.getReserves();
            uint256 total = lpMain.totalSupply();
            if (reserve0 == 0 || reserve1 == 0 || total == 0) return 0;
            if (_usdRates[contractAddress].rateType == 1) {
                return rate * 2 * reserve0 / total;
            } else if (_usdRates[contractAddress].rateType == 2) {
                return rate * 2 * reserve1 / total;
            }
        }
        return 0;
    }
}