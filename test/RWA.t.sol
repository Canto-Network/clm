pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "forge-std/Script.sol";
import {Helpers, NoteRateModel, CToken, CNote} from "./utils.sol";
import "src/ERC20.sol";
import "src/RWA/CRWAToken.sol";
import "src/CErc20Delegator.sol";

contract RWATest is Test, Helpers {
    ERC20 rwaUnderlying;
    CRWAToken rwaCToken;
    
    ERC20 note;
    CErc20Delegator cNote;

    address admin = address(123454321);


    function addCTokenMarket(address cToken, uint cf) internal {
        comptroller_._supportMarket(CToken(cToken));
        comptroller_._setCollateralFactor(CToken(cToken), cf);
    }

    function setUp() public {
        vm.startPrank(admin);
        rwaCToken = new CRWAToken();
        rwaUnderlying = new ERC20("RWA Underlying", "RWA", 100 ether, 18);
        setUpComptroller();

        rwaCToken = CRWAToken(
            address(
                new CErc20Delegator(
                    address(rwaUnderlying),
                    comptroller_,
                    new NoteRateModel(0),
                    1e18,
                    "cRWA",
                    "cRWA",
                    18,
                    payable(admin),
                    address(rwaCToken),
                    ""
                )
            )
        );
        (cNote, note) = deployCNote();
        addCTokenMarket(address(cNote), 0.9e18);
        vm.stopPrank();
    }

    function test_deploy() public {
        assertEq(rwaCToken.name(), "cRWA");
    }

    function test_transfer() public {
        vm.startPrank(admin);
        rwaCToken.testSupply();
        assertEq(rwaCToken.balanceOf(admin), 100 ether);

        vm.expectRevert(CRWAToken.NoCRWATranfer.selector);
        rwaCToken.transfer(address(1234), 100 ether);

        vm.stopPrank();
    }

    function test_transferFrom() public {
        address spender = address(1234);
        vm.startPrank(admin);
        rwaCToken.testSupply();
        assertEq(rwaCToken.balanceOf(admin), 100 ether);

        rwaCToken.approve(spender, 100 ether);
        vm.stopPrank();

        vm.startPrank(spender);
        vm.expectRevert(CRWAToken.NoCRWATranfer.selector);
        rwaCToken.transferFrom(admin, spender, 100 ether);

        vm.stopPrank();
    }

    function test_addMarket() public {
        addCTokenMarket(address(rwaCToken), 0);
        console.log(comptroller_.markets(address(rwaCToken)));
        // assert(comptroller_.markets(address(rwaCToken)).isListed);
    }
}
