import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts} = hre;
    const {deploy, execute, read} = deployments;

    const {deployer} = await getNamedAccounts();

    const etherDep = await hre.ethers.getSigner(deployer);
    
    //set Pending impl of Comptroller in Unitroller 
    if ((await read("Unitroller", "comptrollerImplementation")) != (await deployments.get("Comptroller")).address)
    {
        console.log("setting Comptroller implementation");
        await execute("Unitroller",  {from:deployer, log: true}, "_setPendingImplementation", (await deployments.get("Comptroller")).address);
        await execute("Comptroller", {from: deployer, log:true},  "_become", (await deployments.get("Unitroller")).address)
    }

    // //set Price Oracle
    // const PriceOracle = await deploy("SimplePriceOracle", {
    //     from: deployer,
    //     log: true,
    // }); 

    //Create Instance of Unitroller, at the global instance of unitroller's address, with tbe Comptroller's ABI
    const comptroller = new hre.ethers.Contract(
        (await deployments.get("Unitroller")).address,
        (await deployments.get("Comptroller")).abi,
        hre.ethers.provider.getSigner(deployer)
    );
};      

export default func;
func.tags = ["ComptrollerConfig", "Deployment"];
func.dependencies = ["Comptroller"];