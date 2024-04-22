import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BeraCub", (m): any => {
  const account1 = m.getAccount(0);

  const maxCubSupply = m.getParameter("maxCubSupply");

  const beraCub = m.contract("BeraCub", [maxCubSupply], {
    id: "BeraCubContract",
  });

  m.call(beraCub, "openMinting", [], { from: account1 });

  m.staticCall(beraCub, "mintingOpen", []);

  return { beraCub };
});
