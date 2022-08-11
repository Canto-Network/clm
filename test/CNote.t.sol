pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "./utils.sol";
import "src/CErc20Delegator.sol";
import "src/InterestRateModel.sol";
import "./CNoteExposed.sol";
import "src/NoteInterest.sol";

contract CNoteTest is Test, Helpers { // inherit functionality of cNote enables us to call internal methods
    CNoteExposed cNote;
    MaliciousNote Note;
    NoteRateModel noteInterest;
    address public admin = address(1);
    function setUp() public {
        vm.startPrank(admin);
        Note = new MaliciousNote("note", "note", 0, 18);
        CNoteExposed cNote_ = new CNoteExposed(); // construct cNote contract 
        noteInterest = new NoteRateModel(0);

        setUpComptroller();

        bytes memory data; 
        CErc20Delegator cNoteDelegator = new CErc20Delegator(   
            address(Note),
            comptroller_, // we will be bypassing Comptroller / InterestRateModel functionality
            noteInterest,
            1,
            "cNOTE",
            "cNote",
            18,
            payable(admin),
            address(cNote_), // implementation
            data
        );

        // instantiate CNote interface at the Delegator's address
        cNote = CNoteExposed(address(cNoteDelegator));
        cNote.setAccountantContract(address(2)); // instantiate Fake Accountant Contract
        Note.setCNote(address(cNoteDelegator));
        vm.stopPrank();
    }

    function test_ReEntrance() public {
        // call do transferIn to Trigger re-entrant transferFrom in MaliciousNote contract
        vm.expectRevert(bytes("re-entered"));
        cNote.doTransferInExposed(admin, 0);
    }
}