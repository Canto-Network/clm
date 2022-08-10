import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

const CETH_ADDRESS = "0x830b9849E7D79B92408a86A557e7baAACBeC6030"
const CCANTO_ADDRESS = "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488"
const CUSDT_ADDRESS = "0xD7Ff6Ba11422D47Aeff3DAE08CC1Ff5F30975D80"

async function main() { 
    const [dep] = await ethers.getSigners();

    let cCanto = await ethers.getContractAt("CEther", CCANTO_ADDRESS, dep)
    let cUsdt = await ethers.getContractAt("CErc20", CUSDT_ADDRESS, dep)
    let cEth = await ethers.getContractAt("CErc20", CETH_ADDRESS, dep)
    let jumpRate = await ethers.getContractAt("JumpRateModel", "0x2B715b9AAc41E85ff98402697d1EB9b28239Cda0", dep)


    let tokens = [cCanto, cUsdt, cEth]

    for (var token of tokens) { 
        console.log(`${await token.symbol()} total supply: ${(await token.totalSupply()).toBigInt()}`)
        console.log(`${await token.symbol()} interest rate model ${await token.interestRateModel()}`)
        console.log(`${await token.symbol()} current borrow rate ${(await token.borrowRatePerBlock()).toBigInt()}`)
        console.log(`${await token.symbol()} current exchange rate: ${(await token.exchangeRateStored()).toBigInt()}`)
        console.log(`${await token.symbol()} current borrows: ${(await token.totalBorrows()).toBigInt()}`)
    }
    console.log(`JumpRateModel baseRatePerBlock: ${(await jumpRate.baseRatePerBlock()).toBigInt()}`)
}   	    


main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});