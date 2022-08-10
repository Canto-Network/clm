pragma solidity ^0.8.10;

import "./BaseV1-periphery.t.sol";
import "forge-std/Test.sol";
import "src/Comptroller.sol";
import "src/NoteInterest.sol";
import "src/JumpRateModel.sol";
import "src/CErc20Delegate.sol";
import "src/CErc20Delegator.sol";
import "src/Note.sol";
import "src/WETH.sol";
import "src/JumpRateModel.sol";

contract BaseV1FactoryTest is Test {    
    BaseV1Factory public factory;
    address public admin = address(1);
    Comptroller public comptroller;
    ERC20Test public note;
    CErc20Delegate public delegate;
    ERC20Test public usdc;
    BaseV1Router01 public router;
    WETH public weth;  
    JumpRateModel public jump;

    function setUp() public {
        vm.startPrank(admin);
        factory = new BaseV1Factory();
        comptroller = new Comptroller();
        note = new ERC20Test("first", "first", 0, 6);
        delegate = new CErc20Delegate();
        usdc = new ERC20Test("second", "second", 0, 18);
        weth = new WETH("WCanto", "wCANTO");
        router = new BaseV1Router01(address(factory), address(weth), address(note), address(comptroller));
        jump = new JumpRateModel(10000000000, 1, 1000000, 1000);
        vm.stopPrank();
    }   

    function testFail_expectRevert() public {
        // vm.prank(admin);
        router.setStable(address(usdc));
    }

    function testFail_Proxy(uint firstMint) public {
        address pairAddr = factory.createPair(address(note), address(usdc), true);
        BaseV1Pair pair = BaseV1Pair(pairAddr); // instantiate pair

        vm.assume(firstMint <= 1e20);
        vm.assume(firstMint > 1e6);

        usdc.mintTo(pairAddr, firstMint);
        note.mintTo(pairAddr, firstMint);

        vm.startPrank(admin);
        router.setStable(address(usdc));
        factory.setPeriodSize(0);
        vm.stopPrank();

        pair.mint(admin);
    
        vm.startPrank(address(0));
        CErc20 token = new CErc20();
        token.initialize(address(usdc), comptroller, jump, 1, "cUsdc", "cUSDC", 18);
        vm.stopPrank(); 

        note.mintTo(admin, firstMint);
        usdc.mintTo(admin,firstMint);


        vm.startPrank(admin);
       
        usdc.approve(address(router), firstMint);
        note.approve(address(router), firstMint);

        // for (uint i; i < 8; ++i) {
            router.swapExactTokensForTokensSimple(1, 0, address(usdc), address(note), false, admin, block.timestamp + 12);
        // }
        vm.stopPrank();

        // uint x = router.getUnderlyingPrice(token);
    }   

}