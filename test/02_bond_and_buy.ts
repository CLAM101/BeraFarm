import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployBondAndBuy } from "./testHelpers/deployContractsIgnition";
const networkHelpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");
import { Helpers } from "../helpers/Helpers";

describe("Bond and Buy", async function () {
  let beraCub: any,
    beraFarm: any,
    fuzzToken: any,
    honeyContract: any,
    helpers: Helpers,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner,
    seventhAccount: HardhatEthersSigner,
    eighthAccount: HardhatEthersSigner;

  before(async function () {
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
    await networkHelpers.reset("https://bartio.rpc.berachain.com/", 1886012);
    const loadedFixture = await loadFixture(deployBondAndBuy);

    beraCub = loadedFixture.beraCub;
    fuzzToken = loadedFixture.fuzzToken;
    beraFarm = loadedFixture.beraFarm;

    helpers = await Helpers.createAsync(ethers);

    honeyContract = await helpers.contracts.getHoneyContract();

    await honeyContract.transfer(
      otherAccount.address,
      ethers.parseEther("2000")
    );
    await honeyContract.transfer(
      thirdAccount.address,
      ethers.parseEther("2000")
    );

    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
    await fuzzToken.connect(owner).enableTrading();
  });

  describe("Bond and Buy Tests", async function () {
    it("Allows Purchase of Bera Cubs with Honey at 5 $Honey per Cub", async function () {
      const expectedTransactionTotal = ethers.parseEther("10");
      await expect(
        honeyContract.approve(beraFarm.target, expectedTransactionTotal)
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
          expect(event.args.sender).to.equal(owner.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.equal(
            expectedTransactionTotal
          );
        }
      });

      const beraCubBalance = await beraCub.balanceOf(owner.address);

      expect(beraCubBalance).to.equal(amountOfBeraCubs);
    });
    it("In the event of the minted amount falling within both price brackets the buy function applies the correct total cost to the transaction", async function () {
      const expectedTransactionTotal = ethers.parseEther("35");
      await expect(
        honeyContract
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
          expect(event.args.sender).to.equal(otherAccount.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.equal(
            expectedTransactionTotal
          );
        }
      });

      const beraCubBalance = await beraCub.balanceOf(otherAccount.address);

      expect(beraCubBalance).to.equal(amountOfBeraCubs);
    });

    it("Should allow the user to bond Bera Cubs using Honey, transfer Honey to the treasury and transfer the Bera Cubs to the users wallet", async function () {
      const bondCost = await beraFarm.getBondCost();

      //based on Bera Price of 1000 and liquidity of 1 000 000 Fuzz and 200 Bera added to pool
      const expectedBondCost = ethers.parseEther("8.999999");

      expect(bondCost).to.be.closeTo(
        expectedBondCost,
        ethers.parseEther("0.01")
      );

      // expected cost of bonding two BeraCubs with Honey
      const expectedTotalCost = ethers.parseEther("17.99998");

      const approveAmount = ethers.parseEther("20");

      await expect(
        honeyContract
          .connect(thirdAccount)
          .approve(beraFarm.target, approveAmount)
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
          expect(event.args.sender).to.equal(thirdAccount.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubsToBond);

          expect(event.args.transactionTotal).to.be.closeTo(
            expectedTotalCost,
            ethers.parseEther("0.01")
          );
        }
      });

      const beraCubBalance = await beraCub.balanceOf(thirdAccount.address);

      const treasuryBalance = await honeyContract.balanceOf(
        sixthAccount.address
      );

      expect(treasuryBalance).to.be.closeTo(
        ethers.parseEther("63"),
        ethers.parseEther("0.01")
      );

      expect(beraCubBalance).to.equal(expectedTotalBeraCubBalance);

      const farmerState = await beraFarm.getFarmerByAddress(
        thirdAccount.address
      );

      expect(farmerState.beraCubsBonded).to.equal(expectedTotalBeraCubBalance);
      expect(farmerState.lastUpdate).to.be.greaterThan(0);
    });

    it("Allows purchase of Cubs for Fuzz at the latest compound price and after all Honey cubs minted", async function () {
      const currentPricePerCub =
        (await beraFarm.maxCompoundCostSoFar()) as unknown as number;

      const amountOfBeraCubs = "1";

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
          expect(event.args.sender).to.equal(fourthAccount.address);
          expect(event.args.amountOfCubs).to.equal(amountOfBeraCubs);
          expect(event.args.transactionTotal).to.equal(currentPricePerCub);
        }
      });

      const beraCubBalance = await beraCub.balanceOf(fourthAccount.address);

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
          expect(event.args.sender).to.equal(fifthAccount.address);
          expect(event.args.amountOfCubs).to.equal(5);
        }
      });
    });
  });
});
