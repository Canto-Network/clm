import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";

let router: any;
let comptroller: any;
let weth: any;
let note: any;
let factory: any;   
let usdc: any;
let cCanto: any;
let usdt: any;
let cNote: any;
let cUsdc: any;
let cUsdt: any;
let noteRate: any; 
let cLPToken: any;
let WethLPToken: any; 
let USDCLPToken: any;
let cUsdcLPToken: any;
let cWethLPToken: any;
let blocksPerYear: bigint = BigInt(5256666)

describe("Test with token of different decimals", async () => {
    let dep: any;
    before(async() => {
            dep  = await getNamedAccounts();
            [dep] = await ethers.getSigners();
            await deployments.fixture("Protocol");
            router = await ethers.getContract("BaseV1Router01");
            comptroller = new ethers.Contract(
                (await deployments.get("Unitroller")).address,
                (await deployments.get("Comptroller")).abi,
                dep 
            );
            weth = await ethers.getContract("WETH");
            usdc = await ethers.getContract("USDC");
            note = await ethers.getContract("Note");
            cNote = await ethers.getContract("CNoteDelegator");
            cUsdc = await ethers.getContract("CUsdcDelegator");
            factory = await ethers.getContract("BaseV1Factory");
            noteRate = await ethers.getContract("NoteRateModel");
    });

    describe("Borrow Note using USDC As Collateral", async () => {
        let mintBal = ethers.utils.parseUnits("1000000", "6");

        before("retrieve Note", async () => {
            //support usdc and note markets
            await (await comptroller._supportMarket(cNote.address)).wait();
            await (await comptroller._supportMarket(cUsdc.address)).wait();
            //set the collateral factors for these markets
            await (await comptroller._setCollateralFactor(cNote.address, ethers.utils.parseUnits("0.8", "18"))).wait();
            await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.8","18"))).wait();
            //deployer enters both cNote and cUsdc markets
            await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait();
            //approve cTokens to transferIn mintBal
            await (await usdc.approve(cUsdc.address, mintBal)).wait();
            await (await note.approve(cNote.address, mintBal)).wait();
            //supply mintBal to the markets
            await (await cUsdc.mint(mintBal)).wait();
            let accLiquidity = (await comptroller.callStatic.getAccountLiquidity(dep.address))[1].toBigInt();
            //borrow account liquidity of Note 
            await (await cNote.borrow(accLiquidity)).wait()
            console.log("USDC Balance: ", (await usdc.balanceOf(dep.address)).toBigInt()); 
            console.log("Note Balance: ", (await note.balanceOf(dep.address)).toBigInt());
            //get initial Borrow Rate Per block, should be .02e18 / blocks per year
            let borrowRatePerBlock = (await cNote.borrowRatePerBlock()).toBigInt() // borrow rate per block has not been updated 
            console.log("borrow Rate per block: ", borrowRatePerBlock)
            let baseRatePerYear = borrowRatePerBlock * blocksPerYear
            console.log("baseRatePeryear: ", baseRatePerYear)
            // initial exchangeRate is 1e18, total supply is 0
            console.log("Initial Exchange Rate: ", (await cNote.exchangeRateStored()).toBigInt())
            //initial exchange rate should not have changed
           expect((await cNote.exchangeRateStored()).toBigInt() == ethers.utils.parseUnits("1", "18")).to.be.true

            //first set the allowance on the router
            await (await usdc.approve(router.address, ethers.utils.parseUnits("100000", "6"))).wait()
            await (await note.approve(router.address, ethers.utils.parseUnits("100000", "18"))).wait()
            // add liquidity to the stable pair 
            await (await router.addLiquidity(
                note.address, usdc.address,true,
                ethers.utils.parseUnits("1000", "18"), 
                ethers.utils.parseUnits("1000", "6"),  
                    0, 0,
                    dep.address, 99999999999
            )).wait();
            //set stable on the PriceOracle (for usdc)
            await (await router.setStable(usdc.address)).wait()
            // set period size so we can get immediate feed-back on swaps
            await (await factory.setPeriodSize(0)).wait()
            await (await noteRate._setUpdateFrequency(0)).wait() // set update frequency to 0 so the borrow and supply rates are always updating
        });
        it("Swaps so that the price of 1e6 USDC is less than 1e18 Note", async () => {
                // now make the swaps to generate a price
                for(var i = 0; i < 30; i++) {
                    await (await router.swapExactTokensForTokensSimple(
                        ethers.utils.parseUnits("10", "6"), // note will be trading over the dollar , and interest rate will be lowered
                        ethers.utils.parseUnits("0", "18"), 
                        usdc.address,
                        note.address,
                        true, 
                        dep.address,
                        999999999999
                        )).wait();
                        if (i > 7) {
                            // view the current price quotes as we swap the assets
                            let usdcPairAddr = await factory.getPair(note.address, usdc.address, true);
                            let pair = await ethers.getContractAt("BaseV1Pair", usdcPairAddr)
                            console.log("Current USDC Price: ", (await router.getUnderlyingPrice(cUsdc.address)).toBigInt())
                            console.log("Current USDC Quote: ", (await pair.quote(usdc.address, ethers.utils.parseUnits("1", "6"), 8)).toBigInt())
                    }
                }
                // update the base Rate in the note interest Rate model 
                await (await noteRate.updateBaseRate()).wait()
                console.log("Current Borrow Rate: ", (await noteRate.getBorrowRate(0,0,0)).toBigInt())
        })
        it("Swaps the other way so that Note is trading under the dollar", async () => {
                // now make the swaps to generate a price
                for(var i = 0; i < 60; i++) {
                    await (await router.swapExactTokensForTokensSimple(
                        ethers.utils.parseUnits("10", "18"), // note will be trading under the dollar , and interest rate will be increased
                        ethers.utils.parseUnits("0", "6"), 
                        note.address,
                        usdc.address,
                        true, 
                        dep.address,
                        999999999999
                        )).wait();
                }
                // update the base Rate in the note interest Rate model 
                await (await noteRate.updateBaseRate()).wait()
                console.log("Current Borrow Rate: ", (await noteRate.getBorrowRate(0,0,0)).toBigInt())
        })
    })
}); 