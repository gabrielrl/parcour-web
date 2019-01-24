namespace PRKR.Editor.Objects {
  import Vector3 = THREE.Vector3;

  /**
   * Rotation constraint that makes an object rotate only by certain steps. Rotate steps are defined per axis.
   * Rotation can be turned off around any axis by setting the corresponding step to zero.
   */
  export class SteppedRotateConstraints implements RotateConstraints {

    /**
     * Rotation steps for an object. Step are defined per-axis. Rotation is disabled along axis with a value of zero.
     */
    private _steps: Vector3;

    /**
     * 
     * @param steps Rotate steps for an object. Steps are defined per-axis. Rotation is disabled along axis with a
     * value of zero.
     */
    constructor(steps: Vector3) {
      if (!steps == null) {
        throw new Error('"steps" can not be null or undefined');
      }

      this._steps = steps;
    }

    /**
     * Applies the current stepped rotate constraint to the specified `rotation`. Mutates and return `rotation`.
     * @param rotation Movement vector to constrain.
     * @returns `rotation` (mutated).
     */
    apply(rotation: THREE.Quaternion): THREE.Quaternion {
      let steps = this._steps;

      let euler = new THREE.Euler();
      euler.setFromQuaternion(rotation);

      if (steps.x === 0) {
        euler.x = 0;
      } else {
        let s = steps.x;
        euler.x = Math.round(euler.x / s) * s;
      }

      if (steps.y === 0) {
        euler.y = 0;
      } else {
        let s = steps.y;
        euler.y = Math.round(euler.y / s) * s;
      }

      if (steps.z === 0) {
        euler.z = 0;
      } else {
        let s = steps.z;
        euler.z = Math.round(euler.z / s) * s;
      }

      rotation.setFromEuler(euler);
      return rotation;
    }

  }
}
