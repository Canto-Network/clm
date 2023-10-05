const mainnetAddresses = {
  comptroller: "",
  router: "",
  cCanto: "",
  usdt: "",
  usdc: "",
  wcanto: "",
  note: "",
  rwaCTokens: [""],
};
const testnetAddresses = {
  comptroller: "0x9514c07bC6e80B652e4264E64f589C59065C231f",
  router: "0x463e7d4DF8fE5fb42D024cb57c77b76e6e74417a",
  cCanto: "0x477eaF5DECf6299EE937954084f0d53EFc57346F",
  usdt: "0x4fC30060226c45D8948718C95a78dFB237e88b40",
  usdc: "0xc51534568489f47949A828C8e3BF68463bdF3566",
  wcanto: "0x04a72466De69109889Db059Cb1A4460Ca0648d9D",
  note: "0x03F734Bd9847575fDbE9bEaDDf9C166F880B5E5f",
  rwaCTokens: ["0xf8892860437674690fC34746d0e93d881d5b96B4"],
};

module.exports = async function (taskArgs) {
  // get if we are on testnet or mainnet
  let ALL_ADDRESSES;
  if (hre.network.name === "canto_livenet") {
    ALL_ADDRESSES = mainnetAddresses;
  } else if (hre.network.name === "canto_testnet") {
    ALL_ADDRESSES = testnetAddresses;
  } else {
    throw new Error("Unknown network");
  }

  // deploy oracle
  const oracleFactory = await ethers.getContractFactory("CLMPriceOracle");
  const priceOracle = await (
    await oracleFactory.deploy(
      ALL_ADDRESSES.comptroller,
      ALL_ADDRESSES.router,
      ALL_ADDRESSES.cCanto,
      ALL_ADDRESSES.usdt,
      ALL_ADDRESSES.usdc,
      ALL_ADDRESSES.wcanto,
      ALL_ADDRESSES.note,
      ALL_ADDRESSES.rwaCTokens
    )
  ).deployed();
  console.log(
    `Deployed CLM Price Oracle: ${priceOracle.address} on ${hre.network.name}`
  );

  console.log(
    "Make sure the timelock updates this in the comptroller by calling _setPriceOracle(address)"
  );
};
