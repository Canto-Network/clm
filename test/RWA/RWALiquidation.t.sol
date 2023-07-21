pragma solidity ^0.8.10;

import "./RWASetup.sol";
import "src/ExponentialNoError.sol";

contract RWALiquidationTest is RWASetup, ExponentialNoError {
    address whiteListedAccount = address(1234567);
    address nonWhiteListedAccount = address(7654321);
    address borrower = address(123);

    uint BORROWER_INITIAL_BALANCE = 1000 ether;
    uint LIQUIDATOR_NOTE_BALANCE = 1000 ether;

    function getNoteForLiquidators() internal {
        getNote(whiteListedAccount, LIQUIDATOR_NOTE_BALANCE);
        getNote(nonWhiteListedAccount, LIQUIDATOR_NOTE_BALANCE);
        vm.prank(whiteListedAccount);
        note.approve(address(cNote), LIQUIDATOR_NOTE_BALANCE);
        vm.prank(nonWhiteListedAccount);
        note.approve(address(cNote), LIQUIDATOR_NOTE_BALANCE);
    }

    function getExpectedSeizeTokens(
        address borrow,
        address collateral,
        uint amountToRepay
    ) internal returns (uint) {
        (, uint seizeTokens) = comptroller.liquidateCalculateSeizeTokens(
            address(cNote),
            address(rwaCToken),
            450 ether
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
        // console.log(shortfall);
        assertTrue(shortfall > 0);
    }

    function test_whitelistLiquidation() external {
        // liquidator must be whitelisted
        getNoteForLiquidators();

        uint expectedSeizure = getExpectedSeizeTokens(
            address(cNote),
            address(rwaCToken),
            450 ether
        );

        // attempt to liquidate with non-whitelisted account
        vm.expectRevert(
            abi.encodeWithSelector(
                CRWAToken.NotWhitelisted.selector,
                nonWhiteListedAccount
            )
        );
        vm.prank(nonWhiteListedAccount);
        cNote.liquidateBorrow(borrower, 450 ether, rwaCToken);

        // whitelisted account should be able to liquidate
        vm.prank(whiteListedAccount);
        cNote.liquidateBorrow(borrower, 450 ether, rwaCToken);
        assertEq(rwaCToken.balanceOf(whiteListedAccount), expectedSeizure);
    }
}
