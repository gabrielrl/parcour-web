namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;

  /** Defines a type that can constrain a vector's value. */
  export interface VectorConstraints {

    yEnabled: boolean;

    /** Applies constraints to a vector. */
    apply(vector): void;

  }
}
