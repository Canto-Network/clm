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

    //set Price Oracle
    const PriceOracle = await deploy("SimplePriceOracle", {
        from: deployer,
        log: true,
    }); 

    // const SolidlyOracle = "0x2c2cA11eA37E14CEdeF4266fF1E8A7e21d78Cc62";

    //Create Instance of Unitroller, at the global instance of unitroller's address, with tbe Comptroller's ABI
    const comptroller = new hre.ethers.Contract(
        (await deployments.get("Unitroller")).address,
        (await deployments.get("Comptroller")).abi,
        hre.ethers.provider.getSigner(deployer)
    );

    
    //if Price Oracle is not set, set it
    // if (await comptroller.oracle() != PriceOracle.address) {
    //     let tx = await comptroller._setPriceOracle(PriceOracle.address);
};      

export default func;
func.tags = ["ComptrollerConfig_Test"];
func.dependencies = ["Comptroller_Test"];