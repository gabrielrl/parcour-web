namespace PRKR.Player.Model {
  export interface RuntimeArea extends RuntimeObject {

    id: string;

    model: PRKR.Model.Area;

    scene: THREE.Scene;

    location: THREE.Vector3;
    size: THREE.Vector3;

    // getBoundingBox(): THREE.Box3;
    // getCenter(target?: THREE.Vector3): THREE.Vector3;


  }
}