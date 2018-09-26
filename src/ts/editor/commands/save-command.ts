namespace PRKR.Editor.Commands {
  export class SaveCommand implements Command {

    private _keyboardMatcher = new KeyboardMatcher({
      ctrl: true,
      keyCode: 83 /* S */
    });
      
    constructor(private _editor: ParcourEditor) { }

    get name() { return 'save'; }

    get displayName() { return 'Save'; }

    get keyboardShortcut() { return this._keyboardMatcher; }

    get enabled() { return true; }

    get highlighted() { return this._editor.modelIsDirty; }

    run() {
      this._editor.save();
    }
  }
}