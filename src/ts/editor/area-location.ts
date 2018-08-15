namespace PRKR.Editor {

  /**
   * Encapsulates information on a (world) location and potentially the area inside which it is located.
   */
  export interface AreaLocation {

    /** (World) location. */
    worldLocation: THREE.Vector3;

    /** The ID of the area inside which the location is. Null if not inside any area. */
    areaId: string;

    /** (Area relative) location. Null if not inside any area. */
    relativeLocation: THREE.Vector3;
  }
}