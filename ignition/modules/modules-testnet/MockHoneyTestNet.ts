import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockHoneyTestNet = buildModule("MockHoneyTestNet", (m): any => {
  const initialSupply = m.getParameter("initialSupply");

  const mockHoneyTestNet = m.contract("MockHoneyTestNet", [initialSupply], {
    id: "MockHoneyTestNetContract",
  });

  return { mockHoneyTestNet };
});
export default MockHoneyTestNet;
