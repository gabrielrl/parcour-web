namespace PRKR.Editor.Commands {
  export class UndoCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'undo'; }

    get displayName() { return 'Undo'; }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 90 /* Z */
      });
    }

    get enabled() { return this._editor.canUndo; }

    get highlighted() { return false; }

    run() {
      this._editor.undo();
    }
  }
}