/// <reference path="./move-constraints.ts" />
/// <reference path="./location-constraints.ts" />
/// <reference path="./doorway-location-constraints.ts" />
/// <reference path="./stepped-move-constraints.ts" />
/// <reference path="./stepped-rotate-constraints.ts" />


namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;

  const PI_OVER_8 = Math.PI / 8;

  const constraintsByType = {

    Doorway: {
      move: new SteppedMoveConstraints(new Vector3(.5, 0, .5)),
      location: new DoorwayLocationConstraints()
    },

    DynamicObject: {
      move: new SteppedMoveConstraints(new Vector3(
        Model.DynamicObject.GridSize,
        Model.DynamicObject.GridSize,
        Model.DynamicObject.GridSize
      )),
      rotate: new SteppedRotateConstraints(new Vector3(PI_OVER_8, PI_OVER_8, PI_OVER_8))
    },

    Location: {
      move: new SteppedMoveConstraints(new THREE.Vector3(1, 0, 1))
    },

    RoomArea: {
      move: new SteppedMoveConstraints(new Vector3(1, 0, 1))
    },

    StaticObject: {
      move: new SteppedMoveConstraints(new THREE.Vector3(
        Model.StaticObject.GridSize,
        Model.StaticObject.GridSize,
        Model.StaticObject.GridSize
      )),
      rotate: new SteppedRotateConstraints(new Vector3(PI_OVER_8, PI_OVER_8, PI_OVER_8))
    }
  
  };

  export function getMoveConstraints(parcourObject: Model.ParcourObject): MoveConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.move) return undefined;
    return c.move;    
  }

  export function getLocationConstraints(parcourObject: Model.ParcourObject): LocationConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.location) return undefined;
    return c.location;
  }

  export function getRotationConstratins(parcourObject: Model.ParcourObject): RotateConstraints {
    let c = constraintsByType[parcourObject.type];
    if (!c || !c.rotate) return undefined;
    return c.rotate;
  }
}