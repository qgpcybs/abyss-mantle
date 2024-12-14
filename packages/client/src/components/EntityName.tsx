import { Entity } from "@latticexyz/recs";
import { Hex, hexToString } from "viem";
import { fromEntity } from "../utils/encode";
import { hexTypeToString } from "../utils/encode";

export type EntityNameProps = {
  entity: Entity;
} & JSX.IntrinsicElements["span"];

export default function EntityName({ entity, ...passProps }: EntityNameProps) {
  const { type, id } = fromEntity(entity as Hex);

  return (
    <span {...passProps}>
      {hexTypeToString(type)} #{Number(id)}
    </span>
  );
}