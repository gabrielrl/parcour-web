namespace PRKR.Editor.EditSteps {

  import Parcour = Model.Parcour;
  import EditStep = Editor.EditSteps.EditStep;
  import StepResult = Editor.EditSteps.StepResult;

  class SetPropertyMemento {
    public originalValues: any[] = [];
  }

  export class SetPropertyStep extends EditStep {

    private _targetIds: string[];
    private _propertyName: string;
    private _value: any;

    constructor(targetIds: string[] | string, propertyName: string, value: any) {
      super();

      if (!targetIds) throw new Error('"targetIds" must be defined');
      if (!propertyName) throw new Error('"propertyName" must be defined');

      this._targetIds = [].concat(targetIds);
      this._propertyName = propertyName;
      this._value = value;
    }

    public do(parcour: Parcour): StepResult {
      let memento: SetPropertyMemento = new SetPropertyMemento();
      let targets = this._targetIds.map(id => parcour.getObjectById(id));
      targets.forEach(t => {
        memento.originalValues.push(t.getPropertyValue(this._propertyName));
        t.setPropertyValue(this._propertyName, this._value);
      });

      return {
        dirtyIds: [].concat(this._targetIds),
        data: memento
      }      
    }

    public undo(parcour: Parcour, data: Object): StepResult {
      if (data instanceof SetPropertyMemento) {
        let targets = this._targetIds.map(id => parcour.getObjectById(id));
        targets.forEach((t, i) =>
          t.setPropertyValue(this._propertyName, data.originalValues[i])
        );
        return { dirtyIds: [].concat(this._targetIds) };
      } else {
        throw new Error('"data" must be a "SetPropertyMemento" instance');
      }
    }

  }
}