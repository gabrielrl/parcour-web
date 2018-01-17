namespace PRKR.Model {
  import Vector3 = THREE.Vector3;

  export class WallOrientation {

    private _name: string;
    private _direction: Vector3;
    private _normal: Vector3;

    constructor(name: string, direction: Vector3, normal: Vector3) {
      this._name = name || '';
      this._direction = direction;
      this._normal = normal;
    }

    get direction() { return this._direction }
    get normal() { return this._normal; }

    static _PositiveX: WallOrientation = new WallOrientation('+X', M.Vector3.PositiveX, M.Vector3.PositiveZ);
    static get PositiveX(): WallOrientation { return WallOrientation._PositiveX; }

    static _PositiveZ: WallOrientation = new WallOrientation('+Z', M.Vector3.PositiveZ, M.Vector3.NegativeX);
    static get PositiveZ(): WallOrientation { return WallOrientation._PositiveZ; }

    static _NegativeX: WallOrientation = new WallOrientation('-X', M.Vector3.NegativeX, M.Vector3.NegativeZ);
    static get NegativeX(): WallOrientation { return WallOrientation._NegativeX; }

    static _NegativeZ: WallOrientation = new WallOrientation('-Z', M.Vector3.NegativeZ, M.Vector3.PositiveX);
    static get NegativeZ(): WallOrientation { return WallOrientation._NegativeZ; }
  }
}