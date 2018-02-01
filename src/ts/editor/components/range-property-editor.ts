namespace PRKR.Editor.Components {
  import Property = Objects.Property;

  export class RangePropertyEditor implements PropertyEditor {

    private _editor: ParcourEditor;
    private _domRoot: HTMLElement;
    private _property: Property;
    private _value: number;

    constructor(editor: ParcourEditor, property: Property) {
      this._editor = editor;
      this._property = property;
      this._value = 0;

      this._build();
    }

    get dom() { return this._domRoot; }

    private _build() {
      let p = this._property;

      // TODO min, max, value

      let $root = $(`<div class="prkr-proped prkr-proped-range">
        <div class="prkr-proped-label margin">${p.display}</div>
        <div class="prkr-proped-field padding">
          <input id="property-${p.name}-input" name="${p.name}" type="range" min="" max="" value="" />
        </div>
        <div class="prkr-proped-info cloaked">${p.info}</div>
      </div>`);

      this._domRoot = $root[0];
    }

  }


}