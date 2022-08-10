import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";
import {canto} from "../../config/index.js";

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
    

    //TESTING
    const USDC = await deploy("USDC", {
        contract: "ERC20",
        from: deployer,
        log: true,
        args: ["USDC", "USDC", ethers.utils.parseUnits("1000000000", 6), 6]
    });

    const USDT = await deploy("USDT", {
        contract: "ERC20",
        from: deployer,
        log: true,
        args: ["USDT", "USDT", ethers.utils.parseUnits("1000000000", 6), 6]
    });

    const ATOM = await deploy("ATOM", {
        contract: "ERC20",
        from: deployer,
        log: true,
        args: ["ATOM", "ATOM", ethers.utils.parseUnits("1000000000", 8), 8]
    });

    const ETH = await deploy("ETH", {
        contract: "ERC20",
        from: deployer,
        log: true,
        args: ["ETH", "ETH", ethers.utils.parseUnits("10000000", 18), 18]
    });


    const usdcAddr = USDC.address;
    const usdtAddr = USDT.address;
    const atomaddr = ATOM.address;
    const ethAddr = ETH.address;

    const PriceOracle = await Comptroller.oracle();

    //Note Interest Rate Model
    const NoteModel = await deployments.get("NoteRateModel");  
    const JumpRate = await deployments.get("JumpRateModel");
    //deploy current implementation of cNote Market
    const cNote = await deploy("CNote", {
        from: deployer,
        log: true
    });

    const cUsdc = await deploy("CUsdc", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cUsdt = await deploy("CUsdt", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cATOM = await deploy("CATOM", {
        contract: "CErc20Delegate",
        from: deployer, 
        log: true,
    })

    const cETH = await deploy("CETH", {
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
        markets.CNote.name,
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
        markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cUsdc",
        "cUSDC",
        markets.CNote.decimals,
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
        markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cUsdt",
        "cUSDT",
        markets.CNote.decimals,
        deployer, //admin
        cUsdt.address, //implementation
        markets.CNote.becomeImplementation, //data for _becomeImplementationdata
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
        markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cAtom",
        "cATOM",
        markets.CNote.decimals,
        deployer, //admin
        cATOM.address, //implementation
        markets.CNote.becomeImplementation, //data for _becomeImplementationdata
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


    //Deploy ETHDelegator
    const CETHArgs = [
        ETH.address, //underlying
        Comptroller.address, //ComptrollerInterface
        JumpRate.address, //interestRateModel
        markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
        "cETH",
        "cETH",
        markets.CNote.decimals,
        deployer, //admin
        cETH.address, //implementation
        markets.CNote.becomeImplementation, //data for _becomeImplementationdata
    ];

    const CETHDelegator = await deploy("CETHDelegator", {
        contract: "CErc20Delegator",
        from: deployer,
        log: true, 
        args: CETHArgs
    });
    //sanity check that the markets have been linked
    if(await read("CETHDelegator", "implementation") != cETH.address){
        //most likely, this conditional will not have been met, however to ensure integrity set the impl
        await execute("CETHDelegator", 
            {from: deployer, log: true},
            "_setImplementation", 
            (await deployments.get("cETH")).address,
            false, //do not allow resignation
            [] //become implementation is currently unused
        );
    }

    //deploy CEther, A market for Canto
    const CantoArgs = [
        Comptroller.address,
        JumpRate.address,
        markets.CCanto.initialExchangeRateMantissa,
        markets.CCanto.name,
        markets.CCanto.symbol,
        markets.CCanto.decimals,
        deployer,
    ];

    const CCanto = await deploy("CCanto", {
        contract: "CEther",
        from: deployer,
        log: true,
        args: CantoArgs
    });

    //check that markets have been supported in Comptroller before migrating governance

};  

export default func;
func.tags = ["Markets_Test", "Protocol"];
func.dependencies = ["NoteConfig_Test", "ComptrollerConfig_Test", "Models_Test"];
