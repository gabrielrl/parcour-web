namespace PRKR.Helpers {

  import Vector3 = THREE.Vector3;

  export enum OrthoPlane {
    XZ = 1,
    XY = 2,
    YZ = 3
  };

  export interface PlaneMapping {
    (x: number, y: number, other?: number): Vector3 
  }

  export function getMappingFromOrthoPlane(plane: OrthoPlane): PlaneMapping {
    let mapping: PlaneMapping;

    switch(plane) {
      case OrthoPlane.XZ: {
        mapping = (x, y, other?) => { return new Vector3(x, other || 0, y); }
        break;
      } case OrthoPlane.XY: {
        mapping = (x, y, other?) => { return new Vector3(x, y, other || 0); }
        break;
      } case OrthoPlane.YZ: {
        mapping = (x, y, other?) => { return new Vector3(other || 0, x, y) };
        break;
      }
    }

    if (!mapping) { throw new Error(`Unsupported plane type ${ plane }`); }

    return mapping;
  }

  export function getNormalFromOrthoPlane(plane: OrthoPlane): Vector3 {

    let mapping = getMappingFromOrthoPlane(plane);
    let normal = new Vector3();
    normal.crossVectors(
      mapping(0, 1, 0),
      mapping(1, 0, 0)
    );

    return normal;
    
  }

}
