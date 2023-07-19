pragma solidity ^0.8.10;

import "forge-std/Vm.sol";
import "forge-std/StdInvariant.sol";
import "./RWASetup.sol";
import {RWACErc20} from "src/RWA/CErc20_RWA.sol";

contract RWAFuzz is StdInvariant, RWASetup {

    function setUp() public override {
        targetSender(admin);
        super.setUp();
    }
    function invariant_1() external {
        // assert(isCTokenMarket(address(rwaCToken)));
        // supplyToken(admin, address(rwaUnderlying), address(rwaCToken), 1e18);
        assert(rwaCToken.balanceOf(admin) == 0);
    }
}
