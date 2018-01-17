// /// <reference path="../../defs/prkr.bundle.d.ts" />

// /// <reference path="./edit-step.ts" />

// namespace PRKR.Editor.EditSteps {

//   // Imports
//   import Vector3 = THREE.Vector3;
//   import Parcour = PRKR.Model.Parcour;
//   import RoomArea = PRKR.Model.RoomArea;

//   export class AddRoomStep extends EditStep {

//     private _location: Vector3 = new Vector3();
//     private _size: Vector3 = new Vector3();

//     constructor(
//       location: Vector3,
//       size: Vector3
//     ) {
//       super();

//       if (!location) throw new Error('"location" must be defined');
//       if (!size) throw new Error('"size" must be defined');

//       this._location.copy(location);
//       this._size.copy(size);
//     }

//     public do(parcour: Parcour): StepResult {

//       let room = new RoomArea({
//         location: this._location,
//         size: this._size
//       });
//       parcour.objects.push(room);

//       return {
//         dirtyIds: [room.id],
//         data: room.id
//       };

//     }

//     public undo(parcour: Parcour, data: Object): StepResult {

//       if (!data || !_.isString(data)) {
//         throw new Error('"data" must be a GUID (as a string)');
//       }

//       let id = <string>data;

//       // Find the room index from the parcour's objects.
//       let objects = parcour.objects;
//       let index = -1;
//       for (let i = 0; i < objects.length; i++) {
//         if (objects[i].id === id) {
//           index = i;
//           break;
//         }
//       }
//       if (index === -1) {
//         throw new Error(
//           'Can\'t find an area with ID "' + id +
//           '" in the supplied parcour');
//       }

//       // Remove the room from the parcour's objects.
//       objects.splice(index);
      
//       return { dirtyIds: [id] };
//     }
//   }
// }