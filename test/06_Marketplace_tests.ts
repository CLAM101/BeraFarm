import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";

import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../typechain-types";
import { deployTokenTests } from "./testHelpers/deployContractsIgnition";
import Marketplace from "../ignition/modules/Marketplace";

const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Marketplace Tests", async function () {
  let beraCub: any,
    beraFarm: any,
    fuzzToken: any,
    mockHoney: any,
    nftMarketplace: any,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner,
    seventhAccount: HardhatEthersSigner,
    eighthAccount: HardhatEthersSigner;

  before(async function () {
    // await helpers.reset("https://rpc.ankr.com/berachain_testnet", 1886012);

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

    const loadedFixture = await loadFixture(deployTokenTests);
    mockHoney = loadedFixture.mockHoney;
    beraCub = loadedFixture.beraCub;
    fuzzToken = loadedFixture.fuzzToken;
    beraFarm = loadedFixture.beraFarm;
    nftMarketplace = loadedFixture.nftMarketplace;

    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
  });

  describe("NFT Marketplace Tests", async function () {
    it("Should allow listing of an NFT and update contract state accordingly", async function () {
      expect(
        await beraFarm.connect(owner).awardBeraCubs(otherAccount.address, 10)
      ).to.not.be.reverted;

      const approvalTx = await beraCub
        .connect(otherAccount)
        .setApprovalForAll(nftMarketplace.target, true);

      const confirmedApproval = await approvalTx.wait();

      const listingTx = await nftMarketplace
        .connect(otherAccount)
        .listItem(beraCub.target, 1, ethers.parseEther("1"));

      const confirmedListing = await listingTx.wait();

      //LISTING LOGS
      let listingLogs: Log[] = [];

      if (confirmedListing) {
        listingLogs = confirmedListing.logs as unknown as Log[];
      }

      listingLogs.forEach((log: Log) => {
        const event = nftMarketplace.interface.parseLog(log);

        if (event && event.name === "ItemListed") {
          expect(event.args.seller).to.equal(otherAccount.address);
          expect(event.args.tokenId).to.equal(1);
          expect(event.args.price).to.equal(ethers.parseEther("1"));
          expect(event.args.nftAddress).to.equal(beraCub.target);
        }
      });
    });

    it("Should allow owner to update listing", async function () {
      const newPrice = ethers.parseEther("2");
      const tokenId = 1;

      const updateListingTx = await nftMarketplace
        .connect(otherAccount)
        .updateListing(beraCub.target, tokenId, newPrice);
      const confirmedUpdate = await updateListingTx.wait();

      //LISTING LOGS
      let listingLogs: Log[] = [];

      if (confirmedUpdate) {
        listingLogs = confirmedUpdate.logs as unknown as Log[];
      }

      listingLogs.forEach((log: Log) => {
        const event = nftMarketplace.interface.parseLog(log);

        if (event && event.name === "ItemListed") {
          expect(event.args.seller).to.equal(otherAccount.address);
          expect(event.args.tokenId).to.equal(tokenId);
          expect(event.args.price).to.equal(newPrice);
          expect(event.args.nftAddress).to.equal(beraCub.target);
        }
      });
    });

    it("Should allow the owner to cancel a listing", async function () {
      const tokenId = 1;

      const updateListingTx = await nftMarketplace
        .connect(otherAccount)
        .cancelListing(beraCub.target, tokenId);
      const confirmedUpdate = await updateListingTx.wait();

      //LISTING LOGS
      let listingLogs: Log[] = [];

      if (confirmedUpdate) {
        listingLogs = confirmedUpdate.logs as unknown as Log[];
      }

      listingLogs.forEach((log: Log) => {
        const event = nftMarketplace.interface.parseLog(log);

        if (event && event.name === "ItemCanceled") {
          expect(event.args.seller).to.equal(otherAccount.address);
          expect(event.args.tokenId).to.equal(tokenId);
          expect(event.args.nftAddress).to.equal(beraCub.target);
        }
      });
    });

    it("Should allow the user to buy a listed Item", async function () {
      const tokenId = 1;
      const price = ethers.parseEther("1");

      const approvalTx = await beraCub
        .connect(otherAccount)
        .setApprovalForAll(nftMarketplace.target, true);

      const confirmedApproval = await approvalTx.wait();

      const listingTx = await nftMarketplace
        .connect(otherAccount)
        .listItem(beraCub.target, 1, price);

      const confirmedListing = await listingTx.wait();

      const buyTx = await nftMarketplace
        .connect(thirdAccount)
        .buyItem(beraCub.target, tokenId, { value: price });

      const confirmedBuy = await buyTx.wait();

      //LISTING LOGS
      let listingLogs: Log[] = [];

      if (confirmedBuy) {
        listingLogs = confirmedBuy.logs as unknown as Log[];
      }

      listingLogs.forEach((log: Log) => {
        const event = nftMarketplace.interface.parseLog(log);

        if (event && event.name === "ItemBought") {
          expect(event.args.buyer).to.equal(thirdAccount.address);
          expect(event.args.tokenId).to.equal(tokenId);
          expect(event.args.nftAddress).to.equal(beraCub.target);
          expect(event.args.price).to.equal(price);
        }
      });
    });

    it("Should allow a user to withdraw funds after their item has been sold", async function () {
      const initialBal = parseFloat(
        ethers.formatEther(
          await ethers.provider.getBalance(otherAccount.address)
        )
      );

      const expectedWithdrawAmount = 1;

      const expectedBalance = initialBal + expectedWithdrawAmount;

      console.log(
        "Expected Withdraw Amount: ",
        ethers.formatEther(expectedWithdrawAmount)
      );

      expect(await nftMarketplace.connect(otherAccount).withdrawProceeds()).to
        .not.be.reverted;

      const balanceAfterWithdrawal = parseFloat(
        ethers.formatEther(
          await ethers.provider.getBalance(otherAccount.address)
        )
      );

      expect(balanceAfterWithdrawal).to.be.closeTo(expectedBalance, 0.001);
    });
  });
});