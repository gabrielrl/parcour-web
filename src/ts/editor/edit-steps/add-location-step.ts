// /// <reference path="../../defs/prkr.bundle.d.ts" />

// /// <reference path="./edit-step.ts" />

// namespace PRKR.Editor.EditSteps {

//   import Vector3 = THREE.Vector3;
//   import Parcour = PRKR.Model.Parcour;
//   import LocationKind = PRKR.Model.LocationKind;
//   import LocationOptions = PRKR.Model.LocationOptions;
//   import Location = PRKR.Model.Location;

//   export class AddLocationStep extends EditStep {

//     private _areaId: string;
//     private _location: Vector3 = new Vector3();
//     private _kind: LocationKind;

//     constructor(areaId: string, location: Vector3, kind: LocationKind) {
//       super();

//       if (!areaId) throw new Error('"areaId" must be defined');
//       if (!kind) throw new Error('"kind" must be defined');
//       if (!location) throw new Error('"location" must be defined');

//       this._areaId = areaId;
//       this._location.copy(location);
//       this._kind = kind;
//     }

//     public do(parcour: Parcour): StepResult {

//       let location = new Location({
//         areaId: this._areaId,
//         location: this._location,
//         kind: this._kind
//       });

//       parcour.objects.push(location);

//       return {
//         dirtyIds: [location.id],
//         data: location.id
//       };

//     }

//     public undo(parcour: Parcour, data: Object): StepResult {

//       if (!data || !_.isString(data)) {
//         throw new Error('"data" must be a GUID (as a string)');
//       }

//       let id = <string>data;

//       // Find the start location index.
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
//           `Can't find an object with ID "${id}" in the supplied parcour`);
//       }

//       // Remove the location from the parcour's objects.
//       objects.splice(index);
      
//       return { dirtyIds: [id] };
//     }
//   }
// }