/// <reference path="../utils/uuid.ts" />


namespace PRKR.Model {

  export interface ParcourObjectData {
    /** Unique ID (GUID as a string). */
    id?: string
  }

  // Base class for all the objects / elements that compose a parcour.
  export class ParcourObject {

    constructor(data?: ParcourObjectData) {
      if (data && data.id) {
        this._id = data.id;
      } else {
        this._id = PRKR.Utils.uuid();
      }
    }

    private _id: string;
    get id() { return this._id; }

    public name: string;

    // private _location = new THREE.Vector3();
    // get location() { return this._location; }

    // Override this one (make sure to call `_copy`), don't call super.
    public clone(): ParcourObject {
      let clone = new ParcourObject();
      clone._copy(this);
      return clone;      
    }


    public toObject(): any {
      return {
        $type: 'ParcourObject',
        id: this._id
      };
    }

    public toJson(): string {
      return JSON.stringify(this.toObject());
    }

    public static fromObject(data: any): ParcourObject {
      if (data == null) throw new Error('"data" is mandatory.');
      if (!data.$type) throw new Error('"data" needs to have a `$type` property.');

      let typeName = data.$type;
      let type = PRKR.Model[typeName];
      if (!type) {
        throw new Error(`Unrecognized type "${typeName}".`);
      }
      
      let instance = new type(data);
      return instance;
    }

    // Override this one. call super.
    protected _copy(source: ParcourObject) {
      // Copy properties.
      this._id = source.id;
      this.name = source.name;
      // this.location.copy(source.location);
    }
    
    
  }
}