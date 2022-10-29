const { parseUnits } = require("ethers/lib/utils");
const {ethers} = require("hardhat");

const CNote = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "cNote",
    symbol: "cNOTE",
    decimals: "18",
    InterestRateModel: "NoteRateModel",
    CollateralFactor: ethers.utils.parseUnits("0.8","18"),
    compBorrowSpeed: "0",
    compSupplySpeed: "0",
    liquidationIncentive: ethers.utils.parseUnits("0.1", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: ethers.utils.parseUnits("100000000", "18"),
    becomeImplementation: [],
};

const CCanto = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "cCanto",
    symbol: "cCANTO",
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: parseUnits("0.25", 18),
    compBorrowSpeed: "0",
    compSupplySpeed: "0",
    liquidationIncentive: ethers.utils.parseUnits("0.1","18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: parseUnits("10000", 18),
    becomeImplementation: [],
};

const CEth = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "cEth",
    symbol: "cETH",
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: "0",
    compBorrowSpeed: "0",
    compSupplySpeed: "0",
    liquidationIncentive: ethers.utils.parseUnits("0.1", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: "1",
    becomeImplementation: [],
};  

const CAtom = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "cAtom",
    symbol: "cATOM",
    decimals: "6",
    InterestRateModel: "JumpRate",   
    CollateralFactor: "0",
    compBorrowSpeed: "0",
    compSupplySpeed: "0",
    liquidationIncentive: ethers.utils.parseUnits("0.1", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: parseUnits("50000", "6"),
    becomeImplementation: [],
};  

const CUsdc = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "cUSDC",
    symbol: "cUSDC",
    decimals: "6",
    InterestRateModel: "JumpRate",   
    CollateralFactor: ethers.utils.parseUnits("0.8", "18"),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("0.3", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.1", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: ethers.utils.parseUnits("10000000", "6"),
    becomeImplementation: [],
};  

const CUsdt = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "cUSDT",
    symbol: "cUSDT",
    decimals: "6",
    InterestRateModel: "JumpRate",   
    CollateralFactor: ethers.utils.parseUnits("0.8", "18"),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("0.3", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.1", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: ethers.utils.parseUnits("10000000", "6"),
    becomeImplementation: [],
};  

const CNoteUsdc = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "c-LP Note/USDC", // c-LP Note/USDC
    symbol: "cNOTE/USDC", 
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: parseUnits("0.9", 18),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("4", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.03", "18"),
    closeFactor: ethers.utils.parseUnits("0.25", "18"),
    borrowCap: parseUnits("100000", 18),    
    becomeImplementation: [],
};  

const CNoteUsdt = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "c-LP Note/USDT",
    symbol: "cNOTE/USDT",
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: parseUnits("0.9", 18),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("4", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.03", "18"),
    closeFactor: ethers.utils.parseUnits("0.25", "18"),
    borrowCap: parseUnits("100000", 18),
    becomeImplementation: [],
};  

const CCantoAtom = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "c-LP Canto/Atom",
    symbol: "cCANTO/ATOM",
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: parseUnits("0.4", 18),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("16", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.08", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: parseUnits("25000", 18),
    becomeImplementation: [],
};  

const CCantoEth ={ 
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "c-LP Canto/Eth",
    symbol: "cCANTO/ETH",
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: parseUnits("0.5", 18),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("16", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.7", "18"),
    closeFactor: ethers.utils.parseUnits("0.5", "18"),
    borrowCap: parseUnits("25000", 18),
    becomeImplementation: [],
};

const CCantoNote = {
    initialExchangeRateMantissa: ethers.utils.parseUnits("1", "18"),
    name: "c-LP Canto/Note", // cCanto/Note
    symbol: "cCANTO/NOTE",
    decimals: "18",
    InterestRateModel: "JumpRate",   
    CollateralFactor: parseUnits("0.7", 18),
    compBorrowSpeed: "0",
    compSupplySpeed: parseUnits("32", 18),
    liquidationIncentive: ethers.utils.parseUnits("0.05", "18"),
    closeFactor: ethers.utils.parseUnits("0.33", "18"),
    borrowCap: parseUnits("50000", 18),
    becomeImplementation: [],
};  


module.exports= {
    "canto" : {CNote, CCanto, CEth, CAtom, CUsdc, CUsdt, CNoteUsdc, CNoteUsdt, CCantoAtom, CCantoNote, CCantoEth}, 
}