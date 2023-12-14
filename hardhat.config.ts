import { HardhatUserConfig, task } from "hardhat/config";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";

dotenv.config();

const deployerPrivateKey = process.env.DEPLOYER_ACCOUNT_PRIVATE_KEY || "";

const etherScanApiKEY = process.env.ETHERSCAN_API_KEY || "";
const baseGoerliApiKey = process.env.BASE_API_KEY || "";
const avaxFujiApiKey = process.env.AVAX_FUJI_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 100,
  },
  networks: {
    hardhat: {
      chainId: 1337,
      blockGasLimit: 30000000,
      allowBlocksWithSameTimestamp: true,
      forking: {
        url: "https://avalanche-mainnet.infura.io/v3/156939bf97fc420b81125fe2218b338d",
      },
    },
    // for testnet
    basegoerli: {
      url: "https://base-goerli.g.alchemy.com/v2/q4tjt0Lwo3wbYs8WmtM5_nYgMJhZxuFF",
      accounts: [deployerPrivateKey],
    },
    avaxFuji: {
      url: "https://avalanche-fuji.infura.io/v3/156939bf97fc420b81125fe2218b338d",
      accounts: [deployerPrivateKey],
    },
    goerli: {
      url: process.env.GOERLI_ALCHEMYURL,
      accounts: [deployerPrivateKey],
    },

    polygon_mumbai: {
      url: process.env.MUMBAI_URL,
      accounts: [deployerPrivateKey],
    },
    ganache: {
      url: "http://172.31.112.1:7545",
      chainId: 5777,
    },
    basemainnet: {
      url: "https://mainnet.base.org",
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000,
    },
  },

  etherscan: {
    apiKey: {
      etherscan: etherScanApiKEY,
      baseGoerli: baseGoerliApiKey,
      avalancheFujiTestnet: avaxFujiApiKey,
    },
  },
};

export default config;
