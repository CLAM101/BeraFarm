import { ERC20ABI } from "../test/testHelpers/ABI/ERC20-abi";
import { queryABI } from "../test/testHelpers/ABI/query-abi";
import { artifacts } from "hardhat";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";

export class Contracts {
  abis;
  ethers;

  constructor(data: { ethers: any; abis: any }) {
    this.abis = data.abis;
    this.ethers = data.ethers;
  }

  static async createAsync(ethers: any): Promise<Contracts> {
    const abis = {
      beraCub: await artifacts.readArtifact("BeraCub"),
      beraFarm: await artifacts.readArtifact("BeraFarm"),
      fuzzToken: await artifacts.readArtifact("FuzzTokenV2"),
      nftMarketplace: await artifacts.readArtifact("NftMarketplace"),
    };
    return new Contracts({ ethers, abis });
  }

  async getHoneyContract(signer?: string, impersonate: boolean = false) {
    if (impersonate) {
      await impersonateAccount(
        signer || "0x1F5c5b2AA38E4469a6Eb09f8EcCa5D487E9d1431"
      );
    }
    const fetchedSigner = signer
      ? await this.ethers.getSigner(signer)
      : (await this.ethers.getSigners())[0];
    return new this.ethers.Contract(
      "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
      ERC20ABI,
      fetchedSigner
    );
  }
  async getQueryContract(signer?: string) {
    const fetchedSigner = signer
      ? await this.ethers.getSigner(signer)
      : (await this.ethers.getSigners())[0];

    return new this.ethers.Contract(
      "0x8685CE9Db06D40CBa73e3d09e6868FE476B5dC89",
      queryABI,
      fetchedSigner
    );
  }

  async getBexContract(signer?: string) {
    const fetchedSigner = signer
      ? await this.ethers.getSigner(signer)
      : (await this.ethers.getSigners())[0];

    return new this.ethers.Contract(
      "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49",
      bexABI,
      fetchedSigner
    );
  }

  async getContract(address: string, contractName: string, signer?: string) {
    const fetchedSigner = signer
      ? await this.ethers.getSigner(signer)
      : (await this.ethers.getSigners())[0];

    return new this.ethers.Contract(
      address,
      this.abis[contractName].abi,
      fetchedSigner
    );
  }
}
