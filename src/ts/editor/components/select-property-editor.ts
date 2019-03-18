namespace PRKR.Editor.Components {

  import Property = Model.Property;
  import PropertyOption = Model.PropertyOption;

  class SelectOption {

    value: any;

    dom: JQuery;
      
  }

  export class SelectPropertyEditor extends PropertyEditor {


    private _$dom: JQuery = null;

    private _$field: JQuery = null;
    private _$options: SelectOption[] = null;

    constructor(prop: Property, value?: any, callback?: PropertyChangedCallback) {
      super(prop, value, callback);

      this._build();
      this._update();
    }

    get dom() { return this._$dom[0]; }

    protected _onValueChanged() {
      this._update();
    }

    private _onOptionClicked(evt: JQueryEventObject, opt: PropertyOption) {
      this.setValue(opt.value, false);
    }

    private _update() {
      this._$options.forEach(o => o.dom.toggleClass('active', o.value === this.value));
    }

    private _build() {
      let p = this.prop;


      let $root = $(`<div class="prkr-proped prkr-proped-select">
        <div class="prkr-proped-label margin">${ p.display }</div>
        <div class="prkr-proped-field padding">
        </div>
        <div class="prkr-proped-info cloaked">${ p.info }</div>
      </div>`);

      this._$dom = $root;
      this._$field = $root.find('.prkr-proped-field');

      if (this.prop.options) {
        this._$options = this.prop.options.map(o => this._buildOption(o));
        this._$field.append(this._$options.map(o => o.dom));
      } else {
        this._$options = [];
      }

    }

    private _buildOption(opt: PropertyOption): SelectOption {

      let $option =
        $(`<button class="prkr-option" data-value="${ opt.value }">${ opt.display }</button>`);

      $option.on('click', evt => this._onOptionClicked(evt, opt))
      
      return {
        value: opt.value,
        dom: $option
      };

    }
  }
}