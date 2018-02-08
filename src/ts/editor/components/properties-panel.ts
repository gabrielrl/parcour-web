namespace PRKR.Editor.Components {

  import Tool = Editor.Tools.Tool;
  import Command = Editor.Commands.Command;

  export interface PropertiesPanelConfiguration {
    // TODO
  }

  export class PropertiesPanel implements Component {

    private _editor: ParcourEditor;
    private _configuration: PropertiesPanelConfiguration;
    private _$root: JQuery;
    private _$bodyRoot: JQuery;

    constructor(editor: ParcourEditor, configuration: PropertiesPanelConfiguration) {
      this._editor = editor;
      this._configuration = configuration;

      this._build();
      this.set(null);
    }

    get dom() { return this._$root[0]; }

    set(objects: Editor.Objects.EditorObject | Editor.Objects.EditorObject[]) {

      // Clear previous state.
      this._$bodyRoot.empty();

      // Determine if empty.
      let empty = true;
      if (objects) {
        objects = _.castArray(objects);
        if (objects.length !== 0) {
          empty = false;
        }        
      }

      // Set new state.
      if (empty) {
        this._$root.addClass('empty');
      } else {
        this._$root.removeClass('empty');

        let editors: PropertyEditor[] = []

        _.forEach(objects, object => {
          let props = object.getProperties();
          // Build the editors.
          _.forEach(props, p => {

            let editor: PropertyEditor = null;

            editor = _.find(editors, e => e.name === p.name);
            if (!editor) {

              switch(p.editor) {
                case 'Range':
                case 'range':
                  editor = new RangePropertyEditor(this._editor, p);
                  break;
              }
            }

            if (editor) {
              editors.push(editor);
            }
          });

        });

        // Append them to the DOM.
        this._$bodyRoot.append(editors.map(e => e.dom));
      }
    }

    private _build() {
      this._$root = $(
        `<div id="propertiesPanelRoot" class="prkr-props-root">
          <div class="prkr-props-head padding">
            <div id="propertiesPanelTitle">PROPERTIES</div>
            <div id="propertiesPanelClose" class="right">
              <i class="fa fa-angle-right" />
            </div>
          </div>
          <div id="propertiesPanelBody" class="prkr-props-body">
          </div>
        </div>`);
      
        this._$bodyRoot = this._$root.find('#propertiesPanelBody');
    }

  }
}