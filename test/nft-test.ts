import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployContracts } from "./testHelpers/deploy-contracts";
import {
  BetterChicken,
  ChickenFarmButBetter,
  BetterEgg,
  MockUsdc,
} from "../typechain-types";

describe("Better Chicken NFT Tests", async function () {
  let betterChicken: BetterChicken,
    chickenFarmButBetter: ChickenFarmButBetter,
    betterEgg: BetterEgg,
    mockUSDC: MockUsdc,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner;

  before(async function () {
    const fixture = await loadFixture(deployContracts);
    owner = fixture.owner;
    mockUSDC = fixture.mockUSDC;
    otherAccount = fixture.otherAccount;
    thirdAccount = fixture.thirdAccount;
    fourthAccount = fixture.fourthAccount;
    fifthAccount = fixture.fifthAccount;
    sixthAccount = fixture.sixthAccount;
    betterChicken = fixture.betterChicken;
    betterEgg = fixture.betterEgg;
    chickenFarmButBetter = fixture.chickenFarmButBetter;
  });

  describe("Better Chicken Farm Tests", async function () {
    it("Allows owner to set platform state to live", async function () {
      await expect(chickenFarmButBetter.connect(owner).setPlatformState(true))
        .to.not.be.reverted;
    });
    it("Allows the purchase of two chickens for 20 BetterEgg", async function () {
      await expect(
        betterEgg
          .connect(owner)
          .approve(chickenFarmButBetter.target, ethers.parseEther("20"))
      ).to.not.be.reverted;

      const amountOfChickens = "2";
      const buyAndStakeChickenTx = await chickenFarmButBetter
        .connect(owner)
        .buyChickens(amountOfChickens);

      const finalizedTx = await buyAndStakeChickenTx.wait();

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = chickenFarmButBetter.interface.parseLog(log);

        if (event && event.name === "BoughtChickens") {
          console.log("Bought Chickens event args", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amount).to.equal(amountOfChickens);
        }
      });

      const chickenBalance = await betterChicken.balanceOf(owner.address);

      console.log("Chicken Balance", ethers.formatUnits(chickenBalance, 0));

      expect(chickenBalance).to.equal(amountOfChickens);
    });

    it("estimates daily rewards accurately based on the daily interest set", async function () {
      const dailyInterest = await chickenFarmButBetter.currentDailyRewards();

      expect(ethers.formatEther(dailyInterest)).to.equal("6.0");
    });

    it("Should pay out the correct amount of Better egg for a 24 hour period when the user claims", async function () {
      const stakingDuration = 24 * 3600;

      const expectedReward = ethers.parseEther("12");

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const claimRewardsTx = await chickenFarmButBetter.connect(owner).claim();

      const finalizedTx = await claimRewardsTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = chickenFarmButBetter.interface.parseLog(log);

        if (event && event.name === "RewardsClaimed") {
          console.log("Rewards Claimed", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amount).to.equal(expectedReward);
        }
      });
    });

    it("Should allow the user to bond chickens using USDC, transfer USDC to the treasury and transfer the chickens to the users wallet", async function () {
      const bondCost = await chickenFarmButBetter.getBondCost();

      console.log("Bond Cost", ethers.formatUnits(bondCost, 6));

      await expect(
        mockUSDC
          .connect(owner)
          .approve(chickenFarmButBetter.target, ethers.parseEther("20"))
      ).to.not.be.reverted;

      const amountOfChickensToBond = "2";
      const expectedTotalChickenBalance = "4";

      const bondChickenTx = await chickenFarmButBetter
        .connect(owner)
        .bondChickens(amountOfChickensToBond);

      const finalizedTx = await bondChickenTx.wait(1);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = chickenFarmButBetter.interface.parseLog(log);

        if (event && event.name === "ChickensBonded") {
          console.log("ChickensBonded", event.args);
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amount).to.equal(amountOfChickensToBond);
        }
      });

      const chickenBalance = await betterChicken.balanceOf(owner.address);

      console.log("Chicken Balance", ethers.formatUnits(chickenBalance, 0));

      expect(chickenBalance).to.equal(expectedTotalChickenBalance);
    });
  });
});
