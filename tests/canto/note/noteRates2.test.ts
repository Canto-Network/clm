import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";
import { diff,  } from "./Utils";

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

let comptroller: any;
let weth: any;
let note: any;
let usdc: any;
let cCanto: any;
let usdt: any;
let cNote: any;
let cUsdc: any;
let cUsdt: any;
let noteRate: any; 
let treasury: any;
let accountant: any;
let blocksPerYear: bigint = BigInt(5256666)

let factory: any
let router: any

describe("Testing CNote exchange rate with redeems", async () => {
    let dep: any;
    let user1: any;
    let user2: any;

    let accountantCNoteBalance: any;
    before(async() => {
        dep  = await getNamedAccounts();
        [dep, user1, user2] = await ethers.getSigners();
        await deployments.fixture("Protocol");
        comptroller = new ethers.Contract(
            (await deployments.get("Unitroller")).address,
            (await deployments.get("Comptroller")).abi,
            dep 
        );
        usdc = await ethers.getContract("USDC");
        note = await ethers.getContract("Note");
        cNote = new ethers.Contract(
            (await deployments.get("CNoteDelegator")).address,
            (await deployments.get("CNote")).abi,
            dep
        );
        cUsdc = await ethers.getContract("CUsdcDelegator");
        accountant = await ethers.getContract("AccountantDelegator")
        treasury = await ethers.getContract("TreasuryDelegator")
        noteRate = await ethers.getContract("NoteRateModel")
        factory = await ethers.getContract("BaseV1Factory")
        router = await ethers.getContract("BaseV1Router01")
    });
    it("Check that users have 0 note to begin", async () => {
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("0", "18")).to.be.true
        expect((await note.balanceOf(user1.address)).toBigInt() == ethers.utils.parseUnits("0", "18")).to.be.true
        expect((await note.balanceOf(user2.address)).toBigInt() == ethers.utils.parseUnits("0", "18")).to.be.true
    })
    it ("Send 5,000,000 USDC to user1 and user2 and verify", async () => {
        await usdc.transfer(user1.address, ethers.BigNumber.from("15000000000000"));
        await usdc.connect(user1).transfer(user2.address, ethers.BigNumber.from("5000000000000"));
        expect(await usdc.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("10000000000000"));
        expect(await usdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("5000000000000"));
    })
    it("Supply and collateralize USDC", async () => {
        let mintBal = ethers.utils.parseUnits("400000000", "6");
        
        // support markets for cNOTE and cUSDC and sets collateral factors
        await (await comptroller._supportMarket(cNote.address)).wait();
        await (await comptroller._supportMarket(cUsdc.address)).wait();
        await (await comptroller._setCollateralFactor(cNote.address, ethers.utils.parseUnits("0.9", "18"))).wait();
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait();

        // supply 400,000,000 USDC as deployer
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait();
        await (await usdc.approve(cUsdc.address, mintBal));
        await (await cUsdc.mint(mintBal)).wait();
        expect(await cUsdc.balanceOf(dep.address)).to.eql(ethers.BigNumber.from("400000000000000"));

        // supply 5,000,000 USDC as user1
        await comptroller.connect(user1).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user1).approve(cUsdc.address, ethers.BigNumber.from("5000000000000"));
        await cUsdc.connect(user1).mint(ethers.BigNumber.from("5000000000000"));
        expect(await cUsdc.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("5000000000000"));

        // supply 5,000,000 USDC as user2
        await comptroller.connect(user2).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user2).approve(cUsdc.address, ethers.BigNumber.from("5000000000000"));
        await cUsdc.connect(user2).mint(ethers.BigNumber.from("5000000000000"));
        expect(await cUsdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("5000000000000"));
    })
    it("borrow 10000 Note as deployer and make swaps in the usdc/note pool", async () => {
        await (await cNote.borrow(ethers.utils.parseUnits("100000", "18"))).wait()
        // check exchange rate is still 1e18
        let exchangeRate = (await cNote.exchangeRateStored()).toBigInt()
        expect(exchangeRate == ethers.utils.parseUnits("1", "18")).to.be.true
    })
    it("add 10000 usdc and note into note/usdc stable pool", async () => {
        await (await note.approve(router.address, ethers.utils.parseUnits("10000", "18"))).wait()
        await (await usdc.approve(router.address, ethers.utils.parseUnits("10000", "6"))).wait()
        // now add liquidity to the pair
        await (await router.addLiquidity(
            note.address, usdc.address, true,
            ethers.utils.parseUnits("10000", "18"), // amt note
            ethers.utils.parseUnits("10000", "6"), // amt usdc
            0,0, // amts expected out (slippage tolerance is 100%)
            dep.address, 999999999999
        )).wait()
        // retrieve pair
        let pairAddr = await router.pairFor(usdc.address, note.address, true)
        let pair = await ethers.getContractAt("BaseV1Pair", pairAddr)
        // calculate the expected amount of lpTokens dep should have received
        let actualBal = (await pair.balanceOf(dep.address)).toBigInt()
        console.log(actualBal)
    })

    let currentPrice : any;

    it("deployer borrows more note, and now begins swapping", async () => {
        // first set periodSize, updateFrequency, and stable 
        await (await factory.setPeriodSize(0)).wait()
        await (await router.setStable(usdc.address)).wait()
        await (await noteRate._setUpdateFrequency(0)).wait()

        // approve router to transferFrom deployer
        await (await note.approve(router.address, ethers.utils.parseUnits("100", "18"))).wait()

        // now the deployer begins swapping (10 times)
        for (var i = 0; i < 9; i++) {
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("10", "18"),
                0, 
                note.address, //from
                usdc.address, //to 
                true, // stable
                dep.address,
                9999999999999
            )).wait() // swap 1 usdc for note ten times, naturally, note is now trading above the dollar
        }

        currentPrice = (await router.getUnderlyingPrice(cUsdc.address)).toBigInt()
        console.log("currentPrice: ", currentPrice)
    })

    it("now that note is trading above the dollar calculate the borrow/supply rate", async () => {
        let priceScaled =  BigInt(currentPrice) / BigInt(1e12)
        let priceNote = BigInt(1e18) * BigInt(1e18) / BigInt(priceScaled) // invert the price to get price of note in usdc
        // 1 note is worth less than a dollar, how can we re-stabilize the price?
        expect(priceNote < 1e18).to.be.true
        // dont update the base rate and check that the borrowRate is correct 
        let initBorrowRate = (await noteRate.getBorrowRate(0,0,0)).toBigInt()
        console.log("init Borrow Rate: ", initBorrowRate)
        let expectedBorrowRate = BigInt(2e16) / BigInt(5256666)
        // expect less than 1% difference
        expect((diff(initBorrowRate, expectedBorrowRate) / BigInt(1e18)) < 0.01).to.be.true
        // now update the baseRate 
        await (await noteRate.updateBaseRate()).wait()
        let curBorrowRate = (await noteRate.getBorrowRate(0,0,0)).toBigInt()
        console.log("initial Borrow Rate: ", initBorrowRate)
        console.log("new Borrow Rate: ", curBorrowRate)
        // note was trading above the dollar so we expect the borrowRate to have decreased, 
        let adjust = (await noteRate.adjusterCoefficient()).toBigInt()
        let diffPrice = diff(priceNote, BigInt(1e18))
        let interestAdjust = (diffPrice * adjust) / BigInt(1e18)
        // bc note is trading above the dollar decrease the borrow/supply rate
        let expected = BigInt(2e16) + interestAdjust
        expect(curBorrowRate == (expected / BigInt(5256666))).true
        expect((await cNote.borrowRatePerBlock()).toBigInt() == curBorrowRate).to.be.true
    })

    let priorRate : any

    it("user1 now borrows 1000 note against usdc, and trades the note back to usdc", async () => {
        // borrow 1000 note using usdc as collateral
        await (await cNote.connect(user1).borrow(ethers.utils.parseUnits("1000", "18"))).wait()
        await (await note.connect(user1).approve(router.address, ethers.utils.parseUnits("1000", "18"))).wait()
        //compute priorRate (annualized)
        priorRate = (await noteRate.baseRatePerYear()).toBigInt()
        // now the deployer begins swapping (20 times)

        await (await usdc.connect(user1).approve(router.address, ethers.utils.parseUnits("1000", "6"))).wait()
        for (var i = 0; i < 20; i++) {
            await (await router.connect(user1).swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("10", "6"),
                0, 
                usdc.address, //from
                note.address, //to 
                true, // stable
                user1.address,
                9999999999999
            )).wait() // swap 10 note for usdc 20 times, naturally, note is now trading under the dollar
        }

        currentPrice = (await router.getUnderlyingPrice(cUsdc.address)).toBigInt()
        let priceScaled = BigInt(currentPrice) / BigInt(1e12)
        console.log("price: ", priceScaled)
        // expect Note to now be trading over the dollar
        expect(priceScaled < ethers.utils.parseUnits("1", "18").toBigInt()).to.be.true
    })
    it("compute the annualized borrow/supply rates now that note is trading under the dollar", async () => {
        let priceScaled =  BigInt(currentPrice) / BigInt(1e12)
        let priceNote = BigInt(1e18) * BigInt(1e18) / BigInt(priceScaled) // invert the price to get price of note in usdc
        console.log("priceNote: ", priceNote)
        expect(priceNote > 1e18).to.be.true
        // now update the baseRate 
        await (await noteRate.updateBaseRate()).wait()
        let curBorrowRate = (await noteRate.getBorrowRate(0,0,0)).toBigInt()
        console.log("prior Borrow Rate: ", priorRate)
        console.log("new Borrow Rate: ", curBorrowRate)
        // note was trading above the dollar so we expect the borrowRate to have decreased, 
        let adjust = (await noteRate.adjusterCoefficient()).toBigInt()
        let diffPrice = diff(priceNote, BigInt(1e18))
        let interestAdjust = (diffPrice * adjust) / BigInt(1e18)
        // bc note is trading over the dollar decrease the borrow/supply rate
        let expected = priorRate - interestAdjust
        console.log("expected: ", expected)
        console.log("newBaseRatePerYear", (await noteRate.baseRatePerYear()).toBigInt())
        expect(diff(curBorrowRate, (expected / BigInt(5256666))) == BigInt(0)).true
        expect((await cNote.borrowRatePerBlock()).toBigInt() == curBorrowRate).to.be.true
    })  
});