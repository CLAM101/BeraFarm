import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";

export default buildModule("FuzzTokenV2", (m): any => {
  const owner = m.getAccount(0);

  let initialFuzzSupply = m.getParameter("initialFuzzSupply");
  let maxFuzzSupply = m.getParameter("maxFuzzSupply");
  let treasureAddress = m.getAccount(1);

  const fuzzToken = m.contract(
    "FuzzTokenV2",
    [
      initialFuzzSupply,
      maxFuzzSupply,
      treasureAddress,
      "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    ],
    {
      id: "FuzzTokenContract",
    }
  );

  m.call(fuzzToken, "enableTrading", [], { from: owner });

  return { fuzzToken };
});
