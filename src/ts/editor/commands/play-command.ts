namespace PRKR.Editor.Commands {
  
  export class PlayCommand implements Command {

    private _keyboardMatcher = new KeyboardMatcher({
      keyCode: 116, /* F5 */
      key: 'F5'
    });
      
    constructor(private _editor: ParcourEditor) { }

    get name() { return 'play'; }

    get displayName() { return 'Play'; }

    get keyboardShortcut() { return this._keyboardMatcher; }

    // TODO Should only be enabled if the current parcour is playable.
    get enabled() { return true; }

    get highlighted() { return false; }

    run() {
      this._editor.play();
    }
  }
}