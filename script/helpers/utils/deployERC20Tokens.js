const { parseUnits } = require("ethers/lib/utils");
const {ethers, deployments} = require("hardhat");

async function deployERC20(name, symbol, initialSupply, decimals) {
    const ERC20TokenFactory = await ethers.getContractFactory("ERC20");
    const ERC20Contract = await ERC20TokenFactory.deploy(name, symbol, initialSupply, decimals);
    await ERC20Contract.deployed();
    console.log(name + ": " + ERC20Contract.address);
}
async function main() {
    await deployERC20("USDC", "USDC", parseUnits("1000000000000", 6), 6);
    await deployERC20("USDT", "USDT", parseUnits("1000000000000", 6), 6);
    await deployERC20("ATOM", "ATOM", parseUnits("1000000000000", 6), 6);
    await deployERC20("ETH", "ETH", parseUnits("1000000000000", 18), 18);
}
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});