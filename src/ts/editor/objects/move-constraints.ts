namespace PRKR.Editor.Objects {

  export interface MoveConstraints {

    /**
     * Move step for an objects. Step can be different for each axis. Moving is disabled along
     * axis with a value of zero.
     */
    steps: THREE.Vector3;

    /**
     * Constrains `vector` value to a valid move destination for the object. If a valid location could not be found,
     * false is returnd and `vector` is left untouched, otherwise true is returned and `vector` was adjusted to a
     * valid location.
     * This function is optional and objects don't need to provide one.
     * @param vector Vector to update.
     * @returns True if a suitable location for the object could be found of false otherwise.
     */
    constrain?: (vector: THREE.Vector3) => boolean;

  }
}