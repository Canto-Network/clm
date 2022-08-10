import {expect} from "chai";
import { TransactionDescription } from "ethers/lib/utils";
import {ethers, deployments, getNamedAccounts} from "hardhat";
import { createNoSubstitutionTemplateLiteral, isConstTypeReference } from "typescript";

describe("Stable coin mechanism tests", async () => {
    let dep: any;
    let Comptroller: any;
    let CNote: any;
    let Accountant: any;
    let CCanto: any;
    let PriceOracle: any;
    let AccountantDelegate: any;
    let Treasury: any;
    let namedAccounts: any;
    let depMint: bigint;
    let Note: any;
    let CNote_: any;
    let NoteRateModel: any;

    before("Setup" , async () => { 
        [dep] = await ethers.getSigners(); 
        namedAccounts = await getNamedAccounts();
        await deployments.fixture("Accountant");
        let unitroller = await ethers.getContract("Unitroller"); 
        Comptroller = new ethers.Contract(
            (await deployments.get("Unitroller")).address,
            (await deployments.get("Comptroller")).abi,
            ethers.provider.getSigner(namedAccounts.deployer)
        );
        Note = await ethers.getContract("Note");
        CNote = new ethers.Contract(
            (await deployments.get("CErc20Delegator")).address,
            (await deployments.get("CNote")).abi, 
            dep
            );
        NoteRateModel = await deployments.get("NoteRateModel");
        CNote_ = await ethers.getContract("CErc20Delegator");
        CCanto = await ethers.getContract("CEther");
        PriceOracle = await ethers.getContract("SimplePriceOracle");
        Accountant = await ethers.getContract("AccountantDelegator"); 
        Treasury = await ethers.getContract("TreasuryDelegator");
        AccountantDelegate = await ethers.getContract("AccountantDelegate");
        depMint = ethers.utils.parseUnits("1000", "18").toBigInt(); //1000 Canto
    
    });
   
    describe("Sweeping Interest Mechanism design", async () => {
        it("Check admin is correctly intitialized in AccountantDelegate and TreasuryDelegate", async () => {
            expect(await AccountantDelegate.admin()).to.not.equal(Accountant.address);
            //sanity check to ensure that the admin indeed remains unitialized throughout execution for delegates
            console.log("Accountant address: ", (await CNote._accountant()));
            console.log("Underlying Address: ", (await CNote.underlying()));
            console.log("Underlying Address: ", (await CNote_.underlying()));
            console.log("Note address: ", Note.address);
            console.log("NoteRateModel: ", NoteRateModel.address);
            console.log("InterestRateModel: ", await CNote.interestRateModel());
        });

        it("Perform Setup and General Checks", async () => {
            expect(await Comptroller.checkMembership(Accountant.address, CNote.address)).to.be.true;
            //support cCanto Market
            await (await Comptroller._supportMarket(CCanto.address)).wait();
            await (await Comptroller.enterMarkets([CCanto.address])).wait(); 
            //set pricing constants
            await (await PriceOracle.setUnderlyingPrice(CCanto.address, ethers.BigNumber.from("1000000000000000000"))).wait();
            await (await PriceOracle.setUnderlyingPrice(CNote.address, ethers.BigNumber.from("1000000000000000000"))).wait();
            await (await Comptroller._setCollateralFactor(CCanto.address, ethers.BigNumber.from("500000000000000000"))).wait();
            //sanity check
            expect((await Comptroller.getAccountLiquidity(dep.address))[1].eq(0)).to.be.true;
            //mint 10000 cCanto from cCanto lending market, no need to approve ETH transfers
            await (await CCanto.mint({value: depMint})).wait();
            expect((await CCanto.balanceOf(dep.address)).toBigInt() == depMint).to.be.true;
            let accLiquidity = ethers.utils.parseUnits("500", "18");
            expect((await Comptroller.getAccountLiquidity(dep.address))[1].toBigInt() == accLiquidity).to.be.true;
        }); 

        let transferAmt;

        it("deployer borrows Note, sends to user1", async () => {
            let borrowAmt = ethers.utils.parseUnits("500", "18");
            expect((await Note.balanceOf(dep.address)).toBigInt() == 0).to.be.true;
            let AcctBef = (await Note.balanceOf(Accountant.address)).toBigInt();
            await (await CNote.borrow(borrowAmt)).wait();
            let AcctAfter = (await Note.balanceOf(Accountant.address)).toBigInt();
            // Accountant Balance has decreased from borrow,  but cNote balance is greater
            expect(BigInt(AcctBef - AcctAfter) == borrowAmt.toBigInt()).to.be.true;
            expect((await CNote.balanceOf(Accountant.address)).toBigInt() == borrowAmt).to.be.true;
            //borrow Account Liquidity of Note from cNote Lending Market
            expect((await Comptroller.getAccountLiquidity(dep.address))[1].toBigInt() == 0).to.be.true;
            //shortfall is zero
            expect((await Comptroller.getAccountLiquidity(dep.address))[2].toBigInt() == 0).to.be.true;
            //deployer has borrowed borrowAmy Note
            expect((await Note.balanceOf(dep.address)).toBigInt() == borrowAmt).to.be.true;
            //send borrowed Note to user1
            transferAmt = ethers.utils.parseUnits("300", "18");
            await (await Note.transfer(namedAccounts.user1, transferAmt)).wait();
            expect((await Note.balanceOf(namedAccounts.user1)).toBigInt() == transferAmt).to.be.true;
        });

        let user1Signer;

        it("user1 mints cTokens, ", async () =>  {
            user1Signer = await ethers.provider.getSigner(namedAccounts.user1)
            await (await Note.connect(user1Signer).approve(CNote.address, transferAmt)).wait();
            //mint transferAmt cNote
            let AcctcNoteBef = (await CNote.balanceOf(Accountant.address)).toBigInt();
            let AcctBef = (await Note.balanceOf(Accountant.address)).toBigInt();
            console.log((await CNote.exchangeRateStored()).toBigInt());
            await (await CNote.connect(user1Signer).mint(transferAmt)).wait();
            let AcctAfter = (await Note.balanceOf(Accountant.address)).toBigInt();
            let AcctcNoteAfter = (await CNote.balanceOf(Accountant.address)).toBigInt();
            //Amount minted has gone into the balance of the Accountant
            expect((AcctAfter - AcctBef) == transferAmt.toBigInt()).to.be.true;
            expect(AcctcNoteBef > AcctcNoteAfter).to.be.true;
        });

        it("user1 redeems the cTokens it minted", async () => {
            console.log((await CNote.totalBorrows()).toBigInt());
            let CNoteBal = (await CNote.balanceOf(user1Signer._address)).toBigInt();
            let AcctBalBef = (await Note.balanceOf(Accountant.address)).toBigInt();
            await (await CNote.connect(user1Signer).redeem(CNoteBal)).wait();
            expect((await Note.balanceOf(user1Signer._address)).toBigInt() > transferAmt.toBigInt()).to.be.true;
            let AcctBalAfter = (await Note.balanceOf(Accountant.address)).toBigInt();
            expect((AcctBalBef - AcctBalAfter) > transferAmt.toBigInt()).to.be.true;
        });

        it("Sweeps interest to the Accountant", async () => {
            let noteSupply = (await Note.totalSupply()).toBigInt();
            let fac = (ethers.utils.parseUnits("1", "18")).toBigInt();
            let exRate1 = (await CNote.callStatic.exchangeRateCurrent()).toBigInt(); 
            let NoteBal1 = (await Note.balanceOf(Accountant.address )).toBigInt();
            let cNoteBal1 = (await CNote.balanceOf(Accountant.address)).toBigInt();
            cNoteBal1 = cNoteBal1 * exRate1;
            let scaledcNote1 = BigInt(cNoteBal1)/BigInt(fac);
            let curBal1 = NoteBal1 + scaledcNote1;
            expect(curBal1 >= noteSupply).to.be.true;
            await (await Accountant.sweepInterest()).wait();
            let NoteBal2 = (await Note.balanceOf(Accountant.address)).toBigInt();
            let CNoteBal2 = (await CNote.balanceOf(Accountant.address)).toBigInt();
            let exRate2 = (await CNote.callStatic.exchangeRateCurrent()).toBigInt();
            let cNoteBal2 = (exRate2 * CNoteBal2);
            let scaledcNote2 = BigInt(cNoteBal2)/BigInt(fac);
            let curBal2 = NoteBal2 + scaledcNote2;
            expect(curBal2 <= noteSupply).to.be.true;
            expect((await CNote.balanceOf(Treasury.address)).toBigInt() == 0);
            expect((NoteBal1 - NoteBal2) == (await Note.balanceOf(Treasury.address)).toBigInt());
        });

        it("Check Account liquidities for deployer and user1", async () => {
            let user1Liq  = (await Comptroller.getAccountLiquidity(user1Signer._address))[1].toBigInt();
            let deployerLiq  = (await Comptroller.getAccountLiquidity(dep.address))[1].toBigInt();

            expect(deployerLiq == 0).to.be.true;
            expect(user1Liq == 0).to.be.true;
        }); 

        it("Change the Collateral Factor of cCanto, check that deployer is in shortfall", async () => {
            //set liquidation incentive in Comptroller 
            await (await Comptroller._setLiquidationIncentive(ethers.BigNumber.from("1250000000000000000"))).wait();
            await (await Comptroller._setCloseFactor("1000000000000000000"));
            //reduce collateralFactor to take account into shortfall
            await (await Comptroller._setCollateralFactor(CCanto.address, "250000000000000000"));
            let shortfall = (await Comptroller.getAccountLiquidity(dep.address))[2].toBigInt();
            //dep's account is in shortfall, user1 will liquidate it
            console.log(shortfall);
            expect(shortfall > 0).to.be.true;
            //approve CNote to carry out repayBorrow on dep's behalf
            await (await Note.connect(user1Signer).approve(CNote.address, shortfall)).wait();
            await (await CNote.connect(user1Signer).liquidateBorrow(dep.address, shortfall, CCanto.address)).wait();
            let shortfallAfter = (await Comptroller.getAccountLiquidity(dep.address))[2].toBigInt(); 
            console.log(shortfallAfter);
            expect(shortfallAfter < shortfall).to.be.true;
        });
    }); 
});