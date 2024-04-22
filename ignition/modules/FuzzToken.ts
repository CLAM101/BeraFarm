import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";

export default buildModule("FuzzToken", (m): any => {
  const { beraCub } = m.useModule(BeraCub);

  let initialFuzzSupply = m.getParameter("initialFuzzSupply");
  let maxFuzzSupply = m.getParameter("maxFuzzSupply");
  let treasureAddress = m.getAccount(6);

  const fuzzToken = m.contract(
    "FuzzToken",
    [initialFuzzSupply, maxFuzzSupply, treasureAddress, beraCub],
    {
      id: "FuzzTokenContract",
    }
  );

  return { fuzzToken };
});
