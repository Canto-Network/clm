// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./CErc20Delegate_RWA.sol";
import "./IWhitelist.sol";

contract CRWAToken is RWACErc20Delegate {
    error NoCRWATranfer();
    error NotWhitelisted(address account);

    address whitelist;

    
    /**
     * @notice  Admin function to set the whitelist for RWA token transfers
     * @param   _whitelist  New address of whitelist contract
     */
    function setWhitelist(address _whitelist) external {
        require(msg.sender == admin, "CRWAToken::setWhitelist: only admin can set whitelist");
        whitelist = _whitelist;
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
    function seizeInternal(
        address seizerToken,
        address liquidator,
        address borrower,
        uint seizeTokens
    ) internal override {
        require(whitelist != address(0), "CRWAToken::seizeInternal: whitelist not set");
        if (!IWhitelist(whitelist).isWhitelistedReceiver(liquidator)) {
            revert NotWhitelisted(liquidator);
        }
        // continue and call normal seizeInternal function
        super.seizeInternal(seizerToken, liquidator, borrower, seizeTokens);
    }
}
