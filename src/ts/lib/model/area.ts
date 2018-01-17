/// <reference path="../m.ts" />
/// <reference path="./parcour-object.ts" />

namespace PRKR.Model {

  import Vector3 = THREE.Vector3;

  export interface AreaData extends ParcourObjectData {
    location?: Vector3 | number[];
    size?: Vector3 | number[];
  }

  /**
   * 
   */
  export class Area extends ParcourObject {

    private _location = new Vector3();
    private _size = new Vector3();

    constructor(data?: AreaData) {
      super(data);

      if (data) {
        if (data.location) {
          if (_.isArray(data.location)) {
            let a = data.location;
            this._location.set(a[0], a[1], a[2]);
          } else {
            this._location.copy(data.location);
          }
        }
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

    /** Gets the (world relative) location of the current area's origin. */
    get location() { return this._location; }

    /** Gets the size of the current area. */
    get size() { return this._size };

    /**
     * Gets the area's orthogonal bounding box (world relative).
     */
    public getBoundingBox()
      : THREE.Box3
    {
      let max = new THREE.Vector3();
      max.copy(this.location).add(this.size);
      let box = new THREE.Box3(this.location, max);
      return box;
    }

    public getCenter(target?: THREE.Vector3) {
      if (!target) {
        target = new Vector3();
      }

      target.copy(this.location)
        .addScaledVector(this.size, .5);

      return target;
    }

    /**
     * Returns the list of wall definitions for the current area.
     * 
     * Override, don't call base.
     */
    public getWallDefinitions(): WallDefinition[] {
      return [];
    }

    // Override
    public clone() {
      let clone = new Area();
      clone._copy(this);
      return clone;
    }

    // Override.
    protected _copy(source: Area) {
      super._copy(source);
      this._location.copy(source.location);
      this._size.copy(source.size);
    }

  }
}