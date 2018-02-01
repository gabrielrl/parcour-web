namespace PRKR.Editor.Components {
  import Property = Objects.Property;

  export class RangePropertyEditor implements PropertyEditor {

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

      // TODO min, max, value
      let min = p.min || 0;
      let max = p.max || 100;
      
      let val = this._editor.getPropertyValue(p);

      let $root = $(`<div class="prkr-proped prkr-proped-range">
        <div class="prkr-proped-label margin">${p.display}</div>
        <div class="prkr-proped-field padding">
          <input id="property-${p.name}-input" name="${p.name}" type="range" min="${min}" max="${max}" value="${val}" />
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
      console.log('on value', evt);

      let val = this._$input.val();
      //this._property.setValue(evt.)
    }

  }

}