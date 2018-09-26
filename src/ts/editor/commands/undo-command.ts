namespace PRKR.Editor.Commands {
  export class UndoCommand implements Command {

    private _keyboardMatcher = new KeyboardMatcher({
      ctrl: true,
      keyCode: 90 /* Z */
    });

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'undo'; }

    get displayName() { return 'Undo'; }

    get keyboardShortcut() { return this._keyboardMatcher; }

    get enabled() { return this._editor.canUndo; }

    get highlighted() { return false; }

    run() {
      this._editor.undo();
    }
  }
}