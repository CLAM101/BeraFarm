export const bexABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "initialWbera",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "acceptCrocDex",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "protocolCmd",
    inputs: [
      {
        name: "callpath",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "cmd",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "sudo",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "readSlot",
    inputs: [
      {
        name: "slot",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "data",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "swap",
    inputs: [
      {
        name: "base",
        type: "address",
        internalType: "address",
      },
      {
        name: "quote",
        type: "address",
        internalType: "address",
      },
      {
        name: "poolIdx",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "isBuy",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "inBaseQty",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "qty",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "tip",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "limitPrice",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "minOut",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "reserveFlags",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [
      {
        name: "baseFlow",
        type: "int128",
        internalType: "int128",
      },
      {
        name: "quoteFlow",
        type: "int128",
        internalType: "int128",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "userCmd",
    inputs: [
      {
        name: "callpath",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "cmd",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "userCmdRelayer",
    inputs: [
      {
        name: "callpath",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "cmd",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "conds",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "relayerTip",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "output",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "userCmdRouter",
    inputs: [
      {
        name: "callpath",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "cmd",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "client",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "wbera",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CrocKnockoutCross",
    inputs: [
      {
        name: "pool",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
      {
        name: "tick",
        type: "int24",
        indexed: true,
        internalType: "int24",
      },
      {
        name: "isBid",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "pivotTime",
        type: "uint32",
        indexed: false,
        internalType: "uint32",
      },
      {
        name: "feeMileage",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "commitEntropy",
        type: "uint160",
        indexed: false,
        internalType: "uint160",
      },
    ],
    anonymous: false,
  },
];
