/// <reference path="../../defs/prkr.bundle.d.ts" />

namespace PRKR.Editor.EditSteps {

  import Parcour = PRKR.Model.Parcour;

  export abstract class EditStep {

    public abstract do(parcour: Parcour): StepResult;
    public abstract undo(parcour: Parcour, memento?: Object): StepResult;

  }

  export interface StepResult {
    dirtyIds: string[],
    data?: Object 
  }
}
