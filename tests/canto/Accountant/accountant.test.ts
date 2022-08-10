import {expect} from "chai";
import { TransactionDescription } from "ethers/lib/utils";
import {ethers, deployments, getNamedAccounts} from "hardhat";
import { createNoSubstitutionTemplateLiteral, isConstTypeReference } from "typescript";

describe("Test that cNote market can be deprecated by setting the accountant to a non-existent address", async () => {
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
        await deployments.fixture("Protocol");
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
   
    describe("Check that the cNote's accountant can be set to the zero address", async () => {
        it("", async () => {
            
        });
    }); 
});