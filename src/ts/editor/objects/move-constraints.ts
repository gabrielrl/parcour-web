namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;

  /** Defines a type that can constrain an object's movement. */
  export interface MoveConstraints {

    yEnabled: boolean;

    /** Applies move constraint to a movement vector. */
    apply(movement): void;

  }
}