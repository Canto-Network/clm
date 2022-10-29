const { expect } = require("chai");
const {
  parseUnits,
  keccak256,
  formatBytes32String,
} = require("ethers/lib/utils");
const { ethers, deployments, getNamedAccounts } = require("hardhat");
const {
  testAddresses,
} = require("../../../script/helpers/utils/testAddresses");
const { canto } = require("../../../config/index.js");

let dep;
let user1;
let comptroller;
let Note;
let USDC;
let cUSDC;
let cNOTE;
const account7 = "0x77c4922F44CA2a129bba364D8984A7e00DD4f92e";

describe("Testing lending market", async () => {
  before(async () => {
    [dep, user1] = await ethers.getSigners();
    //configure models
    const markets = canto.markets;
    const JumpModelFactory = await ethers.getContractFactory("JumpRateModel");
    const jumpRateModel = await JumpModelFactory.deploy(
      "0",
      "1000000000000000000",
      "400000000000000",
      "700000000000000000"
    );
    const NoteModelFactory = await ethers.getContractFactory("NoteRateModel");
    const noteRateModel = await NoteModelFactory.deploy("20000000000000000");

    //configure comptroller
    const comptrollerFactory = await ethers.getContractFactory("Comptroller");
    comptroller = await comptrollerFactory.deploy();
    const unitrollerFactory = await ethers.getContractFactory("Unitroller");
    const unitroller = await unitrollerFactory.deploy();
    await unitroller._setPendingImplementation(comptroller.address);
    await comptroller._become(unitroller.address);

    //deploy note
    const NoteFactory = await ethers.getContractFactory("Note");
    Note = await NoteFactory.deploy();

    //deploy treasury
    const TreasuryDelegateFactory = await ethers.getContractFactory(
      "TreasuryDelegate"
    );
    const TreasuryDelegate = await TreasuryDelegateFactory.deploy();
    const TreasuryDelegatorFactory = await ethers.getContractFactory(
      "TreasuryDelegator"
    );
    const TreasuryDelegator = await TreasuryDelegatorFactory.deploy(
      Note.address,
      TreasuryDelegate.address,
      dep.address
    );

    //deploy ERC20s
    const ERC20Facory = await ethers.getContractFactory("ERC20");
    USDC = await ERC20Facory.deploy("USDC", "USDC", "1000", 6);
    //deploycNote
    const cNoteFactory = await ethers.getContractFactory("CNote");
    const cNote = await cNoteFactory.deploy();
    //deploy cERC20s
    const cERC20Factory = await ethers.getContractFactory("CErc20Delegate");
    const cERC20Delegator = await ethers.getContractFactory("CErc20Delegator");

    cNOTE = await cERC20Delegator.deploy(
      Note.address,
      comptroller.address,
      noteRateModel.address,
      markets.CNote.initialExchangeRateMantissa,
      markets.CNote.name,
      markets.CNote.symbol,
      markets.CNote.decimals,
      dep.address,
      cNote.address,
      markets.CNote.becomeImplementation
    );

    const cUSDCDelegate = await cERC20Factory.deploy();
    cUSDC = await cERC20Delegator.deploy(
      USDC.address,
      comptroller.address,
      jumpRateModel.address,
      markets.CUsdc.initialExchangeRateMantissa,
      "cUSDC",
      "cUSDC",
      6,
      dep.address,
      cUSDCDelegate.address,
      markets.CUsdc.becomeImplementation
    );

    //deploy Accountant
    await (await comptroller._supportMarket(cNOTE.address)).wait();
    const AccountantFactory = await ethers.getContractFactory(
      "AccountantDelegate"
    );
    const accountant = await AccountantFactory.deploy();
    const AccountDelegatorFactory = await ethers.getContractFactory(
      "AccountantDelegator"
    );
    const accountantDelegator = await AccountDelegatorFactory.deploy(
      accountant.address,
      dep.address,
      cNOTE.address,
      Note.address,
      comptroller.address,
      TreasuryDelegator.address
    );

    // console.log(cNote)
    const cNoteDelegator = new ethers.Contract(
      cNOTE.address,
      (await deployments.get("CNote")).abi,
      dep.address
    );
    await (await cNoteDelegator.setAccountantContract(
      accountantDelegator.address
    )).wait();

    await (
      await Note._setAccountantAddress(accountantDelegator.address)
    ).wait();
  });

  it("check contract deployments", async () => {
    console.log(await Note.totalSupply());
  });
});
