namespace PRKR {

  /**
   * Represents a polar coordinate, i.e. a (theta, length) pair.
   */
  export class Polar {
    private _theta: number = 0;

    /** Gets the angle of rotation, theta. */
    get theta() { return this._theta; }

    /**
     * Sets the angle of rotation, theta. Wrap the value in the [0, 2pi] range.
     */
    set theta(value: number) { 
      this._theta = M.wrapNumber(value, 0, M.TWO_PI);
    }

    private _length: number = 0;

    /** Gets the length */
    get length() { return this._length; }

    /**
     * Sets the length. Only accepts non-negative values. Negative values are
     * clamped to 0.
     */
    set length(value) {
      // Length can only be positive. Clamp negative values to zero.
      if (value < 0) value = 0;
      this._length = value;
    }

    constructor(theta?: number, length?: number) {
      if (theta != null) {
        this.theta = theta;
      }
      if (length != null) {
        this.length = length;
      }
    }

    /**
     * Sets all values.
     */
    public set(theta: number, length: number) {
      this.theta = theta;
      this.length = length;
      return this;
    }

    /**
     * Copy 'source' values to the current object.
     */
    public copy(source: Polar) {
      this._theta = source._theta;
      this._length = source._length;
      return this;
    }

    public toString() {
      return `Polar[${this._theta} rad, ${this._length}]`;
    }
  }
}