namespace PRKR.Editor.Components {

  import Tool = Editor.Tools.Tool;
  import Command = Editor.Commands.Command;

  export interface PropertiesPanelConfiguration {
    // TODO
  }

  export class PropertiesPanel {

    private _editor: ParcourEditor;
    private _configuration: PropertiesPanelConfiguration;
    private _domRoot: HTMLElement;


    constructor(editor: ParcourEditor, configuration: PropertiesPanelConfiguration) {
      this._editor = editor;
      this._configuration = configuration;

      this._build();
      

    }

    get dom() { return this._domRoot; }

    private _build() {
      let $root = $(
        `<div id="propertiesPanelRoot" class="prkr-props-root">
          <div>
            <h1>PROPERTIES PANEL</h1>
          </div>
        </div>`);
      
        this._domRoot = $root[0];

    }

  }
}