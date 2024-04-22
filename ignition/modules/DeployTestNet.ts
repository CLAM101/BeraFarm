import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import MockHoney from "./MockHoney";
import FuzzToken from "./FuzzToken";
import AddLiquidModule from "./AddLiquidModule";

export default buildModule("Main", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { mockHoney } = m.useModule(MockHoney);
  const { fuzzToken } = m.useModule(FuzzToken);
  const { addLiquid } = m.useModule(AddLiquidModule);

  return { beraCub, mockHoney, fuzzToken, addLiquid };
});
