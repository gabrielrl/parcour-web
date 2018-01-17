// /// <reference path="../../defs/prkr.bundle.d.ts" />

// /// <reference path="./edit-step.ts" />

// namespace PRKR.Editor.EditSteps {
//   import Parcour = PRKR.Model.Parcour;
//   import Doorway = PRKR.Model.Doorway;
//   import DoorwayData = PRKR.Model.DoorwayData;
//   import Area = PRKR.Model.Area;

//   export class AddDoorwayStep implements EditStep {

//     private _data: DoorwayData;

//     constructor(data?: DoorwayData) {
//       if (data) this._data = data;
//     }

//     public do(parcour: Parcour): StepResult {
      
//       let doorway = new Doorway(this._data);

//       parcour.objects.push(doorway);

//       // Include the neighour areas in the dirty objects.
//       let dirtyIds: string[] =
//         [doorway.id, doorway.areaId].concat(
//           parcour.getNeighbourAreas(doorway.areaId).map(a => a.id)
//         );

//       return {
//         dirtyIds: dirtyIds,
//         data: doorway.id
//       };
//     }

//     public undo(parcour: Parcour, memento?: Object): StepResult {
//       if (!memento) throw new Error('memento can not be null or undefined');

//       let id = <string>memento;
//       let doorway = <Doorway>parcour.getObjectById(id);
//       _.remove(parcour.objects, o => o.id === id);

//       // Include the neighour areas in the dirty objects.
//       let dirtyIds: string[] =
//         [doorway.id, doorway.areaId].concat(
//           parcour.getNeighbourAreas(doorway.areaId).map(a => a.id)
//         );

//       return {
//         dirtyIds: dirtyIds
//       }
//     }

//   }
  
// }