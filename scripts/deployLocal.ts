import { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { ERC20ABI } from "../test/testHelpers/ABI/ERC20-abi";
import { Helpers } from "../test/testHelpers/helpers";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";
// these are defaults that will be set when deploying to testnet and mainnet
export let maxCubSupply = 15000;
export let maxSupplyFirstBatch = 5000;
export let limitBeforeEmissions = 3;
export let maxSupplyForHoney = 3;
export let limitBeforeFullTokenTrading = 5000;
export let initialFuzzSupply = ethers.parseEther("3000000");
export let maxFuzzSupply = ethers.parseEther("10000000");
export let snapShotId: string;
export let maxCubsPerWallet = 20;
async function main() {
  const routerAddress = "0xB6120De62561D702087142DE405EEB02c18873Bc";
  const factoryAddress = "0xad88D4ABbE0d0672f00eB3B83E6518608d82e95d";
  const helpers = new Helpers();
  // Contracts are deployed using the first signer/account by default
  const [
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
    seventhAccount,
    eighthAccount,
  ] = await ethers.getSigners();

  const beraCub = await ethers.deployContract("BeraCub", [maxCubSupply]);

  const deployedContract = await beraCub.waitForDeployment();

  console.log("BeraCub deployed to:", deployedContract.target);
  const mintToAddresses = [
    owner.address,
    otherAccount.address,
    thirdAccount.address,
    fourthAccount.address,
    fifthAccount.address,
  ];

  const mockHoney = await ethers.deployContract("MockHoney", [
    ethers.parseEther("10000000"),
    mintToAddresses,
  ]);

  const deployedMockHoney = await mockHoney.waitForDeployment();

  console.log("MockHoney deployed to:", deployedMockHoney.target);

  console.log("Other account address:", otherAccount.address);

  const fuzzToken = await ethers.deployContract("FuzzToken", [
    initialFuzzSupply,
    maxFuzzSupply,
    otherAccount.address,
    mockHoney.target,
    beraCub.target,
  ]);

  const deployedFuzzToken = await fuzzToken.waitForDeployment();

  console.log("FuzzToken deployed to:", deployedFuzzToken.target);

  const pair = await fuzzToken.getPair();

  const LPContract = new ethers.Contract(pair, ERC20ABI, owner);

  console.log("$FUZZ token contract Deployed At:", fuzzToken.target);

  await fuzzToken
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("1000000"));

  await mockHoney
    .connect(owner)
    .approve(routerAddress, ethers.parseEther("40000"));

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

  const beraFarm = await ethers.deployContract("BeraFarm", [
    beraCub.target,
    fuzzToken.target,
    mockHoney.target,
    pair,
    sixthAccount.address,
    60,
    15,
    10,
    maxSupplyForHoney,
    maxSupplyFirstBatch,
    limitBeforeEmissions,
    limitBeforeFullTokenTrading,
    factoryAddress,
    maxCubsPerWallet,
  ]);

  await fuzzToken.connect(owner).setBeraFarmAddress(beraFarm.target);

  await beraCub.addBeraFarmContract(beraFarm.target);

  await beraFarm.waitForDeployment();

  await fuzzToken.connect(owner).addController(beraFarm.target);

  await beraCub.connect(owner).addController(beraFarm.target);

  console.log("Bera Farm Deployed:", beraFarm.target);

  await beraFarm.connect(owner).setPlatformState(true);
  await beraFarm.connect(owner).openBuyBeraCubsHoney();
  await fuzzToken.connect(owner).enableTrading();
  await beraCub.connect(owner).openMinting();

  await fuzzToken.connect(owner).removeHibernation();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
