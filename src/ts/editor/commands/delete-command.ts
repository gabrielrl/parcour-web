namespace PRKR.Editor.Commands {
  export class DeleteCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'delete'; }

    get displayName() { return 'Delete'; }

    get enabled() { return this._editor.selectedObjects.length > 0; }

    get highlighted() { return false; }

    run() {
      if (this._editor.selectedObjects.length !== 0) {
        let ids = this._editor.selectedObjects.map(o => o.id);

        // Expand IDS with area children... TODO extract...
        let expandedIds = [].concat(ids);
        ids.forEach(id => {
          let o = this._editor.getObjectById(id);
          let model = o.model;
          if (model instanceof PRKR.Model.Area) {
            let relatedObjects = this._editor.getObjectsByAreaId(id);
            relatedObjects.forEach(ro => expandedIds.push(ro.id));
          }
        });
        expandedIds = _.uniq(expandedIds);

        let message = 
         'Are you sure you want to delete ' +
         (expandedIds.length === 1 ? 'this object?' : `these ${expandedIds.length} objects`);
        if (confirm(message)) {
          let editStep = new EditSteps.DeleteStep(expandedIds);
          let validation = this._editor.validateEditStep(editStep);
          let errors = _.filter(validation, v => v.level === Validators.ResultLevel.Error);
          if (errors.length > 0) {
            alert('Could not delete. Would have yielded an invalid parcour.');
          } else {
            this._editor.addEditStep(editStep);
          }
        }
      }
      
    }
  }
}