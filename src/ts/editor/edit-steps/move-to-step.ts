/// <reference path="../../defs/prkr.bundle.d.ts" />

/// <reference path="./edit-step.ts" />

namespace PRKR.Editor.EditSteps {

  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;
  import AreaElement = PRKR.Model.AreaElement;

  class MoveToMemento {
    public areaId: string;
    public location: Vector3 = new Vector3();

    constructor(areaId: string, location: Vector3) {
      this.areaId = areaId;
      this.location.copy(location);
    }
  }

  /**
   * Edit step to move a parcour object to a certain location.
   */
  export class MoveToStep extends EditStep {

    private _targetId: string;
    private _areaId: string;
    private _location: Vector3 = new Vector3();

    // NOTE Since `areaId` is the optional one, shouldn't he be kept for last?
    constructor(targetId: string, areaId: string, targetLocation: Vector3) {
      super();

      if (!targetId) throw new Error('"targetId" must be defined');
      if (!targetLocation) throw new Error('"targetLocation" must be defined');

      this._targetId = targetId;
      this._areaId = areaId;
      this._location.copy(targetLocation);
    }

    public do(parcour: Parcour): StepResult { 
      let memento: MoveToMemento = null;

      let target = parcour.getObjectById(this._targetId);
      if (target instanceof Area) {
        // Save original values.
        memento = new MoveToMemento(null, target.location);
        // Set new values.
        target.location.copy(this._location);
      } else if (target instanceof AreaElement) {
        // Save original values.
        memento = new MoveToMemento(target.areaId, target.location);
        // Set new values.
        target.areaId = this._areaId;
        target.location.copy(this._location);
      }

      return {
        dirtyIds: [this._targetId],
        data: memento
      };
    }

    public undo(parcour: Parcour, data: Object): StepResult {
      if (data instanceof MoveToMemento) {
        let target = parcour.getObjectById(this._targetId);
        if (target instanceof Area) {
          target.location.copy(data.location);
        } else if (target instanceof AreaElement) {
          target.areaId = data.areaId;
          target.location.copy(data.location);
        }
        return { dirtyIds: [this._targetId] };
      } else {
        throw new Error('"data" must be a "MoveToMemento" instance');
      }
    }
  }
}