namespace PRKR.Editor.Objects {

  /**
   * Constraints that apply to an object's rotation.
   * 
   * The allowed rotation steps and the possible axes.
   */
  export class RotateConstraints {

    private _step: number;
    private _axes: boolean[];

    /**
     * 
     * @param step Rotation angle step.
     * @param axes An array of 3 booleans indicating whether rotation is supported in each axis (in the X, Y, Z order).
     */
    constructor(step: number, axes?: boolean[]) {

      this._step = step;
      if (axes) {
        if (axes.length !== 3) throw new Error('When specified, "axis" must be of length 3');
        this._axes = axes;
      } else {
        this._axes = [ true, true, true ];
      }

    }

    /** Gets a boolean indicating if rotation is supported on the axis at `index` in X, Y, Z. */
    supportsAxis(index: number): boolean {
      return this._axes[index];
    }

    /** Gets rotation step. */
    get step() { return this._step; }

  }
}