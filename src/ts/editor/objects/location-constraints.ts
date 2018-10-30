namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;

  /** Defines a type that can constrain an object's location. */
  export interface LocationConstraints {

    /**
     * Applies location constraint to an object's location. If a valid location could not be found, false is returnd
     * and `location` is left untouched, otherwise true is returned and `location` was adjusted to a valid location.
     * **Note** that the location is world-relative.
     * @param location World-relative location vector to update.
     * @returns True if a suitable location for the object could be found, false otherwise.
     */
    apply(location: Vector3): boolean;

  }
}