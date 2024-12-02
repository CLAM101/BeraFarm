import { Contracts } from "./Contracts";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Addressable } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export class Helpers {
  contracts: Contracts;
  ethers: any;
  static async createAsync(ethers: any): Promise<Helpers> {
    const contracts = await Contracts.createAsync(ethers);
    return new Helpers({ ethers, contracts });
  }
  constructor(data: { ethers: any; contracts: Contracts }) {
    this.ethers = data.ethers;
    this.contracts = data.contracts;
  }

  predictConduitAddress(
    base: string | Addressable,
    quote: string | Addressable,
    crocSwapDexAddress: string
  ): Promise<string> {
    const LP_CONDUIT_INIT_CODE_HASH =
      "0xf8fb854b80d71035cc709012ce23accad9a804fcf7b90ac0c663e12c58a9c446";
    // Compute the salt using keccak256 of the packed base and quote addresses
    const salt = this.ethers.keccak256(
      this.ethers.solidityPacked(["address", "address"], [base, quote])
    );

    // Compute the create2 address
    const lpConduitAddress = this.ethers.getCreate2Address(
      crocSwapDexAddress,
      salt,
      LP_CONDUIT_INIT_CODE_HASH
    );

    return lpConduitAddress;
  }

  // TO DO: refactor this function to use the new contracts
  async wrapTokens(
    tokenAddress: string,
    amountToWrap: string,
    signer: HardhatEthersSigner,
    abi: any
  ) {
    const wrapperContract = new this.ethers.Contract(
      tokenAddress,
      abi,
      signer
    ) as any;

    const tx = await wrapperContract
      .connect(signer)
      .deposit({ value: this.ethers.parseEther(amountToWrap) });
    await tx.wait();

    const balance = await wrapperContract.balanceOf(signer.address);
    console.log("WrappedToken Balance:", this.ethers.formatEther(balance));
  }

  determineBaseQuoteOrder(
    token1: string,
    token2: string
  ): { baseToken: string; quoteToken: string } {
    const zeroForOne = token1.localeCompare(token2 as string) < 0;

    let baseToken;
    let quoteToken;

    if (zeroForOne) {
      baseToken = token1;

      quoteToken = token2;
    } else {
      baseToken = token2;
      quoteToken = token1;
    }

    return { baseToken, quoteToken };
  }

  // Function to compute the square root
  sqrt(value: bigint): bigint {
    if (value < 0n) {
      throw new Error("Square root of a negative number");
    }
    let x = value;
    let y = (x + 1n) / 2n; // Initial estimate
    while (y < x) {
      x = y;
      y = (x + value / x) / 2n; // Newton's method
    }
    return x;
  }

  calculatePriceFromSqrt(x: bigint): number {
    // Q64.64 scaling factor
    const Q64_64 = BigInt(2) ** BigInt(64);

    // Convert sqrtPrice from Q64.64 to a floating-point number
    const sqrtPrice = Number(x) / Number(Q64_64);

    // Calculate price as the square of sqrtPrice
    const price = sqrtPrice * sqrtPrice;

    return price;
  }

  encodePriceSqrt(reserve1: bigint, reserve0: bigint): bigint {
    const Q64_64_PRECISION = BigInt(2 ** 64); // Define the precision constant
    // Check to avoid division by zero
    if (reserve0 === 0n) {
      throw new Error("Division by zero");
    }

    // Perform the calculation
    const numerator = reserve1 * Q64_64_PRECISION * Q64_64_PRECISION;
    const result = this.sqrt(numerator / reserve0);

    // Return result as a bigint
    return result;
  }

  async multiCallCreatePoolAddLiquid(
    fuzzTokenAddress: string | Addressable,
    fuzzAmount: bigint,
    honeyAmount: bigint
  ) {
    const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
    const bexAddress = "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49";

    const [owner] = await this.ethers.getSigners();

    const dexContract = await this.contracts.getBexContract();

    const honeyContract = await this.contracts.getHoneyContract();

    const fuzzTokenContract = await this.contracts.getContract(
      fuzzTokenAddress as string,
      "fuzzToken"
    );

    const approvalTxHoney = await honeyContract.approve(bexAddress, fuzzAmount);
    await approvalTxHoney.wait();

    const approvalTxFuzz = await fuzzTokenContract.approve(
      bexAddress,
      honeyAmount
    );

    let baseAmount;
    let quoteAmount;
    await approvalTxFuzz.wait();

    const zeroForOne =
      honeyAddress.localeCompare(fuzzTokenAddress as string) < 0;

    let baseToken;
    let quoteToken;
    let liqCode;
    if (zeroForOne) {
      baseToken = honeyAddress;
      baseAmount = honeyAmount;
      quoteAmount = fuzzAmount;
      quoteToken = fuzzTokenAddress;
      liqCode = 31;
    } else {
      baseToken = fuzzTokenAddress;
      quoteToken = honeyAddress;
      baseAmount = fuzzAmount;
      quoteAmount = honeyAmount;
      liqCode = 32;
    }

    const abiCoder = new this.ethers.AbiCoder();

    //Note just check this token order works
    const price = this.encodePriceSqrt(quoteAmount, baseAmount);

    console.log("Price Calculation", this.calculatePriceFromSqrt(price));

    //Init pool args
    const cmd1 = abiCoder.encode(
      ["uint8", "address", "address", "uint256", "uint128"], // Types
      [71, baseToken, quoteToken, 36000, price] // Values
    );

    const lpConduit = await this.predictConduitAddress(
      baseToken,
      quoteToken,
      bexAddress
    );

    // we mus subtract the burn amount from the base amount
    const burnAmount = BigInt(10000000);

    const cmd2 = abiCoder.encode(
      [
        "uint8",
        "address",
        "address",
        "uint256",
        "int24",
        "int24",
        "uint128",
        "uint128",
        "uint128",
        "uint8",
        "address",
      ],
      [
        liqCode,
        baseToken,
        quoteToken,
        36000,
        0,
        0,
        baseAmount - burnAmount,
        price,
        price,
        0,
        lpConduit,
      ] as any[11]
    );

    const multiPathArgs = [2, 3, cmd1, 128, cmd2];

    const multiCmd = abiCoder.encode(
      ["uint8", "uint8", "bytes", "uint8", "bytes"],
      multiPathArgs as any[5]
    );

    const createPoolAddLiquidTx = await dexContract.userCmd(6, multiCmd);

    await createPoolAddLiquidTx.wait();

    console.log("Pool created and liquidity added");
  }

  async impersonateAndGetTokens(addressToImpersonate: string) {
    const transferAmount = this.ethers.parseUnits("1000000", "ether");

    const [owner] = await this.ethers.getSigners();

    const tokenContract = await this.contracts.getHoneyContract(
      addressToImpersonate,
      true
    );

    const tx = await tokenContract.transfer(owner, transferAmount);
    await tx.wait();

    const honeyBalance = await tokenContract.balanceOf(owner.address);

    console.log("Honey Balance", this.ethers.formatUnits(honeyBalance, 18));
  }

  async queryPrice(
    baseToken: string | Addressable,
    quoteToken: string | Addressable
  ): Promise<number> {
    const queryContract = await this.contracts.getQueryContract();

    const x = await queryContract.queryPrice(baseToken, quoteToken, 36000);

    return this.calculatePriceFromSqrt(x);
  }
}
