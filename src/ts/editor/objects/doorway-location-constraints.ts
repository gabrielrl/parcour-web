namespace PRKR.Editor.Objects {
  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;

  export class DoorwayLocationConstraints implements LocationConstraints {

    private _placer: Behaviors.DoorwayPlacer;

    constructor(parcour: Parcour) {
      if (parcour == null) {
        throw new Error('"parcour" can not be null or undefined.');
      }

      this._placer = new Behaviors.DoorwayPlacer(parcour);
    }

    apply(location: Vector3): boolean {
      return this._placer.constrain(location);
    }
  }
}