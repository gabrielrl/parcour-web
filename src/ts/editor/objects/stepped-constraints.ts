namespace PRKR.Editor.Objects {
  import Vector3 = THREE.Vector3;

  /**
   * Movement constraint that makes an object move only by certain steps. Move steps are defined per axis. Movement
   * can be turned off on any axis by setting the corresponding step to zero.
   */
  export class SteppedConstraints implements VectorConstraints {

    /**
     * Move steps for an object. Step is defined per-axis. Moving is disabled along axis with a value of zero.
     */
    private _steps: Vector3;

    /**
     * 
     * @param steps Move steps for an object. Step is defined per-axis. Moving is disabled along axis with a value
     * of zero.
     */
    constructor(steps: Vector3) {
      if (!steps == null) {
        throw new Error('"steps" can not be null or undefined');
      }

      this._steps = steps;
    }

    get yEnabled() {
      return this._steps.y !== 0;
    }

    /**
     * Applies the current stepped move constraint to the specified `target`.
     * @param movement Movement vector to constrain.
     */
    apply(movement) {
      let steps = this._steps;

      if (steps.x === 0) {
        movement.setX(0);
      } else {
        let s = steps.x;
        movement.setX(
          Math.round(movement.x / s) * s
        );
      }

      if (steps.y === 0) {
        movement.setY(0);
      } else {
        let s = steps.y;
        movement.setY(
          Math.round(movement.y / s) * s
        );
      }

      if (steps.z === 0) {
        movement.setZ(0);
      } else {
        let s = steps.z;
        movement.setZ(
          Math.round(movement.z / s) * s
        );
      }
    }

  }
}
