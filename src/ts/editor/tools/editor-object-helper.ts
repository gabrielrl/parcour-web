namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  export class EditorObjectHelper extends THREE.Object3D {

    constructor(object: EditorObject) {

      if (!object) throw new Error('model must be defined');

      super();

      let geometry = object.geometry;
      let material = Constants.Materials.Faces.Valid;
      let mesh: THREE.Mesh;
      if (geometry) {
        mesh = new THREE.Mesh(geometry, material);
        if (object.rotatable) {
          mesh.quaternion.copy((<any>object.model).rotation);
        }
      } else {
        let size = object.boundingBox.getSize();
        // Note: the object's bounding box already includes rotation.
        let geometry = new THREE.BoxBufferGeometry(size.x, size.y, size.z);
        mesh = new THREE.Mesh(geometry, material);
      }
      this.add(mesh);

    }



  }
}