pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {Helpers, NoteRateModel, CToken, CNote, CErc20} from "./utils.sol";
import "./helpers/TestOracle.sol";
import "src/ERC20.sol";
import {CRWAToken} from "src/RWA/CRWAToken.sol";
import "src/CErc20Delegator.sol";
import "src/WETH.sol";
import "src/Swap/BaseV1-periphery.sol";
import "src/Swap/BaseV1-core.sol";
import "src/Accountant/AccountantDelegate.sol";
import "src/Accountant/AccountantDelegator.sol";
import "src/Treasury/TreasuryDelegate.sol";
import "src/Treasury/TreasuryDelegator.sol";

contract RWATest is Test, Helpers {
    Comptroller comptroller;

    ERC20 rwaUnderlying;
    CRWAToken rwaCToken;

    Note note;
    CNote cNote;

    address admin = address(123454321);
    uint ADMIN_INITIAL_BALANCE = 100 ether;

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

    function setUp() public {
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

    function test_deploy() public {
        assertEq(rwaCToken.name(), "cRWA");
    }

    function test_addMarket() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        assert(isCTokenMarket(address(rwaCToken)));
    }

    function test_mintCRWA() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            ADMIN_INITIAL_BALANCE
        );
        assertEq(rwaCToken.balanceOf(admin), ADMIN_INITIAL_BALANCE);
    }

    function test_redeemCRWA() public {
        prankAddCTokenMarket(address(rwaCToken), 0.5e18);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            ADMIN_INITIAL_BALANCE
        );
        vm.startPrank(admin);
        rwaCToken.redeem(rwaCToken.balanceOf(admin));
        vm.stopPrank();
        assertEq(rwaCToken.balanceOf(admin), 0);
    }

    // cannot redeem if put in shortfall
    function test_redeemNotAllowed() public {
        prankAddCTokenMarket(address(rwaCToken), 0.5e18);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            ADMIN_INITIAL_BALANCE
        );
        vm.startPrank(admin);
        //should be able to borrow same balance / 2 as supplied since cf = 50%
        address[] memory markets = new address[](1);
        markets[0] = address(cNote);

        comptroller_.enterMarkets(markets);
        cNote.borrow(ADMIN_INITIAL_BALANCE / 2);

        uint balance = rwaCToken.balanceOf(admin);
        vm.expectRevert();
        rwaCToken.redeem(balance);

        vm.stopPrank();
    }

    function test_borrowAgainstRWA() public {
        prankAddCTokenMarket(address(rwaCToken), 0.5e18);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            ADMIN_INITIAL_BALANCE
        );
        vm.startPrank(admin);
        //should be able to borrow same balance / 2 as supplied since cf = 50%
        address[] memory markets = new address[](1);
        markets[0] = address(cNote);

        comptroller_.enterMarkets(markets);
        cNote.borrow(ADMIN_INITIAL_BALANCE / 2);
        vm.stopPrank();
        assertEq(cNote.borrowBalanceCurrent(admin), ADMIN_INITIAL_BALANCE / 2);
    }

    // no transfers of cTokens should be allowed
    function test_transfer() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            ADMIN_INITIAL_BALANCE
        );

        vm.startPrank(admin);
        vm.expectRevert(CRWAToken.NoCRWATranfer.selector);
        rwaCToken.transfer(address(1234), 1 ether);

        vm.stopPrank();
    }

    // no transfers of cTokens should be allowed
    function test_transferFrom() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            ADMIN_INITIAL_BALANCE
        );

        address spender = address(1234);
        vm.startPrank(admin);
        rwaCToken.approve(spender, 100 ether);
        vm.stopPrank();

        vm.startPrank(spender);
        vm.expectRevert(CRWAToken.NoCRWATranfer.selector);
        rwaCToken.transferFrom(admin, spender, 100 ether);

        vm.stopPrank();
    }
}
