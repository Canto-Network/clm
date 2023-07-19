pragma solidity ^0.8.10;

import {Helpers, NoteRateModel, CToken, CNote, CErc20} from "../utils.sol";
import "src/Comptroller.sol";
import "src/ERC20.sol";
import {CRWAToken} from "src/RWA/CRWAToken.sol";
import "src/CErc20Delegator.sol";
import "src/WETH.sol";
import "src/Note.sol";
import "src/Accountant/AccountantDelegate.sol";
import "src/Accountant/AccountantDelegator.sol";
import "src/Treasury/TreasuryDelegate.sol";
import "src/Treasury/TreasuryDelegator.sol";
import "src/Swap/BaseV1-core.sol";
import "../helpers/TestOracle.sol";

contract RWASetup is Helpers {
    address admin = address(123454321);
    uint ADMIN_INITIAL_BALANCE =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    
    Comptroller comptroller;

    ERC20 rwaUnderlying;
    CRWAToken rwaCToken;

    Note note;
    CNote cNote;

    // supports cToken market and sets collateral factor
    function addCTokenMarket(address cToken, uint cf) internal {
        comptroller._supportMarket(CToken(cToken));
        comptroller._setCollateralFactor(CToken(cToken), cf);
        require(isCTokenMarket(cToken), "cToken not added");
    }

    // calls addCTokenMarket in a prank for the admin of Comptroller
    function prankAddCTokenMarket(address cToken, uint cf) internal {
        vm.startPrank(admin);
        addCTokenMarket(cToken, cf);
        vm.stopPrank();
    }

    // supplies token and enters market for cToken
    function supplyToken(
        address account,
        address underlying,
        address cToken,
        uint amount
    ) internal {
        vm.startPrank(account);
        address[] memory markets = new address[](1);
        markets[0] = cToken;
        comptroller.enterMarkets(markets);
        ERC20(underlying).approve(cToken, amount);
        CErc20(cToken).mint(amount);
        vm.stopPrank();
    }

    // checks if cToken is a market in comptroller
    function isCTokenMarket(address cToken) internal view returns (bool) {
        (bool isListed, , ) = comptroller.markets(cToken);
        return isListed;
    }

    // deployes cNote, treasury, accountant and sets up cNote
    function deployAndSetUpCNote() internal {
        // deploy and set up cNote
        note = new Note();
        CNote cNoteDelegate = new CNote();
        cNote = CNote(
            address(
                new CErc20Delegator(
                    address(note),
                    comptroller,
                    new NoteRateModel(0),
                    1,
                    "cNote",
                    "cNote",
                    18,
                    payable(admin),
                    address(cNoteDelegate),
                    "0x0"
                )
            )
        );
        require(
            cNote.implementation() == address(cNoteDelegate),
            "cNote implementation not set"
        );
        addCTokenMarket(address(cNote), 0.9e18);
        // set up treasury
        TreasuryDelegate treasuryDelegate = new TreasuryDelegate();
        TreasuryDelegator treasury = new TreasuryDelegator(
            address(note),
            address(treasuryDelegate),
            admin
        );
        require(
            treasury.implementation() == address(treasuryDelegate),
            "treasury implementation not set"
        );
        // set up accountant
        AccountantDelegator accountant = new AccountantDelegator(
            address(new AccountantDelegate()),
            admin,
            address(cNote),
            address(note),
            address(comptroller),
            address(treasury)
        );
        // set accountant in cNote
        cNote.setAccountantContract(address(accountant));
        require(
            cNote.getAccountant() == address(accountant),
            "Accountant not set up: CNOTE"
        );
        // set accountant in note
        note._setAccountantAddress(address(accountant));
        require(note.accountant() == address(accountant));
    }

    function setUp() public virtual{
        vm.startPrank(admin);
        // set up comptroller and unitroller and set to local comptroller
        setUpComptroller();
        comptroller = Comptroller(address(unitroller_));

        rwaCToken = new CRWAToken();
        rwaUnderlying = new ERC20(
            "RWA Underlying",
            "RWA",
            ADMIN_INITIAL_BALANCE,
            18
        );

        rwaCToken = CRWAToken(
            address(
                new CErc20Delegator(
                    address(rwaUnderlying),
                    comptroller,
                    new NoteRateModel(0),
                    1e18,
                    "cRWA",
                    "cRWA",
                    18,
                    payable(admin),
                    address(rwaCToken),
                    ""
                )
            )
        );

        //init contracts for router (oracle)
        BaseV1Factory factory = new BaseV1Factory();
        WETH wcanto = new WETH("Wrapped Canto", "WCANTO");
        comptroller._setPriceOracle(new TestOracle());

        // deploy and set up note
        deployAndSetUpCNote();
        vm.stopPrank();
    }
}
