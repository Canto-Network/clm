import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { canto } from "../../config/index.js";


const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    //import consts/functions from packages for use 
    const {ethers, deployments, getNamedAccounts } = hre;
    const { deploy, execute, read } = deployments;

    //get signers, both ethers type and hardhat-deploy type
    const { deployer } = await getNamedAccounts();
    let dep = await ethers.getSigners();

    const markets = canto.markets;

    const Comptroller = new ethers.Contract( 
        (await deployments.get("Unitroller")).address,
         (await deployments.get("Comptroller")).abi,
         hre.ethers.provider.getSigner(deployer)   
    );

    let WETH = await deploy("WETH", {
        from: deployer,
        log: true,
        args: ["Weth", "WETH"]
    });

    
    //set WETH address in Comptroller if not already set
    if ((await Comptroller.getWETHAddress()) != WETH.address) {
        await (await Comptroller.setWETHAddress(WETH.address)).wait();
    }

    let Reservoir = await deploy("Reservoir", {
        from: deployer,
        log: true,
        args: [canto.dripRate, WETH.address, Comptroller.address]
    });



};
//notice, that Note is listed as a dependency for this deployment 
export default func;
func.tags = ["TreasuryConfig_Test", "Protocol"];
func.dependencies = ["NoteConfig_Test", "Comptroller_Test"];