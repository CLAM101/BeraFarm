import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Log } from "@ethersproject/abstract-provider";
import { deployRewardsAndClaims } from "./testHelpers/deployContractsIgnition";
import { Helpers } from "../helpers/Helpers";
const networkHelpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Emissions Tax, Rewards and controls Tests", async function () {
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

    const loadedFixture = await loadFixture(deployRewardsAndClaims);
    const helpers = await Helpers.createAsync(ethers);

    honeyContract = await helpers.contracts.getHoneyContract();
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

    const transferAddresses = [thirdAccount, otherAccount];

    const transferDetails = transferAddresses.map((signer) => {
      return {
        address: signer.address,
        amount: ethers.parseEther("2000"),
      };
    });

    await helpers.multiTransfer(honeyContract, transferDetails);

    // open platform for testing
    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await fuzzToken.connect(owner).enableTrading();
  });

  describe("Rewards & Claims Tests", async function () {
    it("Estimates daily rewards accurately based on the daily interest set", async function () {
      const dailyInterest = await beraFarm.currentDailyRewards();

      expect(ethers.formatEther(dailyInterest)).to.equal("6.0");
    });
    it("Should pay out the correct amount of Fuzz Token for a 24 hour period when the user claims", async function () {
      const expectedTotalCost = ethers.parseEther("10");

      await expect(
        honeyContract
          .connect(thirdAccount)
          .approve(beraFarm.target, expectedTotalCost)
      ).to.not.be.reverted;

      const buyBerasHoneyTx = await beraFarm
        .connect(thirdAccount)
        .buyBeraCubsHoney(2);

      await buyBerasHoneyTx.wait(1);

      const stakingDuration = 24 * 3600;

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const claimRewardsTx = await beraFarm.connect(thirdAccount).claim();

      const finalizedTx = await claimRewardsTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      const expectedAfterTax = ethers.parseEther("10.2");

      const expectedTaxAmount = ethers.parseEther("1.8");

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "RewardsClaimed") {
          expect(event.args.sender).to.equal(thirdAccount.address);
          expect(event.args.rewardAfterTax).to.be.closeTo(
            expectedAfterTax,
            ethers.parseEther("1")
          );
          expect(event.args.tax).to.be.closeTo(
            expectedTaxAmount,
            ethers.parseEther("1")
          );
        }
      });
    });

    it("Should enable owner to change daily interest", async function () {
      // this is of the baseline daily interest which is initially set to 10 units
      const newDailyInterestPercentage = 80;

      await expect(
        beraFarm.connect(owner).setDailyInterest(newDailyInterestPercentage)
      ).to.not.be.reverted;
    });
    it("Should calculate rewards correctly based on the new daily interest set", async function () {
      const dailyInterest = await beraFarm.currentDailyRewards();

      expect(dailyInterest).to.equal(ethers.parseEther("8.0"));
    });

    it("Should allow the owner to change the tax rate ", async function () {
      await expect(beraFarm.connect(owner).setFuzzTax(10)).to.not.be.reverted;
    });
    it("Should estimate tax correctly based on adjusted rate and rewards", async function () {
      const expectedTotalCost = ethers.parseEther("20");

      //for rewards set to 8 units per 24h and tax set to 10% of rewards
      const expectedTaxOnRewards = ethers.parseEther("1.6");

      await expect(
        honeyContract
          .connect(otherAccount)
          .approve(beraFarm.target, expectedTotalCost)
      ).to.not.be.reverted;

      const buyBerasHoneyTx = await beraFarm
        .connect(otherAccount)
        .buyBeraCubsHoney(2);

      await buyBerasHoneyTx.wait(1);

      const stakingDuration = 24 * 3600;

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const returnedTaxEstimate = await beraFarm
        .connect(otherAccount)
        .getTaxEstimate();

      expect(returnedTaxEstimate).to.be.closeTo(
        expectedTaxOnRewards,
        ethers.parseEther("0.1")
      );
    });

    it("Should pay out claim correctly based on adjusted rewards and tax rate", async function () {
      const claimRewardsTx = await beraFarm.connect(otherAccount).claim();

      const finalizedTx = await claimRewardsTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      const expectedAfterTax = ethers.parseEther("14.4");

      const expectedTaxAmount = ethers.parseEther("1.6");

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "RewardsClaimed") {
          expect(event.args.sender).to.equal(otherAccount.address);
          expect(event.args.rewardAfterTax).to.be.closeTo(
            expectedAfterTax,
            ethers.parseEther("1")
          );
          expect(event.args.tax).to.be.closeTo(
            expectedTaxAmount,
            ethers.parseEther("1")
          );
        }
      });
    });

    it("Should start to calculate rewards as soon as a cub is transferred into a wallet", async function () {
      //this test needs to ensure that a users claims status is updated when a cub enters or leaves their wallet to ensure the correct amount of rewards due is always maintained

      await expect(
        beraFarm.connect(owner).awardBeraCubs(fourthAccount.address, 1)
      ).to.not.be.reverted;

      await expect(
        beraCub
          .connect(fourthAccount)
          .setApprovalForAll(fifthAccount.address, true)
      ).to.not.be.reverted;

      await expect(
        beraCub
          .connect(fourthAccount)
          .transferFrom(fourthAccount.address, fifthAccount.address, 4)
      ).to.not.be.reverted;

      const stakingDuration = 24 * 3600;

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const totalClaimable = await beraFarm.getTotalClaimable(
        fifthAccount.address
      );
    });
  });
});
