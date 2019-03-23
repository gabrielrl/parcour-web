namespace PRKR.Model {

  import Vector3 = THREE.Vector3;
  
  export interface DynamicObjectData extends AreaElementData {
    
    size?: Vector3 | number[];

    shape?: Shape;

    /** Object's density. */
    density?: number;

  }

  export class DynamicObject extends AreaElement {

    /**
     * Constant grid size for dynamic objects.
     */
    public static GridSize = 0.25;

    /** Object's half extents. */
    private _size = new Vector3();

    /** Object shape. */
    private _shape: Shape = Shape.Box;

    private _density: number = DynamicObject.DefaultDensity;

    constructor(data?: DynamicObjectData) {
      super(data);

      if (data) {
        if (data.size) {
          if (_.isArray(data.size)) {
            this._size.fromArray(data.size);
          } else {
            this._size.copy(data.size);
          }
        }
        if (data.density != null) {
          this._density = data.density;
        }
        if (data.shape) {
          this._shape = data.shape;
        }
      }

    }

    get type() { return 'DynamicObject'; }

    /** Gets the size of the current dynamic object. */
    get size() { return this._size; }

    /**
     * Gets the shape of the current static object.
     */
    get shape() { return this._shape; }

    /** Gets the density in kg/m^3. */
    get density() { return this._density; }

    /** Gets the mass in kilogram of the current dynamic object. */
    get mass() {
      return this.volume * this.density;
    }

    /** Gets the object's volume in m^3 */
    get volume() {
      let he = this._size;

      switch(this._shape) {
        default:
        case Model.Shape.Box: {
          return 8 * he.x * he.y * he.z;
          // break; 

        }

        case Model.Shape.Sphere: { 
          let r = Math.min(he.x, he.y, he.z);
          return 4 / 3 * Math.PI * Math.pow(r, 3);
          // break; 
        }

        case Model.Shape.Cylinder: { 
          let r = Math.min(he.x, he.z);
          return Math.PI * r * r * he.y * 2;
          // break;
        }
        case Model.Shape.Capsule: { 
          let r = Math.min(he.x, he.z);

          return (
            // The sphere component
            4 / 3 * Math.PI * Math.pow(r, 3)
            +
            // The cylinder component
            Math.PI * r * r * 2 * (he.y - r)
          );
          // break;
        }

        case Model.Shape.Cone: { 
          let r = Math.min(he.x, he.z);
          return 1 / 3 * Math.PI * r * r * he.y * 2
          // break;
        }
    
      }

    }

    // Override.
    public clone() {
      let clone = new DynamicObject();
      clone._copy(this);
      return clone;
    }

    // Override.
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
    public toObject() {
      return _.assign(super.toObject(), {
        $type: this.type,
        size: this.size.toArray(),
        shape: this.shape,
        density: this.density
      });
    }

    // Override
    protected _copy(source: DynamicObject) {
      super._copy(source);
      this._size.copy(source.size);
      this._shape = source.shape;
      this._density = source.density;
    }

    /** Override. */
    public getProperties(): Property[] {
      return super.getProperties().concat(DynamicObject.Properties);
    }

    /** Water = 1000 kg/m^3.  */
    private static DefaultDensity: number = 200;
    /** Just around cork which is estimated at 240. */
    private static MinDensity: number = 2;
    /** Just aroud concrete, which is 2400 */
    private static MaxDensity: number = 2000;

    private static DensityRange = DynamicObject.MaxDensity - DynamicObject.MinDensity;

    private static ExponentialPower = 3;

    /** Converts the specified density (in kg/m³) to its "linear" mapping (from 0 to 1). */
    public static densityToLinear(density: number): number {
      return Math.pow(
        (density - DynamicObject.MinDensity) / DynamicObject.DensityRange,
        1 / DynamicObject.ExponentialPower);      
    }

    /** Converts a "linear" mapping (from 0 to 1) of a density back to its actual value (kg/m³). */
    public static linearToDensity(linear: number): number {
      return DynamicObject.MinDensity +
        Math.pow(linear, DynamicObject.ExponentialPower) * DynamicObject.DensityRange;
    }

    private static Properties: Property[] = [{
      name: 'density',
      display: 'Density',
      info: 'The object\'s density, from cork to gold',
      type: 'number',
      editor: 'range',
      min: DynamicObject.MinDensity,
      max: DynamicObject.MaxDensity,
      getValue: o => {
        if (o instanceof DynamicObject) {
          let v = DynamicObject.densityToLinear(o.density);
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
            let value = DynamicObject.linearToDensity(v);

            if (value < DynamicObject.MinDensity) value = DynamicObject.MinDensity;
            if (value > DynamicObject.MaxDensity) value = DynamicObject.MaxDensity;
            o._density = value;
          }
        }
      }
    }];
  }
}