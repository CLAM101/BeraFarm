import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { BlockTag, Log } from "@ethersproject/abstract-provider";
import { deployContracts } from "./testHelpers/deploy-contracts";
import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../typechain-types";

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
    sixthAccount: HardhatEthersSigner;

  describe("Buy Bera Cubs Blocker Tests", async function () {
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
    });
    it("Blocks user from buying Bera Cubs when platform is not live", async function () {
      await expect(beraFarm.buyBeraCubs(22)).to.be.revertedWith(
        "Platform is offline"
      );
    });

    it("Allows owner to set platform state to live", async function () {
      await expect(beraFarm.connect(owner).setPlatformState(true)).to.not.be
        .reverted;
    });

    it("Blocks user from buying Bera Cubs when trading is not enabled", async function () {
      await expect(beraFarm.buyBeraCubs(22)).to.be.revertedWith(
        "Buy Bera Cubs is closed"
      );
    });

    it("Allows owner to enable trading", async function () {
      await expect(beraFarm.connect(owner).openBuyBeraCubs()).to.not.be
        .reverted;
    });

    it("Blocks User from minting more Bera Cubs than the limit", async function () {
      await expect(
        fuzzToken
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("2000"))
      ).to.not.be.reverted;
      await expect(beraFarm.buyBeraCubs(22)).to.be.revertedWith(
        "Max Bera Cubs Owned"
      );
    });

    it("Blocks purchase of Bera Cub when user does not have enough fuzzToken", async function () {
      await expect(
        beraFarm.connect(otherAccount).buyBeraCubs(5)
      ).to.be.revertedWith("Not enough $FUZZ");
    });

    it("Blocks User from minting more Bera Cubs after having minted the limit", async function () {
      await expect(fuzzToken.connect(owner).enable_trading()).to.not.be
        .reverted;
      await expect(
        fuzzToken
          .connect(owner)
          .transfer(otherAccount.address, ethers.parseEther("2000"))
      ).to.not.be.reverted;

      await expect(
        fuzzToken
          .connect(otherAccount)
          .approve(beraFarm.target, ethers.parseEther("2000"))
      ).to.not.be.reverted;
      await expect(beraFarm.connect(otherAccount).buyBeraCubs(20)).to.not.be
        .reverted;

      await expect(
        beraFarm.connect(otherAccount).buyBeraCubs(1)
      ).to.be.revertedWith("Max Bera Cubs Owned");
    });
  });

  describe("Bond Bera Cubs Blocker Tests", async function () {
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
    });
    it("Blocks user from buying Bera Cubs when platform is not live", async function () {
      await expect(beraFarm.bondBeraCubs(22)).to.be.revertedWith(
        "Platform is offline"
      );
    });

    it("Allows owner to set platform state to live", async function () {
      await expect(beraFarm.connect(owner).setPlatformState(true)).to.not.be
        .reverted;
    });

    it("Blocks User from Bonding Bera Cubs when bonding is not open yet.", async function () {
      await expect(
        fuzzToken
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("2000"))
      ).to.not.be.reverted;
      await expect(beraFarm.bondBeraCubs(22)).to.be.revertedWith(
        "Bond Bera Cub not available yet"
      );
    });

    it("Blocks User from Bonding more Bera Cubs than the limit", async function () {
      await expect(
        fuzzToken
          .connect(owner)
          .approve(beraFarm.target, ethers.parseEther("2000"))
      ).to.not.be.reverted;
      await expect(beraFarm.bondBeraCubs(22)).to.be.revertedWith(
        "Max Bera Cubs Owned"
      );
    });

    it("Blocks bonding of Bera Cub when user does not have enough $Honey", async function () {
      await expect(
        beraFarm.connect(otherAccount).bondBeraCubs(5)
      ).to.be.revertedWith("Not enough $Honey");
    });

    it("Blocks User from Bonding more Bera Cubs after having minted/bonded the limit", async function () {
      await expect(fuzzToken.connect(owner).enable_trading()).to.not.be
        .reverted;
      await expect(
        fuzzToken
          .connect(owner)
          .transfer(otherAccount.address, ethers.parseEther("2000"))
      ).to.not.be.reverted;

      await expect(
        fuzzToken
          .connect(otherAccount)
          .approve(beraFarm.target, ethers.parseEther("2000"))
      ).to.not.be.reverted;
      await expect(beraFarm.connect(otherAccount).bondBeraCubs(20)).to.not.be
        .reverted;

      await expect(
        beraFarm.connect(otherAccount).bondBeraCubs(1)
      ).to.be.revertedWith("Max Bera Cubs Owned");
    });
  });
});
