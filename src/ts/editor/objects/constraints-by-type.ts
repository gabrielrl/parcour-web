/// <reference path="./move-constraints.ts" />
/// <reference path="./location-constraints.ts" />
/// <reference path="./doorway-location-constraints.ts" />
/// <reference path="./stepped-move-constraints.ts" />

namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;

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
      ))
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
      ))
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
}