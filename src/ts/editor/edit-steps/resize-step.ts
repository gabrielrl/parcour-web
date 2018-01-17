/// <reference path="../../defs/prkr.bundle.d.ts" />
/// <reference path="./edit-step.ts" />

namespace PRKR.Editor.EditSteps {

  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Area = PRKR.Model.Area;

  export class ResizeStep extends EditStep {

    private _resizeDelta: Vector3 = new Vector3();
    private _targetIds: string[];

    constructor(
      resizeDelta: Vector3,
      targetIds: string[]
    ) {
      super();

      if (!resizeDelta) throw new Error('"resizeDelta" must be defined');
      if (!targetIds || targetIds.length === 0) throw new Error('"targetIds" must be defined and non-empty');

      this._resizeDelta.copy(resizeDelta);
      this._targetIds = [].concat(targetIds);
    }

    public do(parcour: Parcour): StepResult {

      let memento: number[] = [];

      this._targetIds.forEach(targetId => {
        let target = parcour.getObjectById(targetId);

        if (target instanceof PRKR.Model.Area) {
          memento.push(...target.size.toArray());
          target.size.add(this._resizeDelta);
        } else {
          memento.push(null);
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
          if (po instanceof Area) {
            po.size.set(
              dataArray[index * 3],
              dataArray[index * 3 + 1],
              dataArray[index * 3 + 2]
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