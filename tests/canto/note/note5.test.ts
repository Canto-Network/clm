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
    it("User1 borrow 30 NOTE and check NOTE balance", async () => {
        const n30 = ethers.BigNumber.from("30000000000000000000");
        await (await cNote.connect(user1).borrow(n30)).wait()
        expect(await note.balanceOf(user1.address)).to.eql(ethers.BigNumber.from("30000000000000000000"));
    })
    it("Verify Accountant has 30 cNOTE after user borrows", async () => {
        expect(await cNote.balanceOf(accountant.address)).to.eql(ethers.BigNumber.from("30000000000000000000"));
    })
    it("User2 borrows 3,000,000 NOTE and check NOTE balance", async () => {
        accountantCNoteBalance = (await cNote.balanceOf(accountant.address)).toBigInt();
        const n100m = ethers.BigNumber.from("3000000000000000000000000");
        await (await cNote.connect(user2).borrow(n100m)).wait()
        expect(await note.balanceOf(user2.address)).to.eql(ethers.BigNumber.from("3000000000000000000000000"));    
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;

        const accountCNoteDifference = diff((await cNote.balanceOf(accountant.address)).toBigInt(), accountantCNoteBalance);

        const difference = diff(accountCNoteDifference, BigInt(3000000e18) * BigInt(1e18) / exchangeRate);
        expect(Number(difference)).to.be.lessThan(Number(BigInt(1e10)));
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
    it("Check total supply (deployer + user1 cNOTE balance)", async () => {
        expect(
            (await cNote.totalSupply()).toBigInt()).to.equal(
            (await cNote.balanceOf(user1.address)).toBigInt() + (await cNote.balanceOf(accountant.address)).toBigInt());
    })
    it("User1 supplies 30 NOTE", async () => {
        await note.connect(user1).approve(cNote.address, ethers.BigNumber.from("30000000000000000000"));
        let usr1BalPrior = (await cNote.balanceOf(user1.address)).toBigInt()
        await (await cNote.connect(user1).mint(ethers.BigNumber.from("20000000000000000000"))).wait();
        const currentBorrows = (await cNote.callStatic.totalBorrowsCurrent()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;
        expect(exchangeRate).to.be.equal((await cNote.exchangeRateStored()).toBigInt()); //compare with internal exchangeRate
        // check that user1 received exchangeRate * NOTE amount of cNOTE
        let usr1BalCur = (await cNote.balanceOf(user1.address)).toBigInt()
        let diff = usr1BalCur - usr1BalPrior
        expect(BigInt(diff)).eql(BigInt(20e18) * BigInt(1e18) / exchangeRate);
    })
    it("User2 supplies 3000000 NOTE", async () => {
        await note.connect(user2).approve(cNote.address, ethers.utils.parseUnits("300000000", "18"));
        await (await cNote.connect(user2).mint(ethers.utils.parseUnits("3000000", "18"))).wait();
        const currentBorrows = (await cNote.callStatic.totalBorrows()).toBigInt();
        const totalSupply = (await cNote.totalSupply()).toBigInt();
        const exchangeRate = currentBorrows * BigInt(1e18) / totalSupply;
        expect(exchangeRate).to.be.equal((await cNote.exchangeRateStored()).toBigInt()); //compare with internal exchangeRate
        // check that user1 received exchangeRate * NOTE amount of cNOTE
        let difference = diff((await cNote.balanceOf(user2.address)).toBigInt(), (BigInt(3000000e18) * BigInt(1e18) / exchangeRate));
        expect(difference < 1e9);
    })
});