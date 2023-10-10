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

contract cUsycTests is Test {
    uint256 cantoTestnetFork;
    address admin = 0x287FD606108AF7068a0706588355beC8eA8465f1;
    address oldComptrollerAddress = 0xA51436eF5D46EE56B0906DeC620466153f7fb77e;
    address unitrollerAddress = 0x9514c07bC6e80B652e4264E64f589C59065C231f;

    // hashnote addresses
    address usycAddress = 0xd3D41C08a7e14129bF6Ec9A32697322C70af7E5a;
    ERC20 usyc = ERC20(usycAddress);
    address usycOracle = 0x35b96d80C72f873bACc44A1fACfb1f5fac064f1a;
    address usycWhitelist = 0x38D3A3f8717F4DB1CcB4Ad7D8C755919440848A3;

    // usyc clm addresses
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
        upgrade();
        increaseCollateralFactor();
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

    function test_Transfers() public {
        address nonWhitelistedUser = 0x03cf8710BBA14C32232Efe0613fD44b8199995EC;
        address whitelistedUser = 0xEf109EF4969261eB92A9F00d6639b440160Cc237;
        vm.startPrank(whitelistedUser);

        // ensure user cannot transfer usyc underlying
        vm.expectRevert();
        usyc.transfer(nonWhitelistedUser, 1e6);

        // user deposits usyc into cUsyc
        usyc.approve(cUsycAdress, 100e6);
        cUsycContract.mint(100e6);

        // check user cUsyc balance
        uint256 cUsycBalance = cUsyc.balanceOf(whitelistedUser);
        assertEq(cUsycBalance, 100e6);

        // ensure user cannot transfer cUsyc
        vm.expectRevert();
        cUsycContract.transfer(nonWhitelistedUser, 1e6);
    }

    function test_TransferFuzz(uint32 transferAmount) public {
        address nonWhitelistedUser = 0x03cf8710BBA14C32232Efe0613fD44b8199995EC;
        address whitelistedUser = 0xEf109EF4969261eB92A9F00d6639b440160Cc237;
        vm.startPrank(whitelistedUser);

        // ensure user cannot transfer usyc underlying
        vm.expectRevert();
        usyc.transfer(nonWhitelistedUser, transferAmount);

        if (transferAmount <= 2500e6) {
            // user deposits usyc into cUsyc
            usyc.approve(cUsycAdress, transferAmount);
            cUsycContract.mint(transferAmount);

            // check user cUsyc balance
            uint256 cUsycBalance = cUsyc.balanceOf(whitelistedUser);
            assertEq(cUsycBalance, transferAmount);

            // ensure user cannot transfer cUsyc
            vm.expectRevert();
            cUsycContract.transfer(nonWhitelistedUser, transferAmount);
        }
    }
}
