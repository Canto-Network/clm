// pragma solidity ^0.8.10;

// import "./utils.sol";
// import {CLMPriceOracle} from "./CLMPriceOracle.sol";
// import "forge-std/Test.sol";
// import {TestOracle} from "./helpers/TestOracle.sol";
// import {CRWAToken} from "src/RWA/CRWAToken.sol";
// import {TestRWAOracle} from "./helpers/TestRWAOracle.sol";

// contract CLMPriceOracleTest is Test, Helpers {
//     address public admin = address(1);
//     NoteTest public note;
//     CErc20Delegator public cNote;
//     CEther public CCanto;
//     WCANTOTest public wcanto;
//     BaseV1Router01 public router;
//     ERC20Test public usdc;
//     ERC20Test public usdt;
//     CLMPriceOracle public priceOracle;
//     BaseV1Factory public factory;
//     CRWAToken public rwaCToken;
//     // rwa cToken not added to oracle
//     CRWAToken public rwaCTokenUnadded;

//     function setUp() public {
//         vm.startPrank(admin);
//         // setup Comptroller before deployingCNote
//         setUpComptroller();
//         // deployCNOte
//         (cNote, note) = deployCNote();
//         // deploy CCanto
//         CCanto = deployCCanto();
//         // deploy WCANTO
//         wcanto = new WCANTOTest("wcanto", "wcanto");
//         // deploy router
//         (router, factory) = deployRouter(address(wcanto), address(note));
//         // deploy usdc / usdt
//         usdc = new ERC20Test("usdc", "usdc", 0, 6);
//         usdt = new ERC20Test("usdt", "usdt", 0, 6);

//         // deploy rwacToken to place into oracle
//         rwaCToken = new CRWAToken();
//         ERC20 rwaUnderlying = new ERC20("rwa", "rwa", 0, 18);
//         rwaCToken = CRWAToken(
//             address(
//                 new CErc20Delegator(
//                     address(rwaUnderlying),
//                     Comptroller(address(unitroller_)),
//                     new NoteRateModel(0),
//                     1e18,
//                     "cRWA",
//                     "cRWA",
//                     18,
//                     payable(admin),
//                     address(rwaCToken),
//                     ""
//                 )
//             )
//         );
//         address[] memory rwaCTokenList = new address[](1);
//         rwaCTokenList[0] = address(rwaCToken);

//         //set up RWAPriceOracle
//         TestRWAOracle rwaOracle = new TestRWAOracle();
//         CRWAToken(address(rwaCToken)).setPriceOracle(address(rwaOracle));

//         rwaCTokenUnadded = new CRWAToken();
//         // deploy other cToken to not place into oracle
//         rwaCTokenUnadded = CRWAToken(
//             address(
//                 new CErc20Delegator(
//                     address(rwaUnderlying),
//                     Comptroller(address(unitroller_)),
//                     new NoteRateModel(0),
//                     1e18,
//                     "cRWA",
//                     "cRWA",
//                     18,
//                     payable(admin),
//                     address(rwaCTokenUnadded),
//                     ""
//                 )
//             )
//         );

//         // deploy CLMPriceOracle
//         priceOracle = new CLMPriceOracle(
//             address(comptroller_),
//             address(router),
//             address(CCanto),
//             address(usdc),
//             address(usdt),
//             address(wcanto),
//             address(note),
//             rwaCTokenList
//         );

//         vm.stopPrank();
//     }

//     // test returning price if not Comptroller
//     function test_getUnderlyingPriceNotComptroller() public {
//         // send call from admin
//         vm.prank(admin);
//         // call getUnderlyingPrice from non-Comptroller address
//         uint256 price = priceOracle.getUnderlyingPrice(CToken(address(cNote)));
//         // price should have returned zero
//         assertEq(price, 0);
//     }

//     // test returing correct price if sender is comptroller
//     function test_getUnderlyingPriceComptroller() public {
//         // send call from comptroller
//         vm.prank(address(comptroller_));
//         // call getunderlying price from comptroller
//         uint256 price = priceOracle.getUnderlyingPrice(CToken(address(cNote)));
//         // price should return 1e18
//         assertEq(price, 1e18);
//     }

//     // test returning correct static prices from usdc / usdt
//     function test_getUsdtPrice() public {
//         // instantiate cTokens
//         CErc20Delegator cUsdc = deployCErc20(address(usdc));
//         CErc20Delegator cUsdt = deployCErc20(address(usdt));

//         // send call from Comptroller
//         vm.prank(address(comptroller_));
//         uint256 price = priceOracle.getUnderlyingPrice(CToken(address(cUsdc)));
//         assertEq(price, 1e30);
//     }

//     // test get non-existent pairs
//     function test_getNonExistentPairs() public {
//         // get stable pair with usdc, should return address(0)
//         address usdc_ = address(usdc);
//         address pairAddr = priceOracle.getStablePair(usdc_);
//         assertEq(address(0), pairAddr);
//         pairAddr = priceOracle.getVolatilePair(usdc_);
//         assertEq(address(0), pairAddr);
//     }

