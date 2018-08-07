namespace PRKR.Player.Physics {

  import Vector3 = THREE.Vector3;

  /** Ray cast hit result object */
  export class RayResult {

    private _position: Vector3 = new Vector3();
    private _normal: Vector3 = new Vector3();
    private _object: Model.RuntimeObject = null;

    constructor(position?: Vector3, normal?: Vector3, object?: Model.RuntimeObject) {
      if (position) {
        this._position.copy(position);
      }
      if (normal) {
        this._normal.copy(normal);
      }
      if (object) {
        this._object = object;
      }
    }

    /** Gets the hit location. */
    get position() {
      return this._position;
    }

    /** Gets the hit normal. */
    get normal() {
      return this._normal;
    }

    /**
     * Gets the runtime object the ray collided with.
     */
    get object(): Model.RuntimeObject {
      return this._object;
    }

    /** Sets the runtime object the ray collided with. */
    set object(value: Model.RuntimeObject) {
      this._object = value;
    }

  }

}