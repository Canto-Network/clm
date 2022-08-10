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

    Comptroller public comp;
    NoteTest public note;

    address public admin = address(1);
    address public marketUser = address(2); 

    function setUp() public {
        note = new NoteTest();
        comp = new Comptroller();

        TestPriceOracle priceOracle = new TestPriceOracle();
        comp._setPriceOracle(priceOracle);

        CNote cnote = new CNote();
        NoteRateModel nr = new NoteRateModel(1000);
        // Cnote = new CErc20Delegator(
        //     address(note),
        //     comp,
        //     nr,
        //     "",
        //     "",
        //     18,
        //     admin,
        //     address(Cnote),
        //     []
        // );
    }

}