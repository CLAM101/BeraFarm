import { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { ERC20ABI } from "../test/testHelpers/ABI/ERC20-abi";
import { Helpers } from "../test/testHelpers/helpers";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";
// these are defaults that will be set when deploying to testnet and mainnet
export let maxCubSupply = 150;
export let maxSupplyFirstBatch = 50;
export let limitBeforeEmissions = 15;
export let maxSupplyForHoney = 100;
export let limitBeforeFullTokenTrading = 10;
export let initialFuzzSupply = ethers.parseEther("3000000");
export let maxFuzzSupply = ethers.parseEther("10000000");
export let snapShotId: string;
export let maxCubsPerWallet = 20;
async function main() {
  const routerAddress = "0xB6120De62561D702087142DE405EEB02c18873Bc";
  const factoryAddress = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
  const helpers = new Helpers();

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const treasuryAddress = "0x1753dbA41D73c05800C7f42a4f97Bd49da43A172";

  const mockHoney = await ethers.deployContract("MockHoney", [
    ethers.parseEther("10000000"),
    [deployer.address],
  ]);

  const deployedMockHoney = await mockHoney.waitForDeployment();

  console.log("MockHoney deployed to:", deployedMockHoney.target);

  const beraCubeDeployArgs = [maxCubSupply];

  const beraCub = await ethers.deployContract("BeraCub", beraCubeDeployArgs);

  const deployedContract = await beraCub.waitForDeployment();

  console.log("Deployed Bera Cub", deployedContract);

  console.log(
    "Bera Cub Deployed",
    `Verify with: \n npx hardhat verify --network sepolia ${
      deployedContract.target
    } ${beraCubeDeployArgs.toString().replace(/,/g, " ")} \n`
  );

  const fuzzTokenDeployArgs = [
    initialFuzzSupply,
    maxFuzzSupply,
    treasuryAddress,
    mockHoney.target,
  ];

  const fuzzToken = await ethers.deployContract(
    "FuzzToken",
    fuzzTokenDeployArgs
  );

  const deployedFuzzToken = await fuzzToken.waitForDeployment();

  console.log("Deployed Fuzz Token", deployedFuzzToken);

  console.log(
    "Fuzz Token Deployed",
    `Verify with: \n npx hardhat verify --network sepolia ${
      deployedFuzzToken.target
    } ${fuzzTokenDeployArgs.toString().replace(/,/g, " ")} \n`
  );

  const pair = await fuzzToken.getPair();

  console.log("Pair Address:", pair);

  //const LPContract = new ethers.Contract(pair, ERC20ABI, owner);

  // add the LP
  //   await fuzzToken
  //     .connect(owner)
  //     .approve(routerAddress, ethers.parseEther("1000000"));

  //   await mockHoney
  //     .connect(owner)
  //     .approve(routerAddress, ethers.parseEther("40000"));

  //   await fuzzToken
  //     .connect(owner)
  //     .approve(routerAddress, ethers.parseEther("1000000"));

  //   await mockHoney
  //     .connect(owner)
  //     .approve(routerAddress, ethers.parseEther("40000"));

  //   let address0;

  //   let address1;

  //   let address1Amount;

  //   let address0Amount;

  //   if (fuzzToken.target < mockHoney.target) {
  //     address0 = fuzzToken.target;
  //     address0Amount = ethers.parseEther("1000000");
  //     address1 = mockHoney.target;
  //     address1Amount = ethers.parseEther("40000");
  //   } else {
  //     address0 = mockHoney.target;
  //     address0Amount = ethers.parseEther("40000");
  //     address1 = fuzzToken.target;
  //     address1Amount = ethers.parseEther("1000000");
  //   }

  //   await helpers.addLiquidity(
  //     routerAddress,
  //     address0,
  //     address1,
  //     address0Amount,
  //     address1Amount,
  //     address0Amount,
  //     address1Amount,
  //     owner.address,
  //     bexABI,
  //     owner
  //   );

  // const LPBalance = await LPContract.balanceOf(owner.address);

  //console.log("LP Balance:", LPBalance.toString());

  const beraFarmDeployArgs = [
    mockHoney.target,
    pair,
    treasuryAddress,
    60,
    15,
    10,
    maxSupplyForHoney,
    maxSupplyFirstBatch,
    limitBeforeEmissions,
    limitBeforeFullTokenTrading,
    factoryAddress,
    maxCubsPerWallet,
  ];

  const beraFarm = await ethers.deployContract("BeraFarm", beraFarmDeployArgs);

  //set bera farm address
  // await fuzzToken.connect(owner).setBeraFarmAddress(beraFarm.target);

  //add the beraCub contract manually
  //await beraCub.addBeraFarmContract(beraFarm.target);

  const deployedBeraFarmContract = await beraFarm.waitForDeployment();

  console.log("Deployed Bera Farm", deployedBeraFarmContract);

  console.log(
    "Bera Farm Deployed",
    `Verify with: \n npx hardhat verify --network sepolia ${
      deployedBeraFarmContract.target
    } ${beraFarmDeployArgs.toString().replace(/,/g, " ")} \n`
  );

  // add controller
  // await fuzzToken.connect(owner).addController(beraFarm.target);

  //add controller
  // await beraCub.connect(owner).addController(beraFarm.target);

  //set platform state
  // await beraFarm.connect(owner).setPlatformState(true);

  //open buy cubs for honey
  // await beraFarm.connect(owner).openBuyBeraCubsHoney();

  //endable trading
  // await fuzzToken.connect(owner).enableTrading();

  //open minting
  // await beraCub.connect(owner).openMinting();

  //remove hibernation
  // await fuzzToken.connect(owner).removeHibernation();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
