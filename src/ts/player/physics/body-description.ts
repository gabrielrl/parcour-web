namespace PRKR.Player.Physics {
  export interface BodyDescription {
    /** Mass (in kilogram). If zero, body will be considered static. */
    mass: number;

    /** Friction coefficient (see Bullet Physics). */
    friction?: number;

    /** Initial body position in the physical world. */
    position?: THREE.Vector3;

    /** Initial body rotation. */
    rotation?: THREE.Quaternion;

    /** Render object. Optional. */
    // renderObject?: THREE.Object3D;

  }
}