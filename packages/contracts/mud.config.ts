import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  // namespace: "app",
  systems: {
    Errors: {
      name: "Errors",
      openAccess: false,
      accessList: [],
    },
  },
  tables: {
    IsPlayer: "bool",
    Counter: {
      schema: {
        entityType: "bytes16",
        value: "uint256",
      },
      key: ["entityType"],
    },
    Approval: "bytes32",
    Allowance: {
      schema: {
        entityType: "bytes16",
        owner: "bytes32",
        spender: "bytes32",
        value: "uint256",
      },
      key: ["entityType", "owner", "spender"],
    },
    Balance: {
      schema: {
        entityType: "bytes16",
        owner: "bytes32",
        value: "uint256",
      },
      key: ["entityType", "owner"],
    },
    TotalSupply: {
      schema: {
        entityType: "bytes16",
        value: "uint256",
      },
      key: ["entityType"],
    },
    StoredSize: "uint256",
    // main reasons might be easier for clientside to diff
    // building -> player
    Creator: "bytes32",
    // role -> player
    Commander: "bytes32",
    // -> building & host
    Owner: "bytes32",
    EntityType: "bytes16",
    MiningInfo: {
      schema: {
        roleId: "bytes32",
        buildingId: "bytes32",
        lastUpdated: "uint40",
      },
      key: ["roleId"],
    },
    // building & host
    Path: {
      schema: {
        entityId: "bytes32",
        fromX: "uint32",
        fromY: "uint32",
        toX: "uint32",
        toY: "uint32",
        lastUpdated: "uint40",
        duration: "uint40",
      },
      key: ["entityId"],
    },
    Moves: "uint256",
    // tileId -> terrainType
    Terrain: "uint256",
    // tileId -> buildingId
    TileEntity: "bytes32",
    Position: {
      schema: {
        entityId: "bytes32",
        x: "uint32",
        y: "uint32",
      },
      key: ["entityId"],
    },
    // for non-fungible entity that has stats (with max & balance)
    StatsSpecs: {
      schema: {
        entityType: "bytes16",
        maxPools: "bytes32[]",
      },
      key: ["entityType"],
    },
    HostName: {
      schema: {
        hostId: "bytes32",
        name: "string",
      },
      key: ["hostId"],
    },
    // ----- equipment -----
    Equipment: {
      schema: {
        equipType: "bytes16",
        owner: "bytes32",
        equipment: "bytes32",
      },
      key: ["equipType", "owner"],
    },
    // // item -> bool; if true, cannot be transferred or equiped
    // IsEquipped: "bool",
    // host -> weapon
    // Weapon: "bytes32",
    // Armor: "bytes32",
    // Trinket: "bytes32",
    // WeaponSpecs: {
    //   schema: {
    //     weaponType: "bytes16",
    //     attack: "uint16",
    //     range: "uint16",
    //   },
    //   key: ["weaponType"],
    // },
    // ArmorSpecs: {
    //   schema: {
    //     armorType: "bytes16",
    //     defense: "uint16",
    //   },
    //   key: ["armorType"],
    // },
    // ----- terrain & map -----
    // if true, not obstacle, can build, can move onto if no building
    // coordId ->
    RemovedCoord: "bool",
    // entity types: terrain, building, host, food, material
    // terrain: when destoryed, award destroyer; 0 means cannot be destroyed
    // default is change to GRASS
    TerrainSpecs: {
      schema: {
        terrainType: "bytes16",
        canMove: "bool",
        canBurn: "bool",
      },
      key: ["terrainType"],
    },
    // for all building group
    BuildingSpecs: {
      schema: {
        buildingType: "bytes16",
        width: "uint8",
        height: "uint8",
        // player can move on
        canMove: "bool",
        // terrain type to build on
        terrainType: "bytes16",
      },
      key: ["buildingType"],
    },
    // all erc20 & erc721 has size; except building or terrain
    SizeSpecs: {
      schema: {
        entityType: "bytes16",
        size: "uint128",
      },
      key: ["entityType"],
    },
    //
    ContainerSpecs: {
      schema: {
        entityType: "bytes16",
        capacity: "uint256",
      },
      key: ["entityType"],
    },
    SwapRatio: {
      schema: {
        fromType: "bytes16",
        toType: "bytes16",
        host: "bytes32",
        // easier to querry in client
        hostCopy: "bytes32",
        num: "uint16",
        denom: "uint16",
      },
      key: ["fromType", "toType", "host"],
    },
    // stamina -> soul/blood
    ConvertRatio: {
      schema: {
        fromType: "bytes16",
        toType: "bytes16",
        num: "uint8",
        denom: "uint8",
      },
      key: ["fromType", "toType"],
    },
    // building/item
    MintCosts: {
      schema: {
        mintType: "bytes16", // erc721
        // 1st 16 bytes type, 2nd 16 amount
        costs: "bytes32[]",
      },
      key: ["mintType"],
    },
    // building/item
    UpgradeCosts: {
      schema: {
        fromType: "bytes16", // erc721
        toType: "bytes16", // erc721
        costs: "bytes32[]",
      },
      key: ["fromType"],
    },
    // terrain/building
    BurnCosts: {
      schema: {
        burnType: "bytes16", // erc721
        costs: "bytes32[]",
      },
      key: ["burnType"],
    },
    // terrain/building/host
    BurnAwards: {
      schema: {
        burnType: "bytes16", //erc20 or erc721
        awards: "bytes32[]",
      },
      key: ["burnType"],
    },
    // terrain
    InteractCosts: {
      schema: {
        interactType: "bytes16", //erc721?
        costs: "bytes32[]",
      },
      key: ["interactType"],
    },
    InteractAwards: {
      schema: {
        interactType: "bytes16", //erc20 or erc721
        awards: "bytes32[]",
      },
      key: ["interactType"],
    },
    // outputType ->
    StakeSpecs: {
      schema: {
        outputType: "bytes16",
        buildingType: "bytes16",
        timeCost: "uint40",
        inputs: "bytes32[]",
        outputs: "bytes32[]",
      },
      key: ["outputType"],
    },
    // can use LastUpdated & custodian hash to ensure staking info
    // but create this table to make clientside easier to query
    StakingInfo: {
      schema: {
        stakingId: "bytes32",
        role: "bytes32",
        building: "bytes32",
        // outputType is recorded so that we can check for its timeCost
        // alternatively, player needs to put in outputType
        outputType: "bytes16",
        lastUpdated: "uint40",
      },
      key: ["stakingId"],
    },
    // outputType ->
    CookSpecs: {
      schema: {
        outputType: "bytes16",
        buildingType: "bytes16",
        timeCost: "uint40",
        inputs: "bytes32[]",
        outputs: "bytes32[]",
      },
      key: ["outputType"],
    },
    CookingInfo: {
      schema: {
        cookingId: "bytes32",
        role: "bytes32",
        building: "bytes32",
        outputType: "bytes16",
        lastUpdated: "uint40",
      },
      key: ["cookingId"],
    },
    // destroyable: building, host, terrain
    // Destroy stuff, award erc20s or erc721
  },
});
