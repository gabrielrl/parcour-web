namespace PRKR.Editor.EditSteps {
  import Parcour = Model.Parcour;
  import ParcourObject = Model.ParcourObject;
  import StepResult = EditSteps.StepResult;

  export class AddObjectStep implements EditStep {
    
    private _data: object;

    constructor(data: object) {
      if (!data) throw new Error('"data" is required.');
      this._data = data;
    }

    /** Gets the data used to generate the added object. */
    get data(): any { return _.cloneDeep(this._data); }

    public do(parcour: Parcour): StepResult {

      let po = ParcourObject.fromObject(this._data);
      if (!po) throw new Error('Unable to build a ParcourObject from supplied data.');
      parcour.objects.push(po);

      return {
        dirtyIds: [ po.id ],
        data: po.id
      };
    }

    public undo(parcour: Parcour, data?: object): StepResult {
      if (!data || !_.isString(data)) throw new Error('"data" is required and should be a string.');

      let index = _.findIndex(parcour.objects, o => o.id === data);
      if (index === -1) throw new Error(`Can not find object having ID "${data}" in the current parcour.`);
      parcour.objects.splice(index, 1);

      return {
        dirtyIds: [ data ],
        data: null
      };
    }
  }
}