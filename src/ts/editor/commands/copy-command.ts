namespace PRKR.Editor.Commands {

  export class CopyCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'copy'; }

    get displayName() { return 'Copy'; }

    /** Enabled if objects are selected. */
    get enabled() { return this._editor.selectedObjects.length > 0; }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 67, /* C */
      });
    }

    get highlighted() { return false; }

    run() {
      // TODO
    }
  }
}