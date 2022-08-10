import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts } = hre;
    const { deploy, execute, read } = deployments;

    const { deployer } = await getNamedAccounts();


    //Deploy Note Contract, argument is 0, recall that type(uint256).max is minted to Accountant on initialization of Accountant
    const Note = await deploy("Note", {
        from:deployer,
        log: true
    });
};

export default func;
func.tags = ["NoteConfig_Test", "Protocol"];