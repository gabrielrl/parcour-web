namespace PRKR.Player.Physics {
  export interface BodyDescription {
    /** Body mass. If zero, body will be considered static. */
    mass: number;

    /** Initial body position in the physical world. Optional. */
    position?: THREE.Vector3;

    /** Render object. Optional. */
    // renderObject?: THREE.Object3D;

  }
}