namespace PRKR.Representations {
  export interface Representation {
    name: string;
    
    getSelectionHotSpot(): THREE.Object3D;
  }
}