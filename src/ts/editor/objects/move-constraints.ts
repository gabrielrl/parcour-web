namespace PRKR.Editor.Objects {

  export interface MoveConstraints {

    /**
     * Move step for an objects. Step can be different for each axis. Moving is disabled along
     * axis with a value of zero.
     */
    steps: THREE.Vector3;

  }
}