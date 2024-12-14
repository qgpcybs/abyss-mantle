import Phaser from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  // type: Phaser.CANVAS,
  type: Phaser.AUTO,
  parent: "phaser-container",
  backgroundColor: "#1a103c",
  // width: 800,
  // height: 500,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    // autoCenter: Phaser.Scale.CENTER_BOTH,
    height: window.innerHeight,
  },
  pixelArt: true,
  disableContextMenu: true,
  audio: {
    disableWebAudio: false,
  },
  dom: {
    createContainer: true,
  },
};

export default config;
