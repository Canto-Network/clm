import {expect} from 'chai';
import {ethers, deployments, getNamedAccounts} from 'hardhat';


describe("Delegate Calls to Accountant/Treasury", function() {
    let Comptroller: any;
    let Unitroller: any;
    let PriceOracle: any;
    let deployer: any;  
    let comptroller: any;
    let unitroller: any;
    let dep: any; 
    let Comp: any;
    before(async() => {
        dep  = await getNamedAccounts();
    });
    
    describe("Test Call Delegation with Unitroller", async function() { 
        deployer = await ethers.provider.getSigner(dep);
        //obtain refs to deployment fixtures: Comptroller and Unitroller, instantiate ethers signer for deployer 
        before(async function()  {
            //dep = await ethers.provider.getSigner(deployer);
            await deployments.fixture("Comptroller");
            Comptroller = await ethers.getContract("Comptroller");
            Unitroller = await ethers.getContract("Unitroller");
            await Unitroller.deployed();
            await Comptroller.deployed();
        });

        //Set implementation and perform a sanity check that the reference/modification are correct(possible)
        it("Check that Comptroller and set admin for Unitroller", async function()  {
            const tx1 = await Unitroller._setPendingImplementation(Comptroller.address)
            await tx1.wait();
            const tx2 = await Comptroller._become(Unitroller.address);
            await tx2.wait();
            expect(await Unitroller.comptrollerImplementation()).to.equal(Comptroller.address);
        }); 

        //accept pendingImpl in Unitroller, then instantiate ethers.COntract at Unitroller's address with Comptroller interfaces, check that calling convention is same 
        it("Accept admin in Unitroller, and merge interfaces", async function() {
            Comptroller = await ethers.getContractAt("Comptroller", Unitroller.address, deployer);
            expect(await Comptroller.getWETHAddress()).to.not.equal("0xc00e94Cb662C3520282E6f5717214004A7f26888");
        });
    });

    describe("Test call delegation with Comptroller and Unitroller", function()  {
        let dep: any;
        let CompNonProxy: any;
         //get Updated Unitroller, instantiate a Comptroller Interface at Unitroller's address
        before(async function(){
            //dep = await ethers.provider.getSigner(deployer);
            await deployments.fixture("ComptrollerConfig");
            let unit = await ethers.getContract("Unitroller"); 
            //instantiate Compotroller interface at Unitroller's address
            Comp = await ethers.getContractAt("Comptroller", unit.address, deployer);
            PriceOracle = await ethers.getContract("SimplePriceOracle");
        });
        //sanity check that deployments fixtures are executing as they should
        it("Check ", async function() { 
            expect(await Comp.getWETHAddress()).to.not.equal("0xc00e94Cb662C3520282E6f5717214004A7f26888");
            //check that Price Oracle has been sourced in comptrolle
            expect(await Comp.comptrollerImplementation()).to.equal((await deployments.get("Comptroller")).address);
            //check that price oracle is set correctly
            expect((await Comp.oracle())).to.equal(PriceOracle.address);
        });
    });
    describe("Test call delegation with Treasury", async function () {
        let Treasury: any;
        let deployer: any = await ethers.provider.getSigner(dep);
        let Note: any;
        //instantiate Treasury/Treasury delegator
        before(async function() {
            await deployments.fixture("TreasuryConfig");
            Treasury = await ethers.getContract("TreasuryDelegator");
        }); 
        //ensure that Treasury has deployed and has been linked to the requisite implementation
        it("Ensure that the Treasury Delegator has been initialized correctly", async function(){
            expect(await Treasury.implementation()).to.equal((await deployments.get("TreasuryDelegate")).address);
            expect(await Treasury.note()).to.equal((await deployments.get("Note")).address); 
            expect((await Treasury.queryCantoBalance()).eq(0)).to.be.true; 
            expect((await Treasury.queryNoteBalance()).eq(0)).to.be.true; 
        }); 
    });

    describe("Test call delegation with Lending Market", async function(){
        let CNote: any;
        let Comptroller: any;
        //bring CNote Delegator into scope
        before(async function(){
            await deployments.fixture("Markets");
            CNote = await ethers.getContract("CErc20Delegator");
            Comptroller = await ethers.getContract("Comptroller");
        });

        it("Ensure that CNote and its Delegator have been initialized correctly", async function() {
            expect(await CNote.implementation()).to.equal((await deployments.get("CNote")).address);
            expect((await CNote.balanceOf(Comptroller.address)).eq(0)).to.be.true;
        });

    });

    describe("Test call delegation with Accountant", async function() {
        let AccountantDelegate: any;
        let AccountantDelegator: any;
        let Note: any;
        let Comptroller: any;
        let cNote: any;
        let cCanto: any;
        let depl: any;
        let PriceOracle: any;
        let CNote: any;
        let Treasury: any;
        let cNoteBal: any;
        let totalAmt: any;
        let borrowAmt: any;
        //bring Accountant Contract into scope
        before(async function() {
            await deployments.fixture("Accountant");
            AccountantDelegator = await ethers.getContract("AccountantDelegator");
            AccountantDelegate = await ethers.getContract("AccountantDelegate");
            Note = await ethers.getContract("Note");
            let Unitroller = await ethers.getContract("Unitroller");
            Comptroller = await ethers.getContractAt("Comptroller", Unitroller.address);
            cNote = await ethers.getContract("CErc20Delegator");
            CNote = await ethers.getContractAt("CNote", cNote.address, deployer);
            cCanto = await ethers.getContract("CEther");
            Treasury = await ethers.getContract("TreasuryDelegator");
        });
        //check that AccountantDelegate and Delegator have been initialized correctly
        it("Accountant has been initialized correctly ", async function() {
            expect(await AccountantDelegator.implementation()).to.equal(AccountantDelegate.address);
            expect((await Note.balanceOf(AccountantDelegator.address)).eq(await Note.totalSupply())).to.be.true;
            expect((await Note.balanceOf(AccountantDelegate.address)).eq(0)).to.be.true;
            //Ensure that the market has been entered
            expect((await Comptroller.getAllMarkets()).find(m => 
                m == cNote.address
            )).to.equal(cNote.address);
            expect((await Comptroller.getAssetsIn(AccountantDelegator.address)).find(m => 
                m == cNote.address
            )).to.equal(cNote.address);

            expect(await CNote.getAccountant()).to.equal(AccountantDelegator.address);
        });

        it ("mint 1 canto into CEther contract and obtain Account Liquidity", async function() {
            [depl]  = await ethers.getSigners();
            //set amounts to mint and borrow
            totalAmt = ethers.utils.parseUnits("1", "18");
            borrowAmt = ethers.utils.parseUnits("5", "17");
            expect(await Comptroller.checkMembership(AccountantDelegator.address, cNote.address)).to.be.true;
            
            //support cCanto Market in comptroller, and have deployer enter into this market
            await (await Comptroller._supportMarket(cCanto.address)).wait();
            expect((await Comptroller.getAllMarkets()).find(m =>
                m == cCanto.address
            )).to.equal(cCanto.address);
            await (await Comptroller.enterMarkets([cCanto.address])).wait();

            expect((await Comptroller.getAssetsIn(depl.address)).find(m =>
                m == cCanto.address    
            )).to.equal(cCanto.address );
            //there is currently no Canto (Eth) in this lending Market, so the exchangeRate == initialExchangeRateMantissa
            expect((await cCanto.exchangeRateStored()).eq("1000000000000000000")).to.be.true;
            //cCanto Market is now entered, we can enter this market via the CEther mint function, we mint 1000/exp_Rate cCanto tokens
            await (await cCanto.mint({value: totalAmt})).wait();
            let bal = await cCanto.balanceOf(depl.address);
            expect(bal.toBigInt() == totalAmt).to.be.true;

        }); 

        it ("Calculate Account Liquidity, and borrow AccountLiquidity from cNote LendingMarket", async () => {
            //then set the Underlying Price for the cToken in the Comptroller.PriceOracle
            expect(await Comptroller.oracle()).to.equal((await deployments.get("SimplePriceOracle")).address);
            PriceOracle = await ethers.getContract("SimplePriceOracle");
            await (await PriceOracle.setUnderlyingPrice(cCanto.address, ethers.BigNumber.from("1000000000000000000"))).wait();
            await (await PriceOracle.setUnderlyingPrice(CNote.address, ethers.BigNumber.from("1000000000000000000"))).wait();
            //first set Collateral Factor for cCanto Lending Market
            await (await Comptroller._setCollateralFactor(cCanto.address, ethers.BigNumber.from("500000000000000000"))).wait();
            expect((await Comptroller.getAccountLiquidity(depl.address))[1].toBigInt() == borrowAmt).to.be.true;
        });

        it ("Borrows from cNote Lending Market", async () => {
            await (await Comptroller.enterMarkets([CNote.address]));
            expect((await Comptroller.getAssetsIn(depl.address)).find(m =>
                m == CNote.address
            )).to.equal(CNote.address);
            
            expect((await CNote.balanceOf(AccountantDelegator.address)).toBigInt() == 0).to.be.true;
            await (await CNote.borrow(borrowAmt)).wait();
            //initialExchangeRate is 1
            expect((await CNote.balanceOf(AccountantDelegator.address)).toBigInt() == borrowAmt).to.be.true;
            
            let deplNote = await Note.balanceOf(depl.address);
            expect(deplNote.toBigInt() == borrowAmt).to.be.true;            
            let totalSup = (await Note.totalSupply()).toBigInt();
            let AcctSup = (await Note.balanceOf(AccountantDelegator.address)).toBigInt(); 
            expect((totalSup - AcctSup) == borrowAmt).to.be.true;
        });
        
        //repay the borrow and ensure that the Accountant still has positive net liqudity
        it ("Repay the borrow", async () => {
            await (await Note.approve(CNote.address, borrowAmt));
            let cNoteBal = (await CNote.balanceOf(AccountantDelegator.address)).toBigInt();
            await (await CNote.repayBorrow(borrowAmt)).wait();
            let cnoteAmt = (await CNote.balanceOf(AccountantDelegator.address)).toBigInt();
            //amout of cNote redeemed by accountant, will be less than the initial amount received in return for collateralizing loan
            expect((cNoteBal - cnoteAmt) < borrowAmt).to.be.true; 
        });

        it ("Sweeps the interest to the Treasury", async () => {
            await (await AccountantDelegator.sweepInterest()).wait();
            let AcctBal = (await Note.balanceOf(AccountantDelegator.address)).toBigInt();
            let NoteSup = (await Note.totalSupply()).toBigInt();
            let TreasBal = (await Note.balanceOf(Treasury.address)).toBigInt(); 
            expect((NoteSup - AcctBal) == TreasBal).to.be.true;
        });
    });
}); 