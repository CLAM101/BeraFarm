export const ERC20DexABI = [
  {
    constant: true,
    inputs: [
      {
        name: "pool",
        type: "address",
      },
    ],
    name: "getLiquidity",
    outputs: [
      {
        name: "asset",
        type: "address[]",
      },
      {
        name: "amounts",
        type: "uint256[]",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
