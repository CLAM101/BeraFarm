import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployCompounds } from "./testHelpers/deployContractsIgnition";
import { Helpers } from "../helpers/Helpers";
const networkHelpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Compounding Tests", async function () {
  let beraCub: any,
    beraFarm: any,
    fuzzToken: any,
    honeyContract: any,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner,
    seventhAccount: HardhatEthersSigner,
    eighthAccount: HardhatEthersSigner;

  before(async function () {
    await networkHelpers.reset("https://bartio.rpc.berachain.com/", 1886012);
    const loadedFixture = await loadFixture(deployCompounds);

    const helpers = await Helpers.createAsync(ethers);

    beraCub = loadedFixture.beraCub;
    fuzzToken = loadedFixture.fuzzToken;
    beraFarm = loadedFixture.beraFarm;

    [
      owner,
      otherAccount,
      thirdAccount,
      fourthAccount,
      fifthAccount,
      sixthAccount,
      seventhAccount,
      eighthAccount,
    ] = await ethers.getSigners();

    honeyContract = await helpers.contracts.getHoneyContract();

    await honeyContract.transfer(owner.address, ethers.parseEther("2000"));

    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await fuzzToken.connect(owner).enableTrading();
  });

  describe("Compound Tests", async function () {
    it("Effectively Compounds Cubs on a 5 fuzz interval", async function () {
      const expectedTransactionTotal = ethers.parseEther("15");
      await expect(
        honeyContract
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
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.be.closeTo(
            expectedTransactionTotal,
            ethers.parseEther("0.01")
          );
        }
      });

      const beraCubBalance = await beraCub.balanceOf(owner.address);

      expect(beraCubBalance).to.equal(amountOfBeraCubs);

      const stakingDuration = 144 * 3600;

      const expectedReward = ethers.parseEther("108");

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const totalClaimable = await beraFarm.getTotalClaimable(owner.address);

      expect(totalClaimable).to.equal(expectedReward);

      const expectedCompoundCost1 = ethers.parseEther("5");

      let maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

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
          expect(event.args.sender).to.equal(owner.address);

          expect(event.args.compoundCost).to.equal(expectedCompoundCost1);
        }
      });

      const beraCubBalanceAfterCompound = await beraCub.balanceOf(
        owner.address
      );

      expect(beraCubBalanceAfterCompound).to.equal(ethers.formatUnits(4, 0));

      maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      expect(maxCompoundCostSoFar).to.equal(ethers.parseEther("10"));

      const farmerAfterCompound = await beraFarm
        .connect(owner)
        .getFarmerByAddress(owner.address);
    });

    it("Effectively Compounds Cubs on a 10 fuzz interval", async function () {
      const expectedCompoundCost2 = ethers.parseEther("10");

      let maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

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
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.compoundCost).to.equal(expectedCompoundCost2);
        }
      });

      const beraCubBalanceAfterCompound = await beraCub.balanceOf(
        owner.address
      );

      expect(beraCubBalanceAfterCompound).to.equal(ethers.formatUnits(5, 0));

      maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      expect(maxCompoundCostSoFar).to.equal(ethers.parseEther("15"));

      const farmerAfterCompound = await beraFarm
        .connect(owner)
        .getFarmerByAddress(owner.address);
    });

    it("Will not compound at a cost higher than the set limit of 25 $Fuzz", async function () {
      const expectedCompoundCostMax = ethers.parseEther("25");

      let maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      const farmerBeforeCompound = await beraFarm
        .connect(owner)
        .getFarmerByAddress(owner.address);

      for (let index = 0; index < 3; index++) {
        await beraFarm.connect(owner).compoundBeraCubs();

        const costAfterCompound = await beraFarm.maxCompoundCostSoFar();
      }

      const compoundTx = await beraFarm.connect(owner).compoundBeraCubs();

      await compoundTx.wait();

      maxCompoundCostSoFar = await beraFarm.maxCompoundCostSoFar();

      expect(maxCompoundCostSoFar).to.equal(expectedCompoundCostMax);
    });
  });
});
