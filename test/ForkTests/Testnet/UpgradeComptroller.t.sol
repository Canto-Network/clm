pragma solidity ^0.8.10;

import "forge-std/console.sol";
import "forge-std/Test.sol";
import "../../../src/ComptrollerV2.sol";
import "../../../src/Comptroller.sol";
import "../../../src/Unitroller.sol";
import "../../../src/CToken.sol";
import "../../../src/RWA/CRWAToken.sol";
import "../../../src/ERC20.sol";
// import "../../../src/CNote.sol";

contract UpgradeComptroller is Test {
    uint256 cantoTestnetFork;
    address admin = 0x287FD606108AF7068a0706588355beC8eA8465f1;
    address oldComptrollerAddress = 0xA51436eF5D46EE56B0906DeC620466153f7fb77e;
    address unitrollerAddress = 0x9514c07bC6e80B652e4264E64f589C59065C231f;

    // hashnote addresses
    address usyc = 0xd3D41C08a7e14129bF6Ec9A32697322C70af7E5a;
    ERC20 usycContract = ERC20(usyc);
    address usycOracle = 0x35b96d80C72f873bACc44A1fACfb1f5fac064f1a;
    address usycWhitelist = 0x38D3A3f8717F4DB1CcB4Ad7D8C755919440848A3;

    address cUsycAdress = 0xf8892860437674690fC34746d0e93d881d5b96B4;
    CToken cUsyc = CToken(cUsycAdress);
    CRWAToken cUsycContract = CRWAToken(cUsycAdress);

    address noteAddress = 0x03F734Bd9847575fDbE9bEaDDf9C166F880B5E5f;
    ERC20 noteContract = ERC20(noteAddress);

    address cNoteAddress = 0x04E52476d318CdF739C38BD41A922787D441900c;
    CRWAToken cNote = CRWAToken(cNoteAddress);

    Comptroller unitroller = Comptroller(unitrollerAddress);
    Unitroller unitrollerContract = Unitroller(payable(unitrollerAddress));

    ComptrollerV2 comptrollerV2;

    struct Market {
        // Whether or not this market is listed
        bool isListed;
        //  Multiplier representing the most one can borrow against their collateral in this market.
        //  For instance, 0.9 to allow borrowing 90% of collateral value.
        //  Must be between 0 and 1, and stored as a mantissa.
        uint256 collateralFactorMantissa;
        // Per-market mapping of "accounts in this asset"
        mapping(address => bool) accountMembership;
        // Whether or not this market receives COMP
        bool isComped;
    }

    function setUp() public {
        cantoTestnetFork = vm.createFork("https://testnet-archive.plexnode.wtf");
        vm.selectFork(cantoTestnetFork);
        vm.rollFork(3_915_377); // go to block height where we know testnet state
    }

    // function to upgrade unitroller implentation to comptrollerV2
    function upgrade() public {
        // deploy new comptrollerV2
        comptrollerV2 = new ComptrollerV2();

        // set comptrollerV2 as pending implementation
        vm.startPrank(admin);
        unitrollerContract._setPendingImplementation(address(comptrollerV2));

        // accept comptrollerV2 as implementation
        comptrollerV2._become(unitrollerContract);
        vm.stopPrank();
    }

    function increaseCollateralFactor() public {
        vm.startPrank(admin);

        //set collateral factor to 0.99
        unitroller._setCollateralFactor(cUsyc, 0.99e18);

        vm.stopPrank();
    }

    // ensure that state is what we expect
    function testState() public {
        assertEq(block.number, 3_915_377);
        assertEq(address(0xEf109EF4969261eB92A9F00d6639b440160Cc237).balance, 5565726284354500000000);
        assertEq(admin, unitroller.admin());
        assertEq(oldComptrollerAddress, unitroller.comptrollerImplementation());
    }

    // test that implementation is changed
    function test_Upgrade() public {
        assertEq(oldComptrollerAddress, unitroller.comptrollerImplementation());
        upgrade();
        assertEq(address(comptrollerV2), unitroller.comptrollerImplementation());
    }

    // test setting collateral factor of USYC to 0.99
    function test_SetCollateralFactorBeforeUpgrade() public {
        uint256 usycCollateralFactor;

        // check collateral factor is 0.9 before updating
        (, usycCollateralFactor,) = unitroller.markets(cUsycAdress);
        assertEq(usycCollateralFactor, 0.9e18);

        increaseCollateralFactor();

        // check that collateral factor is still 0.9
        (, usycCollateralFactor,) = unitroller.markets(cUsycAdress);
        assertEq(usycCollateralFactor, 0.9e18);
    }

    // test setting collateral factor of USYC to 0.99
    function test_SetCollateralFactorAferUpgrade() public {
        // upgrade to comptrollerV2
        upgrade();

        uint256 usycCollateralFactor;

        // check collateral factor is 0.9 before updating
        (, usycCollateralFactor,) = unitroller.markets(cUsycAdress);
        assertEq(usycCollateralFactor, 0.9e18);

        increaseCollateralFactor();

        // check collateral factor is 0.99 after updating
        (, usycCollateralFactor,) = unitroller.markets(cUsycAdress);
        assertEq(usycCollateralFactor, 0.99e18);
    }

    // test setting close factor to 1
    function test_SetCloseFactor() public {
        uint256 closeFactor;

        // check close factor is 0.5 before updating
        closeFactor = unitroller.closeFactorMantissa();
        assertEq(closeFactor, 0.5e18);

        vm.startPrank(admin);

        //set close factor to 1
        unitroller._setCloseFactor(1e18);

        // check close factor is 1 after updating
        closeFactor = unitroller.closeFactorMantissa();
        assertEq(closeFactor, 1e18);
        vm.stopPrank();
    }

    // test markets before and after comptroller upgrade
    function test_Markets() public {
        address cNoteAddress = 0x04E52476d318CdF739C38BD41A922787D441900c;
        bool isListed;
        uint256 cNoteCollateralFactor;
        bool isComped;

        // check cNote before upgrade
        (isListed, cNoteCollateralFactor, isComped) = unitroller.markets(cNoteAddress);
        assertEq(isListed, true);
        assertEq(cNoteCollateralFactor, 0.8e18);
        assertEq(isComped, false);

        // upgrade to comptrollerV2
        upgrade();

        // check cNote after upgrade
        (isListed, cNoteCollateralFactor, isComped) = unitroller.markets(cNoteAddress);
        assertEq(isListed, true);
        assertEq(cNoteCollateralFactor, 0.8e18);
        assertEq(isComped, false);
    }

    // test borrows before and after comptroller upgrade
    function test_Borrows() public {
        address whitelistedUser = 0xEf109EF4969261eB92A9F00d6639b440160Cc237;
        uint256 balBefore = usycContract.balanceOf(whitelistedUser);
        uint256 SUPPLY_AMOUNT = 1000e6;

        vm.startPrank(whitelistedUser);

        // approve USYC for cUsyc
        usycContract.approve(cUsycAdress, SUPPLY_AMOUNT);
        uint256 mintStatus = cUsycContract.mint(SUPPLY_AMOUNT);

        // check that user has 1e6 * exchangeRateMantissa cUSYC
        uint256 balAfter = usycContract.balanceOf(whitelistedUser);
        assertEq(balAfter, balBefore - SUPPLY_AMOUNT);

        // confirm cUSYC balance
        uint256 balCUsyc = cUsycContract.balanceOf(whitelistedUser);
        assertEq(balCUsyc, SUPPLY_AMOUNT * cUsycContract.exchangeRateStored() / 1e18);

        // borrow 900 NOTE
        noteContract.approve(cNoteAddress, 900e18);
        uint256 borrowStatus = cNote.borrow(900e18);

        uint256 liquidity;
        // check account liquidity
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, 45e18); // should have 45 NOTE left to borrow, since USYC price is 1.05

        // borrow up to limit
        noteContract.approve(cNoteAddress, 45e18);
        borrowStatus = cNote.borrow(45e18);
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, 0);

        // upgrade to comptrollerV2 and increase collateral factor
        upgrade();
        increaseCollateralFactor();

        // check liquidity after increasing collateral factor
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, 94.5e18);
    }

    // test when upgrade happens before any supplies and borrows
    function test_upgradeBeforeBorrows() public {
        // upgrade to comptrollerV2 and increase CF for cUSYC
        upgrade();
        increaseCollateralFactor();

        address whitelistedUser = 0xEf109EF4969261eB92A9F00d6639b440160Cc237;

        bool isListed;
        uint256 cNoteCollateralFactor;
        bool isComped;

        // check cNote after upgrade
        (isListed, cNoteCollateralFactor, isComped) = unitroller.markets(cNoteAddress);
        assertEq(isListed, true);
        assertEq(cNoteCollateralFactor, 0.8e18);
        assertEq(isComped, false);

        // check cUSYC
        (isListed, cNoteCollateralFactor, isComped) = unitroller.markets(cUsycAdress);
        assertEq(isListed, true);
        assertEq(cNoteCollateralFactor, 0.99e18);
        assertEq(isComped, false);

        vm.startPrank(whitelistedUser);

        // supply 1000 USYC
        uint256 SUPPLY_AMOUNT = 1000e6;
        usycContract.approve(cUsycAdress, SUPPLY_AMOUNT);
        uint256 mintStatus = cUsycContract.mint(SUPPLY_AMOUNT);

        // check account liquidity
        uint256 liquidity;
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, 1050e18 * 0.99e18 / 1e18);

        // borrow max note
        noteContract.approve(cNoteAddress, liquidity);
        uint256 borrowStatus = cNote.borrow(liquidity);

        // check account liquidity
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, 0);
    }

    // fuzz test borrowing with 99% collateral factor
    function testFuzz_Borrows(uint32 supplyAmount) public {
        console.logUint(supplyAmount);
        console.logUint(1914);
        vm.assume(supplyAmount >= 1e6);
        vm.assume(supplyAmount < 2500e6);

        // upgrade to comptrollerV2 and increase CF for cUSYC
        upgrade();
        increaseCollateralFactor();

        address whitelistedUser = 0xEf109EF4969261eB92A9F00d6639b440160Cc237;

        bool isListed;
        uint256 cNoteCollateralFactor;
        bool isComped;

        vm.startPrank(whitelistedUser);

        // supply 1000 USYC
        uint256 valueSupplied = 1.05e18 * uint256(supplyAmount) / 1e6; // price at this block
        console.logUint(valueSupplied);
        usycContract.approve(cUsycAdress, supplyAmount);
        uint256 mintStatus = cUsycContract.mint(supplyAmount);

        // check account liquidity
        uint256 liquidity;
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, valueSupplied * 0.99e18 / 1e18);

        // borrow max note
        noteContract.approve(cNoteAddress, liquidity);
        uint256 borrowStatus = cNote.borrow(liquidity);

        // check account liquidity
        (, liquidity,) = unitroller.getAccountLiquidity(whitelistedUser);
        assertEq(liquidity, 0);
    }
}
