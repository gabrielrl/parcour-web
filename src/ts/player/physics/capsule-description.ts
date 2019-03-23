namespace PRKR.Player.Physics {
  export interface CapsuleDescription extends BodyDescription {
    /** Radius of the capsule. */
    radius: number;

    /** Height of the (whole) capsule (including the spherical ends). */
    height: number;
  }
}
