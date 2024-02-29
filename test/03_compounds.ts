import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployContracts } from "./testHelpers/deploy-contracts";
import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../typechain-types";
import {
  setMaxCubSupply,
  setMaxSupplyFirstBatch,
  setLimitBeforeEmissions,
  setMaxSupplyForHoney,
  setLimitBeforeFullTokenTrading,
  setInitialFuzzSupply,
  setMaxFuzzSupply,
  snapShotId,
  setSnapShotId,
} from "./testHelpers/deploy-contracts";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployWithConfig() {
  setMaxSupplyForHoney(5);
  setLimitBeforeEmissions(2);
  setLimitBeforeFullTokenTrading(5);
  setMaxSupplyFirstBatch(3);

  return deployContracts();
}
describe("Compounding Tests", async function () {
  let beraCub: BeraCub,
    beraFarm: BeraFarm,
    fuzzToken: FuzzToken,
    mockHoney: MockHoney,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner;

  const fixture = async () => {
    return deployWithConfig();
  };

  before(async function () {
    await helpers.reset("https://rpc.ankr.com/berachain_testnet", 810321);

    const loadedFixture = await loadFixture(fixture);
    owner = loadedFixture.owner;
    mockHoney = loadedFixture.mockHoney;
    otherAccount = loadedFixture.otherAccount;
    thirdAccount = loadedFixture.thirdAccount;
    fourthAccount = loadedFixture.fourthAccount;
    fifthAccount = loadedFixture.fifthAccount;
    sixthAccount = loadedFixture.sixthAccount;
    beraCub = loadedFixture.beraCub;
    fuzzToken = loadedFixture.fuzzToken;
    beraFarm = loadedFixture.beraFarm;

    // open platform for testing
    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await beraCub.connect(owner).openMinting();
    await fuzzToken.connect(owner).enableTrading();
  });

  describe("Bera Farm Tests", async function () {
    it("Effectively Compounds Cubs on a 5 fuzz interval", async function () {
      const expectedTransactionTotal = ethers.parseEther("15");
      await expect(
        mockHoney
          .connect(owner)
          .approve(beraFarm.target, expectedTransactionTotal)
      ).to.not.be.reverted;

      const amountOfBeraCubs = "3";
      const buyBeraCubsHoneyTx = await beraFarm
        .connect(owner)
        .buyBeraCubsHoney(amountOfBeraCubs);

      const finalizedTx = await buyBeraCubsHoneyTx.wait();

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BoughtBeraCubsHoney") {
          console.log("Bought Bera Cub 5 $Honey", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.equal(
            expectedTransactionTotal
          );
        }
      });

      const beraCubBalance = await beraCub.balanceOf(owner.address);

      console.log(
        "Bera Cub Balance at 5 $Honey per cub",
        ethers.formatUnits(beraCubBalance, 0)
      );

      expect(beraCubBalance).to.equal(amountOfBeraCubs);

      const stakingDuration = 144 * 3600;

      const expectedReward = ethers.parseEther("108");

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const totalClaimable = await beraFarm.getTotalClaimable(owner.address);

      console.log(
        "Total Claimable after 24 hours on 3 Cubs",
        ethers.formatUnits(totalClaimable, 0)
      );

      expect(totalClaimable).to.equal(expectedReward);

      const expectedCompoundCost1 = ethers.parseEther("5");

      let maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      console.log(
        "Max Bond Cost So Far",
        ethers.formatEther(maxCompoundCostSoFar)
      );

      expect(maxCompoundCostSoFar).to.equal(expectedCompoundCost1);

      const compoundTx = await beraFarm.connect(owner).compoundBeraCubs();

      const finalizedCompound1 = await compoundTx.wait();

      let compound1Logs: Log[] = [];

      if (finalizedTx) {
        compound1Logs = finalizedCompound1!.logs as unknown as Log[];
      }

      compound1Logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BeraCubCompounded") {
          console.log("Compounded Bera Cub", event.args);
          expect(event.args.sender).to.equal(owner.address);

          expect(event.args.compoundCost).to.equal(expectedCompoundCost1);
        }
      });

      const beraCubBalanceAfterCompound = await beraCub.balanceOf(
        owner.address
      );

      expect(beraCubBalanceAfterCompound).to.equal(ethers.formatUnits(4, 0));

      maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      console.log(
        "Max Bond Cost So Far after 1 compound",
        ethers.formatEther(maxCompoundCostSoFar)
      );

      expect(maxCompoundCostSoFar).to.equal(ethers.parseEther("10"));

      const farmerAfterCompound = await beraFarm
        .connect(owner)
        .getFarmerByAddress(owner.address);

      console.log("Farmer After Compound", farmerAfterCompound);
    });

    it("Effectively Compounds Cubs on a 10 fuzz interval", async function () {
      const expectedCompoundCost2 = ethers.parseEther("10");

      let maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      console.log(
        "Max Bond Cost So Far",
        ethers.formatEther(maxCompoundCostSoFar)
      );

      expect(maxCompoundCostSoFar).to.equal(expectedCompoundCost2);

      const compoundTx = await beraFarm.connect(owner).compoundBeraCubs();

      const finalizedCompound2 = await compoundTx.wait();

      let compound2Logs: Log[] = [];

      if (finalizedCompound2) {
        compound2Logs = finalizedCompound2!.logs as unknown as Log[];
      }

      compound2Logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BeraCubCompounded") {
          console.log("Compounded Bera Cub", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.compoundCost).to.equal(expectedCompoundCost2);
        }
      });

      const beraCubBalanceAfterCompound = await beraCub.balanceOf(
        owner.address
      );

      expect(beraCubBalanceAfterCompound).to.equal(ethers.formatUnits(5, 0));

      maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      console.log(
        "Max Bond Cost So Far after 2 compounds",
        ethers.formatEther(maxCompoundCostSoFar)
      );

      expect(maxCompoundCostSoFar).to.equal(ethers.parseEther("15"));

      const farmerAfterCompound = await beraFarm
        .connect(owner)
        .getFarmerByAddress(owner.address);

      console.log("Farmer After Compound 2", farmerAfterCompound);
    });

    it("Will not compound at a cost higher than the set limit of 25 $Fuzz", async function () {
      const expectedCompoundCostMax = ethers.parseEther("25");

      let maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      console.log(
        "Max Bond Cost So Far",
        ethers.formatEther(maxCompoundCostSoFar)
      );

      const farmerBeforeCompound = await beraFarm
        .connect(owner)
        .getFarmerByAddress(owner.address);

      console.log("Farmer Before Compound to Max", farmerBeforeCompound);

      for (let index = 0; index < 3; index++) {
        await beraFarm.connect(owner).compoundBeraCubs();

        const costAfterCompound = await beraFarm.maxCompoundCostSoFar();

        console.log(
          "Cost After Compound",
          ethers.formatEther(costAfterCompound)
        );
      }

      const compoundTx = await beraFarm.connect(owner).compoundBeraCubs();

      await compoundTx.wait();

      maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      console.log(
        "Max Bond Cost So Far after 2 compounds",
        ethers.formatEther(maxCompoundCostSoFar)
      );

      expect(maxCompoundCostSoFar).to.equal(expectedCompoundCostMax);
    });
  });
});
