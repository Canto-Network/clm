import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types"; 

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts} = hre;
    const {deploy, execute, read} =  deployments;
    const {deployer} = await getNamedAccounts();

    const CompLens = await deploy("CompoundLens", {
        from: deployer,
        log: true
    });

};  

export default func;
func.tags = ["ComptrollerConfig_Test_2"];
func.dependencies = ["Comptroller_Test"];