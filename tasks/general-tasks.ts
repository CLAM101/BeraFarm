import { task } from "hardhat/config";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";
import { ERC20ABI } from "../test/testHelpers/ABI/ERC20-abi";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";

task(
  "transferToken",
  "Transfers ERC-20 tokens from one account to another"
).setAction(async (taskArgs, hre) => {
  const tokenAddress = "0x5302E909d1e93e30F05B5D6Eea766363D14F9892";

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
    `Transferred ${transferAmount} tokens from ${owner.address} to ${otherAccount.address}`
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
      const bexAddress = "0xc96304e3c037f81da488ed9dea1d8f2a48278a75";

      const bexContract = new hre.ethers.Contract(bexAddress, bexABI, deployer);

      const mintingOpenStatus = await bexContract.getPoolOptions(
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
      );

      console.log("Pool Options: ", mintingOpenStatus);
    } catch (e) {
      console.log(e);
    }
  }
);

task(
  "setPlatformState",
  "Approves spend with the Honey contract on testnet"
).setAction(async (taskArgs, hre) => {
  try {
    const farmAddress = "0x6afAfEd29a3cd77682c47B23Eb7E07781818F715";

    const [owner] = await hre.ethers.getSigners();

    const farmArtifacts = await hre.artifacts.readArtifact("BeraFarm");

    const signer = await hre.ethers.getSigner(owner.address);
    const farmContract = new hre.ethers.Contract(
      farmAddress,
      farmArtifacts.abi,
      signer
    );

    const tokenAddress = "0x73A1546430678c23654D164A1d6C43cE31F8C4d4";

    const tokenArtifacts = await hre.artifacts.readArtifact("FuzzTokenV2");

    const tokenContract = new hre.ethers.Contract(
      tokenAddress,
      tokenArtifacts.abi,
      signer
    );

    const platfromState = await farmContract.setPlatformState(true);
    await platfromState.wait();

    const openBuyBeraCubsHoney = await farmContract.openBuyBeraCubsHoney();
    await openBuyBeraCubsHoney.wait();

    const enableTrading = await tokenContract.enableTrading();
    await enableTrading.wait();

    const removeHibernation = await tokenContract.removeHibernation();
    await removeHibernation.wait();

    const removeCubsOnlyTx = await tokenContract.openTradingToNonCubsOwner();

    await removeCubsOnlyTx.wait();

    console.log("platfrom is live");
  } catch (e) {
    console.log(e);
  }
});

task(
  "getTransactionDetail",
  "Approves spend with the Honey contract on testnet"
).setAction(async (taskArgs, hre) => {
  try {
    const provider = hre.ethers.provider;

    const txHash =
      "0x7d198c343f89e7f7557622714beb4ee5818bc748b0e1de6ccbc37c77be09030d";

    const reciept: any = await provider.getTransactionReceipt(txHash);

    const iface = new hre.ethers.Interface(bexABI);

    reciept.logs.forEach((log: any) => {
      const event = iface.parseLog(log);

      console.log("event: ", event);
    });

    console.log("Transaction Reciept: ", reciept.logs);
  } catch (err) {
    console.log("Caught get transaction reciept error", err);
  }
});

task(
  "impersonateAndGetTokens",
  "Impersonats a wallet and sends tokens to another wallet"
).setAction(async (taskArgs, hre) => {
  try {
    const transferAmount = hre.ethers.parseUnits("1000000", "ether");

    const address = "0x1F5c5b2AA38E4469a6Eb09f8EcCa5D487E9d1431";
    await impersonateAccount(address);
    const impersonatedSigner = await hre.ethers.getSigner(address);

    const [owner] = await hre.ethers.getSigners();

    const tokenContract = new hre.ethers.Contract(
      "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
      ERC20ABI,
      impersonatedSigner
    );

    const tx = await tokenContract.transfer(owner, transferAmount);
    await tx.wait();

    const honeyBalance = await tokenContract.balanceOf(owner.address);

    console.log("Honey Balance Owner: ", honeyBalance);
  } catch (err) {
    console.log("Caught get transaction reciept error", err);
  }
});

task("generalTask", "taskDescription").setAction(async (taskArgs, hre) => {
  try {
    const fuzzTokenAddress = "0xa84E50408f9dC576309102da03Ed8D6A82b7869B";
    const [owner] = await hre.ethers.getSigners();

    const tokenArtifacts = await hre.artifacts.readArtifact("FuzzTokenV2");
    const fuzzTokenContract = new hre.ethers.Contract(
      fuzzTokenAddress,
      tokenArtifacts.abi,
      owner
    );

    const removeCubsOnlyTx =
      await fuzzTokenContract.openTradingToNonCubsOwner();

    const removeCubsOnlyTxReciept = await removeCubsOnlyTx.wait();

    console.log("removeCubsOnlyTxReciept", removeCubsOnlyTxReciept);
  } catch (err) {
    console.log("Caught get transaction reciept error", err);
  }
});
