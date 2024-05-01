import { ignition } from "hardhat";
import DeployLocal from "../../ignition/modules/DeployLocal";
import MockBex from "../../ignition/modules/MockBex";
import paramsLocalBlocker from "../../ignition/paramsLocalBlockerTests.json";
import paramsBondAndBuy from "../../ignition/paramsBondAndBuyTests.json";
import paramsCompounds from "../../ignition/paramsCompoundTests.json";
import paramsTokenTests from "../../ignition/paramsTokenTests.json";

export async function deployBlocker() {
  const fixture = await ignition.deploy(DeployLocal, {
    parameters: paramsLocalBlocker,
  });

  return fixture;
}

export async function deployBondAndBuy() {
  const fixture = await ignition.deploy(DeployLocal, {
    parameters: paramsBondAndBuy,
  });

  return fixture;
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
