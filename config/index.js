const {ethers} = require("hardhat");
const models = require("./models");
const markets = require("./markets");
const canto = {
    models: models.canto,
    markets: markets.canto,
    migrateAdmin: true,
    timelockDelay: 60, // 1 minute delay for Timelock
    dripRate: "143777317700000000000",
    LiquidationIncentive: "1250000000000000000",
    CloseFactor: "1000000000000000000"
};

const hardhat = {
    models: models.canto,
    markets: markets.canto
};

module.exports = {
    canto,
    hardhat,
}