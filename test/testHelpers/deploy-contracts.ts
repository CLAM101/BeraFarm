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

  const mintToAddresses = [
    owner.address,
    otherAccount.address,
    thirdAccount.address,
    fourthAccount.address,
    fifthAccount.address,
  ];

  mockHoney = (await MockHoney.deploy(
    ethers.parseEther("10000000"),
    mintToAddresses
  )) as unknown as MockHoney;
  await mockHoney.waitForDeployment();

  console.log("Mock $Honey Deployed At:", mockHoney.target);

  fuzzToken = (await FuzzToken.deploy(
    ethers.parseEther("3000000"),
    ethers.parseEther("10000000"),
    otherAccount.address,
    mockHoney.target,
    beraCub.target
  )) as unknown as FuzzToken;
  await fuzzToken.waitForDeployment();

  const pair = await fuzzToken.getPair();

  const LPContract = new ethers.Contract(pair, ERC20ABI, owner);

  console.log("$Fuzz Deployed At:", fuzzToken.target);

  await fuzzToken
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("1000000"));

  await mockHoney
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("40000"));

  let address0;

  let address1;

  let address1Amount;

  let address0Amount;

  if (fuzzToken.target < mockHoney.target) {
    address0 = fuzzToken.target;
    address0Amount = ethers.parseEther("1000000");
    address1 = mockHoney.target;
    address1Amount = ethers.parseEther("40000");
  } else {
    address0 = mockHoney.target;
    address0Amount = ethers.parseEther("40000");
    address1 = fuzzToken.target;
    address1Amount = ethers.parseEther("1000000");
  }

  await helpers.addLiquidity(
    routerAddress,
    address0,
    address1,
    address0Amount,
    address1Amount,
    address0Amount,
    address1Amount,
    owner.address,
    bexABI,
    owner
  );

  const LPBalance = await LPContract.balanceOf(owner.address);

  console.log("LP Balance:", LPBalance.toString());

  beraFarm = (await BeraFarm.deploy(
    beraCub.target,
    fuzzToken.target,
    mockHoney.target,
    pair,
    sixthAccount.address,
    60,
    5,
    8,
    15,
    factoryAddress,
    {
      gasLimit: 30000000,
    }
  )) as unknown as BeraFarm;

  await beraFarm.waitForDeployment();

  await fuzzToken.connect(owner).addController(beraFarm.target);

  await beraCub.connect(owner).addController(beraFarm.target);

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
