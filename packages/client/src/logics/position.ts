import { Vector } from "../utils/vector";

export const adjacent = (from: Vector, to: Vector) => {
  return withinRange(from, to, 1);
};

export const withinRange = (from: Vector, to: Vector, range: number) => {
  const dX = getDelta(from.x, to.x);
  const dY = getDelta(from.y, to.y);
  return dX <= range && dY <= range;
};

export const withinRangeLimited = (from: Vector, to: Vector, range: number) => {
  const dX = getDelta(from.x, to.x);
  const dY = getDelta(from.y, to.y);
  return dX + dY <= range;
};

export const getDelta = (from: number, to: number) => {
  return from > to ? from - to : to - from;
};
