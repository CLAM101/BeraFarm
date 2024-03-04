import { HardhatUserConfig, task } from "hardhat/config";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-ignition-ethers";

dotenv.config();

const deployerPrivateKey = process.env.DEPLOYER_ACCOUNT_KEY2 || "";

const etherScanApiKEY = process.env.ETHERSCAN_API_KEY || "";
const baseGoerliApiKey = process.env.BASE_API_KEY || "";
const avaxFujiApiKey = process.env.AVAX_FUJI_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          viaIR: true,
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

  etherscan: {
    apiKey: {
      artio_testnet: "artio_testnet", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "artio_testnet",
        chainId: 80085,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/80085/etherscan",
          browserURL: "https://artio.beratrail.io",
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
      blockGasLimit: 30000000,
      allowBlocksWithSameTimestamp: true,
      forking: {
        url: "https://rpc.ankr.com/berachain_testnet",
      },
    },
    artio_testnet: {
      url: "https://rpc.ankr.com/berachain_testnet",
      accounts: [deployerPrivateKey],
    },
  },
};

export default config;
