namespace PRKR.Editor.Commands {
  
  export class RenameCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'rename'; }

    get displayName() { return 'Rename'; }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        keyCode: 113, /* F2 */
        key: 'F2'
      });
    }

    get enabled() { return true; }

    get highlighted() { 
      let name = this._editor.modelName;
      return name == null || name === 'New parcour';
     }

    run() {
      let newName = prompt('Enter new name', this._editor.modelName);
      if (newName && newName !== this._editor.modelName) {
        this._editor.modelName = newName;
      }
    }
  }
}