import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import Faucet from "./Faucet";

const MockHoneyTestNet = buildModule("MockHoney", (m): any => {
  const { faucet } = m.useModule(Faucet);
  const owner = m.getAccount(0);

  const mockHoney = m.contract(
    "MockHoney",
    [
      [
        {
          address: owner,
          amount: "2000000000000000000000000",
        },
        {
          address: faucet,
          amount: "5000000000000000000000000",
        },
      ],
    ],
    {
      id: "MockHoneyTestNetContract",
    }
  );

  return { mockHoney };
});
export default MockHoneyTestNet;
