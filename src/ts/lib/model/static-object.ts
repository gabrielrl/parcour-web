namespace PRKR.Model {

  import Vector3 = THREE.Vector3;
  
  export interface StaticObjectData extends AreaElementData {

    size?: Vector3 | number[];

    // TODO...
    // shape, size
  }

  export class StaticObject extends AreaElement {

    /**
     * Constant grid size for static objects.
     */
    public static GridSize = 0.25;

    /** Object's half extents. */
    private _size = new Vector3();

    constructor(data?: StaticObjectData) {
      super(data);

      if (data) {
        if (data.size) {
          if (_.isArray(data.size)) {
            let a = data.size;
            this._size.set(a[0], a[1], a[2]);
          } else {
            this._size.copy(data.size);
          }
        }
      }

    }

    get type() { return 'StaticObject'; }

    /**
     * Gets the size of the current static object. Represent the "half extents" of the object.
     */
    get size() { return this._size; }

    // Override.
    public clone() {
      let clone = new StaticObject();
      clone._copy(this);
      return clone;
    }    

    // Override
    public getBoundingBox(): THREE.Box3 {
      let box = new THREE.Box3(
        new Vector3().copy(this.location).addScaledVector(this.size, -1),
        new Vector3().copy(this.location).addScaledVector(this.size, 1),
      );
      return box;
    }

    // Override.
    public toObject() {
      let o: any = { $type: this.type };
      _.extend(o, {
        id: this.id,
        areaId: this.areaId,
        location: this.location.toArray(),
        size: this.size.toArray()
        // ...
      });
      return o;
    }

    // Override
    protected _copy(source: StaticObject) {
      super._copy(source);
      this._size.copy(source.size);
    }
  }
}