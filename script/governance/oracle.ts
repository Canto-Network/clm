import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() { 
    const [dep] = await ethers.getSigners();
    // instantiate governance contracts
    const wcanto = "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B";
    const comptroller = "0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C";
    const usdc = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd";
    const usdt = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75";
    const ccanto = "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488";
    const note = "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503";
    const router = "0xa252eEE9BDe830Ca4793F054B506587027825a8e";
    // retrieve contract factory (abi, bin)
    let oracle = await ethers.getContractAt("CLMPriceOracle", "0x5b7713d116fe7905952e8957f67b624329a5f437")
    // wait for the contract to deploy
    console.log(`${await ethers.provider.getCode(oracle.address)}`)
    console.log(`oracle price: ${(await oracle.getUnderlyingPrice(ccanto)).toBigInt()}`)
    // instantiate abi encoder
    let abiCoder = ethers.utils.defaultAbiCoder
    // encode abi
    let data = abiCoder.encode(["address"], [oracle.address])
    console.log(`${data}`)
}   	    

export function delay(ms: number) {
  return new Promise( timeOut => setTimeout(timeOut, ms))
}

export function getDelegator(delegate: any, delegator: any, dep: any): any {
  return new ethers.Contract(
      delegator.address,
      delegate.abi, 
      dep
  )
}


main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});