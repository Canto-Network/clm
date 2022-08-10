const {ethers} = require("hardhat");
const { address, etherMantissa } = require('../../tests/Utils/Ethereum');
const {canto} = require("../../config/index");

async function main() { 
    const [dep] = await ethers.getSigners();
    const half = etherMantissa(0.5);
    const eighty = etherMantissa(0.8);
    
    const cantoNote = "0x652b28aa30EAD510B1609B358ce3BDF832BA4951"
    const ethCanto =  "0x5D16Dc43E0070d3298dEE8f82961af197E61a71B"
    const noteUSDC =  "0x2Fa268AF4517F34Fb747a042A4F97f1E47e52feA"
    const noteUSDT =  "0x0823cB8AADB5b430Cc2A8B834F3EE7710533EE14"
    const cantoAtom =  "0x3f0AC85d5C1cEe99E3146A01f1da88B62004F1fC"
    const CUsdc= "0xA21c7AD1b9F0d78Aa8DBB33bB5b42B507eDfe103"
    const CUsdt= "0x9FFaCb2E15c5aBe67FA3A5E5750d00b2C5979E42"
    const CNote= "0x21e53398bE9f76B0FF9367d8c03AEa00d7bf22e2"
    const CATOM= "0x533679D8ceFBa88669882B8A92bf0c7f4286b438"
    const CETH= "0x8Da7C68e20f0173074ad52AcCfF981DA248aa4b4"
    const CCanto= "0x2dBA152f6Bd3822F088BA190AA0Bdc183682dE11"
 
    const Comp =  "0xAE8A689c851373f3E8C560A051635150dCA57293"
    const Model = "0x91Fb963826236DC93c36aDC7BCB8EE6bB5A0ACAa"

    const markets = canto.markets;


    const Comptroller = await ethers.getContractAt("Comptroller", Comp, dep);
    const CErc20Factory = await ethers.getContractFactory("CErc20Delegate");


    const cLPTokenFactory = await CErc20Factory.deploy();
    await cLPTokenFactory.deployed();



    await (await Comptroller._supportMarket(CCanto)).wait();
    console.log("set collateral factor")
    await(await Comptroller._setCollateralFactor(CCanto, "0")).wait();

    await (await Comptroller._supportMarket(CETH)).wait();
    console.log("set collateral factor")
    await(await Comptroller._setCollateralFactor(CETH, half.toString())).wait();

    await (await Comptroller._supportMarket(CNote)).wait();
    console.log("set collateral factor")
    await(await Comptroller._setCollateralFactor(CNote, "0")).wait();

    await (await Comptroller._supportMarket(CATOM)).wait();
    console.log("set collateral factor")
    await(await Comptroller._setCollateralFactor(CATOM, half.toString())).wait();

    await (await Comptroller._supportMarket(CUsdc)).wait();
    console.log("set collateral factor")
    await(await Comptroller._setCollateralFactor(CUsdc, eighty.toString())).wait();
    console.log("set comp speeds")
    await (await Comptroller._setCompSpeeds([CUsdc], [ethers.utils.parseUnits("0.4493041178", "18")], [0])).wait()

    await (await Comptroller._supportMarket(CUsdt)).wait();
    console.log("set collateral factor")
    await(await Comptroller._setCollateralFactor(CUsdt, eighty.toString())).wait();
    console.log("set comp speeds")
    await (await Comptroller._setCompSpeeds([CUsdt], [ethers.utils.parseUnits("0.4493041178", "18")], [0])).wait()




    console.log("------ CErc20s deployed -----");

    const delegator = await ethers.getContractFactory("CErc20Delegator");

    const cCantoNote = await delegator.deploy(       
      cantoNote, // underlying
      Comp, //unitroller
      Model,
      markets.initialExchangeRateMantissa,
      "cCantoNote",
      "cCantoNote",
      markets.decimals,
      dep.address,
      cLPTokenFactory.address,
      3,
      markets.becomeImplementation 
  );
  await cCantoNote.deployed();
  console.log("cCantoNote: ", await cCantoNote.resolvedAddress);
  console.log("support market")
  await (await Comptroller._supportMarket(cCantoNote.address)).wait();
  console.log("set collateral factor")
  await(await Comptroller._setCollateralFactor(cCantoNote.address, "0")).wait();
  console.log("set comp speeds")
  await (await Comptroller._setCompSpeeds([cCantoNote.address], [ethers.utils.parseUnits("53.91649413", "18")], [0])).wait()

  console.log("next token")

  const cCantoETH = await delegator.deploy(       
    ethCanto, // underlying
    Comp, //unitroller
    Model,
    markets.CCantoEth.initialExchangeRateMantissa,
    "cCantoETH",
    "cCantoETH",
    markets.CCantoEth.decimals,
    dep.address,
    cLPTokenFactory.address,
    4,
    markets.becomeImplementation 
);
await cCantoETH.deployed();
console.log("cCantoETH: ", await cCantoETH.resolvedAddress);
console.log("support market")
await (await Comptroller._supportMarket(cCantoETH.address)).wait();
console.log("set collateral factor")
await(await Comptroller._setCollateralFactor(cCantoETH.address, "0")).wait();
console.log("set comp speeds")
await (await Comptroller._setCompSpeeds([cCantoETH.address], [ethers.utils.parseUnits("26.95824707", "18")], [0])).wait()

console.log("next token")

const cCantoATOM = await delegator.deploy(       
  cantoAtom, // underlying
  Comp, //unitroller
  Model,
  markets.initialExchangeRateMantissa,
  "cCantoATOM",
  "cCantoATOM",
  markets.decimals,
  dep.address,
  cLPTokenFactory.address,
  4,
  markets.becomeImplementation 
);
await cCantoATOM.deployed();
console.log("cCantoATOM: ", await cCantoATOM.resolvedAddress);
console.log("support market")
await (await Comptroller._supportMarket(cCantoATOM.address)).wait();
console.log("set collateral factor")
await(await Comptroller._setCollateralFactor(cCantoATOM.address, "0")).wait();
console.log("set comp speeds")
await (await Comptroller._setCompSpeeds([cCantoATOM.address], [ethers.utils.parseUnits("26.95824707", "18")], [0])).wait()

console.log("next token")




  const cnoteUSDC = await delegator.deploy(       
    noteUSDC, // underlying
    Comp, //unitroller
    Model,
    markets.initialExchangeRateMantissa,
    "cnoteUSDC",
    "cnoteUSDC",
    markets.decimals,
    dep.address,
    cLPTokenFactory.address,
    5,
    markets.becomeImplementation 
);
await cnoteUSDC.deployed();
console.log("cnoteUSDC: ", await cnoteUSDC.resolvedAddress);
await (await Comptroller._supportMarket(cnoteUSDC.address)).wait();
await(await Comptroller._setCollateralFactor(cnoteUSDC.address, "0")).wait();
await (await Comptroller._setCompSpeeds([cnoteUSDC.address], [ethers.utils.parseUnits("17.97216471", "18")], [0])).wait()

const cnoteUSDT = await delegator.deploy(       
  noteUSDT, // underlying
  Comp, //unitroller
  Model,
  markets.initialExchangeRateMantissa,
  "cnoteUSDT",
  "cnoteUSDT",
  markets.decimals,
  dep.address,
  cLPTokenFactory.address,
  5,
  markets.becomeImplementation 
);
await cnoteUSDT.deployed();
console.log("cnoteUSDT: ", await cnoteUSDT.resolvedAddress);
await (await Comptroller._supportMarket(cnoteUSDT.address)).wait();
await(await Comptroller._setCollateralFactor(cnoteUSDT.address, "0")).wait();
await (await Comptroller._setCompSpeeds([cnoteUSDT.address], [ethers.utils.parseUnits("17.97216471", "18")], [0])).wait()
 
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});