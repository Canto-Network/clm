import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts} = hre;
    const {deploy, execute, read} = deployments;

    const {deployer} = await getNamedAccounts();

    const comptroller = await deploy("Unitroller", {
        from: deployer,
        log: true,
    });

    const unitroller = await deploy("Comptroller", {
        from: deployer,
        log: true,
    }); 
};
export default func;
func.tags = ["Comptroller_Test"];
