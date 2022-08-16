pragma solidity ^0.8.10;

import "./Treasury.t.sol";
import "forge-std/Test.sol";
import "./utils.sol";
import "src/Accountant/AccountantDelegate.sol";
import "src/Accountant/AccountantDelegator.sol";
import "src/Comptroller.sol";
import "src/CNote.sol";
import "src/CErc20Delegator.sol";
import "src/NoteInterest.sol";

contract AccountantTest is Test {

    AccountantDelegator public accountant;
    TreasuryDelegator public treasury;

    CErc20Delegator public Cnote;

    NoteTest public note;

    address public admin = address(1);

    function setUp() public {

    }
}