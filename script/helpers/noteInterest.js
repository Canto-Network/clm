const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

const USDC_ADDR = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"

async function main() { 
	const [dep] = await ethers.getSigners();
  

  let note = await ethers.getContract("Note")
  let router = await ethers.getContract("BaseV1Router01")
  let factory = await ethers.getContract("BaseV1Factory")
  console.log(`router address: ${router.address}`)
  console.log(`factory address: ${factory.address}`)
  console.log(`note: ${note.address}`)

  noteUsdc = await factory.getPair(note.address, USDC_ADDR, true)
  let pair = await ethers.getContractAt("BaseV1Pair", noteUsdc)
  console.log(`pair observation: ${await pair.observations(2)}`)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});