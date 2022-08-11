import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";
import { diff } from "./Utils";

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

describe("Testing CNote exchange rate with market swamp and repays", async () => {
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
    });
    it("Check that users have 0 note to begin", async () => {
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("0", "18")).to.be.true
        expect((await note.balanceOf(user1.address)).toBigInt() == ethers.utils.parseUnits("0", "18")).to.be.true
        expect((await note.balanceOf(user2.address)).toBigInt() == ethers.utils.parseUnits("0", "18")).to.be.true
    })
    it ("Send 10,000,000 USDC to user1 and user2 and verify", async () => {
        await usdc.transfer(user1.address, ethers.BigNumber.from("20000000000000"));
        await usdc.connect(user1).transfer(user2.address, ethers.BigNumber.from("10000000000000"));
        expect(await usdc.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("10000000000000"));
        expect(await usdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("10000000000000"));
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

        // supply 10,000,000 USDC as user1
        await comptroller.connect(user1).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user1).approve(cUsdc.address, ethers.BigNumber.from("10000000000000"));
        await cUsdc.connect(user1).mint(ethers.BigNumber.from("10000000000000"));
        expect(await cUsdc.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("10000000000000"));

        // supply 10,000,000 USDC as user2
        await comptroller.connect(user2).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user2).approve(cUsdc.address, ethers.BigNumber.from("10000000000000"));
        await cUsdc.connect(user2).mint(ethers.BigNumber.from("10000000000000"));
        expect(await cUsdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("10000000000000"));
    })
    it("User1 borrow 1 NOTE and check NOTE balance", async () => {
        const n1 = ethers.BigNumber.from("1000000000000000000");
        await (await cNote.connect(user1).borrow(n1)).wait()
        expect(await note.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("1000000000000000000"));
    })
    it("Verify Accountant has 1 cNOTE after user borrows", async () => {
        expect(await cNote.balanceOf(accountant.address)).to.eql(ethers.BigNumber.from("1000000000000000000"));
        accountantCNoteBalance = (await cNote.balanceOf(accountant.address)).toBigInt();
    })
    it("User2 borrows 20 NOTE and check NOTE balance", async () => {
        const n20 = ethers.BigNumber.from("20000000000000000000");
        await cNote.connect(user2).borrow(n20);
        expect((await note.balanceOf(user2.address)).toBigInt()).to.equal(n20.toBigInt());
    })
    it("Verify Accountant has correct amount of cNOTE after user2 borrows", async () => {
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;
        const accountCNoteDifference = diff((await cNote.balanceOf(accountant.address)).toBigInt(), accountantCNoteBalance);
        const difference = diff(accountCNoteDifference, BigInt(20e18) * BigInt(1e18) / exchangeRate);
        expect(Number(difference)).to.be.lessThan(Number(BigInt(1e2)));
        expect(accountCNoteDifference).to.equal(BigInt(20e18) * BigInt(1e18) / exchangeRate);
    })
    it("Deployer borrows 200,000,000 NOTE and check NOTE balance", async () => {
        accountantCNoteBalance = (await cNote.balanceOf(accountant.address)).toBigInt();
        const n100m = ethers.BigNumber.from("200000000000000000000000000");
        await (await cNote.connect(dep).borrow(n100m)).wait()
        expect(await note.balanceOf(dep.address)).to.eql(ethers.BigNumber.from("200000000000000000000000000"));    
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;

        const accountCNoteDifference = diff((await cNote.balanceOf(accountant.address)).toBigInt(), accountantCNoteBalance);

        const difference = diff(accountCNoteDifference, BigInt(200000000e18) * BigInt(1e18) / exchangeRate);
        expect(Number(difference)).to.be.lessThan(Number(BigInt(1e10)));
    })
});