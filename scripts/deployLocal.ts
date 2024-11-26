import hre from "hardhat";
import DeployLocal from "../ignition/modules/DeployLocal";
import paramatersLocal from "../ignition/paramatersLocal.json";
import { ethers } from "hardhat";

import {
  multiCallCreatePoolAddLiquid,
  impersonateAndGetTokens,
  queryPrice,
} from "../helpers/helpers";

async function main() {
  try {
    const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
    const bexAddress = "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49";

    const {
      beraCub,
      beraFarm,
      fuzzToken,
      nftMarketplace,
      // applySettingsLocal,
    } = await hre.ignition.deploy(DeployLocal, {
      parameters: paramatersLocal,
    });

    const addressToImpersonate = "0x1F5c5b2AA38E4469a6Eb09f8EcCa5D487E9d1431";

    await impersonateAndGetTokens(honeyAddress, addressToImpersonate, ethers);

    const baseAmount = ethers.parseEther("100000");
    const quoteAmount = ethers.parseEther("200000");

    await multiCallCreatePoolAddLiquid(
      ethers,
      fuzzToken.target,
      baseAmount,
      quoteAmount
    );

    const price = await queryPrice(
      ethers,
      fuzzToken.target as string,
      honeyAddress
    );

    console.log("All deployed, $Fuzz Price at:", price);
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);
