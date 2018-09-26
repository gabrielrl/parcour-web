namespace PRKR.Editor.Commands {
  export class RedoCommand implements Command {

    private _keyboardMatcher = new KeyboardMatcher({
      ctrl: true,
      keyCode: 89 /* Y */
    });

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'redo'; }

    get displayName() { return 'Redo'; }

    get keyboardShortcut() { return this._keyboardMatcher; }

    get enabled() { return this._editor.canRedo; }

    get highlighted() { return false; }

    run() {
      this._editor.redo();
    }
  }
}