// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./CErc20Delegate_RWA.sol";
import "./IWhitelist.sol";
import "./IRWAPriceOracle.sol";

contract CRWAToken is CErc20Delegate_RWA {
    error NoCRWATransfer();
    error NotWhitelisted(address account);

    address whitelist;
    address public priceOracle;

    uint256 internal constant MINIMUM_LIQUIDATION_USD = 150000;

    /**
     * @notice  Admin function to set the whitelist for RWA token transfers
     * @param   _whitelist  New address of whitelist contract
     */
    function setWhitelist(address _whitelist) external {
        require(msg.sender == admin, "CRWAToken::setWhitelist: only admin can set whitelist");
        whitelist = _whitelist;
    }

    /**
     * @notice  Admin function to set the price oracle for the RWA underlying
     * @param   _oracle  New address of price oracle contract
     */
    function setPriceOracle(address _oracle) external {
        require(msg.sender == admin, "CRWAToken::setPriceOracle: only admin can set price oracle");
        priceOracle = _oracle;
    }

    /**
     * @notice  No token transfers can take place for CRWATokens
     * @dev     Any type of transfer (except liquidations) will revert
     * @return  uint  For legacy reasons, will always revert
     */
    function transferTokens(
        address /*spender*/,
        address /*src*/,
        address /*dst*/,
        uint /*tokens*/
    ) internal pure override returns (uint) {
        revert NoCRWATransfer();
    }

    /**
     * @notice  Internal function to seize tokens from a borrower
     * @dev     Must check whitelist and value of seizeTokens before liquidation
     * @param   seizerToken  Address of borrowed token calling this internal function
     * @param   liquidator  Address of liquidator
     * @param   borrower  Address of borrower
     * @param   seizeTokens  Amount of tokens to seize
     */
    function seizeInternal(
        address seizerToken,
        address liquidator,
        address borrower,
        uint seizeTokens
    ) internal override {
        // check whitelist
        require(whitelist != address(0), "CRWAToken::seizeInternal: whitelist not set");
        if (!IWhitelist(whitelist).isCustomer(liquidator)) {
            revert NotWhitelisted(liquidator);
        }
        /** check liquidation amount */

        // get current price of underlying RWA
        require(priceOracle != address(0), "CRWAToken::seizeInternal: price oracle not set");
        (, int answer, , , ) = IRWAPriceOracle(priceOracle).latestRoundData();

        // convert seizeTokens to underlying RWA amount (exchange rate is scaled to 1e18)
        uint underlyingTokens = div_(
            mul_(seizeTokens, exchangeRateStoredInternal()),
            1e18
        );
        // divide total by 10^(underlyingDecimals + priceDecimals) to get USD value
        uint liquidationAmountUSD = div_(
            mul_(underlyingTokens, uint(answer)),
            10 ** (EIP20Interface(underlying).decimals() + IRWAPriceOracle(priceOracle).decimals())
        );
        require(liquidationAmountUSD >= MINIMUM_LIQUIDATION_USD, "CRWAToken::seizeInternal: liquidation amount below minimum");

        // continue and call normal seizeInternal function
        super.seizeInternal(seizerToken, liquidator, borrower, seizeTokens);
    }
}
