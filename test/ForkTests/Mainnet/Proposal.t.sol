// pragma solidity ^0.8.10;

// import "forge-std/console.sol";
// import "forge-std/Test.sol";
// import "../../../src/ComptrollerV2.sol";
// import "../../../src/Comptroller.sol";
// import "../../../src/Unitroller.sol";
// import "../../../src/Governance/GovernorBravoDelegate.sol";

// contract Upgrade is Test {
//     uint256 mainnetFork;

//     address unitroller = 0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C;
//     address comptrollerAddress = 0xBfcf6fF12933E9146f93D7A98DA26612A20f1c1e; // new comptrollerV2 address

//     address proposalStore = 0x648a5Aa0C4FbF2C1CF5a3B432c2766EeaF8E402d;
//     address govshuttle = 0xB7a78c42532424AC7B2584F02E58C6699c660925;
//     address timelock = 0xF33942F457EcabF2a03828e299C052A9523cc473;
//     address governorBravoDelegator = 0xBC3139f9dA6b16A8FF8Ac6e0dEc4C0278d532dba;

//     Unitroller unitrollerContract = Unitroller(payable(unitroller));
//     ProposalStore store = ProposalStore(proposalStore);
//     GovernorBravoDelegate gov = GovernorBravoDelegate(governorBravoDelegator);

//     address[] targets;
//     string[] signatures;
//     bytes[] calldatas;
//     uint256[] values;

//     function setUp() public {
//         mainnetFork = vm.createFork("https://mainnode.plexnode.org:8545");
//         vm.selectFork(mainnetFork);
//     }

//     function upgrade() public {
//         // tx to set pending implementation
//         bytes32 leftPaddedAddress = bytes32(uint256(uint160(comptrollerAddress)));
//         bytes memory i_bytes = abi.encodePacked(leftPaddedAddress);
//         targets.push(unitroller);
//         values.push(0);
//         signatures.push("_setPendingImplementation(address)");
//         calldatas.push(i_bytes);

//         // tx to accept implementation
//         bytes32 leftPaddedUnitroller = bytes32(uint256(uint160(unitroller)));
//         i_bytes = abi.encodePacked(leftPaddedUnitroller);
//         targets.push(comptrollerAddress);
//         values.push(0);
//         signatures.push("_become(address)");
//         calldatas.push(i_bytes);

//         vm.startPrank(govshuttle); // prank as govshuttle so we can append to proposal store

//         // add proposal to store
//         store.AddProposal(
//             129, "upgrade comptroller", "proposal to upgrade comptroller", targets, values, signatures, calldatas
//         );

//         vm.stopPrank();

//         // queue proposal
//         gov.queue(129);
//         skip(3600);

//         // execute proposal
//         gov.execute(129);
//     }

//     function test_addProposal() public {
//         // check implementation before upgrade
//         assertEq(unitrollerContract.comptrollerImplementation(), 0xD5DbF5cd90f158597f916591dBaDDe27E4A4d4Cf);

//         upgrade();

//         // check implementation after upgrade
//         assertEq(unitrollerContract.comptrollerImplementation(), comptrollerAddress);
//     }
// }

// interface ProposalStore {
//     struct Proposal {
//         // @notice Unique id for looking up a proposal
//         uint256 id;
//         string title;
//         string desc;
//         // @notice the ordered list of target addresses for calls to be made
//         address[] targets;
//         uint256[] values;
//         // @notice The ordered list of function signatures to be called
//         string[] signatures;
//         // @notice The ordered list of calldata to be passed to each call
//         bytes[] calldatas;
//     }

//     function AddProposal(
//         uint256 propId,
//         string memory title,
//         string memory desc,
//         address[] memory targets,
//         uint256[] memory values,
//         string[] memory signatures,
//         bytes[] memory calldatas
//     ) external;

//     function QueryProp(uint256 propId) external returns (Proposal memory);
// }
