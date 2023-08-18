pragma solidity ^0.8.10;

import "./RWASetup.sol";
import "src/ExponentialNoError.sol";
import "../helpers/TestRWAOracle.sol";

contract RWALiquidationTest is RWASetup, ExponentialNoError {
    address whiteListedAccount = address(1234567);
    address nonWhiteListedAccount = address(7654321);
    address borrower = address(123);

    uint BORROWER_INITIAL_BALANCE = 1000000 ether;
    uint LIQUIDATOR_NOTE_BALANCE = 1000000 ether;

    // get note for liquidators to perform liquidations
    function getNoteForLiquidators() internal {
        getNote(whiteListedAccount, LIQUIDATOR_NOTE_BALANCE);
        getNote(nonWhiteListedAccount, LIQUIDATOR_NOTE_BALANCE);
        vm.prank(whiteListedAccount);
        note.approve(address(cNote), LIQUIDATOR_NOTE_BALANCE);
        vm.prank(nonWhiteListedAccount);
        note.approve(address(cNote), LIQUIDATOR_NOTE_BALANCE);
    }

    // calculates the expected seize tokens for a liquidation (amount that the liquidator should receive after protocol take)
    function getExpectedSeizeTokens(
        address borrow,
        address collateral,
        uint amountToRepay
    ) internal view returns (uint) {
        (, uint seizeTokens) = comptroller.liquidateCalculateSeizeTokens(
            borrow,
            collateral,
            amountToRepay
        );
        uint protocolSeize = mul_(
            seizeTokens,
            Exp({
                mantissa: CTokenStorage(address(rwaCToken))
                    .protocolSeizeShareMantissa()
            })
        );
        return seizeTokens - protocolSeize;
    }

    function setUp() public override {
        super.setUp();
        whitelist.setWhitelisted(whiteListedAccount, true);
        // put borrower in shortfall
        prankAddCTokenMarket(address(rwaCToken), 0.9e18);
        vm.prank(admin);
        rwaUnderlying.transfer(borrower, BORROWER_INITIAL_BALANCE);

        // borrower must suply RWA
        supplyToken(
            borrower,
            address(rwaUnderlying),
            address(rwaCToken),
            BORROWER_INITIAL_BALANCE
        );

        vm.prank(borrower);
        cNote.borrow((BORROWER_INITIAL_BALANCE * 90) / 100);
        // set collateral factor back to 0 so that borrower is in shortfall
        vm.prank(admin);
        comptroller._setCollateralFactor(CToken(address(rwaCToken)), 0);
    }

    function test_whitelistSetup() external {
        assertTrue(whitelist.isWhitelistedReceiver(whiteListedAccount));
        assertFalse(whitelist.isWhitelistedReceiver(nonWhiteListedAccount));
    }

    function test_shortfallSetup() external {
        (, , uint shortfall) = comptroller.getAccountLiquidity(borrower);
        assertTrue(shortfall > 0);
    }

    // test whitelist is checked before liquidation
    function test_whitelistLiquidation() external {
        // liquidator must be whitelisted
        getNoteForLiquidators();

        uint expectedSeizure = getExpectedSeizeTokens(
            address(cNote),
            address(rwaCToken),
            450000 ether
        );

        // attempt to liquidate with non-whitelisted account
        vm.expectRevert(
            abi.encodeWithSelector(
                CRWAToken.NotWhitelisted.selector,
                nonWhiteListedAccount
            )
        );
        vm.prank(nonWhiteListedAccount);
        cNote.liquidateBorrow(borrower, 450000 ether, rwaCToken);

        // whitelisted account should be able to liquidate
        vm.prank(whiteListedAccount);
        cNote.liquidateBorrow(borrower, 450000 ether, rwaCToken);
        assertEq(rwaCToken.balanceOf(whiteListedAccount), expectedSeizure);
    }

    // test that liquidation threshold is respected
    function test_liquidationThreshold() external {
        getNoteForLiquidators();

        vm.startPrank(whiteListedAccount);
        // for testing, everything is $1, so minimum liquidation amount is 150k rwaCToken
        vm.expectRevert();
        cNote.liquidateBorrow(borrower, 149999 ether, rwaCToken);

        uint expectedSeizure = getExpectedSeizeTokens(
            address(cNote),
            address(rwaCToken),
            150000 ether
        );
        cNote.liquidateBorrow(borrower, 150000 ether, rwaCToken);
        assertEq(rwaCToken.balanceOf(whiteListedAccount), expectedSeizure);
    }
}
