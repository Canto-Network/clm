import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";
import {canto} from "../../config/index.js";

//addresses to be populated on deployment
const USDC_ADDRESS = "0x80b5a32e4f032b2a058b4f29ec95eefeeb87adcd"
const ATOM_ADDRESS = "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265"
const USDT_ADDRESS = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75"

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts } = hre;
    const { deploy, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    const markets = canto.markets;

    //retrieve deployments and link it to the cNote Lending Market
    const Note = await deployments.get("Note");
    //instance of unitroller with comptroller abi
    const Comptroller = new hre.ethers.Contract(
         (await deployments.get("Unitroller")).address,
         (await deployments.get("Comptroller")).abi,
         hre.ethers.provider.getSigner(deployer)
    );  
    

    // On Re-deployment only USDC / ATOM / USDT will be deployed
    let USDC = await ethers.getContractAt("ERC20", USDC_ADDRESS, deployer)
    let ATOM = await ethers.getContractAt("ERC20", ATOM_ADDRESS, deployer)
    let USDT = await ethers.getContractAt("ERC20", USDT_ADDRESS, deployer)

    const usdcAddr = USDC.address;
    const atomaddr = ATOM.address;
    const usdtAddr = USDT.address;

    console.log("LIVENET DEPLOYMENTS")

    //Note Interest Rate Model
    const NoteModel = await deployments.get("NoteRateModel");  
    const JumpRate = await deployments.get("JumpRateModel");

    //deploy current implementation of cNote Market
    const cNote = await deploy("CNote", {
        from: deployer,
        log: true
    });

    // redeploy the CUSDC market
    const cUsdc = await deploy("CUsdc", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    // redeploy the CATOM market
    const cATOM = await deploy("CATOM", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    // redeploy the CUSDT  market
    const cUsdt = await deploy("CUsdt", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    //retrieve markets configuration for canto CLM, set admin to deployer for now (should be Timelock)
    const CNoteArgs = [
        Note.address, //underlying
        Comptroller.address, //ComptrollerInterface
        NoteModel.address, //interestRateModel
        markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cNote", 
        markets.CNote.symbol,
        markets.CNote.decimals,
        deployer, //admin
        cNote.address, //implementation
        markets.CNote.becomeImplementation, //data for _becomeImplementationdata
    ];

    //deploy CErc20Delegator and ensure that they are linked
    const CNoteDelegator = await deploy("CNoteDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true,
        args: CNoteArgs
    });

    //sanity check that the markets have been linked
    if(await read("CNoteDelegator", "implementation") != cNote.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CNoteDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CNote")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }

    //Deploy USDCDelegator
    const CUsdcArgs = [
        USDC.address, //underlying
        Comptroller.address, //ComptrollerInterface
        JumpRate.address, //interestRateModel
        markets.CUsdc.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cUsdc",
        "cUSDC",
        markets.CUsdc.decimals,
        deployer, //admin
        cUsdc.address, //implementation
        markets.CNote.becomeImplementation, //data for _becomeImplementationdata
    ];

    const CUsdcDelegator = await deploy("CUsdcDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true, 
        args: CUsdcArgs
    });
    //sanity check that the markets have been linked
    if(await read("CUsdcDelegator", "implementation") != cUsdc.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CUsdcDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CUsdc")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }

    //Deploy USDT Delegator
    const CUsdtArgs = [
        USDT.address, //underlying
        Comptroller.address, //ComptrollerInterface
        JumpRate.address, //interestRateModel
        markets.CUsdt.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cUsdt",
        "cUSDT",
        markets.CUsdt.decimals,
        deployer, //admin
        cUsdt.address, //implementation
        markets.CUsdt.becomeImplementation, //data for _becomeImplementationdata
    ];

    const CUsdtDelegator = await deploy("CUsdtDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true, 
        args: CUsdtArgs
    });
    //sanity check that the markets have been linked
    if(await read("CUsdtDelegator", "implementation") != cUsdt.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CUsdtDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CUsdt")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }

    
     //Deploy ATOMDelegator
     const CATOMArgs = [
        ATOM.address, //underlying
        Comptroller.address, //ComptrollerInterface
        JumpRate.address, //interestRateModel
        markets.CAtom.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cAtom",
        "cATOM",
        markets.CAtom.decimals,
        deployer, //admin
        cATOM.address, //implementation
        markets.CAtom.becomeImplementation, //data for _becomeImplementationdata
    ];

    const CAtomDelegator = await deploy("CAtomDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true, 
        args: CATOMArgs
    });
    //sanity check that the markets have been linked
    if(await read("CAtomDelegator", "implementation") != cATOM.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CAtomDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("cATOM")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }

    //check that markets have been supported in Comptroller before migrating governance

};  

export default func;
func.tags = ["MarketsUpdate", "Update"];
func.dependencies = ["NoteConfigUpdate", "ComptrollerConfigUpdate", "ModelsUpdate"];
