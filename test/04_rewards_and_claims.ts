import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployContracts } from "./testHelpers/deploy-contracts";
import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../typechain-types";

describe("Emissions Tax, Rewards and controls Tests", async function () {
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

  before(async function () {
    const fixture = await loadFixture(deployContracts);
    owner = fixture.owner;
    mockHoney = fixture.mockHoney;
    otherAccount = fixture.otherAccount;
    thirdAccount = fixture.thirdAccount;
    fourthAccount = fixture.fourthAccount;
    fifthAccount = fixture.fifthAccount;
    sixthAccount = fixture.sixthAccount;
    beraCub = fixture.beraCub;
    fuzzToken = fixture.fuzzToken;
    beraFarm = fixture.beraFarm;

    // open platform for testing
    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await beraCub.connect(owner).openMinting();
    await fuzzToken.connect(owner).enableTrading();
  });

  describe("Bera Farm Tests", async function () {
    it("Estimates daily rewards accurately based on the daily interest set", async function () {
      const dailyInterest = await beraFarm.currentDailyRewards();

      console.log("Initial Daily Interest", ethers.formatEther(dailyInterest));

      expect(ethers.formatEther(dailyInterest)).to.equal("6.0");
    });
    it("Should pay out the correct amount of Fuzz Token for a 24 hour period when the user claims", async function () {
      const expectedTotalCost = ethers.parseEther("10");

      await expect(
        mockHoney
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
          console.log("Rewards Claimed", event.args);
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

      console.log("New Daily Interest", ethers.formatEther(dailyInterest));

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
        mockHoney
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

      console.log(
        "Returned Tax Estimate",
        ethers.formatEther(returnedTaxEstimate)
      );

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
          console.log("Rewards Claimed After Rates adjust", event.args);
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
  });
});
