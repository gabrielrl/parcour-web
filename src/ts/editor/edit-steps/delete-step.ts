namespace PRKR.Editor.EditSteps {
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;

  export class DeleteStep extends EditStep {

    constructor(ids: string | string[]) {
      super();

      if (!ids) {
        this._ids = []
      } else {
        ids = _.castArray(ids);
        this._ids = [].concat(ids);
      }
    }

    private _ids: string[];

    public do(parcour: Parcour): StepResult {

      // Memento for undo-ability
      // let deleteMap: { [index: number]: any } = {}      
      let memento: object[] = [];

      this._ids.forEach(id => {
        let index = _.findIndex(parcour.objects, o => o.id === id);
        if (index === -1) {
          throw new Error(`Can not find object with ID "${id}".`);
        }
        let deleted = parcour.objects.splice(index, 1);
        memento.push(deleted[0].toObject());
        // deleteMap[index] = deleted[0].toObject();
      });

      return {
        data: memento,
        dirtyIds: [].concat(this._ids)
      };
    }

    public undo(parcour: Parcour, data: Object): StepResult {

      if (!data || !_.isArray(data)) throw new Error('"data" is required and should be an array.');

      let memento: object[] = data;
      let dirtyIds: string[] = [];
      memento.forEach(o => {
        let instance = ParcourObject.fromObject(o);
        parcour.objects.push(instance);
        dirtyIds.push(instance.id);
      });
      
      return {
        data: null,
        dirtyIds: dirtyIds
      };
    }

  }
}