import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import { BeraCub, FuzzToken, BeraFarm, MockHoney } from "../../typechain-types";
import { Helpers } from "./helpers";
import { wBeraABI } from "./ABI/wbera-abi";
import { bexABI } from "./ABI/bex-abi";
import { ERC20ABI } from "./ABI/ERC20-abi";

export async function deployContracts() {
  let beraCub: BeraCub;
  let fuzzToken: FuzzToken;
  let beraFarm: BeraFarm;
  let mockHoney: MockHoney;
  const helpers = new Helpers();
  const wBeraAddress = "0x5806E416dA447b267cEA759358cF22Cc41FAE80F";
  const routerAddress = "0xB6120De62561D702087142DE405EEB02c18873Bc";
  const factoryAddress = "0xad88D4ABbE0d0672f00eB3B83E6518608d82e95d";

  // Contracts are deployed using the first signer/account by default
  const [
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
  ] = await ethers.getSigners();

  const BeraCub = await ethers.getContractFactory("BeraCub");
  const BeraFarm = await ethers.getContractFactory("BeraFarm");
  const FuzzToken = await ethers.getContractFactory("FuzzToken");
  const MockHoney = await ethers.getContractFactory("MockHoney");

  beraCub = (await BeraCub.deploy(3000, {
    gasLimit: 30000000,
  })) as unknown as BeraCub;

  await beraCub.waitForDeployment();

  console.log("BetterChicken Deployed At:", beraCub.target);

  fuzzToken = (await FuzzToken.deploy(
    ethers.parseEther("1000000000"),
    ethers.parseEther("1000000000000"),
    otherAccount.address
  )) as unknown as FuzzToken;
  await fuzzToken.waitForDeployment();

  await helpers.wrapTokens(wBeraAddress, "200", owner, wBeraABI);

  const pair = await fuzzToken.getPair();

  const LPContract = new ethers.Contract(pair, ERC20ABI, owner);

  console.log("Token Deployed At:", fuzzToken.target);

  const wrapperContract = new ethers.Contract(wBeraAddress, wBeraABI, owner);

  await wrapperContract
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("200"));

  await fuzzToken
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("1000000"));

  await helpers.addLiquidity(
    routerAddress,
    wBeraAddress,
    fuzzToken.target,
    ethers.parseEther("200"),
    ethers.parseEther("1000000"),
    ethers.parseEther("200"),
    ethers.parseEther("1000000"),
    owner.address,
    bexABI,
    owner
  );

  const LPBalance = await LPContract.balanceOf(owner.address);

  console.log("LP Balance:", LPBalance.toString());

  mockHoney = (await MockHoney.deploy(
    ethers.parseEther("1000000")
  )) as unknown as MockHoney;
  await mockHoney.waitForDeployment();

  console.log("Token Deployed At:", mockHoney.target);

  beraFarm = (await BeraFarm.deploy(
    beraCub.target,
    fuzzToken.target,
    mockHoney.target,
    pair,
    otherAccount.address,
    60,
    10,
    15,
    factoryAddress,
    {
      gasLimit: 30000000,
    }
  )) as unknown as BeraFarm;

  await beraFarm.waitForDeployment();

  await fuzzToken.connect(owner).addController(beraFarm.target);

  console.log("Bera Farm Deployed:", beraFarm.target);

  return {
    betterChickenAbi: fuzzToken.interface,
    beraCub,
    fuzzToken,
    beraFarm,
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
    mockHoney,
  };
}
