import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/dist/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts } = hre;
    const { deploy, execute, read } = deployments;

    const { deployer } = await getNamedAccounts();
    //deploy Accountant
    const Accountant = await deploy("AccountantDelegate", {
        from: deployer,
        log: true
    });

    //retrieve Comptroller Object
    const Comptroller = new ethers.Contract(
        (await deployments.get("Unitroller")).address,
        (await deployments.get("Comptroller")).abi,
        ethers.provider.getSigner(deployer)
    );
    //retrieve cNote Object
    const cNote = await deployments.get("CNoteDelegator"); //cNote Delegator address
    
    await (await Comptroller._supportMarket(cNote.address)).wait();

    // deploy Note, and set the accountant address
    const Note = await deployments.get("Note");
                
    // deploy TreasuryDelegator
    const Treasury = await deployments.get("TreasuryDelegator");
        
    const args = [
        Accountant.address,
        deployer,
        cNote.address,
        Note.address,
        Comptroller.address,
        Treasury.address
    ];
    //Accountant Delegator initialized, and linked to Accountant via AwccountantDelegator.delegatecall(Accountant.initialize()); 
    const AccountantDelegator = await deploy("AccountantDelegator", {
        from: deployer,
        log: true,
        args: args,
    });

    const cNoteDelegator = new hre.ethers.Contract(
        cNote.address,
        (await deployments.get("CNote")).abi,
        hre.ethers.provider.getSigner(deployer)
    );
    //set the Accountant Contract in CNote
    if (await cNoteDelegator.getAccountant() != AccountantDelegator.address) {
        await (await cNoteDelegator.setAccountantContract(AccountantDelegator.address)).wait();
    }
    //mint all of Note to the Accountant Contract, and migrate admin to the Accountant
    if (await read("Note", "accountant") != AccountantDelegator.address) {
        await execute("Note", 
            {from: deployer , log: true},
            "_setAccountantAddress",
            AccountantDelegator.address
        ); 
    }
};

export default func;
func.tags = ["Accountant_Test", "Protocol"];
func.dependencies= ["NoteConfig_Test", "Markets_Test","ComptrollerConfig_Test", "TreasuryConfig_Test"];