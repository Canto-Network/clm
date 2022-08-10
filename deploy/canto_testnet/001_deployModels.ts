import { HardhatRuntimeEnvironment  } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {canto} from "../../config/index.js";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {ethers, deployments, getNamedAccounts } = hre;
    const { deploy, execute, read } = deployments;

    const { deployer } = await getNamedAccounts();

    const models = canto.models;
    
    for(let i =0; i < models.length; i++) {
        const key = Object.keys(models[i])[0];
        const model = models[i][key];
        //deploy the Note Interest Rate Model
        if (key === "NoteModel") {
            const args = [
                model.baseRatePerYear
            ]
            const NoteModel = await deploy("NoteRateModel", {
                from: deployer,
                log: true,
                args: args
            }); 

            //set adjusterCoefficient
            await execute("NoteRateModel", {from:deployer, log:true}, "_setAdjusterCoefficient", model.adjusterCoefficient);

        }
        //deploy Jump Rate Model, with admin as deployer
        if (key === "JumpModel") {
            const args = [
                model.baseRatePerYear,
                model.multiplierPerYear,
                model.jumpMultiplierPerYear,
                model.kink_,
            ]

            const JumpModel = await deploy("JumpRateModel", {
                from: deployer,
                log: true,
                args: args
            });
        }
    }

    
};

export default func;
func.tags = ["Models_Test", "Protocol"];