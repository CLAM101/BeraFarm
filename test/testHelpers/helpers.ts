import "@nomicfoundation/hardhat-chai-matchers";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { token } from "../../typechain-types/@openzeppelin/contracts";
export class Helpers {
  async wrapTokens(
    tokenAddress: string,
    amountToWrap: string,
    signer: HardhatEthersSigner,
    abi: any
  ) {
    const wrapperContract = new ethers.Contract(tokenAddress, abi, signer);

    const tx = await wrapperContract
      .connect(signer)
      .deposit({ value: ethers.parseEther(amountToWrap) });
    await tx.wait();

    const balance = await wrapperContract.balanceOf(signer.address);
    console.log("WrappedToken Balance:", ethers.formatEther(balance));
  }

  async addLiquidity(
    routerAddress: string,
    tokenA: any,
    tokenB: any,
    amountADesired: any,
    amountBDesired: any,
    amountAMin: any,
    amountBMin: any,
    addressTo: string,
    abi: any,
    signer: HardhatEthersSigner
  ) {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

    const router = new ethers.Contract(routerAddress, abi, signer);

    const addLiquidTx = await router.addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      addressTo,
      deadline
    );

    const addLiquidConfirmation = addLiquidTx.wait();
  }
}
