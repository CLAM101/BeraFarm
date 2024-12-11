import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Faucet = buildModule("Faucet", (m): any => {
  const faucet = m.contract("Faucet", [], {
    id: "FaucetContract",
  });

  return { faucet };
});
export default Faucet;
