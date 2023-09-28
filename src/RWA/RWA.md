# RWA CToken Audit

# Overview

CRWAToken is a contract that enables RWA tokens to be used as collateral in the Canto Lending Market (compound v2). CRWAToken inherits from the Compound v2 CToken contract (with slight changes to certain visibilities to allow for overrides).

### About RWA CToken (CRWAToken):

cToken with RWA token (erc20) as underlying asset

### Requirements for RWA CTokens:

-   CRWAToken must not be transferrable unless liquidated by a whitelisted party
-   CRWAToken has a minimum liquidation size of 150k USD. So for example, an entire $290k liquidation will only happen if the liquidator liqudates the entire position.

About whitelist:

-   whitelisted addresses are published to a contract by the RWA issuer
-   this interface can be found in IWhitelist.sol (not in scope)

### Specific changes include:

**Changes to CToken contracts**

-   No transfers
    -   CRWATokens cannot be transferred under any circumstance (except liquidation)
    -   All functions that will perform normal ERC20 transfers will fail through the `transferTokens()` function
-   Minimum liquidation size
    -   Any liquidation of CRWATokens must be at least worth the value set by `MINIMUM_LIQUIDATION_USD`
    -   This will be checked in the `seizeInternal()` override function
    -   Using the priceOracle set in the CRWAToken, the price is calculated and must be worth at least `MINIMUM_LIQUIDATION_USD` for the liquidation to occur
    -   Only whitelisted accounts can perform liquidation, via require statement in `seizeInternal()`

**Visibility Changes for overriding**

-   CToken
    -   `transferTokens()` changed to virtual
        -   allows for override to force this function to always fail
    -   `seizeInternal()` changed to virtual
        -   allows for override to perform RWA checks (whitelist, minimum amount)
        -   calls `super.seizeInternal()` after RWA checks pass

# Scope

| Contract                       | SLOC | Purpose                                                                                                                                                                                               |
| ------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src/RWA/CRWAToken.sol          | 26   | This contract inherits the compound v2 CErc20Delegate contract and adds the extra functionality for setting the RWA whitelist, priceOracle, and logic around transferring and liquidating RWA cTokens |
| src/RWA/CErc20Delegate_RWA.sol | 2    | This contract inherits RWACErc20 instead of compound CErc20                                                                                                                                           |
| src/RWA/CErc20_RWA.sol         | 2    | This contract inherites RWACToken instead of compound CToken                                                                                                                                          |
| src/RWA/CToken_RWA.sol         | 3    | This contract changes the visibility of transferTokens() [line 68] and seizeInternal() [line 803] to virtual functions to allow for overrides in src/RWA/CRWAToken.sol to be possible.                |

# Tests

Testing will work with the latest version of foundry installed.

New testing files added to repo:

-   test/RWA/RWA.t.sol
-   test/RWA/RWAFuzz.t.sol
-   test/RWA/RWALiquidation.t.sol
-   test/CLMPriceOracle.t.sol

Set up .env file with:

```bash
# .env
PRIVATE_KEY="your private key here"
```

To run tests

```bash
# make sure yarn is installed and install all packages
yarn install

# run basic RWA test
forge test --match-contract RWATest -vv

# run RWA fuzz test
forge test --match-contract RWAFuzz -vv

# run RWA liquidation test
forge test --match-contract RWALiquidationTest -vv

# run CLMPriceOracle test
forge test --match-contract CLMPriceOracleTest -vv

```
