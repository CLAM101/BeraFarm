import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BeraCub", (m): any => {
  const maxCubSupply = m.getParameter("maxCubSupply");

  const beraCub = m.contract("BeraCub", [maxCubSupply], {
    id: "BeraCubContract",
  });

  return { beraCub };
});
