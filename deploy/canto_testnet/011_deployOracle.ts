import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts} = hre;
    const {deploy, execute, read} = deployments;

    const {deployer} = await getNamedAccounts();

    const etherDep = await hre.ethers.getSigner(deployer);
    
    const Factory  = await deploy("BaseV1Factory",{
        from: deployer,
        log: true
    });

    let comptroller = new hre.ethers.Contract(
        (await deployments.get("Unitroller")).address,
        (await deployments.get("Comptroller")).abi,
        hre.ethers.provider.getSigner(deployer)
    );

    let note = await deployments.get("Note");
    let weth = await deployments.get("WETH");
    let noteRate = await ethers.getContract("NoteRateModel");

    const Router = await deploy("BaseV1Router01", {
        from: deployer,
        log: true,
        args: [(await deployments.get("BaseV1Factory")).address, weth.address, note.address, comptroller.address]
    });

    if(await comptroller.oracle() != Router.address) {
        await (await comptroller._setPriceOracle(Router.address)).wait();
    }

    if((await noteRate.oracle()).address != Router.address) {
        await (await noteRate.initialize((await deployments.get("CUsdcDelegator")).address, Router.address)).wait();
    }
};      

export default func;
func.tags = ["Oracle_Test", "Protocol"];
func.dependencies = ["Markets_Test", "GovernanceConfig_Test"];