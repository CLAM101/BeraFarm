import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { deployContracts } from "./testHelpers/deploy-contracts";
import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../typechain-types";
import {
  setMaxCubSupply,
  setMaxSupplyFirstBatch,
  setLimitBeforeEmissions,
  setMaxSupplyForHoney,
  setLimitBeforeFullTokenTrading,
  setInitialFuzzSupply,
  setMaxFuzzSupply,
} from "./testHelpers/deploy-contracts";

describe("Bera Farm Blocker Tests", async function () {
  let beraCub: BeraCub,
    beraFarm: BeraFarm,
    fuzzToken: FuzzToken,
    mockHoney: MockHoney,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    seventhAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner;

  describe("Blocker Tests", async function () {
    before(async function () {
      setMaxCubSupply(62);
      setMaxSupplyForHoney(27);
      setLimitBeforeEmissions(2);
      setLimitBeforeFullTokenTrading(5);
      setMaxSupplyFirstBatch(3);
      const fixture = await loadFixture(deployContracts);
      owner = fixture.owner;
      mockHoney = fixture.mockHoney;
      otherAccount = fixture.otherAccount;
      thirdAccount = fixture.thirdAccount;
      fourthAccount = fixture.fourthAccount;
      fifthAccount = fixture.fifthAccount;
      sixthAccount = fixture.sixthAccount;
      seventhAccount = fixture.seventhAccount;
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

    it("Blocks User from minting Cubs if they don't have enough $Honey", async function () {
      await expect(
        beraFarm.connect(sixthAccount).buyBeraCubsHoney(1)
      ).to.be.revertedWith("Not enough $HONEY");
    });

    it("Blocks user from Bonding Bera Cubs before bonding opens", async function () {
      await expect(beraFarm.bondBeraCubs(2)).to.be.revertedWith(
        "Bonding still closed please purchase with $Honey"
      );
    });

    it("Blocks user from buying Bera Cubs with Fuzz if $Honey cubs are not sold out yet", async function () {
      await expect(beraFarm.buyBeraCubsFuzz(2)).to.be.revertedWith(
        "Not enough Minted To Purchase With $Fuzz"
      );
    });

    it("Allows User to Buy Cubs for Honey after opening", async function () {
      await expect(
        mockHoney
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("55"))
      ).to.not.be.reverted;
      await expect(beraFarm.connect(owner).buyBeraCubsHoney(6)).to.not.be
        .reverted;
    });

    it("Blocks the user from buying with $Honey if they have hit the max ownership allowance", async function () {
      await expect(
        mockHoney
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
        mockHoney
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("400"))
      ).to.not.be.reverted;
      await expect(beraFarm.connect(owner).buyBeraCubsHoney(20)).to.not.be
        .reverted;
      await expect(
        beraFarm.connect(owner).buyBeraCubsHoney(2)
      ).to.be.revertedWith("Honey Bera Cubs Sold Out buy with Fuzz");
    });

    it("Blocks User from Bonding Cubs if they don't have enough $Honey", async function () {
      await expect(
        beraFarm.connect(seventhAccount).bondBeraCubs(1)
      ).to.be.revertedWith("Not enough $HONEY");
    });

    it("Blocks user from Bonding Bera Cubs if they have more than the required amount", async function () {
      await expect(
        beraFarm.connect(owner).awardBeraCubs(fourthAccount.address, 20)
      ).to.not.be.reverted;

      await expect(
        mockHoney
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

    it("reverts claim if the farmer doesn't exist", async function () {
      await expect(beraFarm.connect(sixthAccount).claim()).to.be.revertedWith(
        "Sender must be registered Bera Cub farmer to claim"
      );
    });

    it("Blocks the purchase of Cubs once they are completely sold out", async function () {
      await expect(
        beraFarm.connect(owner).awardBeraCubs(sixthAccount.address, 13)
      ).to.not.be.reverted;

      await expect(
        beraFarm.connect(owner).awardBeraCubs(fifthAccount.address, 2)
      ).to.be.revertedWith("All Bera Cubs Minted :(");
    });

    it("Blocks user from compounding if they don't have enough $Fuzz", async function () {
      await expect(
        beraFarm.connect(owner).compoundBeraCubs()
      ).to.be.revertedWith("Not enough pending $FUZZ to compound");
    });

    it("Blocks user from compounding if they have hit the limit per wallet", async function () {});
  });
});
