export const queryABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "dex",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "dex_",
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
    type: "function",
    name: "queryAmbientPosition",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
    ],
    outputs: [
      {
        name: "seeds",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "timestamp",
        type: "uint32",
        internalType: "uint32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryAmbientTokens",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
    ],
    outputs: [
      {
        name: "liq",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "baseQty",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "quoteQty",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryConcRewards",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
        name: "lowerTick",
        type: "int24",
        internalType: "int24",
      },
      {
        name: "upperTick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "liqRewards",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "baseRewards",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "quoteRewards",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryCurve",
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
    ],
    outputs: [
      {
        name: "curve",
        type: "tuple",
        internalType: "struct CurveMath.CurveState",
        components: [
          {
            name: "priceRoot_",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "ambientSeeds_",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "concLiq_",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "seedDeflator_",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "concGrowth_",
            type: "uint64",
            internalType: "uint64",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryCurveTick",
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
    ],
    outputs: [
      {
        name: "",
        type: "int24",
        internalType: "int24",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryKnockoutMerkle",
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
        name: "isBid",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "tick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "root",
        type: "uint160",
        internalType: "uint160",
      },
      {
        name: "pivot",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "fee",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryKnockoutPivot",
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
        name: "isBid",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "tick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "lots",
        type: "uint96",
        internalType: "uint96",
      },
      {
        name: "pivot",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "range",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryKnockoutPos",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
        name: "pivot",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "isBid",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "lowerTick",
        type: "int24",
        internalType: "int24",
      },
      {
        name: "upperTick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "lots",
        type: "uint96",
        internalType: "uint96",
      },
      {
        name: "mileage",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "timestamp",
        type: "uint32",
        internalType: "uint32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryKnockoutTokens",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
        name: "pivot",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "isBid",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "lowerTick",
        type: "int24",
        internalType: "int24",
      },
      {
        name: "upperTick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "liq",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "baseQty",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "quoteQty",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "knockedOut",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryLevel",
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
        name: "tick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "bidLots",
        type: "uint96",
        internalType: "uint96",
      },
      {
        name: "askLots",
        type: "uint96",
        internalType: "uint96",
      },
      {
        name: "odometer",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryLiquidity",
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
    ],
    outputs: [
      {
        name: "",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryPoolParams",
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
    ],
    outputs: [
      {
        name: "pool",
        type: "tuple",
        internalType: "struct PoolSpecs.Pool",
        components: [
          {
            name: "schema_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "feeRate_",
            type: "uint16",
            internalType: "uint16",
          },
          {
            name: "protocolTake_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "tickSize_",
            type: "uint16",
            internalType: "uint16",
          },
          {
            name: "jitThresh_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "knockoutBits_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "oracleFlags_",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryPoolTemplate",
    inputs: [
      {
        name: "poolIdx",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "pool",
        type: "tuple",
        internalType: "struct PoolSpecs.Pool",
        components: [
          {
            name: "schema_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "feeRate_",
            type: "uint16",
            internalType: "uint16",
          },
          {
            name: "protocolTake_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "tickSize_",
            type: "uint16",
            internalType: "uint16",
          },
          {
            name: "jitThresh_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "knockoutBits_",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "oracleFlags_",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryPrice",
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
    ],
    outputs: [
      {
        name: "",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryProtocolAccum",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryRangePosition",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
        name: "lowerTick",
        type: "int24",
        internalType: "int24",
      },
      {
        name: "upperTick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "liq",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "fee",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "timestamp",
        type: "uint32",
        internalType: "uint32",
      },
      {
        name: "atomic",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryRangeTokens",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
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
        name: "lowerTick",
        type: "int24",
        internalType: "int24",
      },
      {
        name: "upperTick",
        type: "int24",
        internalType: "int24",
      },
    ],
    outputs: [
      {
        name: "liq",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "baseQty",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "quoteQty",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "querySurplus",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "surplus",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "queryVirtual",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "tracker",
        type: "address",
        internalType: "address",
      },
      {
        name: "salt",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "surplus",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "view",
  },
];
