const mainnetAddresses = {
  underlyingRWA: "",
  comptroller: "",
  jumpRateModel: "",
  timelock: "",
  rwaPriceOracle: "",
  rwaWhitelist: "",
};
const testnetAddresses = {
  underlyingRWA: "0xd3D41C08a7e14129bF6Ec9A32697322C70af7E5a",
  comptroller: "0x9514c07bC6e80B652e4264E64f589C59065C231f",
  jumpRateModel: "0x05Dbf87ff3a8A9d54F0ceB62366D8060260bA6c4",
  timelock: "0x99CceBE505b519312379C782006423f00B2d4889",
  rwaPriceOracle: "0x35b96d80C72f873bACc44A1fACfb1f5fac064f1a",
  rwaWhitelist: "0x38D3A3f8717F4DB1CcB4Ad7D8C755919440848A3",
};
module.exports = async function (taskArgs) {
  // get if we are on testnet or mainnet
  let testnet;
  if (hre.network.name === "canto_livenet") {
    testnet = false;
  } else if (hre.network.name === "canto_testnet") {
    testnet = true;
  } else {
    throw new Error("Unknown network");
  }
  let signers = await ethers.getSigners();
  let owner = signers[0];

  let comptrollerAddress;
  let underlyingRWAAddress;
  let jumpRateModelAddress;
  let timelockAddress;
  let rwaPriceOracleAddress;
  let rwaWhitelistAddress;
  if (testnet) {
    // // deploy all test contracts and save their addresses

    // // deploy underlying RWA contract as ERC20
    // const rwaUnderlyingFactory = await ethers.getContractFactory("ERC20");
    // const rwaUnderlying = await (
    //   await rwaUnderlyingFactory.deploy(
    //     "RWA",
    //     "RWA",
    //     "1000000000000000000000000000000000",
    //     18
    //   )
    // ).deployed();
    // console.log(`Deployed RWA Underlying: ${rwaUnderlying.address} on testnet`);

    // // deploy test rwa oracle
    // const rwaPriceOracleFactory = await ethers.getContractFactory("TestRWAOracle");
    // const rwaPriceOracle = await (await rwaPriceOracleFactory.deploy()).deployed();
    // console.log(`Deployed RWA Price Oracle: ${rwaPriceOracle.address} on testnet`);

    // // deploy new whitelist for rwa
    // const rwaWhitelistFactory = await ethers.getContractFactory("TestWhitelist");
    // const rwaWhitelist = await (await rwaWhitelistFactory.deploy()).deployed();
    // console.log(`Deployed RWA Whitelist: ${rwaWhitelist.address} on testnet`);

    // save addresses
    underlyingRWAAddress = testnetAddresses.underlyingRWA;
    comptrollerAddress = testnetAddresses.comptroller;
    jumpRateModelAddress = testnetAddresses.jumpRateModel;
    timelockAddress = testnetAddresses.timelock;
    rwaPriceOracleAddress = testnetAddresses.rwaPriceOracle;
    rwaWhitelistAddress = testnetAddresses.rwaWhitelist;
  } else {
    underlyingRWAAddress = mainnetAddresses.underlyingRWA;
    comptrollerAddress = mainnetAddresses.comptroller;
    jumpRateModelAddress = mainnetAddresses.jumpRateModel;
    timelockAddress = mainnetAddresses.timelock;
    rwaPriceOracleAddress = mainnetAddresses.rwaPriceOracle;
    rwaWhitelistAddress = mainnetAddresses.rwaWhitelist;
  }
  // deploy cRWA Delegate Contract
  const cRWADelegateFactory = await ethers.getContractFactory("CRWAToken");
  const cRWADelegate = await (await cRWADelegateFactory.deploy()).deployed();
  console.log(`Deployed CRWA Delegate: ${cRWADelegate.address}`);

  // deploy cRWA Delegator Contract
  const cRWADelegatorFactory = await ethers.getContractFactory(
    "CErc20Delegator"
  );
  const cRWADelegator = await (
    await cRWADelegatorFactory.deploy(
      underlyingRWAAddress,
      comptrollerAddress,
      jumpRateModelAddress,
      ethers.utils.parseUnits("1", 18),
      "cRWA",
      "cRWA",
      6,
      owner.address,
      cRWADelegate.address,
      []
    )
  ).deployed();
  console.log(`Deployed CRWA Delegator: ${cRWADelegator.address}`);

  // set the price oracle in cToken
  console.log("Setting price oracle in cToken...");
  await (
    await cRWADelegateFactory
      .attach(cRWADelegator.address)
      .setPriceOracle(rwaPriceOracleAddress)
  ).wait();
  console.log("Price oracle set in cToken");

  // set the whitelist in cToken
  console.log("Setting whitelist in cToken...");
  await (
    await cRWADelegateFactory
      .attach(cRWADelegator.address)
      .setWhitelist(rwaWhitelistAddress)
  ).wait();
  console.log("Whitelist set in cToken");

  // handing over admin to timelock
  console.log("Handing over admin to timelock...");
  await (
    await cRWADelegateFactory
      .attach(cRWADelegator.address)
      ._setPendingAdmin(timelockAddress)
  ).wait();
  console.log(
    "Admin handed over to timelock once timelock calls _acceptAdmin()"
  );
};
