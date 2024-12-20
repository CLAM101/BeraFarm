import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployBlocker } from "./testHelpers/deployContractsIgnition";
import { Helpers } from "../helpers/Helpers";
import { waitForTransactionReceipt } from "viem/_types/actions/public/waitForTransactionReceipt";

describe("Bera Farm Blocker Tests", async function () {
  let beraCub: any,
    beraFarm: any,
    fuzzToken: any,
    honeyContract: any,
    owner: any,
    otherAccount: any,
    thirdAccount: any,
    fourthAccount: any,
    fifthAccount: any,
    seventhAccount: any,
    sixthAccount: any,
    eighthAccount: any;
  describe("Blocker Tests", async function () {
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
      const fixture = await loadFixture(deployBlocker);

      const helpers = await Helpers.createAsync(ethers);

      honeyContract = await helpers.contracts.getHoneyContract();

      const accountsForTransfer = [
        owner,
        otherAccount,
        thirdAccount,
        fourthAccount,
        fifthAccount,
        seventhAccount,
      ];

      const transferDetails = accountsForTransfer.map((signer) => {
        return {
          address: signer.address,
          amount: ethers.parseEther("2000"),
        };
      });

      await helpers.multiTransfer(honeyContract, transferDetails);

      beraCub = fixture.beraCub;
      fuzzToken = fixture.fuzzToken;
      beraFarm = fixture.beraFarm;

      await beraCub.connect(owner).openMinting();
      await fuzzToken.connect(owner).enableTrading();
    });

    it("Blocks user from buying Bera Cubs when platform is not live", async function () {
      await expect(beraFarm.buyBeraCubsHoney(2)).to.be.revertedWith(
        "Platform is offline"
      );
      await expect(beraFarm.buyBeraCubsFuzz(2)).to.be.revertedWith(
        "Platform is offline"
      );
      await expect(beraFarm.bondBeraCubs(2)).to.be.revertedWith(
        "Platform is offline"
      );
    });

    it("Allows owner to set platform state to live", async function () {
      await expect(beraFarm.connect(owner).setPlatformState(true)).to.not.be
        .reverted;
    });

    it("Blocks user from Buying Cubs for Honey when still closed", async function () {
      await expect(beraFarm.buyBeraCubsHoney(2)).to.be.revertedWith(
        "Buy Bera Cubs is closed"
      );
    });

    it("Allows Owner to Open bera Cub trading for Honey", async function () {
      await expect(beraFarm.connect(owner).openBuyBeraCubsHoney()).to.not.be
        .reverted;
    });

    it("Blocks compound attempt if emissions have not started", async function () {
      await expect(
        beraFarm.connect(owner).compoundBeraCubs()
      ).to.be.revertedWith("Compound not possible emissions not started");
    });

    it("Blocks User from minting Cubs if they don't have enough $Honey", async function () {
      await expect(
        beraFarm.connect(sixthAccount).buyBeraCubsHoney(1)
      ).to.be.revertedWith("Not enough $HONEY");
    });

    it("Blocks user from Bonding Bera Cubs before bonding opens", async function () {
      await expect(beraFarm.bondBeraCubs(2)).to.be.revertedWith(
        "Bonding still closed please purchase with $HONEY"
      );
    });

    it("Blocks user from buying Bera Cubs with Fuzz if $Honey cubs are not sold out yet", async function () {
      await expect(beraFarm.buyBeraCubsFuzz(2)).to.be.revertedWith(
        "Not enough Minted To Purchase With $Fuzz"
      );
    });

    it("Allows User to Buy Cubs for Honey after opening", async function () {
      await expect(
        honeyContract
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("55"))
      ).to.not.be.reverted;
      await expect(beraFarm.connect(owner).buyBeraCubsHoney(6)).to.not.be
        .reverted;
    });

    it("Blocks the user from buying with $Honey if they have hit the max ownership allowance", async function () {
      this.timeout(100000);
      await expect(
        honeyContract
          .connect(seventhAccount)
          .approve(beraFarm.target, ethers.parseEther("200"))
      ).to.not.be.reverted;

      await expect(
        beraFarm.connect(owner).awardBeraCubs(seventhAccount.address, 20)
      ).to.not.be.reverted;

      await expect(
        beraFarm.connect(seventhAccount).buyBeraCubsHoney(1)
      ).to.be.revertedWith("Max Bera Cubs Owned");
    });

    it("Blocks user from Buying Bera Cubs with Honey if they are sold out", async function () {
      await expect(
        honeyContract
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("400"))
      ).to.not.be.reverted;
      await expect(beraFarm.connect(owner).buyBeraCubsHoney(1)).to.not.be
        .reverted;
      await expect(
        beraFarm.connect(owner).buyBeraCubsHoney(2)
      ).to.be.revertedWith(
        "Honey Bera Cubs for $HONEY Sold Out buy with $FUZZ"
      );
    });

    it("Blocks User from Bonding Cubs if they don't have enough $Honey", async function () {
      await expect(
        honeyContract
          .connect(eighthAccount)
          .approve(beraFarm.target, ethers.parseEther("400"))
      ).to.not.be.reverted;
      await expect(
        beraFarm.connect(eighthAccount).bondBeraCubs(1)
      ).to.be.revertedWith("Not enough $HONEY");
    });

    it("Blocks user from Bonding Bera Cubs if they have more than the required amount", async function () {
      this.timeout(100000);

      await expect(
        beraFarm.connect(owner).awardBeraCubs(fourthAccount.address, 20)
      ).to.not.be.reverted;

      await expect(
        honeyContract
          .connect(fourthAccount)
          .approve(beraFarm.target, ethers.parseEther("200"))
      ).to.not.be.reverted;

      await expect(
        beraFarm.connect(fourthAccount).bondBeraCubs(1)
      ).to.be.revertedWith("Max Bera Cubs Owned");
    });

    it("Allows the owner to close $FUZZ purchases and prevents purchase once closed", async function () {
      await expect(beraFarm.connect(owner).closeFuzzSaleOwner()).to.not.be
        .reverted;

      await expect(
        beraFarm.connect(owner).buyBeraCubsFuzz(2)
      ).to.be.revertedWith("Buy Bera Cubs is closed owner");
    });

    it("Allows the owner to open $FUZZ purchases and allows a purchase to take place", async function () {
      await expect(beraFarm.connect(owner).openFuzzSaleOwner()).to.not.be
        .reverted;

      await expect(
        fuzzToken
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("35"))
      ).to.not.be.reverted;

      await expect(beraFarm.connect(owner).buyBeraCubsFuzz(2)).to.not.be
        .reverted;
    });

    it("Blocks the user from purchasing with $FUZZ if they don't have enough $FUZZ", async function () {
      await expect(
        beraFarm.connect(otherAccount).buyBeraCubsFuzz(1)
      ).to.be.revertedWith("Not enough $FUZZ");
    });

    it("owner from awarding a cub if the user has more than the max amount", async function () {
      await expect(
        beraFarm.connect(owner).awardBeraCubs(owner.address, 16)
      ).to.be.revertedWith("Max Bera Cubs Owned");
    });

    it("Reverts claim if the farmer doesn't exist", async function () {
      await expect(beraFarm.connect(sixthAccount).claim()).to.be.revertedWith(
        "Sender must be registered Bera Cub farmer to claim"
      );
    });

    it("Blocks user from compounding if they don't have enough $Fuzz", async function () {
      await expect(
        beraFarm.connect(owner).compoundBeraCubs()
      ).to.be.revertedWith("Not enough pending $FUZZ to compound");
    });

    it("Blocks user from compounding if they have hit the limit per wallet", async function () {
      this.timeout(100000);
      await expect(
        beraFarm.connect(owner).awardBeraCubs(eighthAccount.address, 20)
      ).to.not.be.reverted;

      const stakingDuration = 24 * 3600;

      await ethers.provider.send("evm_increaseTime", [stakingDuration]);
      await ethers.provider.send("evm_mine");

      await expect(
        beraFarm.connect(eighthAccount).compoundBeraCubs()
      ).to.be.revertedWith("Max Bera Cubs Owned");
    });

    it("Blocks the purchase of Cubs once they are completely sold out", async function () {
      const currentTotalSupply = await beraCub.totalSupply();

      console.log("Total Supply", ethers.formatUnits(currentTotalSupply, 0));

      await expect(
        beraFarm.connect(owner).awardBeraCubs(fifthAccount.address, 2)
      ).to.be.revertedWith("All Bera Cubs Minted :(");
    });
  });
});
