namespace PRKR.Editor.Tools {
  export class PasteTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super()
     }

    get name() { return 'paste'; }

    get displayName() { return 'Paste'; }

    /** Enabled if the clipboard is not empty. */
    get enabled() { 
      // TODO
      return true;
    }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 86, /* V */
      });
    }

    get highlighted() { return false; }

    run() {
      // TODO
    }
  }
}