import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";
import {min, sqrt, avg, diff, percentDiff} from "./utils"

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

describe("Testing LpToken Price Accuracy after large vol moves in Canto/Note pair", async () => {
    let dep: any;
    let user1: any;
    let user2: any;
    let pair: any;

    let accountantCNoteBalance: any;
    before(async() => {
        // retrieve contracts from the deployment
        dep  = await getNamedAccounts();
        [dep, user1, user2] = await ethers.getSigners();
        await deployments.fixture(["Protocol"]);
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
    // need to measure influence of large movements in liquidity on the pricing of lpTokens
    it("deployer sends 10000 canto to user1 and user2", async () => {
        // support and collateralize markets in comptroller
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(dep.address)).toBigInt())
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(user2.address)).toBigInt())
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(user1.address)).toBigInt())
        await (await comptroller._supportMarket(cUsdc.address)).wait()
        // set collateral factors for cCanto 
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait()
    })
    it("deployer borrows note against Usdc", async () => {
        // borrow note against usdc 
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait()
        await (await usdc.approve(cUsdc.address, ethers.utils.parseUnits("1000"))).wait()
        // supply usdc
        await (await cUsdc.mint(ethers.utils.parseUnits("100000000", "6"))).wait()
        // borrow note
        await (await cNote.borrow(ethers.utils.parseUnits("9000000", "18"))).wait()
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("9000000", "18").toBigInt()).to.be.true
    })
    // deployer now provides li
});