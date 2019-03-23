namespace PRKR.Editor.Components {

  import Property = Model.Property;

  export interface PropertyChangedCallback {
    (property: Property, value: any) : void
  }

  export class PropertiesPanel implements Component {

    private _$root: JQuery;
    private _$bodyRoot: JQuery;
    private _callback: PropertyChangedCallback;
    private _editors: PropertyEditor[];

    private _name: string;

    constructor(name?: string) {

      this._name = name || 'PROPERTIES';

      this._build();
      this._updateDom();
    }

    get dom() { return this._$root[0]; }

    /**
     * Sets the panel content.
     * @param props An array of properties to display and edit.
     */
    setProperties(props: Property[], values?: any[]) {

      if (props == null) props = [];

      var editors: PropertyEditor[] = [];
      var handler = (p: Property, v: any) => this._onPropertyChanged(p, v);

      _.forEach(props, (prop, i) => {

        // Skip property if another one has the same name.
        let editor = _.find(editors, e => e.name === prop.name);
        if (!editor) {

          let value = values ? values[i] : null;

          switch(prop.editor) {
            // TODO Get rid of magic strings here!
            case 'Range':
            case 'range':
              editor = new RangePropertyEditor(prop, value, handler);
              break;

            case 'Display':
            case 'display':
              editor = new DisplayPropertyEditor(prop, value, handler);
              break;

            case 'select':
              editor = new SelectPropertyEditor(prop, value, handler);
              break;
          }
        }

        if (editor) {
          editors.push(editor);
        }
      });

      this._editors = editors;

      this._updateDom();
    }

    /**
     * Sets a callback to handle property value changes.
     * @param callback Property changed callback
     */
    onChange(callback: PropertyChangedCallback) {
      this._callback = callback;
    }

    private _onPropertyChanged(prop: Property, value: any) {
      if (this._callback) {
        this._callback(prop, value);
      }
    }

    private _updateDom() {

      // Clear previous state.
      this._$bodyRoot.empty();

      // Set new state.
      if (!this._editors || this._editors.length === 0) {
        this._$root.addClass('empty');
      } else {
        this._$root.removeClass('empty');

        // Append editors to the DOM.
        this._$bodyRoot.append(this._editors.map(e => e.dom));
      }
    }

    private _build() {
      this._$root = $(
        `<div class="prkr-props-root">
          <div class="prkr-props-head padding">
            <div class="prkr-props-title">${ this._name }</div>
          </div>
          <div class="prkr-props-body"></div>
        </div>`);
      
        this._$bodyRoot = this._$root.find('.prkr-props-body');
    }

  }
}