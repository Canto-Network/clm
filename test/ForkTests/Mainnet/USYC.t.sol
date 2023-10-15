pragma solidity ^0.8.10;

import "forge-std/console.sol";
import "forge-std/Test.sol";
import "../../../src/ComptrollerV2.sol";
import "../../../src/Comptroller.sol";
import "../../../src/Unitroller.sol";
import "../../../src/Governance/GovernorBravoDelegate.sol";
import "../../../src/RWA/CRWAToken.sol";
import "../../../src/ComptrollerInterface.sol";
import "../../../src/InterestRateModel.sol";
import "../../../src/CErc20Delegator.sol";
import "../../../src/CLMPriceOracle.sol";

contract usycTests is Test {
    uint256 mainnetFork;

    address USYC = 0xFb8255f0De21AcEBf490F1DF6F0BDd48CC1df03B;
    address usycOracle = 0x1d18c02bC80b1921255E71cF2939C03258d75470;
    address whitelist = 0x2828ED02dd258a12AF0c6a5195a0FB9AD61acf4D;

    address unitroller = 0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C;
    address comptrollerAddress = 0xBfcf6fF12933E9146f93D7A98DA26612A20f1c1e; // new comptrollerV2 address

    address proposalStore = 0x648a5Aa0C4FbF2C1CF5a3B432c2766EeaF8E402d;
    address govshuttle = 0xB7a78c42532424AC7B2584F02E58C6699c660925;
    address timelock = 0xF33942F457EcabF2a03828e299C052A9523cc473;
    address governorBravoDelegator = 0xBC3139f9dA6b16A8FF8Ac6e0dEc4C0278d532dba;

    Unitroller unitrollerContract = Unitroller(payable(unitroller));
    ProposalStore store = ProposalStore(proposalStore);
    GovernorBravoDelegate gov = GovernorBravoDelegate(governorBravoDelegator);

    address[] targets;
    string[] signatures;
    bytes[] calldatas;
    uint256[] values;

    address clmOracleAddress = 0xEc13678Bf31CA304bed5b7b7e3c71FeD0B450a24;
    address payable cUSYCDelegatorAddress = payable(0x0355E393cF0cf5486D9CAefB64407b7B1033C2f1);

    CLMPriceOracle clmOracle = CLMPriceOracle(clmOracleAddress);
    CErc20Delegator usycDelegator = CErc20Delegator(cUSYCDelegatorAddress);
    CRWAToken usycDelegate;
    ComptrollerInterface IComptroller = ComptrollerInterface(unitroller);
    InterestRateModel interestRateModel = InterestRateModel(0x9748b6d59fd4C4f087294087bD94b6B9d95B4293);

    address[] public RWACtokens;

    address[] cTokens;
    uint256[] borrowCaps;

    function setUp() public {
        mainnetFork = vm.createFork("");
        vm.selectFork(mainnetFork);
    }

    function deploy() public {
        // deloy USYC delegate
        usycDelegate = new CRWAToken();
        bytes memory data;

        // deploy CErc20Delegator
        usycDelegator = new CErc20Delegator(
            USYC, // underyling
            IComptroller, // comptroller
            interestRateModel, // interestRateModel
            1000000000000000000, // initialExchangeRateMantissa
            "Collateralized US Yield Coin", // name
            "cUSYC", // symbol
            6, // decimals
            payable(address(0xF33942F457EcabF2a03828e299C052A9523cc473)), // admin
            address(usycDelegate), // implementation
            data // becomeImplementationData
        );

        RWACtokens.push(address(usycDelegator));

        // deploy CLM price oracle
        clmOracle = new CLMPriceOracle(
            unitroller, // comptroller
            0xa252eEE9BDe830Ca4793F054B506587027825a8e, // router
            0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488, // _cCanto
            0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75, // _usdt
            0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd, // _usdc
            0x826551890Dc65655a0Aceca109aB11AbDbD7a07B, // _wcanto
            0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503, // note
            RWACtokens // [cUSYC]
        );
    }

    function proposals() public {
        bytes memory i_bytes;
        // tx to set comptroller oracle
        i_bytes = hex"000000000000000000000000ec13678bf31ca304bed5b7b7e3c71fed0b450a24";

        targets.push(unitroller);
        values.push(0);
        signatures.push("_setPriceOracle(address)");
        calldatas.push(i_bytes);

        // tx to support cUSYC in comptroller
        i_bytes = hex"0000000000000000000000000355e393cf0cf5486d9caefb64407b7b1033c2f1";

        targets.push(unitroller);
        values.push(0);
        signatures.push("_supportMarket(address)");
        calldatas.push(i_bytes);

        // tx to set collateral factor for cUSYC
        i_bytes =
            hex"0000000000000000000000000355e393cf0cf5486d9caefb64407b7b1033c2f10000000000000000000000000000000000000000000000000dbd2fc137a30000";

        targets.push(unitroller);
        values.push(0);
        signatures.push("_setCollateralFactor(address,uint256)");
        calldatas.push(i_bytes);

        // tx to set close factor
        i_bytes = hex"0000000000000000000000000000000000000000000000000de0b6b3a7640000";

        targets.push(unitroller);
        values.push(0);
        signatures.push("_setCloseFactor(uint256)");
        calldatas.push(i_bytes);

        // tx to set liquidation incentive
        i_bytes = hex"0000000000000000000000000000000000000000000000000e043da617250000";

        targets.push(unitroller);
        values.push(0);
        signatures.push("_setLiquidationIncentive(uint256)");
        calldatas.push(i_bytes);

        // tx to set borrow cap for cUSYC (must use array of cTokens)
        i_bytes =
            hex"0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000355e393cf0cf5486d9caefb64407b7b1033c2f100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001";
        // i_bytes = bytes(calldataBytes);

        targets.push(unitroller);
        values.push(0);
        signatures.push("_setMarketBorrowCaps(address[],uint256[])");
        calldatas.push(i_bytes);

        vm.startPrank(govshuttle); // prank as govshuttle so we can append to proposal store

        // add proposal to store
        store.AddProposal(
            139, "upgrade comptroller", "proposal to upgrade comptroller", targets, values, signatures, calldatas
        );

        vm.stopPrank();

        // queue proposal
        gov.queue(139);
        skip(3600);

        // execute proposal
        gov.execute(139);
    }

    // function testSetup() public {
    //     deploy();

    //     // assert that USYC is deployed
    //     assertEq(usycDelegator.underlying(), USYC);
    //     assertEq(usycDelegator.admin(), timelock);

    //     // assert that CLM oracle is deployed
    //     assertEq(clmOracle.comptroller(), unitroller);
    //     assertEq(clmOracle.router(), 0xa252eEE9BDe830Ca4793F054B506587027825a8e);
    //     assertEq(clmOracle.cCanto(), 0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488);
    // }

    function testProposals() public {
        // deploy();
        proposals();

        ComptrollerV2 comptroller = ComptrollerV2(payable(unitroller));

        // assert that comptroller oracle is set
        assertEq(address(comptroller.oracle()), address(clmOracle));

        // assert that cUSYC is supported in comptroller
        (bool isListed, uint256 collateralFactorMantissa,) = comptroller.markets(address(usycDelegator));
        assertEq(isListed, true);

        // assert borrowCap for USYC
        assertEq(comptroller.borrowCaps(address(usycDelegator)), 1);

        // assert that cUSYC collateral factor is set
        assertEq(collateralFactorMantissa, 0.99e18);

        // assert that cUSYC close factor is set
        assertEq(comptroller.closeFactorMantissa(), 1e18);

        // assert that cUSYC liquidation incentive is set
        assertEq(comptroller.liquidationIncentiveMantissa(), 1.01e18);

        CRWAToken usyc = CRWAToken(payable(address(usycDelegator)));

        // assert that cUSYC price oracle is set
        assertEq(usyc.priceOracle(), address(usycOracle));
    }

    struct Market {
        // Whether or not this market is listed
        bool isListed;
        //  Multiplier representing the most one can borrow against their collateral in this market.
        //  For instance, 0.9 to allow borrowing 90% of collateral value.
        //  Must be between 0 and 1, and stored as a mantissa.
        uint256 collateralFactorMantissa;
        // Per-market mapping of "accounts in this asset"
        mapping(address => bool) accountMembership;
        // Whether or not this market receives COMP
        bool isComped;
    }
}

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