//     // test getting existing pairs
//     function test_getExistingPairs() public {
//         // mint usdc / note to admin
//         note.mintTo(admin, 4000);
//         usdc.mintTo(admin, 1000);
//         // create allowance for router
//         vm.startPrank(admin);
//         note.approve(address(router), 4000);
//         usdc.approve(address(router), 1000);
//         wcanto.approve(address(router), 1000);
//         vm.stopPrank();
//         // create stable pair w usdc / Note
//         vm.prank(admin);
//         router.addLiquidity(address(note), address(usdc), true, 2000, 1000, 0, 0, admin, block.timestamp + 1000);
//         // create non-stable pair w canto
//         vm.prank(admin);
//         router.addLiquidity(address(note), address(wcanto), false, 2000, 1000, 0, 0, admin, block.timestamp + 1000);
//         // pairs should now exist
//         address cantoPair = priceOracle.getVolatilePair(address(note));
//         address usdcPair  = priceOracle.getStablePair(address(usdc));
//         // retrieve expected addresses
//         address expectCantoAddr = router.pairFor(address(note), address(wcanto), false);
//         address expectUsdcAddr = router.pairFor(address(note), address(usdc), true);
//         assertEq(cantoPair, expectCantoAddr);
//         assertEq(usdcPair, expectUsdcAddr);
//     }

//     //  getPriceCanto returns zero if the pair does not exist,
//     function test_getPriceCantoNonExistentPair() public {
//         // the Pair does not exist, getPriceCanto shld return 0
//         uint price = priceOracle.getPriceCanto(address(usdc));
//         assertEq(price, 0);
//     }

//     // getPriceNote returns zero if the pair does not exist
//     function test_getPriceNoteNonExistentPair() public {
//         // the pair does not exist, getPriceNote shld return 0
//         uint price = priceOracle.getPriceNote(address(usdc), true);
//         assertEq(price, 0);
//     }

//     // getPriceCanto returns 0 if there aren't enough observations in the pair
//     function test_getPriceCantoNoObservations() public {
//         // mint note to admin
//         note.mintTo(admin, 2000);
//         vm.startPrank(admin);
//         note.approve(address(router), 2000);
//         wcanto.approve(address(router), 2000);
//         router.addLiquidity(address(note), address(wcanto), false, 2000, 2000, 0, 0, admin, block.timestamp + 1000);
//         vm.stopPrank();

//         uint price = priceOracle.getPriceCanto(address(note));
//         assertEq(price, 0);
//     }

//     // Provide sufficient observations in pair, and read prices of Canto / Note, check that they
//     // are equal to the observations returned from the router
//     function test_getPriceNote() public {
//         // mint note to admin
//         note.mintTo(admin, 3000e18);
//         vm.startPrank(admin);
//         note.approve(address(router), 3000e18);
//         wcanto.approve(address(router), 2000e18);
//         router.addLiquidity(address(note), address(wcanto), false, 2000e18, 2000e18, 0, 0, admin, block.timestamp + 1000);
//         vm.stopPrank();
//         // now add liquidity to the pairs
//         // retrieve pair
//         address pair = priceOracle.getVolatilePair(address(note));
//         // set periodSize to zero for instant obs
//         vm.prank(address(factory));
//         BaseV1Pair(pair).setPeriodSize(0);
//         for (uint i; i < 14; ++i) {
//             // swap exact tokens for tokens
//             vm.prank(admin);
//             vm.warp(block.timestamp + 1000);
//             router.swapExactTokensForTokensSimple(
//                 1e18,
//                 0,
//                 address(note),
//                 address(wcanto),
//                 false,
//                 admin,
//                 block.timestamp + 2000
//             );
//             // update block timestamp
//         }
//         // expect router price and CLMPriceOracle to return same value
//         uint routerPrice = router.getUnderlyingPrice(CCanto);
//         uint price = priceOracle.getPriceNote(address(wcanto), false);
//         vm.prank(address(comptroller_));
//         uint priceFinal = priceOracle.getUnderlyingPrice(CCanto);
//         assertEq(price, routerPrice);
//         assertEq(price, priceFinal);
//         CErc20Delegator cPair = deployCErc20(pair);
//         vm.prank(address(comptroller_));
//         uint priceLp = priceOracle.getUnderlyingPrice(CToken(address(cPair)));
//         uint priceLpRouter = router.getUnderlyingPrice(CToken(address(cPair)));
//         assertEq(priceLp, priceLpRouter);
//     }

//     function test_getNotePrice() public {
//         // prank call from comptroller
//         vm.prank(address(comptroller_));
//         // get underlying price
//         uint price = priceOracle.getUnderlyingPrice(CToken(address(cNote)));
//         assertEq(price, 1e18);
//     }

//     function test_rwaAssetList() public {
//         assert(!priceOracle.isRWACToken(address(cNote)));
//         assert(priceOracle.isRWACToken(address(rwaCToken)));
//         assert(!priceOracle.isRWACToken(address(rwaCTokenUnadded)));
//     }

//     function test_rwaOraclePrice() public {
//         vm.startPrank(address(comptroller_));
//         assert(priceOracle.getUnderlyingPrice(CToken(address(rwaCToken))) == 1e18);
//         assert(priceOracle.getUnderlyingPrice(CToken(address(cNote))) == 1e18);
//         assert(priceOracle.getUnderlyingPrice(CToken(address(rwaCTokenUnadded))) == 0);
//         vm.stopPrank();
//     }

// }
