pragma solidity ^0.8.10;

import "src/NoteInterest.sol";
import "forge-std/Test.sol";


contract NoteInterestTest is Test {
    function testFailInitialize() public {
        NoteRateModel ir = new NoteRateModel(0);
        ir.initialize(address(1), address(2));
        ir.initialize(address(0), address(0));
    }
}