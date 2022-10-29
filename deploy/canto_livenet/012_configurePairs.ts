import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {canto} from "../../config/index.js";

// mainnet addresses
// const USDC_ADDRESS = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"
// const ETH_ADDRESS = "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265"
// const ATOM_ADDRESS = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687"
// const USDT_ADDRESS = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75"

const USDC_ADDRESS = "0xa705e051853677c96dB05D88eac334603E56CF40"
const ETH_ADDRESS = "0xD4d227a4D16cf2b24C164312eAAD39557A435D04"
const ATOM_ADDRESS = "0xAA0f1885280140936280e925A48088CEAac55d54"
const USDT_ADDRESS = "0x47D405aFee7c8B6e7594E825f559f9c3779Dfc4b"

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
    //retrieve router and factory
    let router = await deployments.get("BaseV1Router01")    
    let weth = await ethers.getContract("WETH")
    let note = await ethers.getContract("Note")
    let jumpRate = await deployments.get("JumpRateModel")


    // create note canto (weth) pair 
    await execute(`BaseV1Factory`, {from: deployer, log: true}, `createPair`, note.address, weth.address, false)
    // create note usdc pair
    await execute(`BaseV1Factory`, {from: deployer, log: true}, `createPair`, note.address, USDC_ADDRESS, true)
    // create note usdt pair
    await execute(`BaseV1Factory`, {from: deployer, log: true}, `createPair`, note.address, USDT_ADDRESS, true)
    // create canto atom pair
    await execute(`BaseV1Factory`, {from: deployer, log: true}, `createPair`, weth.address, ATOM_ADDRESS, false)
    // create canto eth pair
    await execute(`BaseV1Factory`, {from: deployer, log: true}, `createPair`, weth.address, ETH_ADDRESS, false)

    //identify pair addresses
    let noteCantoAddr = await read(`BaseV1Factory`, `getPair`, note.address, weth.address, false)
    let noteUSDCAddr = await read(`BaseV1Factory`, `getPair`, note.address, USDC_ADDRESS, true)
    let noteUSDTAddr = await read(`BaseV1Factory`, `getPair`, note.address, USDT_ADDRESS, true)
    let cantoETHAddr = await read(`BaseV1Factory`, `getPair`, weth.address, ETH_ADDRESS, false)
    let cantoAtomAddr = await read(`BaseV1Factory`, `getPair`, weth.address, ATOM_ADDRESS, false)
    
    console.log("note/canto pair address: ", noteCantoAddr)
    console.log("note/usdt pair address: ", noteUSDCAddr)
    console.log("note/usdc pair address: ", noteUSDTAddr)
    console.log("canto/eth pair address: ", cantoETHAddr)
    console.log("canto/atom pair address: ", cantoAtomAddr)


    //set the stable pairs
    await execute(`BaseV1Router01`, {from: deployer, log: true}, `setStable`, USDT_ADDRESS)
    await execute(`BaseV1Router01`, {from: deployer, log: true}, `setStable`, USDC_ADDRESS)


    // deploy delegates for pairs
    const cCantoNote = await deploy("CCantoNote", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cNoteUsdc = await deploy("CNoteUsdc", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cNoteUsdt = await deploy("CNoteUsdt", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cCantoEth = await deploy("CCantoEth", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cCantoAtom = await deploy("CCantoAtom", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    //retrieve markets configuration for canto CLM, set admin to deployer for now (should be Timelock)
    const CNoteCantoArgs = [
        noteCantoAddr, //underlying
        comptroller.address, //ComptrollerInterface
        jumpRate.address, //interestRateModel
        markets.CCantoNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
        markets.CCantoNote.name,
        markets.CCantoNote.symbol,
        markets.CCantoNote.decimals,
        deployer, //admin
        cCantoNote.address, //implementation
        markets.CCantoNote.becomeImplementation, //data for _becomeImplementationdata
    ];

    //deploy CErc20Delegator and ensure that they are linked
    const CCantoNoteDelegator = await deploy("CCantoNoteDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true,
        args: CNoteCantoArgs
    });

    //sanity check that the markets have been linked
    if(await read("CCantoNoteDelegator", "implementation") != cCantoNote.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CCantoNoteDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CCantoNote")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }
   
    const CNoteUsdcArgs = [
        noteUSDCAddr, //underlying
        comptroller.address, //ComptrollerInterface
        jumpRate.address, //interestRateModel
        markets.CNoteUsdc.initialExchangeRateMantissa, //initialExchangeRateMantissa
        markets.CNoteUsdc.name,
        markets.CNoteUsdc.symbol,
        markets.CNoteUsdc.decimals,
        deployer, //admin
        cNoteUsdc.address, //implementation
        markets.CNoteUsdc.becomeImplementation, //data for _becomeImplementationdata
    ];

    //deploy CErc20Delegator and ensure that they are linked
    const CNoteUsdcDelegator = await deploy("CNoteUsdcDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true,
        args: CNoteUsdcArgs
    });

    //sanity check that the markets have been linked
    if(await read("CNoteUsdcDelegator", "implementation") != cNoteUsdc.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CNoteUsdcDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CNoteUsdc")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }
    const CNoteUsdtArgs = [
        noteUSDTAddr, //underlying
        comptroller.address, //ComptrollerInterface
        jumpRate.address, //interestRateModel
        markets.CNoteUsdt.initialExchangeRateMantissa, //initialExchangeRateMantissa
        markets.CNoteUsdt.name,
        markets.CNoteUsdt.symbol,
        markets.CNoteUsdt.decimals,
        deployer, //admin
        cNoteUsdt.address, //implementation
        markets.CNoteUsdt.becomeImplementation, //data for _becomeImplementationdata
    ];

    //deploy CErc20Delegator and ensure that they are linked
    const CNoteUsdtDelegator = await deploy("CNoteUsdtDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true,
        args: CNoteUsdtArgs
    });

    //sanity check that the markets have been linked
    if(await read("CNoteUsdtDelegator", "implementation") != cNoteUsdt.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CNoteUsdtDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CNoteUsdt")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }

    const CCantoAtomArgs = [
        cantoAtomAddr, //underlying
        comptroller.address, //ComptrollerInterface
        jumpRate.address, //interestRateModel
        markets.CCantoAtom.initialExchangeRateMantissa, //initialExchangeRateMantissa
        markets.CCantoAtom.name,
        markets.CCantoAtom.symbol,
        markets.CCantoAtom.decimals,
        deployer, //admin
        cCantoAtom.address, //implementation
        markets.CCantoAtom.becomeImplementation, //data for _becomeImplementationdata
    ];

    //deploy CErc20Delegator and ensure that they are linked
    const CCantoAtomDelegator = await deploy("CCantoAtomDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true,
        args: CCantoAtomArgs
    });

    //sanity check that the markets have been linked
    if(await read("CCantoAtomDelegator", "implementation") != cCantoAtom.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CCantoAtomDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CCantoAtom")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }
    const CCantoEthArgs = [
        cantoETHAddr, //underlying
        comptroller.address, //ComptrollerInterface
        jumpRate.address, //interestRateModel
        markets.CCantoEth.initialExchangeRateMantissa, //initialExchangeRateMantissa
        markets.CCantoEth.name,
        markets.CCantoEth.symbol,
        markets.CCantoEth.decimals,
        deployer, //admin
        cCantoEth.address, //implementation
        markets.CCantoEth.becomeImplementation, //data for _becomeImplementationdata
    ];

    //deploy CErc20Delegator and ensure that they are linked
    const CCantoEthDelegator = await deploy("CCantoEthDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true,
        args: CCantoEthArgs
    });

    //sanity check that the markets have been linked
    if(await read("CCantoEthDelegator", "implementation") != cCantoEth.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CCantoEthDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("CCantoEth")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }
};          

export default func;
func.tags = ["ConfigurePairs", "Deployment"];
func.dependencies = ["Markets", "Oracle"];