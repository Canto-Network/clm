pragma solidity ^0.8.10;

import "src/Reservoir.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";

contract ReservoirTest is Test {
    Reservoir public reservoir;
    WETH public weth; 
    address  public admin = address(1);

    function setUp() public {
        weth = new WETH("WCanto", "wcanto");
        reservoir = new Reservoir(0, weth, admin);
    }

    function test_Reservoir(uint amount) public {
        //increase balance of admin
        vm.assume(amount > 100);
        vm.deal(admin, amount);
        //transfer amount to Reservoir
        vm.prank(admin);
        address(reservoir).call{value: amount}("");
        uint reservoirBalance = weth.balanceOf(address(reservoir));

        console.log("WETH balance: ", reservoirBalance);
        assertEq(reservoirBalance, amount);
    }
    function testFail_ReservoirTransfer(uint amount) public {
        //increase balance of admin
        vm.assume(amount > 100);
        vm.deal(admin, amount);
        //transfer amount to Reservoir
        vm.prank(admin);
        payable(reservoir).transfer(amount);
        uint reservoirBalance = weth.balanceOf(address(reservoir));

        console.log("WETH balance: ", reservoirBalance);
        assertEq(reservoirBalance, amount);
    }
}