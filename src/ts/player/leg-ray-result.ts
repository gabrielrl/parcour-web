namespace PRKR.Player {

  export interface LegRayResult {

    location: THREE.Vector3;
    normal: THREE.Vector3;
    object: Model.RuntimeObject;
    legGap: number;

    /** Whether the current hit is stable or not, stable meaning: "not sliding". */
    stable: boolean;

  }
}
