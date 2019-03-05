/// <reference path="../utils/uuid.ts" />


namespace PRKR.Model {

  export interface ParcourObjectData {
    /** Unique ID (GUID as a string). */
    id?: string,

    /** Object name. */
    name?: string
  }

  // Base class for all the objects / elements that compose a parcour.
  export class ParcourObject {

    constructor(data?: ParcourObjectData) {
      if (data && data.id) {
        if (data.id) {
          this._id = data.id;
        }
        if (data.name) {
          this._name = data.name;
        }
      }

      if (!this._id) {
        this._id = PRKR.Utils.uuid();
      }
    }

    get type() { return 'ParcourObject'; }

    private _id: string;
    get id() { return this._id; }

    private _name: string;
    get name() { return this._name; }

    // Override this one (make sure to call `_copy`), don't call super.
    public clone(): ParcourObject {
      let clone = new ParcourObject();
      clone._copy(this);
      return clone;      
    }

    /**
     * Gets a plain object representation of the current object.
     * Override, call super and extend its return value, don't forget to overwrite `$type`.
     */
    public toObject(): any {
      return {
        $type: this.type,
        id: this._id,
        name: this._name
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
        throw new Error(`Unrecognized type "${ typeName }".`);
      }
      
      let instance = new type(data);
      return instance;
    }

    /**
     * Return the editable properties of the object.
     * When overriden, concat result with super's result.
     */
    public getProperties(): Property[] {
      return [];
    }

    /**
     * Gets a property by its name.
     * @param name Property name.
     */
    public getProperty(name: string) {
      return _.find(this.getProperties(), p => p.name === name);
    }

    /**
     * Gets a property value from a property name.
     * @param name Property name.
     */
    public getPropertyValue(name: string): any {
      let prop = this.getProperty(name);
      if (prop) return prop.getValue(this);
    }

    public setPropertyValue(name: string, value: any) {
      let prop = this.getProperty(name);
      if (prop && prop.setValue) {
        prop.setValue(this, value);
      }
    }

    // Override this one. call super.
    protected _copy(source: ParcourObject) {
      // Copy properties.
      this._id = source.id;
      this._name = source.name;
    }
  }
}
