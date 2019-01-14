namespace PRKR.Editor.Tools {

  import OrthoPlane = Helpers.OrthoPlane;

  export class RotationWidget {

    private _color: number;
    private _plane: OrthoPlane;

    private _threeObject: THREE.Object3D;

    constructor(plane: OrthoPlane, color: number) {

      this._plane = plane;
      this._color = color;

      this._buildObject();

    }

    get threeObject(): THREE.Object3D {
      return this._threeObject;
    }

    setPosition(p: THREE.Vector3) {

      this._threeObject.position.copy(p);

    }

    private _buildObject(): void {

      let ringGeo = new THREE.RingBufferGeometry(0.75, 1, 20, 1);
      let ringMat = new THREE.MeshBasicMaterial({
        color: this._color,
        transparent: true,
        opacity: 0.666,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      let ring = new THREE.Mesh(ringGeo, ringMat);

      let normal = Helpers.getNormalFromOrthoPlane(this._plane);

      ring.quaternion.setFromUnitVectors(M.Vector3.PositiveZ, normal);

      this._threeObject = ring;
      
    }

  }
}