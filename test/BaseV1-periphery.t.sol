pragma solidity ^0.8.10;

import "src/Swap/BaseV1-core.sol";
import "src/Swap/BaseV1-periphery.sol";
import "src/ERC20.sol";

import "forge-std/Test.sol";
import "forge-std/console.sol";

contract ERC20Test is ERC20 {
    constructor(string memory name, string memory symbol, uint256 totalSup, uint8 decimals) ERC20(name, symbol, totalSup, decimals) {}
    function mintTo(address to, uint256 amt) external {
        _mint(to, amt);
    }
}


contract BaseV1CoreTest is Test {
    BaseV1Factory public factory; 
    uint MaxPeriod = 3600;
    uint MaxMint = 1e18;
    uint minMint = 10;
    uint constant MINLIQ = 1e3;

    address public admin = address(1);

    function setUp() public {
        vm.prank(admin);
        factory = new BaseV1Factory();
    }

    function test_Supply(uint256 firstMint, uint256 secondMint, uint256 timeDiff) public{ 
        ERC20Test erc20 = new ERC20Test("first", "first", 0, 6);
        ERC20Test erc30 = new ERC20Test("second", "second", 0, 18);

        vm.assume(firstMint <= 1e20);
        vm.assume(secondMint <= 1e20);
        vm.assume(timeDiff <= MaxPeriod);

        if((firstMint ** 2 <= 1e6) || (secondMint <= 1e6)) {
            return; //account for minimum liquidity
        }

        address pairAddr = factory.createPair(address(erc20), address(erc30), false);
        uint curTime = block.timestamp;
        BaseV1Pair pair = BaseV1Pair(pairAddr);
        
        // erc20.mintTo(pairAddr, exponent(firstMint, 6));
        erc20.mintTo(pairAddr, firstMint);
        erc30.mintTo(pairAddr, firstMint); 
        
        assertEq(erc20.balanceOf(pairAddr),  firstMint);
        assertEq(erc30.balanceOf(pairAddr), firstMint);
        assertEq(pair.balanceOf(admin), 0);
        //preparations before minting LP Tokens
        vm.prank(admin); // become admin to set the period size 
        factory.setPeriodSize(timeDiff);
        
        vm.warp(curTime + timeDiff + 1); 
        assertEq(pair.totalSupplyCumulativeLast(),0);
       
       
        pair.mint(admin);
        curTime = block.timestamp;
        assertEq(pair.balanceOf(admin), pair.totalSupply() - MINLIQ);

        //first _update records zero values
        assertEq(pair.observationLength(), 2);
        assertEq(pair.totalSupplyCumulativeLast(), 0);

        vm.warp(curTime + timeDiff + 1);
        
        erc20.mintTo(pairAddr, secondMint);
        erc30.mintTo(pairAddr, secondMint); 

        //record accumulated values 
        pair.mint(admin);   
        curTime = block.timestamp;
        uint firstSupply = pair.totalSupply();
        uint firstSupplyRecording = pair.totalSupply() * (timeDiff + 1);
        assertEq(pair.observationLength(), 3);
        assertEq(pair.totalSupplyCumulativeLast(), firstSupplyRecording);

        vm.warp(curTime + timeDiff + 1);    

        // erc20.mintTo(pairAddr, exponent(firstMint, 6));
        erc20.mintTo(pairAddr, firstMint);
        erc30.mintTo(pairAddr, firstMint); 
        

        pair.mint(admin);
        uint totalSupplyLast = pair.totalSupply();

        assertEq(pair.observationLength(), 4);
        assertEq(pair.totalSupplyCumulativeLast(), firstSupplyRecording + pair.totalSupply() * (timeDiff + 1));

        uint[] memory supplyObs = pair.sampleSupply(3,1);
        assertEq(supplyObs[0], 0);
        assertEq(supplyObs[1], firstSupply);
        assertEq(supplyObs[2], totalSupplyLast);
    }      

    function test_TWAR(uint periodSize, uint mint1) public {
        vm.assume(mint1 >= 1e6 && mint1 <= 1e20);
        // vm.assume(mint2 >= 1e6 && mint2 <= 1e20);
        // vm.assume(mint3  >= 1e6 && mint3 <= 1e20);
        // vm.assume(mint4  >= 1e6 && mint4 <= 1e20);
        vm.assume(periodSize <= 3600 );

        ERC20Test erc20 = new ERC20Test("first", "first", 0, 6);
        ERC20Test erc30 = new ERC20Test("second", "second", 0, 18);

        address pairAddr = factory.createPair(address(erc20), address(erc30), false);
        uint curTime = block.timestamp;
        BaseV1Pair pair = BaseV1Pair(pairAddr);

        erc20.mintTo(pairAddr, mint1);
        erc30.mintTo(pairAddr, mint1);

        vm.prank(admin);    
        factory.setPeriodSize(periodSize);


        vm.warp(curTime + periodSize + 1);
        pair.mint(admin);

        curTime = block.timestamp;

        assertEq(pair.observationLength(), 2);

        erc20.mintTo(pairAddr, mint1/2);
        erc30.mintTo(pairAddr, mint1/2);

        vm.warp(curTime + periodSize +1);

        pair.mint(admin);

        uint timeDiff = block.timestamp - curTime;
        uint totalSupply = pair.totalSupply();

        assertEq(pair.totalSupplyCumulativeLast(), totalSupply * timeDiff); 
        
        

    }       


    //
    function exponent(uint256 base, uint256 exp) internal pure returns(uint256) {
        return base * (10 ** exp);
    }
}