pragma solidity ^0.8.10;

import "src/Treasury/TreasuryDelegate.sol";
import "src/Treasury/TreasuryDelegator.sol";
import "forge-std/Test.sol";
import "src/Note.sol";
import "./utils.sol";
import "src/Reservoir.sol";


contract TreasuryTest is Test {
    TreasuryDelegate public delegate;
    TreasuryDelegator public delegator;
    address public admin = address(1);
    
    NoteTest public note;

    function setUp() public {
        vm.prank(admin);
        delegate = new TreasuryDelegate();
        note = new NoteTest();
        vm.prank(admin);
        delegator  = new TreasuryDelegator(address(note), address(delegate), admin);
    }

    function test_changeAdmin() public { 
        address pendingAdmin = address(2);
        vm.prank(admin);
        delegator._setPendingAdmin(pendingAdmin);
        assertEq(delegator.pendingAdmin(), pendingAdmin);
        vm.prank(pendingAdmin);
        delegator._acceptAdmin();
        assertEq(delegator.admin(), pendingAdmin); 
    }

    function test_changeImplementation(uint firstMint, uint secondMint) public {
        vm.assume(firstMint <= 1e20);
        vm.assume(secondMint <= 1e20);
        // The implemenation address will be the same as what the delegator was constructed with
        assertEq(delegator.implementation(), address(delegate));
        // Send the delegator Note
        note.mintTo(address(delegator), firstMint);
        //mint to delegate address
        note.mintTo(address(delegate), secondMint);
        uint delegatorBal = delegator.queryNoteBalance();
        TreasuryDelegate newDelegate = new TreasuryDelegate(); 
        
        vm.prank(admin);
        delegator.setImplementation(address(newDelegate));
        assertEq(delegator.implementation(), address(newDelegate));
        //balance should be the same
        assertEq(delegator.queryNoteBalance(), delegatorBal);
    } 

    function test_SendFund(uint sendAmount) public {
        vm.deal(address(delegator), sendAmount);
        assertEq(address(delegator).balance, sendAmount);
        assertEq(admin.balance, 0); 
        vm.prank(admin);
        delegator.sendFund(admin, sendAmount, "CANTO");
        assertEq(address(admin).balance, sendAmount); 
    } 

    function testFail_InvalidDenom(string calldata denom) public {
        bytes32 denomHash = keccak256(bytes(denom));
        bytes32 canto = keccak256(bytes("CANTO"));
        vm.assume(denomHash != canto);
        vm.prank(admin);
        delegator.sendFund(admin, 1, denom);
    }

    function test_SendReservoir(uint sendAmount) public { 
        vm.deal(address(delegator), sendAmount);
        WETH weth = new WETH("wcanto", "wcanto");
        Reservoir reservoir = new Reservoir(0, weth, admin);
        vm.prank(admin);
        delegator.sendFund(address(reservoir), sendAmount, "CANTO");
        assertEq(weth.balanceOf(address(reservoir)), sendAmount);
    }
}