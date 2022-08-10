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

describe("Testing CNote exchange rate with borrows", async () => {
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
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait();

        // supply 400,000,000 USDC as deployer
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait();
        await (await usdc.approve(cUsdc.address, mintBal));
        await (await cUsdc.mint(mintBal)).wait();
        expect(await cUsdc.balanceOf(dep.address)).to.eql(ethers.BigNumber.from("400000000000000"));

        // supply 10,000,000 USDC as user1
        await comptroller.connect(user1).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user1).approve(cUsdc.address, ethers.BigNumber.from("5000000000000"));
        await cUsdc.connect(user1).mint(ethers.BigNumber.from("5000000000000"));
        expect(await cUsdc.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("5000000000000"));

        // supply 10,000,000 USDC as user2
        await comptroller.connect(user2).enterMarkets([cUsdc.address, cNote.address]);
        await usdc.connect(user2).approve(cUsdc.address, ethers.BigNumber.from("5000000000000"));
        await cUsdc.connect(user2).mint(ethers.BigNumber.from("5000000000000"));
        expect(await cUsdc.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("5000000000000"));
    })
    it("User1 borrow 30 NOTE and check NOTE balance", async () => {
        const n30 = ethers.BigNumber.from("30000000000000000000");
        await (await cNote.connect(user1).borrow(n30)).wait()
        expect(await note.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("30000000000000000000"));
    })
    it("Verify Accountant has 30 cNOTE after user borrows", async () => {
        expect(await cNote.balanceOf(accountant.address)).to.eql(ethers.BigNumber.from("30000000000000000000"));
    })
    it("After user1 supplies 10 NOTE, check that user1 cNOTE balance is equal to 10 / exchangeRate", async () => {
        await note.connect(user1).approve(cNote.address, ethers.BigNumber.from("30000000000000000000"));
        await (await cNote.connect(user1).mint(ethers.BigNumber.from("10000000000000000000"))).wait();
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;
        expect(exchangeRate).to.be.equal((await cNote.exchangeRateStored()).toBigInt()); //compare with internal exchangeRate
        // check that user1 received exchangeRate * NOTE amount of cNOTE
        expect((await cNote.balanceOf(user1.address)).toBigInt()).to.equal(BigInt(10e18) * BigInt(1e18) / exchangeRate);
    })
    it("Check that total supply (deployer + user1 cNOTE balance) is 30", async () => {
        expect(
            (await cNote.totalSupply()).toBigInt()).to.equal(
            (await cNote.balanceOf(user1.address)).toBigInt() + (await cNote.balanceOf(accountant.address)).toBigInt());
        expect((await cNote.totalSupply()).toBigInt()).to.equal(BigInt(30e18));
    })
    it("After deployer borrows 195k NOTE, check deployer NOTE balance", async () => {        
        const n195k = ethers.BigNumber.from("195000000000000000000000");
        accountantCNoteBalance = (await cNote.balanceOf(accountant.address)).toBigInt();
        await (await cNote.connect(dep).borrow(n195k)).wait();
        expect((await note.balanceOf(dep.address)).toBigInt()).to.equal(n195k.toBigInt());
    })
    it("Check accountant cNOTE is correct according to the exchange rate", async () => {
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;
        const difference = diff(
            BigInt(
                (await cNote.balanceOf(accountant.address)).toBigInt() - accountantCNoteBalance), 
                BigInt(195000e18)*BigInt(1e18) / exchangeRate);
        expect(exchangeRate).to.be.equal((await cNote.exchangeRateStored()).toBigInt()); //compare with internal exchangeRate
        expect(Number(difference)).to.be.lessThan(Number(BigInt(3e6)));
        // expect(await cNote.totalSupply()).to.eql(ethers.BigNumber.from("195030000000000000000000"));
    })
    it("Check that user1 redeems cNOTE for correct NOTE amount", async () => {
        const oldNoteBalance = (await note.balanceOf(user1.address)).toBigInt();
        const oldCNoteBalance = (await cNote.balanceOf(user1.address)).toBigInt();
        await cNote.connect(user1).redeem(oldCNoteBalance);
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;
        const newNoteBalance = (await note.balanceOf(user1.address)).toBigInt();
        const noteDifference = diff(oldNoteBalance, newNoteBalance);
        expect(exchangeRate).to.be.equal((await cNote.exchangeRateStored()).toBigInt());
        expect(noteDifference).to.be.equal((oldCNoteBalance * exchangeRate) / BigInt(1e18));
    })
});