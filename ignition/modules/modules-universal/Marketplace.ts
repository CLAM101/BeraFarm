import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
export default buildModule("NftMarketplace", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const nftMarketplace = m.contract("NftMarketplace", [beraCub], {
    id: "NftMarketplace",
  });

  return { nftMarketplace };
});
