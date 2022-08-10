pragma solidity ^0.8.10;

import "src/Swap/BaseV1-core.sol";
import "src/ERC20.sol";

import "forge-std/Test.sol";

contract BaseV1FactoryTest is Test {

    BaseV1Factory public factory;

    address public admin = address(999);

    function setUp() public {
        vm.prank(admin);
        factory = new BaseV1Factory();
    }

    function test_factoryInit() public {
        assertEq(factory.admin(), admin);
        assertEq(factory.isPaused(), false);
        assertEq(factory.pauser(), admin);
    }

    function test_setAdmin() public {
        assertEq(factory.admin(), admin);

        address newAdmin = address(992);

        vm.prank(admin);
        factory.setAdmin(newAdmin);

        assertEq(factory.admin(), newAdmin);


        vm.prank(admin);
        vm.expectRevert();
        factory.setAdmin(admin);
    }

    function test_setPeriodSize(uint256 _period) public {
        BaseV1Pair[] memory pairs = new BaseV1Pair[](4);

        for (uint256 i = 0; i < 4; i++) {
            address tokenA = address(new ERC20("n", "s", 100, 6));
            address tokenB = address(new ERC20("n", "s", 100, 6));

            factory.createPair(tokenA, tokenB, false);
            pairs[i] = BaseV1Pair(factory.getPair(tokenA, tokenB, false));
        }

        uint256 MaxPeriod = 3600;

        vm.expectRevert();
        vm.prank(admin);
        factory.setPeriodSize(MaxPeriod + 1);

        vm.assume(_period <= MaxPeriod);

        vm.expectRevert();
        factory.setPeriodSize(_period);

        for (uint256 i = 0; i < 4; i++) {
            assertEq(pairs[i].periodSize(), 1800);
        }

        vm.prank(admin);
        factory.setPeriodSize(_period);

        for (uint256 i = 0; i < 4; i++) {
            assertEq(pairs[i].periodSize(), _period);
        }
    }



}
