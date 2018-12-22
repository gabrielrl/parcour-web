/// <reference path="../../defs/prkr.bundle.d.ts" />

/// <reference path="./edit-step.ts" />
/// <reference path="./aggregate-result.ts" />


namespace PRKR.Editor.EditSteps {

  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;


  export class ComposedStep extends EditStep {

    private _steps: EditStep[];

    constructor(steps: EditStep[]) {
      super();

      if (steps == null) throw new Error('"steps" can not be null of undefined');

      this._steps = steps;
    }

    /** Gets the edit steps composing the current step. */
    get steps() { return _.cloneDeep(this._steps); }

    public do(parcour: Parcour): StepResult {

      let results: StepResult[] = [];

      for (let i = 0; i < this._steps.length; i++) {
        results.push(
          this._steps[i].do(parcour)
        );
      }

      return new AggregateResult(results);
    }

    public undo(parcour: Parcour, data: any): StepResult {

      let results: StepResult[] = [];
      let dataArray = <Object[]>data;

      for (let i = 0; i < this._steps.length; i++) {
        results.push(this._steps[i].undo(parcour, dataArray[i]));
      }

      return new AggregateResult(results);
    }
  }

}