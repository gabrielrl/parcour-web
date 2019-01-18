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
            this._size.fromArray(data.size);
          } else {
            this._size.copy(data.size);
          }
        }
      }
    }

    get type() { return 'WallElement'; }

    get size() { return this._size; }
    get width() { return this._size.x; }
    get height() { return this._size.y; }

    // Override, don't call parent but call `_copy`.
    public clone() {
      let clone = new WallElement();
      clone._copy(this);
      return clone;
    }

    /**
     * Gets a plain object representation of the current object.
     * Override, call super and extend its return value, don't forget to overwrite `$type`.
     */
    public toObject(): any {
      return _.assign(super.toObject(), {
        $type: this.type,
        size: this._size.toArray()
      });
    }

    // Override, call parent.
    protected _copy(source: WallElement) {
      super._copy(source);
      this._size.copy(source._size);
    }
  }
}