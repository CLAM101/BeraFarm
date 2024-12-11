import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-ignition-ethers";
import "./tasks/general-tasks";

dotenv.config();

const deployerPrivateKey = process.env.ACCOUNT_PRIVATE_KEY || "";
const treasuryPrivateKey = process.env.TREASURY_ACCOUNT_KEY || "";
const etherScanApiKEY = process.env.ETHERSCAN_API_KEY || "";
const baseGoerliApiKey = process.env.BASE_API_KEY || "";
const avaxFujiApiKey = process.env.AVAX_FUJI_API_KEY || "";
const sepoilaApiKey = process.env.SEPOILA_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 50,
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
      bartio_testnet: "henlo",
      sepolia: etherScanApiKEY, // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "bartio_testnet",
        chainId: 80084,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/80084/etherscan",
          browserURL: "https://bartio.beratrail.io/",
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chains: {
        80084: {
          hardforkHistory: {
            berlin: 2913755,
            london: 3913755,
          },
        },
      },
      chainId: 1337,
      blockGasLimit: 30000000,
      allowBlocksWithSameTimestamp: true,
      forking: {
        url: "https://bartio.rpc.berachain.com/",
        enabled: true,
      },
    },
    bartio_testnet: {
      chainId: parseInt(`${process.env.CHAIN_ID}`),
      url: `${process.env.RPC_URL || ""}`,
      accounts: [`${deployerPrivateKey}`, `${treasuryPrivateKey}`],
      gas: "auto", // Optional: use auto gas estimation
      gasPrice: "auto", // Optional: set gas price to auto
      blockGasLimit: 30000000, // Set the desired block gas limit
    },

    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${sepoilaApiKey}`,
      accounts: [deployerPrivateKey],
    },
  },
};

export default config;
