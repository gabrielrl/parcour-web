namespace PRKR.Editor.Tools {
  import Object3D = THREE.Object3D;

  const LINE_MATERIAL = new THREE.LineBasicMaterial({
    color: Constants.ValidColor,
    depthTest: false,
    side: THREE.DoubleSide
  });

  const FACE_MATERIAL = new THREE.MeshBasicMaterial({
    color: Constants.ValidColor,
    depthTest: false,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });

  export class DoorwayHelper extends Object3D {

    constructor() {
      super();

      let helperOptions = { 
        useFaces: true,
        useLines: true,
        lineMaterial: LINE_MATERIAL,
        faceMaterial: FACE_MATERIAL
      };

      let tile = new PRKR.Helpers.RectangleHelper(
        new THREE.Box2(
          new THREE.Vector2(-0.5, 0),
          new THREE.Vector2(0.5, 1)
        ), helperOptions, Helpers.OrthoPlane.XZ);
      
      this.add(tile);

      // TODO add wall segment...
      let wall = new PRKR.Helpers.RectangleHelper(
        new THREE.Box2(
          new THREE.Vector2(-.42, 0),
          new THREE.Vector2(.42, 1.4)
        ), helperOptions, Helpers.OrthoPlane.XY);

      this.add(wall);
    }
  }
}