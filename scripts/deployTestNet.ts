import hre from "hardhat";
import DeployTestNet from "../ignition/modules/modules-testnet/DeployTestNet";
import paramsTestNet from "../ignition/paramsTestNet.json";
import { ethers } from "hardhat";
import { Helpers } from "../helpers/Helpers";

async function main() {
  try {
    const { beraCub, beraFarm, fuzzToken, mockHoney, nftMarketplace } =
      await hre.ignition.deploy(DeployTestNet, {
        parameters: paramsTestNet,
      });

    const helpers = await Helpers.createAsync(ethers);
    const honeyAddress = mockHoney.target as string;

    const fuzzAmount = ethers.parseEther("200000");
    const honeyAmount = ethers.parseEther("400000");

    await helpers.multiCallCreatePoolAddLiquid(
      fuzzToken.target,
      honeyAmount,
      fuzzAmount,
      honeyAddress
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
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);
