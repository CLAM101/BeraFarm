import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MockHoney from "./MockHoney";
import FuzzToken from "./FuzzTokenV2";

export default buildModule("MockBex", (m): any => {
  const { mockHoney } = m.useModule(MockHoney);
  const { fuzzToken } = m.useModule(FuzzToken);

  const fuzzTokenLiquidAmount = m.getParameter("fuzzTokenLiquidAmount");
  const mockHoneyLiquidAmount = m.getParameter("mockHoneyLiquidAmount");
  const mockPoolAddress = m.getParameter("mockPoolAddress");

  const mockBex = m.contract(
    "MockBex",
    [
      mockHoney,
      fuzzToken,
      mockHoneyLiquidAmount,
      fuzzTokenLiquidAmount,
      mockPoolAddress,
    ],
    {
      id: "MockBexContract",
    }
  );

  return { mockBex };
});
