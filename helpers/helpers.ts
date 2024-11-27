import { keccak256 } from "ethers";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { ERC20ABI } from "../test/testHelpers/ABI/ERC20-abi";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";
import { queryABI } from "../test/testHelpers/ABI/query-abi";
import { Addressable } from "ethers";

export async function predictConduitAddress(
  base: string | Addressable,
  quote: string | Addressable,
  crocSwapDexAddress: string,
  ethers: any,
  abiCoder: any
): Promise<string> {
  const LP_CONDUIT_INIT_CODE_HASH =
    "0xf8fb854b80d71035cc709012ce23accad9a804fcf7b90ac0c663e12c58a9c446";
  // Compute the salt using keccak256 of the packed base and quote addresses
  const salt = keccak256(
    ethers.solidityPacked(["address", "address"], [base, quote])
  );

  // Compute the create2 address
  const lpConduitAddress = ethers.getCreate2Address(
    crocSwapDexAddress,
    salt,
    LP_CONDUIT_INIT_CODE_HASH
  );

  return lpConduitAddress;
}

// Function to compute the square root
function sqrt(value: bigint): bigint {
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

function encodePriceSqrt(reserve1: bigint, reserve0: bigint): bigint {
  const Q64_64_PRECISION = BigInt(2 ** 64); // Define the precision constant
  // Check to avoid division by zero
  if (reserve0 === 0n) {
    throw new Error("Division by zero");
  }

  // Perform the calculation
  const numerator = reserve1 * Q64_64_PRECISION * Q64_64_PRECISION;
  const result = sqrt(numerator / reserve0);

  // Return result as a bigint
  return result;
}

export async function multiCallCreatePoolAddLiquid(
  ethers: any,
  fuzzTokenAddress: string | Addressable,
  baseAmount: bigint,
  quoteAmount: bigint
) {
  const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
  const bexAddress = "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49";

  const [owner] = await ethers.getSigners();

  const dexContract = new ethers.Contract(bexAddress, bexABI, owner);

  const honeyContract = new ethers.Contract(honeyAddress, ERC20ABI, owner);

  const fuzzTokenContract = new ethers.Contract(
    fuzzTokenAddress,
    ERC20ABI,
    owner
  );

  const approvalTxHoney = await honeyContract.approve(bexAddress, baseAmount);
  await approvalTxHoney.wait();

  const approvalTxFuzz = await fuzzTokenContract.approve(
    bexAddress,
    quoteAmount
  );

  await approvalTxFuzz.wait();

  const zeroForOne = honeyAddress.localeCompare(fuzzTokenAddress as string) < 0;

  let baseToken;
  let quoteToken;
  let liqCode;
  if (zeroForOne) {
    baseToken = honeyAddress;
    quoteToken = fuzzTokenAddress;
    liqCode = 31;
  } else {
    baseToken = fuzzTokenAddress;
    quoteToken = honeyAddress;
    liqCode = 32;
  }

  const abiCoder = new ethers.AbiCoder();

  //Note just check this token order works
  const price = encodePriceSqrt(quoteAmount, baseAmount);

  //Init pool args
  const cmd1 = abiCoder.encode(
    ["uint8", "address", "address", "uint256", "uint128"], // Types
    [71, baseToken, quoteToken, 36000, price] // Values
  );

  const lpConduit = await predictConduitAddress(
    baseToken,
    quoteToken,
    bexAddress,
    ethers,
    abiCoder
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

  const finalizePoolTx = await createPoolAddLiquidTx.wait();

  console.log("Pool created and liquidity added");
}

export async function impersonateAndGetTokens(
  tokenAddress: string,
  addressToImpersonate: string,
  ethers: any
) {
  const transferAmount = ethers.parseUnits("1000000", "ether");

  await impersonateAccount(addressToImpersonate);
  const impersonatedSigner = await ethers.getSigner(addressToImpersonate);

  const [owner] = await ethers.getSigners();

  const tokenContract = new ethers.Contract(
    tokenAddress,
    ERC20ABI,
    impersonatedSigner
  );

  const tx = await tokenContract.transfer(owner, transferAmount);
  await tx.wait();

  const honeyBalance = await tokenContract.balanceOf(owner.address);
}

export async function queryPrice(
  ethers: any,
  baseToken: string | Addressable,
  quoteToken: string | Addressable
): Promise<bigint> {
  const [deployer] = await ethers.getSigners();
  const queryAddress = "0x8685CE9Db06D40CBa73e3d09e6868FE476B5dC89";

  const queryContract = new ethers.Contract(queryAddress, queryABI, deployer);

  const x = await queryContract.queryPrice(quoteToken, baseToken, 36000);

  const sq = BigInt(x) / BigInt(2) ** BigInt(64);
  const price = BigInt(sq) * BigInt(sq);

  return price;
}
