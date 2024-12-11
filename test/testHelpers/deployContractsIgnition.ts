import { ignition } from "hardhat";
import DeployLocal from "../../ignition/modules/modules-local/DeployLocal";
import paramsLocalBlocker from "../../ignition/paramsLocalBlockerTests.json";
import paramsBondAndBuy from "../../ignition/paramsBondAndBuyTests.json";
import paramsCompounds from "../../ignition/paramsCompoundTests.json";
import paramsTokenTests from "../../ignition/paramsTokenTests.json";
import { Helpers } from "../../helpers/Helpers";
import { ethers } from "hardhat";
import DeployTestNet from "../../ignition/modules/modules-testnet/DeployTestNet";

export async function deployLiquid(
  fuzzToken: string
): Promise<{ price: number; honeyAddress: string }> {
  const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";

  const helpers = await Helpers.createAsync(ethers);
  const addressToImpersonate = "0x1F5c5b2AA38E4469a6Eb09f8EcCa5D487E9d1431";

  await helpers.impersonateAndGetTokens(addressToImpersonate);

  const fuzzAmount = ethers.parseEther("200000");
  const honeyAmount = ethers.parseEther("400000");

  await helpers.multiCallCreatePoolAddLiquid(
    fuzzToken,
    honeyAmount,
    fuzzAmount
  );

  const { baseToken, quoteToken } = helpers.determineBaseQuoteOrder(
    honeyAddress,
    fuzzToken as string
  );

  console.log("Base Token:", baseToken, "Quote Token:", quoteToken);

  const price = await helpers.queryPrice(baseToken, quoteToken);

  return { price, honeyAddress };
}

export async function deployBlocker() {
  const { beraCub, beraFarm, fuzzToken, nftMarketplace } =
    await ignition.deploy(DeployLocal, {
      parameters: paramsLocalBlocker,
    });

  const { price, honeyAddress } = await deployLiquid(
    fuzzToken.target as string
  );

  console.log(
    "All deployed, $Fuzz Price at:",
    price,
    "FuzzToken",
    fuzzToken.target,
    "Honey",
    honeyAddress,
    "BeaFarm",
    beraFarm.target,
    "BeraCub",
    beraCub.target,
    "NFTMarketplace",
    nftMarketplace.target
  );
  return { beraCub, beraFarm, fuzzToken, nftMarketplace };
}

export async function deployBondAndBuy() {
  const { beraCub, beraFarm, fuzzToken, nftMarketplace } =
    await ignition.deploy(DeployLocal, {
      parameters: paramsBondAndBuy,
    });

  const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";

  const helpers = await Helpers.createAsync(ethers);
  const addressToImpersonate = "0x1F5c5b2AA38E4469a6Eb09f8EcCa5D487E9d1431";

  await helpers.impersonateAndGetTokens(addressToImpersonate);

  const fuzzAmount = ethers.parseEther("200000");
  const honeyAmount = ethers.parseEther("400000");

  await helpers.multiCallCreatePoolAddLiquid(
    fuzzToken.target,
    honeyAmount,
    fuzzAmount
  );

  const { baseToken, quoteToken } = helpers.determineBaseQuoteOrder(
    honeyAddress,
    fuzzToken.target as string
  );

  console.log("Base Token:", baseToken, "Quote Token:", quoteToken);

  const price = await helpers.queryPrice(baseToken, quoteToken);

  console.log(
    "All deployed, $Fuzz Price at:",
    price,
    "FuzzToken",
    fuzzToken.target,
    "Honey",
    honeyAddress,
    "BeaFarm",
    beraFarm.target,
    "BeraCub",
    beraCub.target,
    "NFTMarketplace",
    nftMarketplace.target
  );

  return { beraCub, beraFarm, fuzzToken, nftMarketplace };
}

export async function deployCompounds() {
  const { beraCub, beraFarm, fuzzToken, nftMarketplace } =
    await ignition.deploy(DeployLocal, {
      parameters: paramsCompounds,
    });

  const { price, honeyAddress } = await deployLiquid(
    fuzzToken.target as string
  );

  console.log(
    "All deployed, $Fuzz Price at:",
    price,
    "FuzzToken",
    fuzzToken.target,
    "Honey",
    honeyAddress,
    "BeaFarm",
    beraFarm.target,
    "BeraCub",
    beraCub.target,
    "NFTMarketplace",
    nftMarketplace.target
  );

  return { beraCub, beraFarm, fuzzToken, nftMarketplace };
}

export async function deployRewardsAndClaims() {
  const { beraCub, beraFarm, fuzzToken, nftMarketplace } =
    await ignition.deploy(DeployLocal, {
      parameters: paramsCompounds,
    });

  const { price, honeyAddress } = await deployLiquid(
    fuzzToken.target as string
  );

  console.log(
    "All deployed, $Fuzz Price at:",
    price,
    "FuzzToken",
    fuzzToken.target,
    "Honey",
    honeyAddress,
    "BeaFarm",
    beraFarm.target,
    "BeraCub",
    beraCub.target,
    "NFTMarketplace",
    nftMarketplace.target
  );

  return { beraCub, beraFarm, fuzzToken, nftMarketplace };
}

export async function deployTokenTests() {
  const { beraCub, beraFarm, fuzzToken, nftMarketplace } =
    await ignition.deploy(DeployLocal, {
      parameters: paramsTokenTests,
    });

  const { price, honeyAddress } = await deployLiquid(
    fuzzToken.target as string
  );

  console.log(
    "All deployed, $Fuzz Price at:",
    price,
    "FuzzToken",
    fuzzToken.target,
    "Honey",
    honeyAddress,
    "BeaFarm",
    beraFarm.target,
    "BeraCub",
    beraCub.target,
    "NFTMarketplace",
    nftMarketplace.target
  );

  return { beraCub, beraFarm, fuzzToken, nftMarketplace };
}
