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
let cUsdt: any;
let noteRate: any; 
let treasury: any;
let accountant: any;
let blocksPerYear: bigint = BigInt(5256666)
let cEth : any
let factory: any
let router: any
let cUsdc : any
let eth: any

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
        eth = await ethers.getContract("ETH")
        cNote = new ethers.Contract(
            (await deployments.get("CNoteDelegator")).address,
            (await deployments.get("CNote")).abi,
            dep
        );
        cCanto = await ethers.getContract("CCanto")
        cEth = new ethers.Contract(
            (await deployments.get("CETHDelegator")).address,
            (await deployments.get("CETH")).abi,
            dep
        )
        cUsdc = new ethers.Contract(
            (await deployments.get("CUsdcDelegator")).address,
            (await deployments.get("CUsdc")).abi,
            dep
        )

        accountant = await ethers.getContract("AccountantDelegator")
        treasury = await ethers.getContract("TreasuryDelegator")
        noteRate = await ethers.getContract("NoteRateModel")
        factory = await ethers.getContract("BaseV1Factory")
        router = await ethers.getContract("BaseV1Router01")
        weth = await ethers.getContract("WETH")
    });
    it("deployer sends 10000 canto to user1 and user2", async () => {
        // support and collateralize markets in comptroller
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(dep.address)).toBigInt())
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(user2.address)).toBigInt())
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(user1.address)).toBigInt())
        await (await comptroller._supportMarket(cNote.address)).wait()
        await (await comptroller._supportMarket(cCanto.address)).wait()
        await (await comptroller._supportMarket(cEth.address)).wait()
        await (await comptroller._supportMarket(cUsdc.address)).wait()
        // set collateral factors for cCanto 
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait()
        // set liquidation incentive and close factor for comptroller 
        await (await comptroller._setLiquidationIncentive(ethers.utils.parseUnits("0.1", "18"))).wait()
        await (await comptroller._setCloseFactor(ethers.utils.parseUnits("0.5", "18"))).wait()
    })
    it("deployer borrows note against Usdc and makes swaps", async () => {
        // borrow note against usdc 
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait()
        await (await usdc.approve(cUsdc.address, ethers.utils.parseUnits("1000"))).wait()
        // supply usdc
        await (await cUsdc.mint(ethers.utils.parseUnits("1000", "6"))).wait()
        // borrow note
        await (await cNote.borrow(ethers.utils.parseUnits("900", "18"))).wait()
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("900", "18").toBigInt()).to.be.true
    })
    it("deployer adds liquidity to the eth/canto pair and note/canto pair", async () => {
        // deployer adds 500 note / 1000 canto to the canto eth pool    
        await (await weth.approve(router.address, ethers.utils.parseUnits("1100", "18"))).wait()
        await (await note.approve(router.address, ethers.utils.parseUnits("500", "18"))).wait()
        await (await eth.approve(router.address, ethers.utils.parseUnits("10", "18"))).wait()
        // add liquidity to the note canto pool
        await (await router.addLiquidityCANTO(
            note.address, false,
            ethers.utils.parseUnits("500", "18"), // 500 note to pool
            0,0,
            dep.address, 9999999999,
            {value: ethers.utils.parseUnits("1000", "18")}
        )).wait()
        // add liquidity to the eth / canto pool (price of eth in canto is 10)
        await (await router.addLiquidityCANTO(
            eth.address, false,
            ethers.utils.parseUnits("10"),
            0,0, 
            dep.address, 9999999999,
            {value: ethers.utils.parseUnits("100", "18")}
        )).wait()
    })

    let cantoPrice: any
    let ethPrice: any

    it("deployer swaps in both pools 10 times so that a price for the assets may be determined", async () => {
        //set period size to be 0
        await (await factory.setPeriodSize(0)).wait()
        
        //deposit canto and approve weth for swaps
        await (await weth.deposit({value: ethers.utils.parseUnits("20", "18")})).wait()
        await (await weth.approve(router.address, ethers.utils.parseUnits("20", "18"))).wait()

        for (var i = 0; i < 9;++i) {
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"), 
                0, 
                weth.address, //token from
                eth.address, //token to
                false, 
                dep.address,
                9999999999999
            )).wait();
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"), 
                0, 
                weth.address, //token from
                note.address, //token to
                false, 
                dep.address,
                9999999999999
            )).wait();
        }
        cantoPrice = (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        ethPrice =  (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        console.log("cantoPrice: ", cantoPrice)
        console.log("ethPrice: ", ethPrice)
        await (await comptroller._setCollateralFactor(cCanto.address, ethers.utils.parseUnits("0.9", "18"))).wait()
    })

    it("user1 borrows eth against canto", async () => {
        // deployer supplies eth to the cEth lending market (approve transfer in eth first)
        await (await eth.approve(cEth.address, ethers.utils.parseUnits("1000", "18"))).wait()
        await (await cEth.mint(ethers.utils.parseUnits("1000", "18"))).wait()
        // user1 borrows eth against Canto  
        await (await comptroller.connect(user1).enterMarkets([cCanto.address])).wait()
        await (await cCanto.connect(user1).mint({value: ethers.utils.parseUnits("4600", "18")})).wait()
        let user1Bal = BigInt(4600) * cantoPrice * BigInt(9e17) / BigInt(1e18)
        let user1Spend = BigInt(400) * ethPrice
        let difference = user1Bal - user1Spend
        // now borrow 400 eth 
        await (await cEth.connect(user1).borrow(ethers.utils.parseUnits("400", "18"))).wait()
        let acctLiquidity = (await comptroller.getAccountLiquidity(user1.address))[1].toBigInt()
        expect((diff(difference, acctLiquidity)) < 1e3).to.be.true
    })
    it("deployer adds more liquidity to the canto / eth pool", async () => {
        // add liquidity to the eth / canto pool (price of eth in canto is 10)
        await (await eth.approve(router.address, ethers.utils.parseUnits("50", "18"))).wait()
        await (await weth.approve(router.address, ethers.utils.parseUnits("1000", "18"))).wait()
        await (await router.addLiquidityCANTO(
            eth.address, false,
            ethers.utils.parseUnits("50", "18"),
            0,0, 
            dep.address, 9999999999,
            {value: ethers.utils.parseUnits("1000", "18")}
        )).wait()
        await (await weth.deposit({value: ethers.utils.parseUnits("100", "18")})).wait()
        for (var i = 0; i < 9;++i) {
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("10", "18"), 
                0, 
                weth.address, //token from
                eth.address, //token to
                false, 
                dep.address,
                9999999999999
            )).wait();
        }
        ethPrice =  (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        let acctShortfall = (await comptroller.getAccountLiquidity(user1.address))[2].toBigInt()
        let user1Bal = BigInt(4600) * cantoPrice * BigInt(9e17) / BigInt(1e18)
        let user1Spend = BigInt(400) * ethPrice
        let difference = user1Spend - user1Bal
        expect(diff(acctShortfall, difference) < 1e3).to.be.true
    })
    it("user2 liquidates user1", async () => {
        // deployer sends user2 300 eth to liquidate user1
        await (await eth.transfer(user2.address, ethers.utils.parseUnits("300", "18"))).wait()
        await (await eth.connect(user2).approve(cEth.address, ethers.utils.parseUnits("300", "18"))).wait()
        // user2 now liquidates user1 for 250 eth
        await (await comptroller.connect(user2).enterMarkets([cCanto.address, cEth.address])).wait()
        await (await cEth.connect(user2).liquidateBorrow(user1.address, ethers.utils.parseUnits("200", "18"), cCanto.address)).wait()
        let numerator = ethers.utils.parseUnits("0.1", "18").toBigInt() * ethPrice / BigInt(1e18)
        let exchangeRate = (await cCanto.exchangeRateStored()).toBigInt()
        let denom = BigInt(cantoPrice) * BigInt(exchangeRate) / BigInt(1e18)
        let frac = numerator * BigInt(1e18) / denom
        let expected = ethers.utils.parseUnits("200", "18").toBigInt() * BigInt(frac) / BigInt(1e18)
        let expectedSeize = expected * BigInt(97.2e16) / BigInt(1e18)
        let cCantoBal = (await cCanto.balanceOf(user2.address)).toBigInt()
        expect(cCantoBal == expectedSeize).to.be.true
    })
});