// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { TileEntity } from "@/codegen/index.sol";
import { Errors } from "@/Errors.sol";

// mainly used by BuildingLogic
library TileLogic {
  function _setTileEntitiesStrict(bytes32 entity, bytes32[] memory tileIds) internal {
    for (uint256 i = 0; i < tileIds.length; i++) {
      _setTileEntityStrict(entity, tileIds[i]);
    }
  }

  function _setTileEntityStrict(bytes32 entity, bytes32 tileId) internal {
    if (TileEntity.get(tileId) != 0) revert Errors.HasEntityOnCoord();
    TileEntity.set(tileId, entity);
  }

  function _deleteTileEntities(bytes32 entity, bytes32[] memory tileIds) internal {
    for (uint256 i = 0; i < tileIds.length; i++) {
      _deleteTileEntity(entity, tileIds[i]);
    }
  }

  function _deleteTileEntity(bytes32 entity, bytes32 tileId) internal {
    TileEntity.deleteRecord(tileId);
  }
}
