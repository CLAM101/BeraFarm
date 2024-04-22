import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockHoney = buildModule("MockHoney", (m): any => {
  const accounts = [
    m.getAccount(0),
    m.getAccount(1),
    m.getAccount(2),
    m.getAccount(3),
    m.getAccount(4),
  ];

  const amountPerAddress = m.getParameter("amountPerAddress");

  const mockHoney = m.contract("MockHoney", [amountPerAddress, accounts], {
    id: "MockHoneyContract",
  });

  return { mockHoney };
});
export default MockHoney;
