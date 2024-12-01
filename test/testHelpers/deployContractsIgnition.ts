import { ignition } from "hardhat";
import DeployLocal from "../../ignition/modules/DeployLocal";
import MockBex from "../../ignition/modules/MockBex";
import paramsLocalBlocker from "../../ignition/paramsLocalBlockerTests.json";
import paramsBondAndBuy from "../../ignition/paramsBondAndBuyTests.json";
import paramsCompounds from "../../ignition/paramsCompoundTests.json";
import paramsTokenTests from "../../ignition/paramsTokenTests.json";
import {
  multiCallCreatePoolAddLiquid,
  impersonateAndGetTokens,
  queryPrice,
  determineBaseQuoteOrder,
} from "../../helpers/HelpersOld";
import { ethers } from "hardhat";

export async function deployBlocker() {
  const fixture = await ignition.deploy(DeployLocal, {
    parameters: paramsLocalBlocker,
  });

  return fixture;
}

export async function deployBondAndBuy() {
  const { beraCub, beraFarm, fuzzToken, nftMarketplace, applySettingsLocal } =
    await ignition.deploy(DeployLocal, {
      parameters: paramsBondAndBuy,
    });

  const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
  const bexAddress = "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49";
  const addressToImpersonate = "0x1F5c5b2AA38E4469a6Eb09f8EcCa5D487E9d1431";

  await impersonateAndGetTokens(honeyAddress, addressToImpersonate, ethers);

  const fuzzAmount = ethers.parseEther("200000");
  const honeyAmount = ethers.parseEther("400000");

  await multiCallCreatePoolAddLiquid(
    ethers,
    fuzzToken.target,
    honeyAmount,
    fuzzAmount
  );

  const { baseToken, quoteToken } = determineBaseQuoteOrder(
    honeyAddress,
    fuzzToken.target as string
  );

  console.log("Base Token:", baseToken, "Quote Token:", quoteToken);

  const price = await queryPrice(ethers, baseToken, quoteToken);

  console.log(
    "All deployed, $Fuzz Price at:",
    price,
    "FuzzToken",
    fuzzToken.target,
    "Honey",
    honeyAddress,
    "BeaFarm",
    beraFarm.target,
    "BeraCub",
    beraCub.target,
    "NFTMarketplace",
    nftMarketplace.target
  );

  return { beraCub, beraFarm, fuzzToken, nftMarketplace, applySettingsLocal };
}

export async function deployCompounds() {
  const fixture = await ignition.deploy(DeployLocal, {
    parameters: paramsCompounds,
  });

  return fixture;
}

export async function deployRewardsAndClaims() {
  const fixture = await ignition.deploy(DeployLocal, {
    parameters: paramsCompounds,
  });

  return fixture;
}

export async function deployTokenTests() {
  const fixture = await ignition.deploy(DeployLocal, {
    parameters: paramsTokenTests,
  });

  return fixture;
}
