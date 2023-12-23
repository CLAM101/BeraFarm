import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import {
  BetterChicken,
  BetterEgg,
  ChickenFarmButBetter,
  MockUsdc,
} from "../../typechain-types";
import { Helpers } from "./helpers";
import { wavaxABI } from "./ABI/wavax-abi";
import { joeABI } from "./ABI/joe-abi";
import { ERC20ABI } from "./ABI/ERC20-abi";

export async function deployContracts() {
  let betterChicken: BetterChicken;
  let betterEgg: BetterEgg;
  let chickenFarmButBetter: ChickenFarmButBetter;
  let mockUSDC: MockUsdc;
  const helpers = new Helpers();
  const wavaxAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
  const routerAddress = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4";
  const factoryAddress = "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10";
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
  const MockUSDC = await ethers.getContractFactory("MockUsdc");

  betterChicken = (await BetterChicken.deploy({
    gasLimit: 30000000,
  })) as unknown as BetterChicken;

  await betterChicken.waitForDeployment();

  console.log("BetterChicken Deployed At:", betterChicken.target);

  betterEgg = (await BetterEgg.deploy(
    ethers.parseEther("1000000000"),
    ethers.parseEther("1000000000000"),
    otherAccount.address
  )) as unknown as BetterEgg;
  await betterEgg.waitForDeployment();

  await helpers.wrapTokens(wavaxAddress, "200", owner, wavaxABI);

  const pair = await betterEgg.getPair();

  const LPContract = new ethers.Contract(pair, ERC20ABI, owner);

  console.log("Token Deployed At:", betterEgg.target);

  const wrapperContract = new ethers.Contract(wavaxAddress, wavaxABI, owner);

  await wrapperContract
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("200"));

  await betterEgg
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("1000000"));

  await helpers.addLiquidity(
    routerAddress,
    wavaxAddress,
    betterEgg.target,
    ethers.parseEther("200"),
    ethers.parseEther("1000000"),
    ethers.parseEther("200"),
    ethers.parseEther("1000000"),
    owner.address,
    joeABI,
    owner
  );

  const LPBalance = await LPContract.balanceOf(owner.address);

  console.log("LP Balance:", LPBalance.toString());

  mockUSDC = (await MockUSDC.deploy(
    ethers.parseUnits("100000", 6)
  )) as unknown as MockUsdc;
  await mockUSDC.waitForDeployment();

  console.log("Token Deployed At:", mockUSDC.target);

  chickenFarmButBetter = (await ChickenFarmButBetter.deploy(
    betterChicken.target,
    betterEgg.target,
    mockUSDC.target,
    pair,
    otherAccount.address,
    60,
    10,
    15,
    factoryAddress,
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
    mockUSDC,
  };
}
