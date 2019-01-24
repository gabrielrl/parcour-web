namespace PRKR.Editor.Objects {

  /** Defines a type that can constrain an object's rotation. */
  export interface RotateConstraints {

    /** Applies rotation constraint to a rotation quaternion. */
    apply(quaternion: THREE.Quaternion): void;

  }
}