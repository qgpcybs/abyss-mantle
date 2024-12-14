import { toHex } from "viem";

export const TEST = toHex("testing", { size: 32 });

export const HOST = toHex("HOST", { size: 16 });

export const POOL = toHex("POOL", { size: 16 });
export const BLOOD = toHex("BLOOD", { size: 16 });
export const SOUL = toHex("SOUL", { size: 16 });
export const STAMINA = toHex("STAMINA", { size: 16 });

export const GRASS = toHex("GRASS", { size: 16 });
export const BUSH = toHex("BUSH", { size: 16 });
export const TREE = toHex("TREE", { size: 16 });
export const GRAVEL = toHex("GRAVEL", { size: 16 });
export const SAND = toHex("SAND", { size: 16 });
export const STUMP = toHex("STUMP", { size: 16 });
export const RED_MINE = toHex("RED_MINE", { size: 16 });

// erc20s
export const WOOD = toHex("WOOD", { size: 16 });
export const BERRY = toHex("BERRY", { size: 16 });
export const WATER = toHex("WATER", { size: 16 });
export const ROCK = toHex("ROCK", { size: 16 });
export const IRON = toHex("IRON", { size: 16 });
export const MEAT = toHex("MEAT", { size: 16 });
export const FISH = toHex("FISH", { size: 16 });
export const RED = toHex("RED", { size: 16 });
export const YELLOW = toHex("YELLOW", { size: 16 });

// buildings
export const SAFE = toHex("SAFE", { size: 16 });
export const GRANARY = toHex("GRANARY", { size: 16 });
export const BRIDGE = toHex("BRIDGE", { size: 16 });
export const NODE = toHex("NODE", { size: 16 });
export const FOUNDRY = toHex("FOUNDRY", { size: 16 });
export const FENCE = toHex("FENCE", { size: 16 });

export const MAX_MOVES = 20;
// for terrain generation
export const PERLIN_DENOM = 30;
// in ms
export const MOVE_DURATION = 300;

// terrain
export const OCEAN = toHex("OCEAN", { size: 16 });
export const FOREST = toHex("FOREST", { size: 16 });
export const PLAIN = toHex("PLAIN", { size: 16 });
export const MOUNTAIN = toHex("MOUNTAIN", { size: 16 });

// mining
export const PERLIN_DENOM_MINE = 30;
export const GRID_SIZE_MINE = 2;
export const UP_LIMIT_MINE = 75;
export const DOWN_LIMIT_MINE = 70;
export const PERCENTAGE_MINE = 10;

export const MINER = toHex("MINER", { size: 16 });
export const CUSTODIAN = toHex("CUSTODIAN", { size: 16 });

// staking
export const STAKING = toHex("STAKING", { size: 16 });

// drop
export const DROP = toHex("DROP", { size: 16 });

// stats
export const ATTACK = toHex("ATTACK", { size: 16 });
export const DEFENSE = toHex("DEFENSE", { size: 16 });
export const RANGE = toHex("RANGE", { size: 16 });

// 3 equipTypes
export const WEAPON = toHex("WEAPON", { size: 16 });
export const ARMOR = toHex("ARMOR", { size: 16 });
export const TRINKET = toHex("TRINKET", { size: 16 });

// mining
export const MINING_RATE = 10 ** 18;
export const DECIMALS = 18;
