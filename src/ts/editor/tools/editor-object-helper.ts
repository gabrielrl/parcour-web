namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  export class EditorObjectHelper extends THREE.Object3D {

    private _mesh: THREE.Mesh;

    constructor(object: EditorObject) {

      if (!object) throw new Error('model must be defined');

      super();

      let geometry = object.geometry;
      let material = Constants.Materials.Faces.Valid;
      if (geometry) {
        this._mesh = new THREE.Mesh(geometry, material);
        if (object.rotatable) {
          this._mesh.quaternion.copy((<any>object.model).rotation);
        }
      } else {
        let size = object.boundingBox.getSize();
        // Note: the object's bounding box already includes rotation.
        let geometry = new THREE.BoxBufferGeometry(size.x, size.y, size.z);
        this._mesh = new THREE.Mesh(geometry, material);
      }
      this.add(this._mesh);

    }

    setValidState(valid: boolean) {

      this._mesh.material = valid
        ? Constants.Materials.Faces.Valid
        : Constants.Materials.Faces.Invalid;

    }



  }
}