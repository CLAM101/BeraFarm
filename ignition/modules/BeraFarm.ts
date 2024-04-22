import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MockHoney from "./MockHoney";
import MockBex from "./MockBex";

export default buildModule("BeraFarm", (m): any => {
  const { mockHoney } = m.useModule(MockHoney);
  const { mockBex } = m.useModule(MockBex);

  const beraCub = m.contract("BeraFarm", [maxCubSupply], {
    id: "BeraCubContract",
  });

  m.call(beraCub, "openMinting", [], { from: account1 });

  m.staticCall(beraCub, "mintingOpen", []);

  return { beraCub };
});
