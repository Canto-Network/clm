import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    //import consts/functions from packages for use 
    const {ethers, deployments, getNamedAccounts } = hre;
    const { deploy, execute, read } = deployments;

    //get signers, both ethers type and hardhat-deploy type
    const { deployer } = await getNamedAccounts();
    let dep = await ethers.getSigners();


    let Note = await deployments.get("Note"); 
    //Deploy Treasury Delegate
    const TreasuryDelegate = await deploy("TreasuryDelegate", {
        from:deployer,
        log: true
    });

    //deploy Treasury Delegator, we currently pass deployer as the admin for this contract, but for future scrips, Timelock will be given, as the contract is controlled by governance
    const TreasuryDelegator = await deploy("TreasuryDelegator", {
        from: deployer,
        args: [Note.address, TreasuryDelegate.address, deployer],
        log:true
    });

    //Ensure that current implementation of The Treasury Delegate is accessible to the Treasury Delegator (Sanity Check)
    if(( await read("TreasuryDelegator", "implementation")) != TreasuryDelegate.address) {
        await execute("TreasuryDelegator", {from: deployer, log:true}, "_setImplementation", TreasuryDelegate.address);
    }
};
//notice, that Note is listed as a dependency for this deployment 
export default func;
func.tags = ["TreasuryConfig_Test", "Protocol"];
func.dependencies = ["NoteConfig_Test"];