pragma solidity ^0.8.10;
import "forge-std/console.sol";
import "./RWASetup.sol";

contract RWATest is RWASetup {
    uint INITIAL_SUPPLY_BALANCE = 1000 ether;

    // make sure RWASetup ran correctly
    function test_deploy() public {
        assertEq(rwaCToken.name(), "cRWA");
    }

    // add CToken to CLM Comptroller markets
    function test_addMarket() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        assert(isCTokenMarket(address(rwaCToken)));
    }

    // mint cRWA by supplying underlying
    function test_mintCRWA() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            INITIAL_SUPPLY_BALANCE
        );
        assertEq(rwaCToken.balanceOf(admin), INITIAL_SUPPLY_BALANCE);
    }

    // test redeeming cRWA
    function test_redeemCRWA() public {
        prankAddCTokenMarket(address(rwaCToken), 0.5e18);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            INITIAL_SUPPLY_BALANCE
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
            INITIAL_SUPPLY_BALANCE
        );
        vm.startPrank(admin);
        //should be able to borrow same balance / 2 as supplied since cf = 50%
        address[] memory markets = new address[](1);
        markets[0] = address(cNote);

        comptroller.enterMarkets(markets);
        cNote.borrow(INITIAL_SUPPLY_BALANCE / 2);

        uint balance = rwaCToken.balanceOf(admin);
        vm.expectRevert();
        rwaCToken.redeem(balance);

        vm.stopPrank();
    }

    // should be able to borrow against cRWA just like all other cToken markets
    function test_borrowAgainstRWA() public {
        prankAddCTokenMarket(address(rwaCToken), 0.5e18);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            INITIAL_SUPPLY_BALANCE
        );
        vm.startPrank(admin);
        //should be able to borrow same balance / 2 as supplied since cf = 50%
        address[] memory markets = new address[](1);
        markets[0] = address(cNote);

        comptroller.enterMarkets(markets);
        cNote.borrow(INITIAL_SUPPLY_BALANCE / 2);
        vm.stopPrank();
        assertEq(cNote.borrowBalanceCurrent(admin), INITIAL_SUPPLY_BALANCE / 2);
    }

    // no transfers of cTokens should be allowed
    function test_transfer() public {
        prankAddCTokenMarket(address(rwaCToken), 0);
        supplyToken(
            admin,
            address(rwaUnderlying),
            address(rwaCToken),
            INITIAL_SUPPLY_BALANCE
        );

        vm.startPrank(admin);
        vm.expectRevert(CRWAToken.NoCRWATransfer.selector);
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
            INITIAL_SUPPLY_BALANCE
        );

        address spender = address(1234);
        vm.startPrank(admin);
        rwaCToken.approve(spender, 100 ether);
        vm.stopPrank();

        vm.startPrank(spender);
        vm.expectRevert(CRWAToken.NoCRWATransfer.selector);
        rwaCToken.transferFrom(admin, spender, 100 ether);

        vm.stopPrank();
    }
}
