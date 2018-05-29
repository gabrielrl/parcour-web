namespace PRKR.Model {

  import Vector3 = THREE.Vector3;
  
  export interface DynamicObjectData extends AreaElementData {

    size?: Vector3 | number[];

    // TODO...
    // shape, size
  }

  export class DynamicObject extends AreaElement {

    private _size = new Vector3();

    constructor(data?: DynamicObjectData) {
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

    /** Gets the size of the current dynamic object. */
    get size() { return this._size; }

    // Override.
    public clone() {
      let clone = new DynamicObject();
      clone._copy(this);
      return clone;
    }

    // Override.
    public toObject() {
      let o: any = { $type: 'DynamicObject' };
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
    protected _copy(source: DynamicObject) {
      super._copy(source);
      this._size.copy(source.size);
    }
  }
}