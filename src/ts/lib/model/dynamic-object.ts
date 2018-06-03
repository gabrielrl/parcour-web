namespace PRKR.Model {

  import Vector3 = THREE.Vector3;
  
  export interface DynamicObjectData extends AreaElementData {
    
    size?: Vector3 | number[];

    /** Object's density. */
    density?: number;

    // TODO...
    // shape
  }

  export class DynamicObject extends AreaElement {

    private _size = new Vector3();

    private _density: number = DynamicObject.DefaultDensity;

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
        if (data.density != null) {
          this._density = data.density;
        }
      }

    }

    /** Gets the size of the current dynamic object. */
    get size() { return this._size; }

    /** Gets the density in kg/m^3. */
    get density() { return this._density; }

    /** Gets the mass in kilogram of the current dynamic object. */
    get mass() {
      return this.volume * this.density;
    }

    /** Gets the object's volume in m^3 */
    get volume() {
      return this._size.x * this._size.y * this._size.z;
    }

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
        size: this.size.toArray(),
        density: this.density
        // ...
      });
      return o;
    }

    // Override
    protected _copy(source: DynamicObject) {
      super._copy(source);
      this._size.copy(source.size);
      this._density = source.density;
    }

    /** Override. */
    public getProperties(): Property[] {
      return super.getProperties().concat(DynamicObject.Properties);
    }

    /** Water = 1000 kg/m^3.  */
    private static DefaultDensity: number = 1000;
    /** Just around cork which is estimated at 240. */
    private static MinDensity: number = 200;
    /** Just aroud gold, which is 19320 */
    private static MaxDensity: number = 20000;

    private static DensityRange = DynamicObject.MaxDensity - DynamicObject.MinDensity;

    private static Properties: Property[] = [{
      name: 'density',
      display: 'Density',
      info: 'The object\'s density, from cork to gold',
      type: 'number',
      editor: 'range',
      min: DynamicObject.MinDensity, // !
      max: DynamicObject.MaxDensity, // ! TODO logarithmic scale required
      getValue: o => {
        if (o instanceof DynamicObject) {
          let v = (o.density - DynamicObject.MinDensity) / DynamicObject.DensityRange;
          return v;
        } else {
          return 0;
        }
      },
      setValue: (o, v) => {
        if (o instanceof DynamicObject) {
          if (v == null) {
            o._density = DynamicObject.DefaultDensity;
          } else {
            // console.log('DynamicObject.setValue (v=', v, ', o=', o);
            let value = DynamicObject.MinDensity + v * DynamicObject.DensityRange;

            if (value < DynamicObject.MinDensity) value = DynamicObject.MinDensity;
            if (value > DynamicObject.MaxDensity) value = DynamicObject.MaxDensity;
            o._density = value;
          }
        }
      }
    }];
  }
}