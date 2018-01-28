namespace PRKR.Editor.Components {

  import Tool = Editor.Tools.Tool;
  import Command = Editor.Commands.Command;

  export interface PropertiesPanelConfiguration {
    // TODO
  }

  export class PropertiesPanel implements Component {

    private _editor: ParcourEditor;
    private _configuration: PropertiesPanelConfiguration;
    private _domRoot: HTMLElement;
    private _$bodyRoot: JQuery;

    constructor(editor: ParcourEditor, configuration: PropertiesPanelConfiguration) {
      this._editor = editor;
      this._configuration = configuration;

      this._build();

    }

    get dom() { return this._domRoot; }


    set(objects: Editor.Objects.EditorObject | Editor.Objects.EditorObject[]) {

      // Clear previous state.
      this._$bodyRoot.empty();

      if (!objects) return;
      objects = _.castArray(objects);
      if (objects.length === 0) return;

      // Set new state.
      let editors: PropertyEditor[] = []

      _.forEach(objects, object => {
      
        let props = object.getProperties();

        // Build the editors.

        _.forEach(props, p => {
          let editor: PropertyEditor = null;

          switch(p.editor) {
            case 'Range':
            case 'range':
              editor = new RangePropertyEditor(this._editor, p);
              break;
          }

          if (editor) {
            editors.push(editor);
          }
        });

      });

      // Append them to the DOM.
      this._$bodyRoot.append(editors.map(e => e.dom));

    }

    private _build() {
      let $root = $(
        `<div id="propertiesPanelRoot" class="prkr-props-root">
          <div class="prkr-props-head">
            <div id="propertiesPanelTitle">PROPERTIES</div>
            <div id="propertiesPanelClose" class="right">
              <i class="fa fa-angle-right" />
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
        this._$bodyRoot = $root.find('#propertiesPanelBody');
    }

  }
}