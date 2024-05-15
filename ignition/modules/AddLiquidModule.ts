import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FuzzToken from "./FuzzToken";
import HoneyABI from "../externalArtifacts/honey.json";
import BexABI from "../externalArtifacts/bex.json";

export default buildModule("AddLiquidModule", (m): any => {
  const { fuzzToken } = m.useModule(FuzzToken);

  const fuzzTokenLiquidAmount = m.getParameter("fuzzTokenLiquidAmount");
  const honeyLiquidAmount = m.getParameter("honeyLiquidAmount");

  const honeyAddress = m.getParameter("honeyAddress");
  const bexAddress = m.getParameter("bexAddress");
  const ownerAccount = m.getAccount(0);

  const bex = m.contractAt("Bex", BexABI, bexAddress);
  const honey = m.contractAt("Honey", HoneyABI, honeyAddress);
  const fuzzApprove = m.call(
    fuzzToken,
    "approve",
    [bexAddress, fuzzTokenLiquidAmount],
    {
      from: ownerAccount,
    }
  );
  const honeyApprove = m.call(
    honey,
    "approve",
    [bexAddress, honeyLiquidAmount],
    {
      from: ownerAccount,
    }
  );

  const pool: any = m.call(
    bex,
    "createPool",
    [
      "HoneyFuzzPool",
      [honeyAddress, fuzzToken],
      [honeyLiquidAmount, fuzzTokenLiquidAmount],
      "weighted",

      [
        { asset: honeyAddress, weight: 50 },
        { asset: fuzzToken, weight: 50 },
      ],
      "3000000000",
    ],
    { from: ownerAccount, after: [honeyApprove, fuzzApprove] }
  );

  // const addedLiquid = m.call(
  //   bex,
  //   "addLiquidity",
  //   [
  //     pool,
  //     ownerAccount,
  //     [honeyAddress, fuzzToken],
  //     [honeyLiquidAmount, fuzzTokenLiquidAmount],
  //   ],
  //   { from: ownerAccount, after: pool }
  // );

  return { bex, pool };
});
