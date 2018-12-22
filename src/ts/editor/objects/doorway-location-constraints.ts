namespace PRKR.Editor.Objects {
  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;

  export class DoorwayLocationConstraints implements LocationConstraints {

    constructor() { }

    apply(location: Vector3, parcour: Parcour): boolean {
      if (parcour == null) {
        throw new Error('"parcour" can not be null or undefined.');
      }

      let placer = new Behaviors.DoorwayPlacer(parcour);

      return placer.constrain(location);
    }
  }
}