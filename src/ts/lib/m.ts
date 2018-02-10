namespace PRKR {
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Box2 = THREE.Box2;

  /** Math (but "Math" was already taken and I can't allow myself to shadow it) */
  export class M {

    /** 2 times Pi. */
    static TWO_PI = 2 * Math.PI;

    /** Pi over 2. */
    static PI_OVER_TWO = Math.PI * 0.5;

    /** Useful vectors */
    static Vector3 = {
      Zero: new Vector3(0, 0, 0),
      OneOneOne: new Vector3(1, 1, 1),
      OneZeroOne: new Vector3(1, 0, 1),
      Half: new Vector3(.5, .5, .5),
      MinusHalf: new Vector3(-.5, -.5, -.5),
      PositiveX: new Vector3(1, 0, 0),
      PositiveY: new Vector3(0, 1, 0),
      PositiveZ: new Vector3(0, 0, 1),
      NegativeX: new Vector3(-1, 0, 0),
      NegativeY: new Vector3(0, -1, 0),
      NegativeZ: new Vector3(0, 0, -1),
    };

    static Vector2 = {
      Zero: new Vector2(0, 0),
      OneOne: new Vector2(1, 1),
      Half: new Vector2(.5, .5),
      MinusHalf: new Vector2(-.5, -.5),
      PositiveX: new Vector2(1, 0),
      PositiveY: new Vector2(0, 1),
      NegativeX: new Vector2(-1, 0),
      NegativeY: new Vector2(0, -1)
    }

    /** Useful boxes */
    static Box3 = {
      Unit: new Box3(
        M.Vector3.Zero,
        M.Vector3.OneOneOne
      ),
      CenteredUnit: new Box3(
        M.Vector3.MinusHalf,
        M.Vector3.Half
      )
    };

    static Box2 = {
      Unit: new Box2(
        M.Vector2.Zero,
        M.Vector2.OneOne
      ),
      CenteredUnit: new Box2(
        M.Vector2.MinusHalf,
        M.Vector2.Half
      )
    };

    /**
     * Wraps a number inside a specified range.
     */
    public static wrapNumber(n: number, low: number, high: number) {
      // TODO OPTIMIZE
      if (n < low) {
        let range = high - low;
        while (n < low) {
          n += range;
        }
      } else if (n > high) {
        let range = high - low;
        while (n > high) {
          n -= range;
        }
      }
      return n;
    }

    /**
     * Computes the difference between two numbers in a wrapped context.
     * Difference should be interpreted like "what should be added to 'origin'
     * to get to 'target' using the smallest possible number" or in other words,
     * "what is the shortest path from 'origin' to 'target' in the specified
     * wrapped context".
     * @param low {number} Must be less than "high" (the method will not check). 
     * @param high {number} Must be greater than "low" (the method will not check). 
     */
    public static wrappedDiff(
      target: number, origin: number, low: number, high: number
    ) {
      let range = high - low;
      if (target > origin) {

        let a = target - origin;
        let b = (origin + range) - target;

        if (a < b) return a;
        else return -b;

      } else {

        let a = origin - target;
        let b = (target + range) - origin;

        if (a < b) return -a;
        else return b;

      }
    }

    /**
     * Clamps 'value' between 'low' and 'high' bounds.
     * @param value {number} Number to process.
     * @param low {number} Lowest bound. Should be less than 'high' (the method
     * will not check).
     * @param high {number} Highest bound. Should be greater than 'low' (the
     * method will not check).
     * @returns 'value' clamped between 'low' and 'high'.
     */
    public static clamp(value: number, low: number, high: number) {
      if (value < low) {
        return low;
      } else if (value > high) {
        return high;
      } else {
        return value;
      }
    }
  }
}