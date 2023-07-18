// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./CErc20Delegate.sol";

contract CRWAToken is RWACErc20Delegate {
    error NoCRWATranfer();

    // cRWA tokens cannot be transferred
    function transferTokens(
        address /*spender*/,
        address /*src*/,
        address /*dst*/,
        uint /*tokens*/
    ) internal virtual override returns (uint) {
        revert NoCRWATranfer();
    }
}
