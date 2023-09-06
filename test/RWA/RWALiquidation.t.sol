pragma solidity ^0.8.10;

import "./RWASetup.sol";
import "src/ExponentialNoError.sol";
import "../helpers/TestRWAOracle.sol";

contract RWALiquidationTest is RWASetup, ExponentialNoError {
    address whiteListedAccount = address(1234567);
    address nonWhiteListedAccount = address(7654321);
    address borrower1 = address(123);
    address borrower2 = address(321);

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
        rwaUnderlying.transfer(borrower1, BORROWER_INITIAL_BALANCE);

        // borrower must suply RWA
        supplyToken(
            borrower1,
            address(rwaUnderlying),
            address(rwaCToken),
            BORROWER_INITIAL_BALANCE
        );

        vm.prank(borrower1);
        cNote.borrow((BORROWER_INITIAL_BALANCE * 90) / 100);
        // set collateral factor back to 0 so that borrower is in shortfall
        vm.prank(admin);
        comptroller._setCollateralFactor(CToken(address(rwaCToken)), 0);
    }

    function test_whitelistSetup() external {
        assertTrue(whitelist.isCustomer(whiteListedAccount));
        assertFalse(whitelist.isCustomer(nonWhiteListedAccount));
    }

    function test_shortfallSetup() external {
        (, , uint shortfall) = comptroller.getAccountLiquidity(borrower1);
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
        cNote.liquidateBorrow(borrower1, 450000 ether, rwaCToken);

        // whitelisted account should be able to liquidate
        vm.prank(whiteListedAccount);
        cNote.liquidateBorrow(borrower1, 450000 ether, rwaCToken);
        assertEq(rwaCToken.balanceOf(whiteListedAccount), expectedSeizure);
    }

    // test that liquidation threshold is respected
    function test_liquidationThreshold() external {
        getNoteForLiquidators();

        vm.startPrank(whiteListedAccount);
        // for testing, everything is $1, so minimum liquidation amount is 150k rwaCToken
        vm.expectRevert();
        cNote.liquidateBorrow(borrower1, 149999 ether, rwaCToken);

        uint expectedSeizure = getExpectedSeizeTokens(
            address(cNote),
            address(rwaCToken),
            150000 ether
        );
        cNote.liquidateBorrow(borrower1, 150000 ether, rwaCToken);
        assertEq(rwaCToken.balanceOf(whiteListedAccount), expectedSeizure);
    }

    // test when the exchange rate is not 1:1
    function setUpCTokenExchangeRates(
        uint _exchangeRate
    ) internal returns (CRWAToken) {
        vm.startPrank(admin);
        // deploy new RWA with different exchange rate (don't mess up the other tests)
        ERC20 newRwaUnderlying = new ERC20(
            "New RWA",
            "NRWA",
            ADMIN_INITIAL_BALANCE,
            18
        );
        CRWAToken newCRWAToken = new CRWAToken();
        newCRWAToken = CRWAToken(
            address(
                new CErc20Delegator(
                    address(newRwaUnderlying),
                    comptroller,
                    new NoteRateModel(0),
                    _exchangeRate,
                    "NcRWA",
                    "NcRWA",
                    18,
                    payable(admin),
                    address(newCRWAToken),
                    ""
                )
            )
        );
        // can use same tet oracle
        TestRWAOracle rwaOracle = new TestRWAOracle();
        newCRWAToken.setPriceOracle(address(rwaOracle));

        // same whitelist and set in rwaCToken
        newCRWAToken.setWhitelist(address(whitelist));
        vm.stopPrank();

        // add market to comptroller
        prankAddCTokenMarket(address(newCRWAToken), 0.9e18);
        vm.prank(admin);

        // give underlying to borrower
        newRwaUnderlying.transfer(borrower2, BORROWER_INITIAL_BALANCE);

        // borrower must suply new RWA tokens
        supplyToken(
            borrower2,
            address(newRwaUnderlying),
            address(newCRWAToken),
            BORROWER_INITIAL_BALANCE
        );

        vm.prank(borrower2);
        cNote.borrow((BORROWER_INITIAL_BALANCE * 90) / 100);
        // set collateral factor back to 0 so that borrower is in shortfall
        vm.prank(admin);
        comptroller._setCollateralFactor(CToken(address(newCRWAToken)), 0);

        return newCRWAToken;
    }

    // test exchange rate when less than 1
    function test_liquidationThresholdWithExchangeRateLessThan1() external {
        // set up new RWA with exchange rate of 0.5
        CRWAToken newCRWAToken = setUpCTokenExchangeRates(0.5e18);
        /** Test liquidation amounts */
        getNoteForLiquidators();
        vm.startPrank(whiteListedAccount);

        // this should still fail
        vm.expectRevert();
        cNote.liquidateBorrow(borrower2, 149999 ether, newCRWAToken);

        // since exchange rate is 0.5, expected seize tokens should be greater than 150k
        uint expectedSeizure = getExpectedSeizeTokens(
            address(cNote),
            address(newCRWAToken),
            150000 ether
        );
        assertTrue(expectedSeizure > 150000 ether, "expected seize tokens");

        cNote.liquidateBorrow(borrower2, 150000 ether, newCRWAToken);
        assertEq(newCRWAToken.balanceOf(whiteListedAccount), expectedSeizure);
    }

    // test exchange rate when greater than 1
    function test_liquidationThresholdWithExchangeRateGreaterThan1() external {
        // set up new RWA with exchange rate of 2
        CRWAToken newCRWAToken = setUpCTokenExchangeRates(2e18);
        /** Test liquidation amounts */
        getNoteForLiquidators();
        vm.startPrank(whiteListedAccount);

        // this should still fail
        vm.expectRevert();
        cNote.liquidateBorrow(borrower2, 149999 ether, newCRWAToken);

        // since exchange rate is 2, expected seize tokens should be less than 150k
        uint expectedSeizure = getExpectedSeizeTokens(
            address(cNote),
            address(newCRWAToken),
            150000 ether
        );
        assertTrue(expectedSeizure < 150000 ether, "expected seize tokens");

        cNote.liquidateBorrow(borrower2, 150000 ether, newCRWAToken);
        assertEq(newCRWAToken.balanceOf(whiteListedAccount), expectedSeizure);
    }
}
