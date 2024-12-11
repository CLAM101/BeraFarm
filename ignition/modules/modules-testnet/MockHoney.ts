import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockHoney = buildModule("MockHoney", (m): any => {
  const owner = m.getAccount(0);

  const mockHoney = m.contract(
    "MockHoney",
    [
      [
        {
          recipient: owner,
          amount: "3000000000000000000000000",
        },
      ],
      "200000000000000000000",
    ],
    {
      id: "MockHoneyContract",
    }
  );

  return { mockHoney };
});
export default MockHoney;
