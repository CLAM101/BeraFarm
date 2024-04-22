import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MockHoney from "./MockHoney";
import MockBex from "./MockBex";
import AddLiquidModule from "./AddLiquidModule";

export default buildModule("BeraFarm", (m): any => {
  const { mockHoney } = m.useModule(MockHoney);
  const { mockBex } = m.useModule(MockBex);
  const { pool } = m.useModule(AddLiquidModule);
  const treasury = m.getAccount(6);

  const beraFarm = m.contract(
    "BeraFarm",
    [pool, mockHoney, mockBex, treasury],
    {
      id: "BeraFarm",
    }
  );

  return { beraFarm };
});
