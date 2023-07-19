pragma solidity ^0.8.10;

import "forge-std/Vm.sol";
import "forge-std/StdInvariant.sol";
import "./RWASetup.sol";
import {RWACErc20} from "src/RWA/CErc20_RWA.sol";

contract RWAFuzz is StdInvariant, RWASetup {
    address targetAccount = address(1234567);
    address[] accounts = [address(123), address(321)];

    uint TARGET_ACCOUNT_INITIAL_BALANCE = 1000 ether;

    function setUp() public override {
        // set up target msg.senders
        targetSender(targetAccount);
        for (uint i; i < accounts.length; i++) {
            targetSender(accounts[i]);
        }
        // call normal setup
        super.setUp();

        // add rwaCToken market
        prankAddCTokenMarket(address(rwaCToken), 0.9e18);

        // send underlying to targetAccount
        vm.prank(admin);
        rwaUnderlying.transfer(targetAccount, TARGET_ACCOUNT_INITIAL_BALANCE);
    }

    function invariant_accountBalances() external {
        for (uint i; i < accounts.length; i++) {
            assertEq(rwaCToken.balanceOf(accounts[i]), 0);
            assertEq(rwaUnderlying.balanceOf(accounts[i]), 0);
        }
    }
    function test_targetAccountSupply(uint _supplyAmount) external {
        vm.assume(_supplyAmount > 0 && _supplyAmount <= TARGET_ACCOUNT_INITIAL_BALANCE);
        supplyToken(
            targetAccount,
            address(rwaUnderlying),
            address(rwaCToken),
            _supplyAmount
        );
        require(rwaCToken.balanceOf(targetAccount) == _supplyAmount, "targetAccount balance should be equal to supply amount");
    }
}
