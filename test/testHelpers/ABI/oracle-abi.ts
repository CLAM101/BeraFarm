export const oracleABI = [
  {
    inputs: [],
    name: "getAllCurrencyPairs",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "pair",
        type: "string",
      },
    ],
    name: "getPrice",
    outputs: [
      {
        name: "",
        type: "int256",
      },
      {
        name: "",
        type: "uint256",
      },
      {
        name: "",
        type: "uint64",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
