/// <reference path="./vector-constraints.ts" />
/// <reference path="./location-constraints.ts" />
/// <reference path="./doorway-location-constraints.ts" />
/// <reference path="./stepped-constraints.ts" />
/// <reference path="./rotate-constraints.ts" />

namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;

  const PI_OVER_8 = Math.PI / 8;

  const constraintsByType = {

    Doorway: {
      move: new SteppedConstraints(new Vector3(.5, 0, .5)),
      location: new DoorwayLocationConstraints()
    },

    DynamicObject: {
      move: new SteppedConstraints(new Vector3(
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5
      )),
      size: new SteppedConstraints(new Vector3(
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5
      )),
      rotate: new RotateConstraints(PI_OVER_8)
    },

    Location: {
      move: new SteppedConstraints(new THREE.Vector3(1, 0, 1))
    },

    RoomArea: {
      move: new SteppedConstraints(new Vector3(1, 0, 1)),
      size: new SteppedConstraints(new Vector3(1, 0.25, 1)),
      rotate: new RotateConstraints(M.PI_OVER_TWO, [ false, true, false ])
    },

    StaticObject: {
      move: new SteppedConstraints(new Vector3(
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5
      )),
      size: new SteppedConstraints(new Vector3(
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5,
        Model.DynamicObject.GridSize * .5
      )),
      rotate: new RotateConstraints(PI_OVER_8)
    }
  
  };

  export function getMoveConstraints(parcourObject: Model.ParcourObject): VectorConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.move) return undefined;
    return c.move;    
  }

  export function getLocationConstraints(parcourObject: Model.ParcourObject): LocationConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.location) return undefined;
    return c.location;
  }

  export function getSizeConstraints(parcourObject: Model.ParcourObject): VectorConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.size) return undefined;
    return c.size;
  }

  export function getRotationConstraints(parcourObject: Model.ParcourObject): RotateConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.rotate) return undefined;
    return c.rotate;
  }
}