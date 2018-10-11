namespace PRKR.Editor.Tools {
  export class PasteTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super()
     }

    get name() { return 'paste'; }

    get displayName() { return 'Paste'; }

    /** Enabled if the clipboard is not empty. */
    get enabled() { 
      return !Clipboard.isEmpty;
    }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 86, /* V */
      });
    }

    /** Informs the Tool that it's being activated. */
    activate() {
      
      if (!Clipboard.isEmpty) {

        try {

          let payload = JSON.parse(Clipboard.get());
          if (!_.isArray(payload)) throw new Error('Clipboard content is not an array');

          if (payload.length === 0) return;

          // this._buildHelpers
          // ...


        } catch(err) {


        
        }       

      }
      
    }

    /** Informs the Tool that it's being deactivated. */
    deactivate() { }

    notifyMouseMove(event: JQueryMouseEventObject): void { }

  }
}