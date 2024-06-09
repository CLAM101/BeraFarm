import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NftMarketplace", (m): any => {
  const nftMarketplace = m.contract("NftMarketplace", [], {
    id: "NftMarketplace",
  });

  return { nftMarketplace };
});
