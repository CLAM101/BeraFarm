import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import MockHoney from "./MockHoney";
import FuzzToken from "./FuzzToken";
import AddLiquidModule from "./AddLiquidModule";

export default buildModule("Main", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { mockHoney } = m.useModule(MockHoney);
  const { fuzzToken } = m.useModule(FuzzToken);

  const owner = m.getAccount(0);
  const otherAccount = m.getAccount(1);
  const thirdAccount = m.getAccount(2);
  const fourthAccount = m.getAccount(3);
  const fifthAccount = m.getAccount(4);
  const sixthAccount = m.getAccount(5);

  return {
    beraCub,
    mockHoney,
    fuzzToken,
    owner,
    otherAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
    sixthAccount,
  };
});
