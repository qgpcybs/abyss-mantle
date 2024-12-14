import { UIController } from "../../controllers/UIController";
import { UIBase, UIBaseConfig } from "./UIBase";
import { UIEvents } from "./UIEvents";
import { UISlider } from "./UISlider";
import { ALIGNMODES } from "../../../../constants";

export interface UIListConfig extends UIBaseConfig {
  itemIndentation?: number;
  itemWidth?: number;
  itemHeight?: number;
  spacingX?: number; // horizontal spacing
  spacingY?: number; // vertical spacing
}

export class UIList extends UIBase {
  /** indentation of each item */
  itemIndentation: number = 0;

  /** horizontal spacing */
  spacingX: number = 0;

  /** vertical spacing */
  spacingY: number = 0;

  protected _item?: UIBase;
  protected _itemIndex: number = -1;

  /** list items */
  itemsContainer: UIBase;
  protected _items: UIBase[] = [];

  /** the width of each item */
  protected _itemWidth: number = 180;

  /** the height of each item */
  protected _itemHeight: number = 32;

  sliderX?: UISlider;
  sliderY?: UISlider;

  /** */
  constructor(scene: Phaser.Scene, config: UIListConfig = {}) {
    super(scene, config);
    this.itemsContainer = new UIBase(this.scene, {
      parent: this,
      width: config.width,
      height: config.height,
    });
    this.itemIndentation = config.itemIndentation ?? 0;
    this.itemWidth = config.itemWidth ?? 0;
    this.itemHeight = config.itemHeight ?? 0;
    this.spacingX = config.spacingX ?? 0;
    this.spacingY = config.spacingY ?? 0;
    if (this.overflow === "scroll") {
      this.createViewport();
      this.sliderY = new UISlider(
        scene,
        "list-slider-track",
        undefined,
        "list-slider-thumb",
        {
          width: 32,
          height: this.displayHeight,
          trackNineSlice: [16, 16],
          filledTrackNineSlice: [16, 16],
          alignModeName: ALIGNMODES.RIGHT_TOP,
          parent: this,
          vertical: true,
          thumbWidth: 32,
          thumbHeight: 32,
          thumbAlignMode: 1,
        }
      );
    }
  }

  createViewport() {
    this.viewport = new Phaser.GameObjects.Graphics(this.scene);
    // this.viewport = this.scene.add.graphics().setDepth(12);
    this.updateViewport();
    // this.viewport?.fillStyle(0xffffff, 0.75);
    this.mask = new Phaser.Display.Masks.GeometryMask(
      this.scene,
      this.viewport
    );
    this.itemsContainer.root.setMask(this.mask);
  }

  /**
   * Destroy all listeners and the root node
   */
  destroy() {
    this.removeAllItems();
    super.destroy();
  }

  updateItemSize() {
    this.items.forEach((item, index) => {
      item.setMargin(
        this.itemIndentation,
        (this.itemHeight + this.spacingY) * index
      );
    });
  }

  /**
   * Add a child item to items.
   * @param item the UI to add
   * @param index If other UI for this index, the other UI will be shifted back in order.
   */
  addItem(item: UIBase, index?: number) {
    item.parent = this.itemsContainer;
    if (index === undefined) index = this.items.length;
    else if (index < 0) index += this.items.length;
    if (index < 0) index = 0;
    item.setMargin(
      this.itemIndentation,
      (this.itemHeight + this.spacingY) * index
    );
    this.items.splice(index, 0, item);
    for (let i = index + 1; i < this.items.length; i++) {
      this.items[i].setMargin(
        this.itemIndentation,
        (this.itemHeight + this.spacingY) * i
      );
    }
    this.emit(UIEvents.CHANGE, this);
  }

  removeItem(item: UIBase): boolean {
    this._items.forEach((_item, index) => {
      if (_item === item) {
        this._items.splice(index, 1);
        this.itemsContainer.remove(_item);
        for (let i = index; i < this.items.length; i++) {
          this.items[i].setMargin(
            this.itemIndentation,
            (this.itemHeight + this.spacingY) * i
          );
        }
        this.emit(UIEvents.CHANGE, this);
        return true;
      }
    });
    return false;
  }

