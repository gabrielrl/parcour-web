namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  /**
   * A helper to proxy any editor object used to represent tool effects.
   * 
   * Create an instance by specifying an editor object to proxy. Then insert it in the scene and set it at the
   * object's location. Use `setRotateBy`, `setMoveBy` and `setResizeBy` to update the helper's display.
   */
  export class EditorObjectHelper extends THREE.Object3D {

    private _target: EditorObject;

    /** Mesh that proxies the original object. */
    private _proxy: THREE.Mesh;

    /** Object to control the rotation of the proxy. Takes the relative location of the object's pivot into account. */
    private _rotateControl: THREE.Object3D;

    /** Object to control the movement of the proxy. */
    private _moveControl: THREE.Object3D;

    private _restRotation: THREE.Quaternion;
    private _size: THREE.Vector3;

    constructor(object: EditorObject) {

      if (!object) throw new Error('model must be defined');

      super();

      this._target = object;

      let pivotAdjustment = object.getWorldPosition().sub(object.getWorldPivot());
      let material = Constants.Materials.Faces.Valid;
      let geometry = object.geometry;
      let box: THREE.Box3 = null;
      let w: number, h: number, d: number;
      if (geometry) {
        geometry.computeBoundingBox();
        box = geometry.boundingBox
        w = box.max.x - box.min.x;
        h = box.max.y - box.min.y;
        d = box.max.z - box.min.z;
        this._proxy = new THREE.Mesh(geometry, material);
      } else {
        box = object.boundingBox;
        w = box.max.x - box.min.x;
        h = box.max.y - box.min.y;
        d = box.max.z - box.min.z;
        let g = new THREE.BoxBufferGeometry(w, h, d);
        g.translate(
          box.min.x + w * .5,
          box.min.y + h * .5,
          box.min.z + d * .5
        );
        this._proxy = new THREE.Mesh(g, material);
      }
      this._proxy.position.copy(pivotAdjustment);
      this._rotateControl = new THREE.Object3D();
      this._rotateControl.position.copy(pivotAdjustment).negate();
      this._rotateControl.add(this._proxy);
      this._moveControl = new THREE.Object3D();
      this._moveControl.add(this._rotateControl);
      this.add(this._moveControl);

      this._size = new THREE.Vector3(w, h, d);
      this._restRotation = new THREE.Quaternion();
    }

    setValidState(valid: boolean) {

      this._proxy.material = valid
        ? Constants.Materials.Faces.Valid
        : Constants.Materials.Faces.Invalid;

    }

    setMoveBy(move: THREE.Vector3) {
      this._moveControl.position.copy(move);
    }

    setRestRotation(restRotation: THREE.Quaternion) {
      if (restRotation) {
        this._restRotation.copy(restRotation);
      } else {
        this._restRotation.set(0, 0, 0, 1);
      }
      this._rotateControl.quaternion.copy(this._restRotation);
    }

    setRotateBy(rotation: THREE.Quaternion) {
      this._rotateControl.quaternion.copy(this._restRotation).premultiply(rotation);
    }

    setResizeBy(sizeDelta: THREE.Vector3) {

      let delta = sizeDelta.clone();

      // Resize "counts double" for these objects as they store their size in "half extents".
      if (
        (this._target instanceof Objects.StaticObject)
          ||
        (this._target instanceof Objects.DynamicObject)
      ) {
        delta.multiplyScalar(2);
      }      

      let scale = delta.add(this._size).divide(this._size);


      this._proxy.scale.copy(scale);

    }

  }
}