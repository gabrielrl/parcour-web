namespace PRKR.Editor.Commands {
  export class RedoCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'redo'; }

    get displayName() { return 'Redo'; }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 89 /* Y */
      });
    }

    get enabled() { return this._editor.canRedo; }

    get highlighted() { return false; }

    run() {
      this._editor.redo();
    }
  }
}