import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployContracts } from "./testHelpers/deploy-contracts";
import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../typechain-types";

describe("Bera Farm Tests", async function () {
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
    await beraFarm.connect(owner).openBuyBeraCubs();
    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBonding();
  });

  describe("Bera Farm Tests", async function () {
    it("Allows the purchase of two Bera Cubs for 20 fuzzToken", async function () {
      await expect(
        fuzzToken
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("20"))
      ).to.not.be.reverted;

      const amountOfBeraCubs = "2";
      const buyAndStakeBeraCubTx = await beraFarm
        .connect(owner)
        .buyBeraCubs(amountOfBeraCubs);

      const finalizedTx = await buyAndStakeBeraCubTx.wait();

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BoughtBeraCubs") {
          console.log("Bought Bera Cub event args", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
        }
      });

      const beraCubBalance = await beraCub.balanceOf(owner.address);

      console.log("Bera Cub Balance", ethers.formatUnits(beraCubBalance, 0));

      expect(beraCubBalance).to.equal(amountOfBeraCubs);
    });

    it("Estimates daily rewards accurately based on the daily interest set", async function () {
      const dailyInterest = await beraFarm.currentDailyRewards();

      expect(ethers.formatEther(dailyInterest)).to.equal("6.0");
    });

    it("Should pay out the correct amount of Fuzz Token for a 24 hour period when the user claims", async function () {
      const stakingDuration = 24 * 3600;

      const expectedReward = ethers.parseEther("12");

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const claimRewardsTx = await beraFarm.connect(owner).claim();

      const finalizedTx = await claimRewardsTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "RewardsClaimed") {
          console.log("Rewards Claimed", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amountOfFuzz).to.be.closeTo(
            expectedReward,
            ethers.parseEther("1")
          );
        }
      });
    });

    it("Should allow the user to bond Bera Cubs using Honey, transfer Honey to the treasury and transfer the Bera Cubs to the users wallet", async function () {
      const bondCost = await beraFarm.getBondCost();

      //based on Bera Price of 1000 and liquidity of 1 000 000 Fuzz and 200 Bera added to pool
      const expectedBondCost = ethers.parseEther("1.7");

      console.log("Bond Cost In Test", ethers.formatEther(bondCost) + "$HONEY");

      expect(bondCost).to.equal(expectedBondCost);

      // expected cost of bonding two BeraCubs with Honey
      const expectedTotalCost = ethers.parseEther("3.4");

      await expect(
        mockHoney.connect(owner).approve(beraFarm.target, expectedTotalCost)
      ).to.not.be.reverted;

      const amountOfBeraCubsToBond = "2";
      const expectedTotalBeraCubBalance = "4";

      const bondBeraCubTx = await beraFarm
        .connect(owner)
        .bondBeraCubs(amountOfBeraCubsToBond);

      const finalizedTx = await bondBeraCubTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BeraCubsBonded") {
          console.log("BeraCubsBonded args", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubsToBond);
        }
      });

      const beraCubBalance = await beraCub.balanceOf(owner.address);

      console.log("Chicken Balance", ethers.formatUnits(beraCubBalance, 0));

      expect(beraCubBalance).to.equal(expectedTotalBeraCubBalance);
    });

    it("Allows the owner to award bera Cubs", async function () {
      const awardBeraCubTx = await beraFarm
        .connect(owner)
        .awardBeraCubs(thirdAccount.address, 5);

      const finalizedTx = await awardBeraCubTx.wait(1);

      const nodeBalance = await beraCub.balanceOf(thirdAccount.address);

      expect(nodeBalance).to.equal(5);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BeraCubsAwarded") {
          console.log("Bera Cubs Compounded args", event.args);
          expect(event.args.sender).to.equal(thirdAccount.address);
          expect(event.args.amountOfCubs).to.equal(5);
        }
      });
    });

    it("Should Allow a user to Compound Bera Cubs", async function () {
      await expect(
        beraFarm.connect(owner).awardBeraCubs(fourthAccount.address, 1)
      ).to.not.be.reverted;

      const stakingDuration = 48 * 3600;

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const expectedReward = ethers.parseEther("6");

      const totalClaimableRewards = await beraFarm.getTotalClaimable(
        fourthAccount.address
      );

      console.log(
        "Total Claimable Rewards in compound test",
        totalClaimableRewards
      );

      const compoundableBeraCubs = await beraFarm
        .connect(fourthAccount)
        .getAmountOfCoupoundableBeraCubs();

      console.log("Compoundable Bera Cubs", compoundableBeraCubs);

      expect(compoundableBeraCubs).to.equal(1);

      const compoundTx = await beraFarm
        .connect(fourthAccount)
        .compoundBeraCubs(ethers.formatUnits(compoundableBeraCubs, 0));

      const finalizedTx = await compoundTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BeraCubCompounded") {
          console.log("Bera Cubs Compounded args", event.args);
          expect(event.args.sender).to.equal(fourthAccount.address);
          expect(event.args.amountOfCubs).to.equal(1);
        }
      });
    });
  });
});
