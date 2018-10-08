namespace PRKR.Editor.Commands {
  export class SaveCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'save'; }

    get displayName() { return 'Save'; }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 83 /* S */
      });
    }

    get enabled() { return true; }

    get highlighted() { return this._editor.modelIsDirty; }

    run() {
      this._editor.save();
    }
  }
}