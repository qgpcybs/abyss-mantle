export type Vector = {
  x: number;
  y: number;
};

export function scaleVector(vector: Vector, scale: number) {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

export function vectorToAngle(vector: Vector) {
  return Math.atan2(vector.y, vector.x);
}

export function vectorToMagnitude(vector: Vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

export function squareVector(vector: Vector) {
  return vector.x * vector.x + vector.y * vector.y;
}

export function angleToUnitVector(angle: number) {
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

export function addVectors(vector1: Vector, vector2: Vector) {
  return {
    x: vector1.x + vector2.x,
    y: vector1.y + vector2.y,
  };
}

export function subVectors(vector1: Vector, vector2: Vector) {
  return {
    x: vector1.x - vector2.x,
    y: vector1.y - vector2.y,
  };
}

export function getUnitVector(vector: Vector) {
  const magnitude = vectorToMagnitude(vector);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

export function angleBetweenVectors(vector1: Vector, vector2: Vector) {
  return vectorToAngle(vector2) - vectorToAngle(vector1);
}

export function lawOfCosines(a: number, b: number, angle: number) {
  return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angle));
}

export function dotVectors(vector1: Vector, vector2: Vector) {
  return vector1.x * vector2.x + vector1.y * vector2.y;
}

// get coords of the rectangle formed by the start and end points and extra
export function getRectangleCoords(start: Vector, end: Vector, extra = 0) {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);

  const coords: Vector[] = [];
  for (let x = minX - extra; x <= maxX + extra; x++) {
    for (let y = minY - extra; y <= maxY + extra; y++) {
      coords.push({ x, y });
    }
  }
  return coords;
}

export function getCoordsWithinRadius(coord: Vector, radius: number) {
  const coordsWithinRadius = [];
  for (let x = coord.x - radius; x <= coord.x + radius; x++) {
    if (x < 0) continue;
    for (let y = coord.y - radius; y <= coord.y + radius; y++) {
      if (y < 0) continue;
      const distance = Math.abs(coord.x - x) + Math.abs(coord.y - y);
      if (distance <= radius) {
        coordsWithinRadius.push({ x, y });
      }
    }
  }
  return coordsWithinRadius;
}
