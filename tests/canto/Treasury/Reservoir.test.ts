import {expect} from "chai";
import {ethers, deployments, getNamedAccounts} from "hardhat";

let oracle: any;
let comptroller: any;
let weth: any;
let note: any;
let atom: any;
let factory: any;   
let usdc: any;
let cCanto: any;
let usdt: any;
let cNote: any;
let cUsdc: any;
let noteRate: any; 
let cLPToken: any;
let WethLPToken: any; 
let USDCLPToken: any;
let cUsdcLPToken: any;
let cWethLPToken: any;
let cAtomLPToken: any;
let cAtom: any;


describe("Reservoir Tests", async () => {
    let dep: any;
    before(async () => {
        [dep] = await ethers.getSigners();
        await deployments.fixture(["Protocol"]);
        oracle = await ethers.getContract("BaseV1Router01");
        comptroller = new ethers.Contract(
            (await deployments.get("Unitroller")).address,
            (await deployments.get("Comptroller")).abi,
            dep 
        );
        weth = await ethers.getContract("WETH");
        usdt = await ethers.getContract("USDT");
        usdc = await ethers.getContract("USDC");
        note = await ethers.getContract("Note");
        atom = await ethers.getContract("ATOM");
        cNote = await ethers.getContract("CNoteDelegator");
        cUsdc = await ethers.getContract("CUsdcDelegator");
        cAtom = await ethers.getContract("CAtomDelegator");
        factory = await ethers.getContract("BaseV1Factory");
        cCanto = await ethers.getContract("CCanto");
        noteRate = await ethers.getContract("NoteRateModel");
    });
    describe("Reservoir Tests", async () => {
        it("check that the router exists", async () => {
            console.log("USDC Balance: ", (await usdc.balanceOf(dep.address)).toBigInt()); 
            console.log("USDT Balance: ", (await usdt.balanceOf(dep.address)).toBigInt());
            expect((await ethers.provider.getCode(oracle.address)) === "0x").to.be.false;
            expect((await oracle.getUnderlyingPrice(cCanto.address)).toBigInt() == 0).to.be.true;
        });
        it("deploy pair and check that it exists", async () => {
            await (await factory.createPair(usdc.address, weth.address, false)).wait();
            expect((await oracle.getUnderlyingPrice(cCanto.address)).toBigInt() == 0).to.be.true;
            //router and factory are linked and the note/WETH pair exists
            expect(await factory.allPairs(0)).to.equal(await oracle.pairFor(usdc.address, weth.address, false));
        });
        let transferBal = ethers.utils.parseUnits("1000", "18");
        it("retrieve WETH with this account", async () => {
            expect((await weth.balanceOf(dep.address)).toBigInt() == transferBal).to.be.false; //WETH balance is transferBal
            console.log("WETH Balance: ", (await weth.balanceOf(dep.address)).toBigInt());
        }); 

        let mintBal = ethers.utils.parseUnits("100000000", "6");

        it("retrieve Note", async () => {
            await (await comptroller._supportMarket(cNote.address)).wait();
            await (await comptroller._supportMarket(cUsdc.address)).wait();
            await (await comptroller._setCollateralFactor(cNote.address, "800000000000000000")).wait();
            await (await comptroller._setCollateralFactor(cUsdc.address, "800000000000000000")).wait();
            await (await comptroller.enterMarkets([cUsdc.address,cNote.address])).wait();
            await (await usdc.approve(cUsdc.address, mintBal)).wait();
            await (await cUsdc.mint(mintBal)).wait();
            let accLiquidity = (await comptroller.callStatic.getAccountLiquidity(dep.address))[1].toBigInt();
            await (await cNote.borrow(accLiquidity)).wait();
            expect((await note.balanceOf(dep.address)).toBigInt() > 0).to.be.true;
            console.log((await note.balanceOf(dep.address)).toBigInt());
            console.log("cNote Supply: ", (await cNote.supplyRatePerBlock()).toBigInt());
        });

        it("Add Liquidity", async () =>  {
            //set allowance 
            let priorWETHBal = (await weth.balanceOf(dep.address)).toBigInt();
            let priorNOTEBal = (await note.balanceOf(dep.address)).toBigInt();
            
            await (await weth.approve(oracle.address, ethers.utils.parseUnits("100000000", "18"))).wait();
            await (await note.approve(oracle.address, (await note.balanceOf(dep.address)).toBigInt())).wait();
            expect((await weth.allowance(dep.address, oracle.address)).toBigInt() ==  ethers.utils.parseUnits("100000000", "18")).to.be.true
            expect((await note.allowance(dep.address, oracle.address)).toBigInt() == priorNOTEBal).to.be.true
            console.log("Weth balance: ", (await weth.balanceOf(dep.address)).toBigInt());
            console.log("Note Balance: ", (await note.balanceOf(dep.address)).toBigInt());
            // await (await oracle.releaseStatic()).wait();

            await (await oracle.addLiquidityCANTO(
                note.address, false,
                ethers.utils.parseUnits("100000", "18"), 
                0, 0,
                dep.address, 9999999999999,
                {value: ethers.utils.parseUnits("9999", "18")}
            )).wait();
            
            console.log("Note balance: ", (await note.balanceOf(oracle.address)).toBigInt());
                
            await (await factory.setPeriodSize(0)).wait() // set periodSize to be zero
            
            
            for(var i = 0; i < 30; i++) {
                await (await oracle.swapExactTokensForTokensSimple(
                    ethers.utils.parseUnits("300", "18"), 
                    ethers.utils.parseUnits("0", "18"), 
                    note.address,
                    weth.address,
                    false, 
                    dep.address,
                    999999999999
                    )).wait();
                    if (i > 7) {
                        let wethPairAddr = await factory.getPair(note.address, weth.address, false);
                        let pair = await ethers.getContractAt("BaseV1Pair", wethPairAddr)
                        console.log("Current WETH Price: ", (await oracle.getUnderlyingPrice(cCanto.address)).toBigInt())
                        console.log("Current WETH Quote: ", (await pair.quote(weth.address, ethers.utils.parseUnits("1", "18"), 8)).toBigInt())
                }
            }

            //pool balances
            console.log((await weth.balanceOf(oracle.address)).toBigInt());
            console.log((await note.balanceOf(oracle.address)).toBigInt());
            //user balances
            console.log("----------");
            console.log((await weth.balanceOf(dep.address)).toBigInt());
            console.log((await note.balanceOf(dep.address)).toBigInt());
            
            console.log("WETH Price: ", (await oracle.getUnderlyingPrice(cCanto.address)).toBigInt())
            let curWETHBal =(await weth.balanceOf(dep.address)).toBigInt();
            let curUSDCBal =(await note.balanceOf(dep.address)).toBigInt();
        });

        it("Check LP balance of deployer", async () => {
            expect(await comptroller.oracle()).to.equal(oracle.address);
            console.log("USDC/WETH: ", await factory.allPairs(0));
            console.log("Price: ", (await oracle.getUnderlyingPrice(cCanto.address)).toBigInt());
        });
        
        let wethBal: any
        it("AccountLiquidity determined by PriceOracle", async () => {
            wethBal = await weth.balanceOf(dep.address)
            
            //support cCanto market, and set collateral factor
            console.log("Comptroller Address: ", comptroller.address);
            console.log("deployer weth balance: ", await weth.balanceOf(dep.address));
            
            await (await comptroller._supportMarket(cCanto.address)).wait(); 
            await (await comptroller._setCollateralFactor(cCanto.address, ethers.BigNumber.from("50000000000000000"))).wait();
            await (await comptroller.enterMarkets([cCanto.address])).wait();
            // withdraw deployer's balance of weth
            await (await weth.withdraw(wethBal)).wait()

            await (await cCanto.mint({value:wethBal})).wait();
            
            console.log("deployer cCanto balance: ", await cCanto.balanceOf(dep.address));
            console.log("Deployer acc Liquidity: ",(await comptroller.getAccountLiquidity(dep.address))[1].toBigInt());
        });

        describe("Identify Note Price from Comptroller and with InterestRateModel", async () => {
            it("check Interest Rate Model's Price Oracle", async () => {
                expect(await noteRate.oracle()).to.equal(oracle.address);
            });
            
            let borrow = ethers.utils.parseUnits("400", "18")
            it("Supply Note", async () => {
                expect(await comptroller.checkMembership(dep.address, cNote.address)).to.be.true;
                await (await note.approve(cNote.address, dep.address)).wait();
                await (await cNote.mint(await note.balanceOf(dep.address))).wait();
                console.log("Note Supply: ",(await cNote.balanceOf(dep.address)).toBigInt());
            });

            it("Redeem Note minted", async () => {
                console.log("exchange Rate: ", await cNote.exchangeRateStored());
                console.log("exchange Rate: ", await cUsdc.exchangeRateStored());
                await (await cNote.redeem(await cNote.balanceOf(dep.address))).wait();
                console.log("note balance after redeem: ", (await note.balanceOf(dep.address)).toBigInt());
                console.log("cUsdc balance: ", await cUsdc.balanceOf(dep.address));
                await (await cUsdc.redeem(ethers.utils.parseUnits("5", "6"))).wait();
                console.log("USDC Balance after redeem", (await usdc.balanceOf(dep.address)).toBigInt());
                
                console.log((await comptroller.callStatic.getAccountLiquidity(dep.address))[1].toBigInt());
                console.log("USDC balance: ", (await usdc.balanceOf(dep.address)).toBigInt());
                console.log("NOTE balance: ", (await note.balanceOf(dep.address)).toBigInt());
            });

            it("Now add Liquidity to the USDC/Note token pair", async () =>{ 
                await (await note.approve(oracle.address, (ethers.utils.parseUnits("400", "18")))).wait();
                await (await usdc.approve(oracle.address, (ethers.utils.parseUnits("400", "6")))).wait(); 
                await (await weth.approve(oracle.address, (ethers.utils.parseUnits("50", "18")))).wait();
                await (await atom.approve(oracle.address, (ethers.utils.parseUnits("1000", "8")))).wait();

                await (await cNote.repayBorrow(ethers.utils.parseUnits("300", "18"))).wait(); 
                console.log("account liquidty: ",(await comptroller.callStatic.getAccountLiquidity(dep.address))[1].toBigInt() );
                console.log((await cUsdc.exchangeRateStored()).toBigInt());
                await (await cUsdc.redeem(ethers.utils.parseUnits("30", "6"))).wait();

                let NoteInterest = await ethers.getContract("NoteRateModel");
                await ( await NoteInterest._setUpdateFrequency(0)).wait( );

                console.log("USDC BAL: ",  (await usdc.balanceOf(dep.address)).toBigInt());
                console.log("Note BAL: ", (await note.balanceOf(dep.address)).toBigInt());

                await (await cCanto.redeem(wethBal)).wait()
                
                let cantoBal = await ethers.provider.getBalance(dep.address)
                await (await weth.deposit({value: ethers.utils.parseUnits("800", "18")})).wait()

                console.log("WETH BAL: ", (await weth.balanceOf(dep.address)).toBigInt());

                await (await oracle.addLiquidity(
                    note.address, usdc.address,true,
                    ethers.utils.parseUnits("50", "18"), 
                    ethers.utils.parseUnits("30", "6"),  
                    0, 0,
                    dep.address, 99999999999
                )).wait();
                
                await ( await oracle.setStable(usdc.address)).wait();

                console.log("LIQUIDITY ADDED");

                await (await oracle.addLiquidity(
                    weth.address, atom.address, false,
                    ethers.utils.parseUnits("10", "18"),
                    ethers.utils.parseUnits("10", "8"),
                    0,0,
                    dep.address, 999999999999
                )).wait();
                
                console.log("LIQUIDITY ADDED");

                await (await factory.setPeriodSize(0)).wait()
                // await (await oracle.releaseStatic()).wait();
                for (var i = 0; i < 9;++i) {
                    await (await oracle.swapExactTokensForTokensSimple(
                        ethers.utils.parseUnits("1", "18"), 
                        0, 
                        note.address, //token from
                        usdc.address, //token to
                        true, 
                        dep.address,
                        9999999999999
                    )).wait();
                }

                for (var i = 0; i < 9;++i) {
                    await (await oracle.swapExactTokensForTokensSimple(
                        ethers.utils.parseUnits("1", "8"), 
                        0, 
                        atom.address, //token from
                        weth.address, //token to
                        false, 
                        dep.address,
                        9999999999999
                    )).wait();
                }

                await (await cNote.accrueInterest()).wait();
                await cNote.supplyRatePerBlock();
                console.log(await cNote.supplyRatePerBlock());
                console.log("cNote borrowRate: ", await cNote.callStatic.exchangeRateStored());
                await (await cNote.exchangeRateCurrent()).wait();
                console.log("cNote Borrow Rate: ", (await cNote.exchangeRateStored()).toBigInt());

                //pool balances
                console.log((await note.balanceOf(await factory.allPairs(1))).toBigInt());
                console.log((await usdc.balanceOf(await factory.allPairs(1))).toBigInt());
                //user balances
                console.log("----------");
                console.log((await note.balanceOf(dep.address)).toBigInt());
                console.log((await usdc.balanceOf(dep.address)).toBigInt());

                console.log("USDC/NOTE Price: ", (await oracle.getUnderlyingPrice(cUsdc.address)).toBigInt());
            });
        });
    });
    describe("minting LP tokens and setting up market for LP Token", async () => {

        before(async () =>{
            USDCLPToken = await ethers.getContractAt("BaseV1Pair", await oracle.pairFor(usdc.address, note.address, true), dep.address);
            console.log("USDCLPToken balance of deployer", await USDCLPToken.balanceOf(dep.address));
            console.log("USDCLPToken address: ", USDCLPToken.address);
            // deploy CLPToken
            let cLPFac = await ethers.getContractFactory("CErc20Delegate", dep);
            let cLP = await cLPFac.deploy();
            await cLP.deployed();
            let cLPTokenFac = await ethers.getContractFactory("CErc20Delegator", dep);
            cUsdcLPToken = await cLPTokenFac.deploy(
                USDCLPToken.address, 
                comptroller.address,
                (await deployments.get("JumpRateModel")).address,
                "1000000000000000000",
                "cLPTOKEN",
                "cLPTOKEN",
                18,
                dep.address,
                cLP.address,
                2,
                []
            );
            await cUsdcLPToken.deployed(); 
            console.log("cLPToken address: ", cUsdcLPToken.address);
        });  

        it("Check user's LP Token balance", async () => {
            let noteUsdc = await oracle.pairFor(usdc.address, note.address, true);
            console.log("Note balance of pool: ", (await note.balanceOf(noteUsdc)).toBigInt());
            console.log("USDC balance of pool: ", (await usdc.balanceOf(noteUsdc)).toBigInt());
            console.log("USDC cLPToken Price", (await oracle.getUnderlyingPrice(cUsdcLPToken.address)).toBigInt());
            let pair = await ethers.getContractAt("BaseV1Pair", noteUsdc);
            console.log("Pair totalSupply: ", (await pair.totalSupply()));
        }); 
    }); 


    describe("Checking price of WETH/Note LP Token Pool ", async () => {
        let AtomLPToken: any;

        before(async () => {
            console.log("WETH(CANTO)/Note Pair", await oracle.pairFor(note.address, weth.address, false));
            WethLPToken = await ethers.getContractAt("BaseV1Pair", await oracle.pairFor(note.address, weth.address, false), dep.address);
            console.log("WETHLPToken balance of deployer", await WethLPToken.balanceOf(dep.address));
            console.log("WETHLPToken address: ", WethLPToken.address);
            // deploy CLPToken
            let cLPFac = await ethers.getContractFactory("CErc20Delegate", dep);
            let cLP = await cLPFac.deploy();
            await cLP.deployed();
            let cLPTokenFac = await ethers.getContractFactory("CErc20Delegator", dep);
            cWethLPToken = await cLPTokenFac.deploy(
                WethLPToken.address, 
                comptroller.address,
                (await deployments.get("JumpRateModel")).address,
                "1000000000000000000",
                "cLPTOKEN",
                "cLPTOKEN",
                18,
                dep.address,
                cLP.address,
                3,
                []
            );
            await cWethLPToken.deployed(); 
            console.log("cLPToken address: ", cWethLPToken.address);

            
            console.log("WETH(CANTO)/Atom Pair", await oracle.pairFor(atom.address, weth.address, false));
            AtomLPToken = await ethers.getContractAt("BaseV1Pair", await oracle.pairFor(atom.address, weth.address, false), dep.address);
            console.log("WETHLPToken balance of deployer", await WethLPToken.balanceOf(dep.address));
            console.log("WETHLPToken address: ", WethLPToken.address);
            // deploy CLPToken
            let cLP2 = await cLPFac.deploy();
            await cLP2.deployed();
            cAtomLPToken = await cLPTokenFac.deploy(
                AtomLPToken.address, 
                comptroller.address,
                (await deployments.get("JumpRateModel")).address,
                "1000000000000000000",
                "cLPTOKEN",
                "cLPTOKEN",
                18,
                dep.address,
                cLP2.address,
                3,
                []
            );
            await cWethLPToken.deployed(); 
            console.log("Atom cLPToken address: ", cAtomLPToken.address);
            
            console.log("Atom LPToken price: ", (await oracle.getUnderlyingPrice(cAtomLPToken.address)).toBigInt()) ;
            console.log("ATOM LP TOkens totalSupply; ", (await AtomLPToken.totalSupply()).toBigInt());
            console.log("Weth Balance: ", (await weth.balanceOf(AtomLPToken.address)).toBigInt());
            console.log("Atom Balance: ", (await atom.balanceOf(AtomLPToken.address)).toBigInt());
            console.log("Weth PRice: ", (await oracle.getUnderlyingPrice(cCanto.address)).toBigInt());
            console.log("Atom PRice: ", (await oracle.getUnderlyingPrice(cAtom.address)).toBigInt());

        });      

        it("remove liquidity from the atom canto pair and check price: ", async () => {
            let atomCantoAddr = await oracle.pairFor(atom.address, weth.address, false)
            let atomCanto = await ethers.getContractAt("BaseV1Pair", atomCantoAddr)
            let balance = (await atomCanto.balanceOf(dep.address)).toBigInt() - BigInt(100000)
            await (await atomCanto.approve(oracle.address, balance)).wait()
            await oracle.removeLiquidity(
                atom.address, 
                weth.address, 
                false, 
                balance, 
                0,0, dep.address,
                9999999999999
            )

            for (var i = 0; i < 30;++i) {
                await (await oracle.swapExactTokensForTokensSimple(
                    ethers.utils.parseUnits("1", "5"), 
                    0, 
                    atom.address, //token from
                    weth.address, //token to
                    false, 
                    dep.address,
                    9999999999999
                )).wait();
            }


            console.log("Atom LPToken price: ", (await oracle.getUnderlyingPrice(cAtomLPToken.address)).toBigInt()) ;
            console.log("ATOM LP TOkens totalSupply; ", (await AtomLPToken.totalSupply()).toBigInt());
            console.log("Weth Balance: ", (await weth.balanceOf(AtomLPToken.address)).toBigInt());
            console.log("Atom Balance: ", (await atom.balanceOf(AtomLPToken.address)).toBigInt());
            console.log("Weth PRice: ", (await oracle.getUnderlyingPrice(cCanto.address)).toBigInt());
            console.log("Atom PRice: ", (await oracle.getUnderlyingPrice(cAtom.address)).toBigInt());
        })

        it("Check user's WethLP Token balance", async ( ) => {
            console.log("WETH cLPToken Price: ", (await oracle.getUnderlyingPrice(cWethLPToken.address)).toBigInt());
            console.log("Note balanceOf deployer", (await note.balanceOf(dep.address)).toBigInt());
            console.log("USDC balanceOf deployer", (await usdc.balanceOf(dep.address)).toBigInt());
        });

        it("Swamps Pool by 10x", async () => {
            await (await note.approve(oracle.address, ethers.utils.parseUnits("200", "18")));
            await (await usdc.approve(oracle.address, ethers.utils.parseUnits("300", "18")));
            console.log("USDC Balance: ", (await usdc.balanceOf(dep.address)).toBigInt());
            console.log("NOTE Balance: ", (await note.balanceOf(dep.address)).toBigInt());

            await (await oracle.addLiquidity(
                note.address, usdc.address,true,
                ethers.utils.parseUnits("200", "18"), 
                ethers.utils.parseUnits("10", "6"),  
                0, 0,
                dep.address, 99999999999
            )).wait();

            console.log("note/usdc lp token supply: ", (await USDCLPToken.totalSupply()).toBigInt());
            console.log("note/usdc lp token supply: ", (await USDCLPToken.totalSupplyAvg(8)).toBigInt());
            console.log("cUsdcLPToken Price: ", (await oracle.getUnderlyingPrice(cUsdcLPToken.address)).toBigInt());
            console.log("cWethLPToken Price: ", (await oracle.getUnderlyingPrice(cWethLPToken.address)).toBigInt());
            let wethNote = await ethers.getContractAt("BaseV1Pair", oracle.pairFor(weth.address, note.address, false));
            let usdcNote = await ethers.getContractAt("BaseV1Pair", oracle.pairFor(usdc.address, note.address, true));
            console.log("WethNote TotalSupply: ", (await wethNote.totalSupply()).toBigInt());
            console.log("UsdcNote TotalSupply: ", (await usdcNote.totalSupply()).toBigInt());
            console.log("UDSC balance: ", (await usdc.balanceOf(usdcNote.address)).toBigInt());
            console.log("note balance: ", (await note.balanceOf(usdcNote.address)).toBigInt());
            await (await factory.createPair(note.address, usdc.address, false)).wait();
            console.log("USDC Price: ", (await oracle.getUnderlyingPrice(cUsdc.address)).toBigInt());
        });


        it("Supports the WethLPToken Market", async () => {
            await (await comptroller._supportMarket(cUsdcLPToken.address));
        });
    });
});