/// <reference path="./property-editor.ts" />

namespace PRKR.Editor.Components {
  import Property = Model.Property;

  /**
   * Displays a non-editable string.
   */
  export class DisplayPropertyEditor extends PropertyEditor {

    private _$domRoot: JQuery;

    constructor(prop: Property, value?: any, callback?: PropertyChangedCallback) {
      super(prop, value, callback);

      this._build();
      this._onValueChanged(value);
    }

    get dom() { return this._$domRoot[0]; }

    private _build() {
      let p = this.prop;

      let $root = $(`<div class="prkr-proped prkr-proped-display">
        <div class="prkr-proped-label margin">${ p.display }</div>
        <div class="prkr-proped-field padding"></div>
        <div class="prkr-proped-info cloaked">${ p.info }</div>
      </div>`);

      this._$domRoot = $root;
    }

    protected _onValueChanged(newValue: any) {
      this._$domRoot.find('.prkr-proped-field').html(newValue || '');
    }

  }
}