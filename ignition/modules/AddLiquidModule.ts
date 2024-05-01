import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import MockHoney from "./MockHoney";
import FuzzToken from "./FuzzToken";
import { ERC20ABI } from "../../test/testHelpers/ABI/ERC20-abi";
import BexABI from "../artifacts/bex.json";
import FuzzTokenABI from "../../artifacts/contracts/FuzzToken.sol/FuzzToken.json";
import MockBex from "./MockBex";
export default buildModule("AddLiquid", (m): any => {
  const { fuzzToken } = m.useModule(FuzzToken);
  const { mockHoney } = m.useModule(MockHoney);
  let routerAddress = m.getParameter("routerAddress");

  const fuzzTokenLiquidAmount = m.getParameter("fuzzTokenLiquidAmount");
  const mockHoneyLiquidAmount = m.getParameter("mockHoneyLiquidAmount");
  const ownerAccount = m.getAccount(0);

  m.call(fuzzToken, "approve", [routerAddress, fuzzTokenLiquidAmount], {
    from: ownerAccount,
  });
  m.call(mockHoney, "approve", [routerAddress, mockHoneyLiquidAmount], {
    from: ownerAccount,
  });

  let address0;

  let address1;

  let address1Amount;

  let address0Amount;

  if (fuzzToken < mockHoney) {
    address0 = fuzzToken;
    address0Amount = fuzzTokenLiquidAmount;
    address1 = mockHoney;
    address1Amount = mockHoneyLiquidAmount;
  } else {
    address0 = mockHoney;
    address0Amount = mockHoneyLiquidAmount;
    address1 = fuzzToken;
    address1Amount = fuzzTokenLiquidAmount;
  }

  const router = m.contractAt("Router", BexABI, routerAddress);

  const pool: any = m.call(
    router,
    "createPool",
    [
      "HoneyFuzzPool",
      [address0, address1],
      [address0Amount, address1Amount],
      "weighted",
      {
        weights: [
          { asset: address0, weight: 50 },
          { asset: address1, weight: 50 },
        ],
        swapFee: "3000000000",
      },
    ],
    { from: ownerAccount }
  );

  const addedLiquid = m.call(
    router,
    "addLiquidity",
    [
      pool,
      ownerAccount,
      [address0, address1],
      [address0Amount, address1Amount],
    ],
    { from: ownerAccount, after: pool }
  );

  return { router, pool, addedLiquid };
});
