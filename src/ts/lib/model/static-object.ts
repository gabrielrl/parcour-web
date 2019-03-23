namespace PRKR.Model {

  import Vector3 = THREE.Vector3;
  
  export interface StaticObjectData extends AreaElementData {

    size?: Vector3 | number[];

    shape?: Shape;

  }

  export class StaticObject extends AreaElement {

    /**
     * Constant grid size for static objects.
     */
    public static GridSize = 0.25;

    /** Object's half extents. */
    private _size = new Vector3();

    /** Object shape. */
    private _shape: Shape = Shape.Box;

    constructor(data?: StaticObjectData) {
      super(data);

      if (data) {
        if (data.size) {
          if (_.isArray(data.size)) {
            this._size.fromArray(data.size);
          } else {
            this._size.copy(data.size);
          }
        }

        if (data.shape) {
          this._shape = data.shape;
        }
      }

    }

    get type() { return 'StaticObject'; }

    /**
     * Gets the size of the current static object. Represent the "half extents" of the object.
     */
    get size() { return this._size; }

    /**
     * Gets the shape of the current static object.
     */
    get shape() { return this._shape; }

    // Override.
    public clone() {
      let clone = new StaticObject();
      clone._copy(this);
      return clone;
    }

    // Override
    public getBoundingBox(): THREE.Box3 {

      let box = new THREE.Box3(
        this.size.clone().multiplyScalar(-1),
        this.size.clone()
      );
      M.rotateBox3(box, this.rotation);
      box.translate(this.location);
      return box;
    }

    /**
     * Gets a plain object representation of the current object.
     * Override, call super and extend its return value, don't forget to overwrite `$type`.
     */
    public toObject(): any {
      return _.assign(super.toObject(), {
        size: this.size.toArray(),
        shape: this.shape
      });
    }

    // Override
    protected _copy(source: StaticObject) {
      super._copy(source);
      this._size.copy(source.size);
      this._shape = source.shape;
    }
  }
}