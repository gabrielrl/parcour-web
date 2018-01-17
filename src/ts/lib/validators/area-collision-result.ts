/// <reference path="./parcour-validator.ts" />

/// <reference path="./validation-result.ts" />


namespace PRKR.Validators {

  export interface IAreaCollision {
    areas: Model.Area[];
    box: THREE.Box3;
  }

  export class AreaCollisionResult extends ValidationResult {
    private _collision: IAreaCollision;
    public get collision() { return this._collision; }

    constructor(collision: IAreaCollision) {
      super(ResultLevel.Error, 'area-collision', 'Area collision found');
      this._collision = collision;
    }
  }
}