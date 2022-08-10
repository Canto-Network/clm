const { ethers } = require("hardhat");

const NoteModel = {
    baseRatePerYear: "20000000000000000",
    adjusterCoefficient: "250000000000000000",
};  

const JumpModel = {
    baseRatePerYear:"0",
    multiplierPerYear:"1000000000000000000",
    jumpMultiplierPerYear:"4000000000000000000",
    kink_: "700000000000000000"
};

module.exports = {
   "canto" : [{NoteModel}, {JumpModel}],
};