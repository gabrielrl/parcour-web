namespace PRKR.Player {

  export interface LegRayResult {

    location: THREE.Vector3;
    normal: THREE.Vector3;
    object: Model.RuntimeObject;
    legGap: number;

  }
}
