pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "./RWASetup.sol";

contract RWAFuzz is Test, RWASetup {
    function setUp() public override {
        super.setUp();
        targetContract(address(rwaCToken));
    }
    function invariant_1() external {
        assertEq(rwaCToken.balanceOf(admin), 0);
    }
}