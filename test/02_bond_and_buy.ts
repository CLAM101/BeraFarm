import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployContracts, setSnapShotId } from "./testHelpers/deploy-contracts";
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
} from "./testHelpers/deploy-contracts";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");
async function deployWithConfig() {
  setMaxSupplyForHoney(6);
  setLimitBeforeEmissions(2);
  setLimitBeforeFullTokenTrading(5);
  setMaxSupplyFirstBatch(3);

  return deployContracts();
}

const fixture = async () => {
  return deployWithConfig();
};

describe("Bond and Buy", async function () {
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
    // beraFarm = loadedFixture.beraFarm;

    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await fuzzToken.connect(owner).enableTrading();
    await beraCub.connect(owner).openMinting();
  });

  describe("Bond and Buy Tests", async function () {
    it("Allows Purchase of Bera Cubs with Honey at 5 $Honey per Cub", async function () {
      const expectedTransactionTotal = ethers.parseEther("10");
      await expect(
        mockHoney
          .connect(owner)
          .approve(beraFarm.target, expectedTransactionTotal)
      ).to.not.be.reverted;

      const amountOfBeraCubs = "2";
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
    });
    it("In the event of the minted amount falling within both price brackets the buy function applies the correct total cost to the transaction", async function () {
      const expectedTransactionTotal = ethers.parseEther("35");
      await expect(
        mockHoney
          .connect(otherAccount)
          .approve(beraFarm.target, expectedTransactionTotal)
      ).to.not.be.reverted;

      const amountOfBeraCubs = "4";
      const buyBeraCubsHoneyTx = await beraFarm
        .connect(otherAccount)
        .buyBeraCubsHoney(amountOfBeraCubs);

      const finalizedTx = await buyBeraCubsHoneyTx.wait();

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BoughtBeraCubsHoney") {
          console.log("Bought Bera Cub 10 $Honey", event.args);
          expect(event.args.sender).to.equal(otherAccount.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.equal(
            expectedTransactionTotal
          );
        }
      });

      const beraCubBalance = await beraCub.balanceOf(otherAccount.address);

      console.log(
        "Bera Cub Balance at 10 $Honey pre cub",
        ethers.formatUnits(beraCubBalance, 0)
      );

      expect(beraCubBalance).to.equal(amountOfBeraCubs);
    });

    it("Should allow the user to bond Bera Cubs using Honey, transfer Honey to the treasury and transfer the Bera Cubs to the users wallet", async function () {
      const bondCost = await beraFarm.getBondCost();

      //based on Bera Price of 1000 and liquidity of 1 000 000 Fuzz and 200 Bera added to pool
      const expectedBondCost = ethers.parseEther("0.18");

      console.log("Bond Cost In Test", ethers.formatEther(bondCost) + "$HONEY");

      expect(bondCost).to.equal(expectedBondCost);

      // expected cost of bonding two BeraCubs with Honey
      const expectedTotalCost = ethers.parseEther("0.36");

      await expect(
        mockHoney
          .connect(thirdAccount)
          .approve(beraFarm.target, expectedTotalCost)
      ).to.not.be.reverted;

      const amountOfBeraCubsToBond = "2";
      const expectedTotalBeraCubBalance = "2";

      const bondBeraCubTx = await beraFarm
        .connect(thirdAccount)
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
          expect(event.args.sender).to.equal(thirdAccount.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubsToBond);
          expect(event.args.transactionTotal).to.equal(expectedTotalCost);
        }
      });

      const beraCubBalance = await beraCub.balanceOf(thirdAccount.address);

      const treasuryBalance = await mockHoney.balanceOf(sixthAccount.address);

      console.log("Treasury Balance", ethers.formatUnits(treasuryBalance, 0));

      expect(treasuryBalance).to.equal(ethers.parseEther("45.36"));

      console.log("Bera Cub Balance", ethers.formatUnits(beraCubBalance, 0));

      expect(beraCubBalance).to.equal(expectedTotalBeraCubBalance);

      const farmerState = await beraFarm.getFarmerByAddress(
        thirdAccount.address
      );

      expect(farmerState.beraCubsBonded).to.equal(expectedTotalBeraCubBalance);
      expect(farmerState.lastUpdate).to.be.greaterThan(0);

      console.log("Farmer State After Bond", farmerState);
    });

    it("Allows purchase of Cubs for Fuzz at the latest compound price and after all Honey cubs minted", async function () {
      const currentPricePerCub =
        (await beraFarm.maxCompoundCostSoFar()) as unknown as number;

      const amountOfBeraCubs = "1";

      console.log(
        "Expected Transaction Total in fuzz buy test",
        currentPricePerCub
      );

      await expect(
        fuzzToken
          .connect(owner)
          .transfer(fourthAccount.address, currentPricePerCub)
      ).to.not.be.reverted;

      await expect(
        fuzzToken
          .connect(fourthAccount)
          .approve(beraFarm.target, currentPricePerCub)
      ).to.not.be.reverted;

      const buyBeraCubsFuzzTx = await beraFarm
        .connect(fourthAccount)
        .buyBeraCubsFuzz(amountOfBeraCubs);

      const finalizedTx = await buyBeraCubsFuzzTx.wait();

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BoughtBeraCubsFuzz") {
          console.log("Bought Bera Cub for $Fuzz", event.args);
          expect(event.args.sender).to.equal(fourthAccount.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.equal(currentPricePerCub);
        }
      });

      const beraCubBalance = await beraCub.balanceOf(fourthAccount.address);

      console.log(
        `Bera Cub Balance at ${ethers.formatEther(
          currentPricePerCub
        )} $Fuzz pre cub`,
        ethers.formatUnits(beraCubBalance, 0)
      );

      expect(beraCubBalance).to.equal(amountOfBeraCubs);
    });

    it("Allows the owner to award bera Cubs", async function () {
      const awardBeraCubTx = await beraFarm
        .connect(owner)
        .awardBeraCubs(fifthAccount.address, 5);

      const finalizedTx = await awardBeraCubTx.wait(1);

      const nodeBalance = await beraCub.balanceOf(fifthAccount.address);

      expect(nodeBalance).to.equal(5);

      let logs: Log[] = [];

      if (finalizedTx) {
        logs = finalizedTx.logs as unknown as Log[];
      }

      logs.forEach((log: Log) => {
        const event = beraFarm.interface.parseLog(log);

        if (event && event.name === "BeraCubsAwarded") {
          console.log("Bera Cubs Compounded args", event.args);
          expect(event.args.sender).to.equal(fifthAccount.address);
          expect(event.args.amountOfCubs).to.equal(5);
        }
      });
    });
  });
});
