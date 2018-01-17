namespace PRKR.Editor.Commands {
  export class SaveCommand {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'save'; }

    get displayName() { return 'Save'; }

    get enabled() { return true; }

    get highlighted() { return this._editor.modelIsDirty; }

    run() {
      this._editor.save();
    }
  }
}