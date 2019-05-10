/// <reference path="../../defs/prkr.bundle.d.ts" />
/// <reference path="./edit-step.ts" />

namespace PRKR.Editor.EditSteps {

  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Area = PRKR.Model.Area;

  export class ResizeStep extends EditStep {

    private _locationDelta: Vector3 = new Vector3();
    private _sizeDelta: Vector3 = new Vector3();
    private _targetIds: string[];

    constructor(
      locationDelta: Vector3,
      sizeDelta: Vector3,
      targetIds: string[]
    ) {
      super();

      if (!locationDelta) throw new Error('"locationDelta" must be defined');
      if (!sizeDelta) throw new Error('"sizeDelta" must be defined');
      if (!targetIds || targetIds.length === 0) throw new Error('"targetIds" must be defined and non-empty');

      this._locationDelta.copy(locationDelta);
      this._sizeDelta.copy(sizeDelta);
      this._targetIds = [].concat(targetIds);
    }

    public do(parcour: Parcour): StepResult {

      let memento: number[] = [];

      this._targetIds.forEach(targetId => {
        let target = parcour.getObjectById(targetId);

        if (
          target instanceof PRKR.Model.Area ||
          target instanceof PRKR.Model.StaticObject ||
          target instanceof PRKR.Model.DynamicObject
        ) {
          memento.push(...target.location.toArray());
          memento.push(...target.size.toArray());
          target.location.add(this._locationDelta);
          target.size.add(this._sizeDelta);
        } else {
          memento.push(null, null, null, null, null, null);
        }

      });

      return {
        dirtyIds: [].concat(this._targetIds),
        data: memento
      };
    }

    public undo(parcour: Parcour, data: Object): StepResult {

      if (_.isArray(data)) {
        let dataArray = <number[]> data;

        this._targetIds.forEach((targetId, index) => {
          let po = parcour.getObjectById(targetId);          
          if (
            po instanceof Area ||
            po instanceof PRKR.Model.StaticObject ||
            po instanceof PRKR.Model.DynamicObject
          ) {
            po.location.set(
              dataArray[index * 6],
              dataArray[index * 6 + 1],
              dataArray[index * 6 + 2]
            );
            po.size.set(
              dataArray[index * 6 + 3],
              dataArray[index * 6 + 4],
              dataArray[index * 6 + 5]
            );
          }
        });

        return { dirtyIds: [].concat(this._targetIds) };

      } else {
        throw new Error('"data" must be an array of numbers.');
      }
    }

  }

}