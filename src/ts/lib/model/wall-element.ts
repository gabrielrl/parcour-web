/// <reference path="./area-element.ts" />

namespace PRKR.Model {
  import Vector2 = THREE.Vector2;

  export interface WallElementData extends AreaElementData {

    size?: Vector2 | number[];

  }

  export class WallElement extends AreaElement {

    private _size: Vector2;

    constructor(data?: WallElementData) {
      super(data);
      this._size = new Vector2();

      if (data) {
        if (data.size) {
          if (_.isArray(data.size)) {
            let a = data.size;
            this._size.set(a[0], a[1]);
          } else {
            this._size.copy(data.size);
          }
        }
      }
    }

    get size() { return this._size; }
    get width() { return this._size.x; }
    get height() { return this._size.y; }

    // Override, don't call parent but call `_copy`.
    public clone() {
      let clone = new WallElement();
      clone._copy(this);
      return clone;
    }

    // Override, call parent.
    protected _copy(source: WallElement) {
      super._copy(source);
      this._size.copy(source._size);
    }
  }
}