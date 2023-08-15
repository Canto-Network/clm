// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./CErc20Delegate_RWA.sol";
import "./IWhitelist.sol";
import "./IRWAPriceOracle.sol";

contract CRWAToken is RWACErc20Delegate {
    error NoCRWATranfer();
    error NotWhitelisted(address account);

    address whitelist;
    address public priceOracle;

    uint256 internal constant MINIMUM_LIQUIDATION_USD = 150000;

    /**
     * @notice  Admin function to set the whitelist for RWA token transfers
     * @param   _whitelist  New address of whitelist contract
     */
    function setWhitelist(address _whitelist) external {
        require(
            msg.sender == admin,
            "CRWAToken::setWhitelist: only admin can set whitelist"
        );
        whitelist = _whitelist;
    }

    function setPriceOracle(address _oracle) external {
        require(
            msg.sender == admin,
            "CRWAToken::setPriceOracle: only admin can set price oracle"
        );
        priceOracle = _oracle;
    }

    // cRWA tokens cannot be transferred
    function transferTokens(
        address /*spender*/,
        address /*src*/,
        address /*dst*/,
        uint /*tokens*/
    ) internal pure override returns (uint) {
        revert NoCRWATranfer();
    }

    // must check whitelist during liquidation
    // must check if liquidation will be above minimum liquidation amount
    function seizeInternal(
        address seizerToken,
        address liquidator,
        address borrower,
        uint seizeTokens
    ) internal override {
        // check whitelist
        require(
            whitelist != address(0),
            "CRWAToken::seizeInternal: whitelist not set"
        );
        if (!IWhitelist(whitelist).isWhitelistedReceiver(liquidator)) {
            revert NotWhitelisted(liquidator);
        }

        // check liquidation amount
        require(
            priceOracle != address(0),
            "CRWAToken::seizeInternal: price oracle not set"
        );
        (, int answer, , , ) = IRWAPriceOracle(priceOracle).latestRoundData();
        
        // divide total by 10^(18 + decimals) to get USD value
        uint liquidationAmountUSD = div_(
            mul_(seizeTokens, uint(answer)),
            10 ** (this.decimals() + 18)
        );
        require(
            liquidationAmountUSD >= MINIMUM_LIQUIDATION_USD, "CRWAToken::seizeInternal: liquidation amount below minimum"
        );

        // continue and call normal seizeInternal function
        super.seizeInternal(seizerToken, liquidator, borrower, seizeTokens);
    }
}
