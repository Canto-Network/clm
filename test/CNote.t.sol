pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "./utils.sol";
import "src/CErc20Delegator.sol";
import "src/InterestRateModel.sol";
import "./CNoteExposed.sol";

contract CNoteTest is Test{ // inherit functionality of cNote enables us to call internal methods
    CNoteExposed cNote;
    MaliciousNote Note;
    address public admin = address(1);
    function setUp() public {
        Note = new MaliciousNote("note", "note", 0, 18);
        CNoteExposed cNote_ = new CNoteExposed(); // construct cNote contract 
         
        bytes memory data; 
        CErc20Delegator cNoteDelegator = new CErc20Delegator(   
            address(Note),
            ComptrollerInterface(address(1)), // we will be bypassing Comptroller / InterestRateModel functionality
            InterestRateModel(address(1)),
            1,
            "cNOTE",
            "cNote",
            18,
            payable(admin),
            address(cNote_), // implementation
            data
        );

        // instantiate CNote interface at the Delegator's address
        cNote = CNote(address(cNoteDelegator));
        cNote.setAccountantContract(address(2)); // instantiate Fake Accountant Contract
    }

    function test_ReEntrance() public {
        // call do transferIn to Trigger re-entrant transferFrom in MaliciousNote contract
        cNote.doTransferIn(admin, 0);
    }
}