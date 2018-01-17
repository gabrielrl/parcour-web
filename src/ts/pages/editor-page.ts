// References to the editor library.
/// <reference path="../defs/prkr-editor.bundle.d.ts" />

declare var Detector: any; // typedefs?

namespace PRKR.Pages {
  import Editor = PRKR.Editor.ParcourEditor;

  export class EditorPage {
    constructor() { }

    public editor: Editor;

    public init(config: any) {
      this.editor = new Editor(config);
      this.editor.init();

      return this;
    }

    public run() {

      this.editor.run();

      return this;
    }
  }
}

// run

if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
} else {
  // Fetch configuration.
  $.getJSON('./config.json').then(
    (data, status, xhr) => {
      new PRKR.Pages.EditorPage().init(data).run();
    },
    (xhr, status, err)  => {
      var message = 'Could not fetch configuration. Aborting.';
      console.error(message);
      alert(message);
    }
  );
  
}
