import hre from "hardhat";
import DeployLocal from "../ignition/modules/modules-local/DeployLocal";
import paramatersLocal from "../ignition/paramatersLocal.json";
import { ethers } from "hardhat";
import { Helpers } from "../helpers/Helpers";

async function main() {
  try {
    const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";

    const { beraCub, beraFarm, fuzzToken, nftMarketplace } =
      await hre.ignition.deploy(DeployLocal, {
        parameters: paramatersLocal,
      });

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
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);
