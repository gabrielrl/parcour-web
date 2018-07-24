/// <reference path="./parcour-object.ts" />

namespace PRKR.Model {

  import Vector3 = THREE.Vector3;

  export interface AreaElementData extends ParcourObjectData {
    areaId: string;
    location: Vector3 | number[];
  }

  /** Base class for all parcour objects that are part of an area. */
  export class AreaElement extends ParcourObject {

    /** ID of the area that contains the current element. */
    private _areaId: string = null;

    /** (Area relative) location of the current element. */
    private _location = new Vector3();

    constructor(data?: AreaElementData) {
      super(data);

      if (data) {
        if (data.areaId) { this._areaId = data.areaId; }

        if (data.location) {
          if (_.isArray(data.location)) {
            let a = data.location;
            this._location.set(a[0], a[1], a[2]);
          } else {
            this._location.copy(data.location);
          }
        }
      }
    }

    /** Gets the ID of the area that contains the current element. */
    get areaId() { return this._areaId; }
    /** Sets the ID of the area that contains the current element. */
    set areaId(value: string) { this._areaId = value; }

    /** Gets the (area relative) location of the current element in the area. */
    get location() { return this._location; }

    // Override
    public clone() {
      let clone = new AreaElement();
      clone._copy(this);
      return clone;
    }

    /**
     * Gets the object's orthogonal bounding box (area relative). Test before using return value as not all
     * subclasses implements this method and the defulat implementation returns null.
     */
    // Override.
    public getBoundingBox(): THREE.Box3 {
      return null;
    }

    // Override.
    protected _copy(source: AreaElement) {
      super._copy(source);
      this._areaId = source.areaId;
      this._location.copy(source.location);
    }
  }
}