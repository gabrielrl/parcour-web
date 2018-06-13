namespace PRKR.Editor.Components {
  import Property = Model.Property;

  /**
   * Displays a non-editable string.
   */
  export class DisplayPropertyEditor implements PropertyEditor {

    public static STEP = 20;

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

    get name() { return this._property.name; }

    get dom() { return this._domRoot; }

    private _build() {
      let p = this._property;
      
      let val = this._editor.getPropertyValue(p);

      let $root = $(`<div class="prkr-proped prkr-proped-range">
        <div class="prkr-proped-label margin">${ p.display }</div>
        <div class="prkr-proped-field padding">${ val }</div>
        <div class="prkr-proped-info cloaked">${ p.info }</div>
      </div>`);

      this._domRoot = $root[0];
    }

  }
}