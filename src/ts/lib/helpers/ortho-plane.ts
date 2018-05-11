namespace PRKR.Helpers {

  import Vector3 = THREE.Vector3;

  export enum OrthoPlane {
    XZ = 1,
    XY = 2
    // TODO (when needed) XY, ZY ...
  };

  export function getMappingFromOrthoPlane(plane: OrthoPlane): (x: number, y: number, other?: number) => Vector3 {
    let mapping: (x: number, y: number, other?: number) => Vector3;

    switch(plane) {
      case OrthoPlane.XZ: {
        mapping = (x, y, other?) => { return new Vector3(x, other || 0, y); }
        break;
      } case OrthoPlane.XY: {
        mapping = (x, y, other?) => { return new Vector3(x, y, other || 0); }
        break;
      }
    }

    if (!mapping) { throw new Error(`Unsupported plane type ${ plane }`); }

    return mapping;
  }

}
