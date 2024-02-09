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
    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await fuzzToken.connect(owner).enable_trading();
  });

  describe("Bera Farm Tests", async function () {
    it("Estimates daily rewards accurately based on the daily interest set", async function () {
      const dailyInterest = await beraFarm.currentDailyRewards();

      expect(ethers.formatEther(dailyInterest)).to.equal("6.0");
    });
    it("Should pay out the correct amount of Fuzz Token for a 24 hour period when the user claims", async function () {
      const expectedTotalCost = ethers.parseEther("10");

      await expect(
        mockHoney.connect(owner).approve(beraFarm.target, expectedTotalCost)
      ).to.not.be.reverted;

      const buyBerasHoneyTx = await beraFarm.connect(owner).buyBeraCubsHoney(2);

      await buyBerasHoneyTx.wait(1);

      const stakingDuration = 24 * 3600;

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      const claimRewardsTx = await beraFarm.connect(owner).claim();

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
          expect(event.args.sender).to.equal(owner.address);
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

    it("Should enable owner to change daily interest", async function () {});
    it("Should calculate rewards correctly based on the new daily interest set", async function () {});
    it("Should allow the owner to change the tax rate", async function () {});
    it("Should calculate rewards correctly based on the new tax rate", async function () {});
  });
});
