import { task } from "hardhat/config";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";
import { ERC20ABI } from "../test/testHelpers/ABI/ERC20-abi";

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
  "getLiquidity",
  "get liquidity off a token pair from Bex contract"
).setAction(async (taskArgs, hre) => {
  try {
    const [deployer] = await hre.ethers.getSigners();
    const bexAddress = "0x0d5862FDbdd12490f9b4De54c236cff63B038074";

    const bexContract = new hre.ethers.Contract(bexAddress, bexABI, deployer);

    const liquidity = await bexContract.getLiquidity(
      "0xa88572F08f79D28b8f864350f122c1CC0AbB0d96"
    );

    console.log("Liquidity: ", liquidity);
  } catch (e) {
    console.log(e);
  }
});

task("createPool", "Creates a pool on Bex").setAction(async (taskArgs, hre) => {
  try {
    const [deployer] = await hre.ethers.getSigners();
    const bexAddress = "0x0d5862FDbdd12490f9b4De54c236cff63B038074";

    const honeyAddress = "0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B";

    const fuzzTokenAddress = "0xB5Bf70e26872E2713E8cD8054c3a9251e6E70b7E";

    const bexContract = new hre.ethers.Contract(bexAddress, bexABI, deployer);

    const honeyContract = new hre.ethers.Contract(
      honeyAddress,
      ERC20ABI,
      deployer
    );

    const fuzzTokenContract = new hre.ethers.Contract(
      fuzzTokenAddress,
      ERC20ABI,
      deployer
    );

    const approvalTxHoney = await honeyContract.approve(
      bexAddress,
      "400000000000000000000"
    );
    const honeyApprove = await approvalTxHoney.wait();

    console.log("Honey Approval: ", honeyApprove);

    const approvalTxFuzz = await fuzzTokenContract.approve(
      bexAddress,
      "10000000000000000000000"
    );

    const fuzzApprove = await approvalTxFuzz.wait();

    console.log("Fuzz Approval: ", fuzzApprove);
    const createPoolTx = await bexContract.createPool(
      "HoneyFuzzPool",
      [honeyAddress, fuzzTokenAddress],
      [hre.ethers.parseEther("400"), hre.ethers.parseEther("10000")],
      "weighted",
      {
        weights: [
          { asset: honeyAddress, weight: 50 },
          { asset: fuzzTokenAddress, weight: 50 },
        ],
        swapFee: "3000000000",
      }
    );

    const createResult = await createPoolTx.wait();

    console.log("Liquidity: ", createResult);
  } catch (e) {
    console.log(e);
  }
});

task(
  "setPlatfromState",
  "Approves spend with the Honey contract on testnet"
).setAction(async (taskArgs, hre) => {
  try {
    const farmAddress = "0x4bf010f1b9beDA5450a8dD702ED602A104ff65EE";

    const [owner] = await hre.ethers.getSigners();

    const farmArtifacts = await hre.artifacts.readArtifact("BeraFarm");

    const signer = await hre.ethers.getSigner(owner.address);
    const farmContract = new hre.ethers.Contract(
      farmAddress,
      farmArtifacts.abi,
      signer
    );

    const tokenAddress = "0x5302E909d1e93e30F05B5D6Eea766363D14F9892";

    const tokenArtifacts = await hre.artifacts.readArtifact("FuzzToken");

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
