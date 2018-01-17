/// <reference path="./edit-step.ts" />

namespace PRKR.Editor.EditSteps {
  export class AggregateResult implements StepResult {
    private _steps: StepResult[];

    constructor(steps: StepResult[]) {
      this._steps = [].concat(steps);
    }

    public get dirtyIds() {
      let aggregate: string[] = [];
      this._steps.forEach((s, i) => {
        aggregate = aggregate.concat(s.dirtyIds);
      });

      return aggregate;
    }

    public get data() {
      let aggregate: Object[] = [];
      this._steps.forEach((s, i) => {
        aggregate.push(s.data);
      });
      return aggregate;
    }
  }
}