namespace PRKR.Editor.Components {
  import Property = Model.Property;

  export class RangePropertyEditor extends PropertyEditor {

    public static STEP = 20;

    private _domRoot: HTMLElement;
    private _$input: JQuery;

    constructor(prop: Property, value?: any, callback?: PropertyChangedCallback) {
      super(prop, value, callback);

      this._build();
      this._updateDom(value);
    }

    get dom() { return this._domRoot; }

    protected _onValueChanged(newValue: number) {
      this._updateDom(newValue);
    }

    /** Called every time the value changes (while it's being dragged). */
    private _onInput(evt: JQuery.TriggeredEvent) {
      // console.log('on input', evt);
    }

    /** Called once the user releases the thumb. */
    private _onChange(evt: JQuery.ChangeEvent) {
      // console.log('on value', evt);

      let newValue = <number>this._$input.val() / RangePropertyEditor.STEP;

      console.log(`Set '${ this.prop.name }' value to ${ newValue }`);

      // Update the current property value.
      this.setValue(newValue, false);
    }

    private _build() {
      let p = this.prop;
      let thumb = this.value * RangePropertyEditor.STEP;
      let $root = $(`<div class="prkr-proped prkr-proped-range">
        <div class="prkr-proped-label margin">${ p.display }</div>
        <div class="prkr-proped-field padding">
          <input id="property-${ p.name }-input" name="${ p.name }" type="range" min="${ 0 }" max="${ RangePropertyEditor.STEP }" value="${ thumb }" />
        </div>
        <div class="prkr-proped-info cloaked">${ p.info }</div>
      </div>`);

      this._domRoot = $root[0];

      let $input = $root.find('input');

      $input.on('input', e => this._onInput(e));
      $input.on('change', e => this._onChange(e));

      this._$input = $input;
    }

    private _updateDom(value: number) {
      let thumb = value * RangePropertyEditor.STEP;
      this._$input.val(thumb);
    }

  }

}