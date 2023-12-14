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
} from "../typechain-types";

describe("Better Chicken NFT Tests", async function () {
  let betterChicken: BetterChicken,
    chickenFarmButBetter: ChickenFarmButBetter,
    betterEgg: BetterEgg,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner;

  before(async function () {
    const fixture = await loadFixture(deployContracts);
    owner = fixture.owner;
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
  });
});
