import { task } from "hardhat/config";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";

task(
  "transferToken",
  "Transfers ERC-20 tokens from one account to another"
).setAction(async (taskArgs, hre) => {
  const tokenAddress = "0x5c74c94173f05da1720953407cbb920f3df9f887";

  const [
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
    seventhAccount,
    eighthAccount,
  ] = await hre.ethers.getSigners();

  const tokenArtifacts = await hre.artifacts.readArtifact("FuzzToken");
  const transferAmount = hre.ethers.parseUnits("5000", "ether");

  const signer = await hre.ethers.getSigner(owner.address);
  const tokenContract = new hre.ethers.Contract(
    tokenAddress,
    tokenArtifacts.abi,
    signer
  );

  const tx = await tokenContract.transfer(otherAccount, transferAmount);
  await tx.wait();

  console.log(
    `Transferred ${taskArgs.amount} tokens from ${taskArgs.from} to ${taskArgs.to}`
  );
});

task(
  "transferCub",
  "Transfers ERC-20 tokens from one account to another"
).setAction(async (taskArgs, hre) => {
  const tokenAddress = "0x720472c8ce72c2A2D711333e064ABD3E6BbEAdd3";

  const [
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
    seventhAccount,
    eighthAccount,
  ] = await hre.ethers.getSigners();

  const tokenArtifacts = await hre.artifacts.readArtifact("FuzzToken");
  const transferAmount = hre.ethers.parseUnits("5000", "ether");

  const signer = await hre.ethers.getSigner(owner.address);
  const tokenContract = new hre.ethers.Contract(
    tokenAddress,
    tokenArtifacts.abi,
    signer
  );

  const tx = await tokenContract.transfer(otherAccount, transferAmount);
  await tx.wait();

  console.log(
    `Transferred ${taskArgs.amount} tokens from ${taskArgs.from} to ${taskArgs.to}`
  );
});

task(
  "mineBlocks",
  "Transfers ERC-20 tokens from one account to another"
).setAction(async (taskArgs, hre) => {
  const stakingDuration = 144 * 3600;
  await hre.ethers.provider.send("evm_increaseTime", [stakingDuration]);
  await hre.ethers.provider.send("evm_mine");
});

task("addController", "Adds controller to Cub contract").setAction(
  async (taskArgs, hre) => {
    try {
      const cubAddress = "0x3E00F47F55fcFD4f4A8892c4a0cA0f8CF5B9FFdf";

      const [owner] = await hre.ethers.getSigners();

      const cubArtifacts = await hre.artifacts.readArtifact("BeraCub");

      const signer = await hre.ethers.getSigner(owner.address);
      const cubContract = new hre.ethers.Contract(
        cubAddress,
        cubArtifacts.abi,
        signer
      );

      const tx = await cubContract.addBeraFarmContract(
        "0x397AfC935D015DF8Cafc5f3B547aF365d1Cd8159"
      );
      await tx.wait();

      // console.log(
      //   `Transferred ${taskArgs.amount} tokens from ${taskArgs.from} to ${taskArgs.to}`
      // );
    } catch (e) {
      console.log(e);
    }
  }
);

task("buyBeraCubsHoney", "Buys a Bera CUb for Honey").setAction(
  async (taskArgs, hre) => {
    try {
      const farmAddress = "0x397AfC935D015DF8Cafc5f3B547aF365d1Cd8159";

      const [owner] = await hre.ethers.getSigners();

      const farmArtifacts = await hre.artifacts.readArtifact("BeraFarm");

      const signer = await hre.ethers.getSigner(owner.address);
      const farmContract = new hre.ethers.Contract(
        farmAddress,
        farmArtifacts.abi,
        signer
      );

      const tx = await farmContract.buyBeraCubsHoney(1);
      await tx.wait();

      // console.log(
      //   `Transferred ${taskArgs.amount} tokens from ${taskArgs.from} to ${taskArgs.to}`
      // );
    } catch (e) {
      console.log(e);
    }
  }
);

task(
  "approveHoneyTestnet",
  "Approves spend with the Honey contract on testnet"
).setAction(async (taskArgs, hre) => {
  try {
    const farmAddress = "0x397AfC935D015DF8Cafc5f3B547aF365d1Cd8159";

    const [owner] = await hre.ethers.getSigners();

    const farmArtifacts = await hre.artifacts.readArtifact("BeraFarm");

    const signer = await hre.ethers.getSigner(owner.address);
    const farmContract = new hre.ethers.Contract(
      farmAddress,
      farmArtifacts.abi,
      signer
    );

    const tx = await farmContract.buyBeraCubsHoney(1);
    await tx.wait();

    // console.log(
    //   `Transferred ${taskArgs.amount} tokens from ${taskArgs.from} to ${taskArgs.to}`
    // );
  } catch (e) {
    console.log(e);
  }
});

task(
  "deploySingleContract",
  "Approves spend with the Honey contract on testnet"
).setAction(async (taskArgs, hre) => {
  try {
    const [deployer] = await hre.ethers.getSigners();

    const args = [hre.ethers.parseEther("10000000"), [deployer.address]];
    const mockHoney = await hre.ethers.deployContract("MockHoney", [
      hre.ethers.parseEther("10000000"),
      [deployer.address],
    ]);

    const deployedMockHoney = await mockHoney.waitForDeployment();

    console.log(
      "Contract Deployed",
      `Verify with: \n npx hardhat verify --network sepolia ${
        deployedMockHoney.target
      } ${args.toString().replace(/,/g, " ")} \n`
    );
  } catch (e) {
    console.log(e);
  }
});

task(
  "checkMintStatus",
  "checks if open minting is true on Cub contract"
).setAction(async (taskArgs, hre) => {
  try {
    const [deployer] = await hre.ethers.getSigners();
    const cubAddress = "0x5c74c94173F05dA1720953407cbb920F3DF9f887";

    const cubArtifacts = await hre.artifacts.readArtifact("BeraCub");

    const cubContract = new hre.ethers.Contract(
      cubAddress,
      cubArtifacts.abi,
      deployer
    );

    const mintingOpenStatus = await cubContract.mintingOpen();

    console.log("Minting Open Status: ", mintingOpenStatus);
  } catch (e) {
    console.log(e);
  }
});

task("generalViewCall", "get options of a pool from bex contract").setAction(
  async (taskArgs, hre) => {
    try {
      const [deployer] = await hre.ethers.getSigners();
      const bexAddress = "0x0d5862FDbdd12490f9b4De54c236cff63B038074";

      const bexContract = new hre.ethers.Contract(bexAddress, bexABI, deployer);

      const mintingOpenStatus = await bexContract.getPoolOptions(
        "0x5479FbDef04302D2DEEF0Cc78f7D503d81fDFCC9"
      );

      console.log("Pool Options: ", mintingOpenStatus);
    } catch (e) {
      console.log(e);
    }
  }
);

task(
  "getLiquidity",
  "get liquidity off a token pair from Bex contract"
).setAction(async (taskArgs, hre) => {
  try {
    const [deployer] = await hre.ethers.getSigners();
    const bexAddress = "0x0d5862FDbdd12490f9b4De54c236cff63B038074";

    const bexContract = new hre.ethers.Contract(bexAddress, bexABI, deployer);

    const liquidity = await bexContract.getLiquidity(
      "0x751524E7bAdd31d018A4CAF4e4924a21b0c13CD0"
    );

    console.log("Liquidity: ", liquidity);
  } catch (e) {
    console.log(e);
  }
});
