namespace PRKR.Editor.Components {

  import Tool = Editor.Tools.Tool;
  import Command = Editor.Commands.Command;

  export class PropertiesPanel implements Component {

    private _editor: ParcourEditor;
    private _$root: JQuery;
    private _$bodyRoot: JQuery;

    constructor(editor: ParcourEditor) {
      this._editor = editor;

      this._build();
      this.update();
    }

    get dom() { return this._$root[0]; }

    update() {

      // Clear previous state.
      this._$bodyRoot.empty();

      // Determine if empty.
      let empty = true;
      let objects = this._editor.selectedObjects;
      if (objects.length !== 0) {

        var editors: PropertyEditor[] = []

        _.forEach(objects, object => {
          let props = object.getProperties();

          // Try to build an editor for each property.
          _.forEach(props, p => {

            // Merge editors when properties have the same name.
            let editor: PropertyEditor = null;  
            editor = _.find(editors, e => e.name === p.name);
            if (!editor) {

              switch(p.editor) {
                // TODO Get rid of magic strings here!
                case 'Range':
                case 'range':
                  editor = new RangePropertyEditor(this._editor, p);
                  break;

                case 'Display':
                case 'display':
                  editor = new DisplayPropertyEditor(this._editor, p);
                  break;
              }
            }

            if (editor) {
              editors.push(editor);
            }
          });

        });

        if (editors.length !== 0) {
          empty = false;
        }
      }        

      // Set new state.
      if (empty) {
        this._$root.addClass('empty');
      } else {
        this._$root.removeClass('empty');

        // Append editors to the DOM.
        this._$bodyRoot.append(editors.map(e => e.dom));
      }
    }

    private _build() {
      this._$root = $(
        `<div id="propertiesPanelRoot" class="prkr-props-root">
          <div class="prkr-props-head padding">
            <div id="propertiesPanelTitle">PROPERTIES</div>` +
            // Restore the close button when ready to implement it.
            // <div id="propertiesPanelClose" class="right">
            //   <i class="fa fa-angle-right" />
            // </div>
          `</div>
          <div id="propertiesPanelBody" class="prkr-props-body">
          </div>
        </div>`);
      
        this._$bodyRoot = this._$root.find('#propertiesPanelBody');
    }

  }
}