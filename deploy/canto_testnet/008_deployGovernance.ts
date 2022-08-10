import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";
import {canto} from "../../config/index.js";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts} = hre;
    const { deploy, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    //deploy Timelock with args from 
    const Timelock = await deploy("Timelock", {
        from: deployer, 
        log: true,
        args: [deployer, canto.timelockDelay] //currently 100 secs, changed in config files
    }); 

    // deploy governor bravo delegate
    const GovBravo = await deploy("GovernorBravoDelegate", {
        from: deployer, 
        log: true
    });

    //deploy and link delegators 

    const GovernorBravo = await deploy("GovernorBravoDelegator", {
        from: deployer, 
        log: true,
        args: [Timelock.address, deployer, GovBravo.address]
    }); 

    const governor = new hre.ethers.Contract(
        (await deployments.get("GovernorBravoDelegator")).address,
        (await deployments.get("GovernorBravoDelegate")).abi,
        ethers.provider.getSigner(deployer)
    )

    // set PendingAdmin in GovernorBravo as Timelock if not already set
    if (await read("GovernorBravoDelegator", "pendingAdmin") != Timelock.address) {
        await (await governor._setPendingAdmin(Timelock.address)).wait()
    }

    let timelock = new ethers.Contract(Timelock.address, Timelock.abi, ethers.provider.getSigner(deployer))

    let govAddr = governor.address.split("x", 2)

    let calldata = "0x000000000000000000000000" + govAddr[1]


    // set the admin of Timelock to be GovernorBravo 
    // if (await read("Timelock", "admin") != GovernorBravo.address) { 
    //     let eta = (await ethers.provider.getBlock((await ethers.provider.getBlockNumber()))).timestamp + 100
    //     console.log("Setting Timelock Admin")
    //     await (await timelock.queueTransaction(timelock.address, 0, "setPendingAdmin(address)", ethers.utils.hexlify(calldata), eta)).wait()
    //     await new Promise(f => setTimeout(f, 100 * 1000)); // wait 100 seconds
    //     await (await timelock.executeTransaction(Timelock.address, 0, "setPendingAdmin(address)", ethers.utils.hexlify(calldata), eta)).wait()
    // }
    // await (await governor._initiate()).wait()
};

export default func;
func.tags = ["GovernanceConfig_Test", "Protocol"];
