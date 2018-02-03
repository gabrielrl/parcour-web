namespace PRKR.Editor.Components {
  import Property = Model.Property;

  export class RangePropertyEditor implements PropertyEditor {

    public static STEP = 20;

    private _editor: ParcourEditor;
    private _domRoot: HTMLElement;
    private _$input: JQuery;
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
      
      let val = this._editor.getPropertyValue(p);

      let thumb = val * RangePropertyEditor.STEP;

      let $root = $(`<div class="prkr-proped prkr-proped-range">
        <div class="prkr-proped-label margin">${p.display}</div>
        <div class="prkr-proped-field padding">
          <input id="property-${p.name}-input" name="${p.name}" type="range" min="${0}" max="${RangePropertyEditor.STEP}" value="${thumb}" />
        </div>
        <div class="prkr-proped-info cloaked">${p.info}</div>
      </div>`);

      this._domRoot = $root[0];

      let $input = $root.find('input');

      $input.on('input', e => this._onInput(e));
      $input.on('change', e => this._onChange(e));

      this._$input = $input;
    }

    /** Called every time the value changes (while it's being dragged). */
    private _onInput(evt: JQueryEventObject) {
      // console.log('on input', evt);
    }

    /** Called once the user releases the thumb. */
    private _onChange(evt: JQueryEventObject) {
      // console.log('on value', evt);

      let val = this._$input.val() / RangePropertyEditor.STEP;

      console.log(`Set '${this._property.name}' value to ${val}`);

      this._editor.setPropertyValue(this._property, val);
    }

  }

}