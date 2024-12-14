// import {
//   Entity,
//   Has,
//   UpdateType,
//   defineSystem,
//   getComponentValue,
//   removeComponent,
//   setComponent,
// } from "@latticexyz/recs";
// import { SetupResult } from "./setup";
// import { HOST } from "../contract/constants";
// import { POOL_TYPES } from "../constants";
// import { getPool } from "../contract/hashes";
// import { Hex } from "viem";

// export function syncPools({ components, network: { world } }: SetupResult) {
//   const { Position, Commander, EntityType, PoolOf } = components;

//   // because pool is a hash of player & poolType, so we need to map pool -> player
//   // deep down, the rationale is to save gas on three writes when role spawn: Owner.set(pool, role)
//   defineSystem(world, [Has(Position), Has(Commander)], ({ entity, type }) => {
//     const entityType = getComponentValue(EntityType, entity)?.value;
//     // TODO: add arrayOfHostTypes.includes(entityType) to the if statement
//     if (entityType !== HOST) return;
//     if (type === UpdateType.Update) return;
//     if (type === UpdateType.Exit) {
//       const pools = POOL_TYPES.map((poolType) =>
//         getPool(entity as Hex, poolType)
//       );
//       return pools.forEach((pool) => removeComponent(PoolOf, pool as Entity));
//     }
//     const pools = POOL_TYPES.map((poolType) =>
//       getPool(entity as Hex, poolType)
//     );
//     pools.forEach((pool) =>
//       setComponent(PoolOf, pool as Entity, { value: entity })
//     );
//     console.log("pool", pools, entity);
//   });
// }
