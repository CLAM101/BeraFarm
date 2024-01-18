import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../../typechain-types";
import { oracleABI } from "../testHelpers/ABI/oracle-abi";
import { ERC20DexABI } from "../testHelpers/ABI/ERC20dex-abi";
import { ERC20ABI } from "../testHelpers/ABI/ERC20-abi";

describe("Bera Farm Tests", async function () {
  let beraCub: BeraCub,
    beraFarm: BeraFarm,
    fuzzToken: FuzzToken,
    mockUSDC: MockHoney,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner;
  const oracleAddress = "0x9202Af6Ce925b26AE6B25aDfff0B2705147e195F";
  const ERC20DexAddress = "0x0D5862FDBDD12490F9B4DE54C236CFF63B038074";
  const otherDexAddress = "0x9D0FBF9349F646F1435072F2B0212084752EF460";
  const poolAddress = "0x0000000000000000000000000000000000696969";
  const honeyTokenAddress = "0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B";

  //   before(async function () {
  const signers = await ethers.getSigners();
  //   });

  describe("Bera Farm Tests", async function () {
    it("Gets Currency pairs from Oracle contract on testnet", async function () {
      const oracleContract = new ethers.Contract(
        oracleAddress,
        oracleABI,
        signers[0]
      );

      const currencyPairs = await oracleContract.getAllCurrencyPairs();

      console.log("All currency pairs:", currencyPairs);

      const ethusd = currencyPairs[2];

      const price = await oracleContract.getPrice(ethusd);

      console.log("Price of ETH in USD:", price);

      // const erc20DexContract = new ethers.Contract(
      //   ERC20DexAddress,
      //   ERC20DexABI,
      //   signers[0]
      // );

      // const fetchedLiquidity = await erc20DexContract.getLiquidity(poolAddress);

      // console.log("Liquidity of pool:", fetchedLiquidity);

      const honeyContract = new ethers.Contract(
        honeyTokenAddress,
        ERC20ABI,
        signers[0]
      );

      const decimals = await honeyContract.decimals();

      console.log("Honey Decimals:", decimals);
    });
  });
});
