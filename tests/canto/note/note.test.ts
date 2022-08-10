import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";

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

describe("Test with token of different decimals", async () => {
    let dep: any;
    before(async() => {
            dep  = await getNamedAccounts();
            [dep] = await ethers.getSigners();
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
    });    
    it("Borrow Note using USDC As Collateral", async () => {
        let mintBal = ethers.utils.parseUnits("400000000", "6")
        // user supplies USDC to borrow Note
        await (await comptroller._supportMarket(cNote.address)).wait()
        await (await comptroller._supportMarket(cUsdc.address)).wait()
        await (await comptroller._setCollateralFactor(cNote.address, ethers.utils.parseUnits("0.9", "18"))).wait()
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait()
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait()
        await (await usdc.approve(cUsdc.address, mintBal))
        await (await cUsdc.mint(mintBal)).wait()
        
        await (await cNote.borrow(ethers.utils.parseUnits("3000", "18"))).wait()
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("3000", "18")).to.be.true
    });
    it("supply note to the cNote lending Market", async () => {
        await (await note.approve(cNote.address, ethers.utils.parseUnits("100000000", "18"))).wait()
        expect((await cNote.balanceOf(accountant.address)).toBigInt() == ethers.utils.parseUnits("3000", "18")).to.be.true
        // mint a small amount to verify that the exchange rate has changed
        await (await cNote.mint(ethers.utils.parseUnits("1", "18"))).wait()
        //exchange rate will be monotonically increasing until someone repays their borrow
        console.log("borrow Balance Currently: ", (await cNote.totalBorrows()).toBigInt())
        console.log("totalSupply before: ", (await cNote.totalSupply()).toBigInt())
        console.log("exchange Rate: ", (await cNote.exchangeRateStored()).toBigInt())
        console.log("totalSupply after: ", (await cNote.totalSupply()).toBigInt())
        console.log("cNote balance of deployer: ", (await cNote.balanceOf(dep.address)).toBigInt())
        await (await cNote.borrow(ethers.utils.parseUnits("3000000", "18"))).wait()
        console.log("exchange Rate: ", (await cNote.exchangeRateStored()).toBigInt())
        console.log("totalSupply: ", (await cNote.totalSupply()).toBigInt())
        console.log("totalBorrows: ", (await cNote.totalBorrows()).toBigInt())
        console.log("cToken balance of Accountant: ", (await cNote.balanceOf(accountant.address)).toBigInt())
        console.log("note borrow rate: ", (await noteRate.getBorrowRate(0,0,0)).toBigInt())
        // mine 16 blocks and now check the exchangeRate
        await ethers.provider.send('hardhat_mine', ["0x10"])
        console.log("exchange rate current: ", (await cNote.callStatic.exchangeRateCurrent()).toBigInt())

    })  
});