import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Log } from "@ethersproject/abstract-provider";
import { deployTokenTests } from "./testHelpers/deployContractsIgnition";
import { Helpers } from "../helpers/Helpers";
const networkHelpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Marketplace Tests", async function () {
  let beraCub: any,
    beraFarm: any,
    fuzzToken: any,
    honeyContract: any,
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
    await networkHelpers.reset("https://bartio.rpc.berachain.com/", 1886012);
    const helpers = await Helpers.createAsync(ethers);
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
    honeyContract = helpers.contracts.getHoneyContract();
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
        .updateListing(beraCub.target, tokenId, newPrice, 0);
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
        .cancelListing(beraCub.target, tokenId, 0);
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
        .buyItem(beraCub.target, tokenId, 0, { value: price });

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

      expect(await nftMarketplace.connect(otherAccount).withdrawProceeds()).to
        .not.be.reverted;

      const balanceAfterWithdrawal = parseFloat(
        ethers.formatEther(
          await ethers.provider.getBalance(otherAccount.address)
        )
      );

      expect(balanceAfterWithdrawal).to.be.closeTo(expectedBalance, 0.001);
    });

    it("Should allow listing of multiple items and fetching of all active listings", async function () {
      const price = ethers.parseEther("1");
      this.timeout(100000);
      expect(
        await beraFarm.connect(owner).awardBeraCubs(otherAccount.address, 10)
      ).to.not.be.reverted;

      let tokenId = 1;
      for (let i = 0; i < 10; i++) {
        const approvalTx = await beraCub
          .connect(otherAccount)
          .setApprovalForAll(nftMarketplace.target, true);

        const confirmedApproval = await approvalTx.wait();

        const listingTx = await nftMarketplace
          .connect(otherAccount)
          .listItem(beraCub.target, tokenId + 1, price);
        tokenId = tokenId + 1;
        const confirmedListing = await listingTx.wait();
      }

      const activeListings = await nftMarketplace.getActiveListings();
    });

    it("Should allow cancelation of a listing and reuse of an existing listing index", async function () {
      const tokenId = 2;
      let canceledListingId: string;
      const price = ethers.parseEther("1");
      const cancelListingTx = await nftMarketplace
        .connect(otherAccount)
        .cancelListing(beraCub.target, tokenId, 0);
      const confirmedCancel = await cancelListingTx.wait();

      //LISTING LOGS
      let caneclLogs: Log[] = [];

      if (confirmedCancel) {
        caneclLogs = confirmedCancel.logs as unknown as Log[];
      }

      caneclLogs.forEach((log: Log) => {
        const event = nftMarketplace.interface.parseLog(log);

        if (event && event.name === "ItemCanceled") {
          expect(event.args.seller).to.equal(otherAccount.address);
          expect(event.args.tokenId).to.equal(tokenId);
          expect(event.args.nftAddress).to.equal(beraCub.target);
          expect(event.args.listingId).to.equal(0);

          canceledListingId = ethers.formatUnits(event.args.listingId, 0);
        }
      });

      const listingTx = await nftMarketplace
        .connect(otherAccount)
        .listItem(beraCub.target, 2, price);

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
          expect(event.args.tokenId).to.equal(tokenId);
          expect(event.args.price).to.equal(ethers.parseEther("1"));
          expect(event.args.nftAddress).to.equal(beraCub.target);
          expect(event.args.id).to.equal(canceledListingId);
        }
      });
    });
  });
});
