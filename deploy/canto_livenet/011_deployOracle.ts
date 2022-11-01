import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

//addresses to be populated on deployment
const USDC_ADDRESS = "0x2A68C77Dd0b83b1D86A650b521900d797227C74E"
const USDT_ADDRESS = "0x65B1Def3502430070C61073857c82b93C54E444f"

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
    let cCanto = await ethers.getContract("CCanto")

    const Router = await deploy("BaseV1Router01", {
        from: deployer,
        log: true,
        args: [(await deployments.get("BaseV1Factory")).address, weth.address, note.address, comptroller.address]
    });

    const CLMOracle = await deploy("CLMPriceOracle", {
        from: deployer,
        log: true,
        args: [comptroller.address, Router.address, cCanto.address, USDT_ADDRESS, USDC_ADDRESS, weth.address, note.address]
    })

    if(await comptroller.oracle() != CLMOracle.address) {
        await (await comptroller._setPriceOracle(CLMOracle.address)).wait();
    }

    if((await noteRate.oracle()).address != CLMOracle.address) {
        await (await noteRate.initialize((await deployments.get("CUsdcDelegator")).address, CLMOracle.address)).wait();
    }

    
};      

export default func;
func.tags = ["Oracle", "Deployment"];
func.dependencies = ["Markets", "GovernanceConfig"];