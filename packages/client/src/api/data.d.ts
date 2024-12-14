export interface BuildingData {
  id: number;
  type: string;
  name: string;
  img: string;
  sceneImg: string;
  introduction: string;
}

export interface BuildingSpecs {
  width: number;
  height: number;
  canMove: boolean;
  terrainType: Hex;
}

export interface ItemData {
  type: string;
  entity: Entity;
  amount: number;
  id?: number;
  state?: string;
}

export interface MoveStep {
  x: number;
  y: number;
  distance: number;
  type?: string;
  terrainType?: TerrainType;
}
