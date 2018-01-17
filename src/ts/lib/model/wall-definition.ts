/// <reference path="./constants.ts" />

namespace PRKR.Model {
  import Vector3 = THREE.Vector3;
  import Line3 = THREE.Line3;
  import Box3 = THREE.Box3;

  export class WallDefinition {
    private _origin: Vector3 = new Vector3();
    private _orientation: WallOrientation;
    private _length: number;
    private _height: number;

    /** The wall's box. Lazy computed on first get. */
    private _box: Box3 = null;

    constructor(
      origin: Vector3,
      orientation: WallOrientation,
      length: number,
      height: number
    ) {
      this._origin.copy(origin);
      this._orientation = orientation;
      this._length = length;
      this._height = height;
    }

    get origin() { return this._origin; }
    get orientation() { return this._orientation; }
    get length() { return this._length; }
    get height() { return this._height; }

    /**
     * Gets the wall's base line.
     * @param target Optional target.
     */
    public getLine(target?: Line3): Line3 {
      if (!target) target = new Line3();

      target.start.copy(this._origin);
      target.end.copy(this._origin)
        .addScaledVector(this._orientation.direction, this._length);

      return target;
    }

    get box(): Box3 {
      let box = new Box3();
      let halfThickness = PRKR.Model.Constants.WallThickness / 2;
      let end = new Vector3();
      end.copy(this._origin)
        .addScaledVector(this._orientation.direction, this._length);

      if (
        this._orientation === WallOrientation.PositiveX ||
        this._orientation === WallOrientation.NegativeX
      ) {

        box.min.set(
          Math.min(this._origin.x, end.x),
          this._origin.y,
          this._origin.z - halfThickness
        );
        box.max.set(
          Math.max(this._origin.x, end.x),
          this._origin.y + this._height,
          this._origin.z + halfThickness
        )

      } else {

        box.min.set(
         this._origin.x - halfThickness,
          this._origin.y,
          Math.min(this._origin.z, end.z)
        );
        box.max.set(
          this._origin.x+ halfThickness,
          this._origin.y + this._height,
          Math.max(this._origin.z, end.z)
        )

      }

      return box;
    }

    contains(point: Vector3): boolean {
      return this.box.containsPoint(point);
    }
  }
}