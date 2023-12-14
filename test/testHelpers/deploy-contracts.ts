import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import {
  BetterChicken,
  BetterEgg,
  ChickenFarmButBetter,
  MockUSDC,
} from "../../typechain-types";

export async function deployContracts() {
  let betterChicken: BetterChicken;
  let betterEgg: BetterEgg;
  let chickenFarmButBetter: ChickenFarmButBetter;
  let mockUSDC: MockUSDC;
  // Contracts are deployed using the first signer/account by default
  const [
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
  ] = await ethers.getSigners();

  const BetterChicken = await ethers.getContractFactory("BetterChicken");
  const ChickenFarmButBetter = await ethers.getContractFactory(
    "ChickenFarmButBetter"
  );
  const BetterEgg = await ethers.getContractFactory("BetterEgg");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");

  betterChicken = (await BetterChicken.deploy({
    gasLimit: 30000000,
  })) as unknown as BetterChicken;

  await betterChicken.waitForDeployment();

  console.log("BetterChicken Deployed At:", betterChicken.target);

  betterEgg = (await BetterEgg.deploy(
    ethers.parseEther("1000000000"),
    ethers.parseEther("1000000000"),
    otherAccount.address
  )) as unknown as BetterEgg;
  await betterEgg.waitForDeployment();

  const pair = await betterEgg.getPair();

  console.log("Token Deployed At:", betterEgg.target);

  mockUSDC = (await MockUSDC.deploy(1000000000)) as unknown as MockUSDC;
  await mockUSDC.waitForDeployment();

  console.log("Token Deployed At:", mockUSDC.target);

  chickenFarmButBetter = (await ChickenFarmButBetter.deploy(
    betterChicken.target,
    betterEgg.target,
    mockUSDC.target,
    pair,
    otherAccount.address,
    6,
    10,
    15,
    {
      gasLimit: 30000000,
    }
  )) as unknown as ChickenFarmButBetter;

  await chickenFarmButBetter.waitForDeployment();

  await betterEgg.connect(owner).addController(chickenFarmButBetter.target);

  console.log("Chicken Farm But Better:", chickenFarmButBetter.target);

  return {
    betterChickenAbi: BetterChicken.interface,
    betterChicken,
    betterEgg,
    chickenFarmButBetter,
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
  };
}
