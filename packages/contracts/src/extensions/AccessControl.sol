// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { WorldContextConsumer } from "@latticexyz/world/src/WorldContext.sol";
import { Approval, Commander, Owner, Creator } from "@/codegen/index.sol";
import { space } from "@/constants.sol";
import { TypeCast } from "@/utils/TypeCast.sol";
import { Errors } from "@/Errors.sol";

abstract contract AccessControl is WorldContextConsumer {
  using TypeCast for address;

  // controller == commander || creator
  modifier onlyController(bytes32 entity) {
    {
      bytes32 account = _msgSender().toBytes32();
      if (!_isController(entity, account)) revert Errors.NotController();
    }
    _;
  }

  modifier onlyCommander(bytes32 entity) {
    {
      bytes32 account = _msgSender().toBytes32();
      if (!_isCommander(entity, account)) revert Errors.NotCommander();
    }
    _;
  }

  // NOT USED RN
  modifier onlyApproved(bytes32 entity) {
    {
      bytes32 account = _msgSender().toBytes32();
      if (!_isApproved(entity, account)) revert Errors.NotApproved();
    }
    _;
  }

  function _isController(bytes32 entity, bytes32 account) internal view returns (bool) {
    return _isCreator(entity, account) || _isCommander(entity, account);
  }

  function _isCreator(bytes32 entity, bytes32 account) internal view returns (bool) {
    bytes32 curr = entity;
    while (true) {
      bytes32 next = Owner.get(curr);
      if (next == space()) {
        // an entity only has a commander if the owner is the world
        bytes32 currCreator = Creator.get(curr);
        return currCreator == account || currCreator == space();
      } else if (next == 0) {
        return false;
      }
      curr = next;
    }
  }

  // this new _isCommander() check the first commander following the owner chain
  function _isCommander(bytes32 entity, bytes32 account) internal view returns (bool) {
    bytes32 curr = entity;
    while (true) {
      bytes32 next = Owner.get(curr);
      bytes32 currCommander = Commander.get(curr);
      if (currCommander != 0) {
        return currCommander == account;
      }
      if (next == space() || next == 0) {
        return false;
      }
      curr = next;
    }
  }

  // function _isCommander(bytes32 entity, bytes32 account) internal view returns (bool) {
  //   bytes32 curr = entity;
  //   while (true) {
  //     bytes32 next = Owner.get(curr);
  //     if (next == space()) {
  //       // an entity only has a commander if the owner is the world
  //       bytes32 currCommander = Commander.get(curr);
  //       return currCommander == account || currCommander == space();
  //     } else if (next == 0) {
  //       return false;
  //     }
  //     curr = next;
  //   }
  // }

  function _isApproved(bytes32 entity, bytes32 account) internal view returns (bool) {
    bytes32 curr = entity;
    while (Approval.get(curr) != account) {
      bytes32 next = Owner.get(curr);
      if (next == space()) {
        // an entity only has a commander if the owner is the world
        bytes32 currCommander = Commander.get(curr);
        return currCommander == account || currCommander == space();
      } else if (next == 0) {
        return false;
      }
      curr = next;
    }
    return true;
  }
}
