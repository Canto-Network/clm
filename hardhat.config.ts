import fs from "fs";
// import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { HardhatUserConfig } from "hardhat/types";
import "hardhat-deploy";
import "ethereum-waffle";
import "hardhat-preprocessor";
require("dotenv").config();


const config: HardhatUserConfig = {
  networks: {
    canto_testnet: {
      url: "https://canto-testnet.plexnode.wtf",
      accounts: [process.env.PRIVATE_KEY],
      tags: ["Deployment"],
    },
    canto_livenet: {
      url: "https://mainnode.plexnode.org:8545",
      accounts: [process.env.PRIVATE_KEY],
    },
    new_testnet: {
      url: "http://50.116.1.91:8545",
      accounts: [process.env.PRIVATE_KEY],
      tags: ["Deployment"],
    },
    official_testnet: {
      url: "https://canto-testnet.plexnode.wtf",
      accounts: [process.env.PRIVATE_KEY],
      tags: ["Deployment"],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    user1: 1,
    user2: 2,
    liquidator: 3,
  },
  preprocess: {
    eachLine: (hre) => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          getRemappings().forEach(([find, replace]) => {
            if (line.match(find)) {
              line = line.replace(find, replace);
            }
          });
        }
        return line;
      },
    }),
  },
  paths: {
    deploy: "./deploy/canto_livenet",
    sources: "./src",
    tests: "./test/Treasury",
    cache: "./cache_hardhat",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 100000000000,
  },
};

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split("="));
}

export default config;
