pragma solidity ^0.8.10;

import "forge-std/console.sol";
import "forge-std/Test.sol";
import "../../../src/ComptrollerV2.sol";
import "../../../src/Comptroller.sol";
import "../../../src/Unitroller.sol";
import "../../../src/Governance/GovernorBravoDelegate.sol";

interface ProposalStore {
    struct Proposal {
        // @notice Unique id for looking up a proposal
        uint256 id;
        string title;
        string desc;
        // @notice the ordered list of target addresses for calls to be made
        address[] targets;
        uint256[] values;
        // @notice The ordered list of function signatures to be called
        string[] signatures;
        // @notice The ordered list of calldata to be passed to each call
        bytes[] calldatas;
    }

    function AddProposal(
        uint256 propId,
        string memory title,
        string memory desc,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas
    ) external;

    function QueryProp(uint256 propId) external returns (Proposal memory);
}

contract Upgrade is Test {
    uint256 mainnetFork;

    address unitroller = 0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C;

    address proposalStore = 0x648a5Aa0C4FbF2C1CF5a3B432c2766EeaF8E402d;
    address govshuttle = 0xB7a78c42532424AC7B2584F02E58C6699c660925;
    address timelock = 0xF33942F457EcabF2a03828e299C052A9523cc473;
    address governorBravoDelegator = 0xBC3139f9dA6b16A8FF8Ac6e0dEc4C0278d532dba;

    Unitroller unitrollerContract = Unitroller(payable(unitroller));
    ProposalStore store = ProposalStore(proposalStore);
    GovernorBravoDelegate gov = GovernorBravoDelegate(governorBravoDelegator);

    bytes[] calldatas;
    string[] signatures;
    uint256[] values;
    address[] addresses;

    function setUp() public {
        mainnetFork = vm.createFork("http://143.198.228.162:8545");
        vm.selectFork(mainnetFork);
        vm.rollFork(6_318_958);
    }

    function upgrade() public {
        vm.startPrank(govshuttle);
        // deploy comptroller v2
        ComptrollerV2 comptrollerV2 = new ComptrollerV2();

        // encode data for proposal
        bytes memory i_bytes = abi.encodePacked(comptrollerV2);
        addresses.push(unitroller);
        values.push(0);
        signatures.push("_setPendingImplementation(address)");
        calldatas.push(i_bytes);

        // add proposal to store
        store.AddProposal(
            129, "upgrade comptroller", "proposal to upgrade comptroller", addresses, values, signatures, calldatas
        );

        // queue proposal
        gov.queue(129);
        vm.warp(block.timestamp + 100);

        ProposalStore.Proposal memory prop = store.QueryProp(129);
        assertEq(prop.targets[0], unitroller);

        // execute proposal
        // gov.execute(129);
    }

    function test_addProposal() public {
        upgrade();
        // ProposalStore.Proposal memory prop = store.QueryProp(129);
        // console.logString(prop.title);
    }
}
