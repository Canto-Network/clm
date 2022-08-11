import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";
// import { diff,  } from "../Note/Utils";

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
        await usdc.transfer(user1.address, ethers.BigNumber.from("10000000000000"));
        await usdc.connect(user1).transfer(user2.address, ethers.BigNumber.from("5000000000000"));
        expect(await usdc.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("5000000000000"));
        expect(await usdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("5000000000000"));
    })
    it("Supply and collateralize USDC", async () => {
        let mintBal = ethers.utils.parseUnits("400000000", "6");
        
        // support markets for cNOTE and cUSDC and sets collateral factors
        await (await comptroller._supportMarket(cNote.address)).wait();
        await (await comptroller._supportMarket(cUsdc.address)).wait();
        await (await comptroller._setCollateralFactor(cNote.address, ethers.utils.parseUnits("0.9", "18"))).wait();
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.8", "18"))).wait();
        await (await comptroller._setCloseFactor(ethers.utils.parseUnits("0.5", "18"))).wait()
        await (await comptroller._setLiquidationIncentive(ethers.utils.parseUnits("0.1", "18"))).wait()


        // supply 400,000,000 USDC as deployer
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait();
        await (await usdc.approve(cUsdc.address, mintBal));
        await (await cUsdc.mint(mintBal)).wait();
        expect(await cUsdc.balanceOf(dep.address)).to.eql(ethers.BigNumber.from("400000000000000"));

        // supply 5,000,000 USDC as user1
        await comptroller.connect(user1).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user1).approve(cUsdc.address, ethers.BigNumber.from("5000000000000"));
        // supply 1000 usdc, acct liquidity is 800
        await cUsdc.connect(user1).mint(ethers.utils.parseUnits("1000", "6"));
        expect(await cUsdc.balanceOf(user1.address)).to.eql(ethers.utils.parseUnits("1000", "6"));

        // supply 5,000,000 USDC as user2
        await comptroller.connect(user2).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user2).approve(cUsdc.address, ethers.BigNumber.from("5000000000000"));
        await cUsdc.connect(user2).mint(ethers.BigNumber.from("5000000000000"));
        expect(await cUsdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("5000000000000"));
    })
    it("user1 borrows 800 note against 1000 usdc", async () => {
        // user1 has borrowed 800 note against 1000 usdc, their acccount liquidity is now 0
        await (await cNote.connect(user1).borrow(ethers.utils.parseUnits("800", "18"))).wait()
        expect((await comptroller.getAccountLiquidity(user1.address))[1].toBigInt() == BigInt(0)).to.be.true
    })
    it("Change Collateral factor of USDC to 0.5, user1 is in shortfall and user2 liquidates them", async () => {
        // change collateral factor
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.5", "18"))).wait()
        // check that user1 is underwater
        console.log("shortfall: ", ((await comptroller.getAccountLiquidity(user1.address))[2].toBigInt()))
        expect((await comptroller.getAccountLiquidity(user1.address))[2].toBigInt() == ethers.utils.parseUnits("300", "18")).to.be.true
       // user2 borrows 1000 note to accomodate the repay borrow    
        await (await cNote.connect(user2).borrow(ethers.utils.parseUnits("1000", "18"))).wait()
        // liquidate user1's note borrow and seize usdc as collateral
        let priorCollateral = (await cUsdc.balanceOf(user2.address)).toBigInt()
        await (await note.connect(user2).approve(cNote.address, ethers.utils.parseUnits("30000", "18"))).wait()
        await (await cNote.connect(user2).liquidateBorrow(user1.address, ethers.utils.parseUnits("150", "18"), cUsdc.address)).wait()
        let finalCollateral = (await cUsdc.balanceOf(user2.address)).toBigInt()
        let amtReceived = finalCollateral - priorCollateral
        let exchangeRate = (await cUsdc.callStatic.exchangeRateCurrent()).toBigInt()
        console.log("exchangeRate: ", exchangeRate)
        let seizeAmt = ethers.utils.parseUnits("15", "6").toBigInt() * BigInt(97.2e16) / BigInt(1e18)
        expect(BigInt(amtReceived) == seizeAmt).to.be.true
    })  
});