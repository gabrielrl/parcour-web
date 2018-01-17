/// <reference path="./representation.ts" />

namespace PRKR.Representations {
  export interface IAreaRepresentation extends Representation {
    
    getSceneObject(): THREE.Object3D;

  }
}