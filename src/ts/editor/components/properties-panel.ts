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
          <div class="prkr-props-head">
            <div id="propertiesPanelTitle">Properties</div>
            <div id="propertiesPanelClose" class="right">
              <i class="fa fa-times" />
            </div>
          </div>
          <div id="propertiesPanelBody" class="prkr-props-body">
          
            <div class="prkr-props-item">
              <div class="prkr-props-item-label">Color</div>
              <div class="prkr-props-item-editor"><input id="colorInput" /></div>
              <div class="prkr-props-item-info"><i class="fa fa-info" /></div>
            </div>

            <div class="prkr-props-item">
              <div class="prkr-props-item-label">Hue</div>
              <div class="prkr-props-item-editor"><input id="colorInput" /></div>
              <div class="prkr-props-item-info"><i class="fa fa-info" /></div>
            </div>

            <div class="prkr-props-item">
              <div class="prkr-props-item-label">Intensity</div>
              <div class="prkr-props-item-editor"><input id="colorInput" /></div>
              <div class="prkr-props-item-info"><i class="fa fa-info" /></div>
            </div>
            

          </div>
        </div>`);
      
        this._domRoot = $root[0];

    }

  }
}