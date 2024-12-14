import buildings_json from "../../assets/data/buildings.json?url";

export class GameData {
  static scene: Phaser.Scene;
  static preload(scene: Phaser.Scene) {
    this.scene = scene;
    scene.load.json("buildings", buildings_json);
  }

  static getData(filename: string) {
    return this.scene.cache.json.get(filename);
  }

  static getDataByIndex(filename: string, index: number) {
    const data = this.getData(filename);
    return data[index];
  }

  static getDataByType(filename: string, type: string) {
    const data = this.getData(filename) as Array<any>;
    return data.find((item) => item.type === type);
  }
}
