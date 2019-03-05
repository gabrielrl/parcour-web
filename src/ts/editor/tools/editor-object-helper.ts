namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  /**
   * A helper to proxy any editor object used to represent tool effects.
   * 
   * NOTE Created mesh is always centered at the proxied object's local pivot point. Requied for `setRotateBy` to
   * work.
   */
  export class EditorObjectHelper extends THREE.Object3D {

    /** Mesh that proxies the original object. */
    private _proxy: THREE.Mesh;

    private _restRotation: THREE.Quaternion;

    constructor(object: EditorObject) {

      if (!object) throw new Error('model must be defined');

      super();

      let pivotAdjustment = object.getWorldPosition().sub(object.getWorldPivot());
      let material = Constants.Materials.Faces.Valid;
      let geometry = object.geometry;
      if (geometry) {
        geometry.translate(pivotAdjustment.x, pivotAdjustment.y, pivotAdjustment.z);
        this._proxy = new THREE.Mesh(geometry, material);
      } else {
        let box = object.boundingBox;
        let w = box.max.x - box.min.x;
        let h = box.max.y - box.min.y;
        let d = box.max.z - box.min.z;
        let g = new THREE.BoxBufferGeometry(w, h, d);
        g.translate(
          box.min.x + w * .5 + pivotAdjustment.x,
          box.min.y + h * .5 + pivotAdjustment.y,
          box.min.z + d * .5 + pivotAdjustment.z
        );
        this._proxy = new THREE.Mesh(g, material);
      }
      this.add(this._proxy);

      this._restRotation = new THREE.Quaternion();
    }

    setValidState(valid: boolean) {

      this._proxy.material = valid
        ? Constants.Materials.Faces.Valid
        : Constants.Materials.Faces.Invalid;

    }

    setMoveBy(move: THREE.Vector3) {
      this._proxy.position.copy(move);
    }

    setRestRotation(restRotation: THREE.Quaternion) {
      if (restRotation) {
        this._restRotation.copy(restRotation);
      } else {
        this._restRotation.set(0, 0, 0, 1);
      }
      this._proxy.quaternion.copy(this._restRotation);
    }

    setRotateBy(rotation: THREE.Quaternion) {
      this._proxy.quaternion.copy(this._restRotation).premultiply(rotation);
    }

  }
}