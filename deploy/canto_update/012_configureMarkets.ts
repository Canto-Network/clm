import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {canto} from "../../config/index.js";

const CCANTO_ADDRESS = "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488"
const CETH_ADDRESS = "0x830b9849e7d79b92408a86a557e7baaacbec6030"

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts} = hre;
    const {deploy, execute, read} = deployments;

    const {deployer} = await getNamedAccounts();

    const etherDep = await hre.ethers.getSigner(deployer);

    // instantiate the Unitroller as a proxy contract
    let comptroller = new hre.ethers.Contract(
        (await deployments.get("Unitroller")).address,
        (await deployments.get("Comptroller")).abi,
        hre.ethers.provider.getSigner(deployer)
    );
    
    const markets = canto.markets
        
    await (await comptroller._setLiquidationIncentive(markets.CNote.liquidationIncentive)).wait() // set the liquidation incentive for this market
    await (await comptroller._setCloseFactor(markets.CNote.closeFactor)).wait() // set the close Factor
    
    // retrieve market parameters
    let cNote = await ethers.getContract("CNoteDelegator")
    let cAtom = await ethers.getContract("CAtomDelegator")
    let cUsdc = await ethers.getContract("CUsdcDelegator")
    let cUsdt = await ethers.getContract("CUsdtDelegator")
    
    //retreive addresses of cToken delegators that have not been redeployed
    let cCanto = await ethers.getContractAt("CEther", CCANTO_ADDRESS, etherDep)
    let cEth = await ethers.getContractAt("CErc20Delegator", CETH_ADDRESS, etherDep)
    
    let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
    let cCantoEth = await ethers.getContract("CCantoEthDelegator")
    let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
    let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")
    let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")

    //configure the cNote market
    await (await comptroller._supportMarket(cNote.address)).wait()
    await (await comptroller._setCollateralFactor(cNote.address, markets.CNote.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cNote.address], [markets.CNote.compSupplySpeed], [markets.CNote.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cNote.address], [markets.CNote.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CNote configured")
    
    // configure cCanto market
    await (await comptroller._supportMarket(cCanto.address)).wait()
    await (await comptroller._setCollateralFactor(cCanto.address, markets.CCanto.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCanto.address], [markets.CCanto.compSupplySpeed], [markets.CCanto.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCanto.address], [markets.CCanto.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCanto configured")

    // configure cAtom market
    await (await comptroller._supportMarket(cAtom.address)).wait()
    await (await comptroller._setCollateralFactor(cAtom.address, markets.CAtom.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cAtom.address], [markets.CAtom.compSupplySpeed], [markets.CAtom.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cAtom.address], [markets.CAtom.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CAtom configured")

    // configure cEth market
    await (await comptroller._supportMarket(cEth.address)).wait()
    await (await comptroller._setCollateralFactor(cEth.address, markets.CEth.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cEth.address], [markets.CEth.compSupplySpeed], [markets.CEth.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cEth.address], [markets.CEth.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CEth configured")

    // configure cUsdc market
    await (await comptroller._supportMarket(cUsdc.address)).wait()
    await (await comptroller._setCollateralFactor(cUsdc.address, markets.CUsdc.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cUsdc.address], [markets.CUsdc.compSupplySpeed], [markets.CUsdc.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cUsdc.address], [markets.CUsdc.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CUsdc configured")

    // configure cUsdt market
    await (await comptroller._supportMarket(cUsdt.address)).wait()
    await (await comptroller._setCollateralFactor(cUsdt.address, markets.CUsdt.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cUsdt.address], [markets.CUsdt.compSupplySpeed], [markets.CUsdt.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cUsdt.address], [markets.CUsdt.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CUsdt configured")    
    
    // configure cCantoNote market
    await (await comptroller._supportMarket(cCantoNote.address)).wait()
    await (await comptroller._setCollateralFactor(cCantoNote.address, markets.CCantoNote.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCantoNote.address], [markets.CCantoNote.compSupplySpeed], [markets.CCantoNote.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCantoNote.address], [markets.CCantoNote.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCantoNote configured")   
    
    // configure cCantoEth market
    await (await comptroller._supportMarket(cCantoEth.address)).wait()
    await (await comptroller._setCollateralFactor(cCantoEth.address, markets.CCantoEth.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCantoEth.address], [markets.CCantoEth.compSupplySpeed], [markets.CCantoEth.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCantoEth.address], [markets.CCantoEth.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCantoEth configured")   
    
    // configure cCantoAtom market
    await (await comptroller._supportMarket(cCantoAtom.address)).wait()
    await (await comptroller._setCollateralFactor(cCantoAtom.address, markets.CCantoAtom.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCantoAtom.address], [markets.CCantoAtom.compSupplySpeed], [markets.CCantoAtom.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCantoAtom.address], [markets.CCantoAtom.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCantoAtom configured")   
        
    // configure cNoteUsdc market
    await (await comptroller._supportMarket(cNoteUsdc.address)).wait()
    await (await comptroller._setCollateralFactor(cNoteUsdc.address, markets.CNoteUsdc.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cNoteUsdc.address], [markets.CNoteUsdc.compSupplySpeed], [markets.CNoteUsdc.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cNoteUsdc.address], [markets.CNoteUsdc.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CNoteUsdc configured")   
        
    // configure cNoteUsdt market
    await (await comptroller._supportMarket(cNoteUsdt.address)).wait()
    await (await comptroller._setCollateralFactor(cNoteUsdt.address, markets.CNoteUsdt.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cNoteUsdt.address], [markets.CNoteUsdt.compSupplySpeed], [markets.CNoteUsdt.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cNoteUsdt.address], [markets.CNoteUsdt.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CNoteUsdt configured")   
};          

export default func;
func.tags = ["ConfigureMarketsUpdate", "Update"];
func.dependencies = ["MarketsUpdate", "GovernanceConfigUpdate", "ConfigurePairsUpdate"];