  removeItemByIndex(index: number, num: number = 1): boolean {
    const removedItems = this._items.splice(index, num);
    this.itemsContainer.remove(removedItems);
    for (let i = index; i < this.items.length; i++) {
      this.items[i].setMargin(
        this.itemIndentation,
        (this.itemHeight + this.spacingY) * i
      );
    }
    if (removedItems?.length > 0) {
      this.emit(UIEvents.CHANGE, this);
      return true;
    }
    return false;
  }

  removeAllItems() {
    this.items = [];
    this._item = undefined;
    this._itemIndex = -1;
  }

  onFocus() {
    if (this._itemIndex < 0 && this.itemsCount > 0) this.itemIndex = 0;
    else if (this._itemIndex >= this.itemsCount)
      this.itemIndex = this.itemsCount - 1;
  }

  onUpPressed(event: KeyboardEvent) {
    super.onUpPressed(event);
    this.itemIndex = this.itemIndex > 0 ? this.itemIndex - 1 : 0;
  }

  onDownPressed(event: KeyboardEvent) {
    super.onDownPressed(event);
    this.itemIndex =
      this.itemIndex < this.itemsCount - 1
        ? this.itemIndex + 1
        : this.itemsCount - 1;
  }

  onConfirmPressed(event: KeyboardEvent) {
    super.onConfirmPressed(event);
    if (!this._item?.disable && this._item?.onConfirm) {
      UIController.focus = this._item;
      this._item.onConfirm();
    }
  }

  onCancelPressed(event: KeyboardEvent) {
    super.onCancelPressed(event);
    if (!this._item?.disable && this._item?.onCancel) {
      // this._item.onCancel();
    }
  }

  onItemSelected(value: UIBase | undefined) {
    // scroll
    if (this.sliderY) {
      this.sliderY.max = this.itemsCount - 1;
      this.sliderY.value = this.itemIndex;
      this.updateScroll();
    }
    // logic
    this.emit(UIEvents.SELECT_CHANGE, this);
    if (!value) return;
    value.onSelected();
  }

  onItemUnSelected(value: UIBase | undefined) {
    if (!value) return;
    value.onUnSelected();
  }

  updateScroll() {
    const itemY = this.item?.y ?? 0;
    const past =
      itemY +
      this.itemHeight -
      this.itemsContainer.configHeight / this.itemsContainer.zoom;
    if (past > -this.itemsContainer.y / this.itemsContainer.zoom) {
      this.itemsContainer.y = -past * this.itemsContainer.zoom;
    } else if (itemY < -this.itemsContainer.y / this.itemsContainer.zoom) {
      this.itemsContainer.y = -itemY * this.itemsContainer.zoom;
    }
  }

  setZoom(value: number) {
    super.setZoom(value);
  }

  get itemsCount(): number {
    return this._items.length;
  }

  get items(): UIBase[] {
    return this._items;
  }

  set items(value: UIBase[]) {
    this._items = value;
    this.itemsContainer.destroyChildren();
    this._items.forEach((newItem, index) => {
      newItem.parent = this.itemsContainer;
      newItem.setMargin(
        this.itemIndentation,
        (this.itemHeight + this.spacingY) * index
      );
    });
    this.emit(UIEvents.CHANGE, this);
  }

  get itemWidth(): number {
    return this._itemWidth;
  }

  set itemWidth(value: number) {
    this._itemWidth = value;
    this.updateItemSize();
  }

  get itemHeight(): number {
    return this._itemHeight;
  }

  set itemHeight(value: number) {
    this._itemHeight = value;
    this.updateItemSize();
  }

  get item(): UIBase | undefined {
    return this._item;
  }

  set item(value: UIBase) {
    this.onItemUnSelected(this._item);
    const index = this._items.indexOf(value);
    this._item = index !== -1 ? value : undefined;
    this._itemIndex = index;
    this.onItemSelected(this._item);
  }

  get itemIndex(): number {
    return this._itemIndex;
  }

  set itemIndex(value: number) {
    this.onItemUnSelected(this._item);
    this._itemIndex = value;
    this._item = value >= 0 ? this._items[value] : undefined;
    this.onItemSelected(this._item);
  }
}
