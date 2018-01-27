namespace PRKR.Editor.Components {



  export class RangePropertyEditor implements Component {

    private _editor: ParcourEditor;
    private _domRoot: HTMLElement;

    constructor(editor: ParcourEditor, config: any /* TODO */) {
      this._editor = editor;

      this._build();
    }

    get dom() { return this._domRoot; }

    private _build() {
      let $root = $(`<div class="prkr-proped prkr-proped-range">
        ...
      </div>`);
    }

  }


}