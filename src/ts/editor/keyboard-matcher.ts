namespace PRKR.Editor {

  export interface KeyboardMatcherParams {
    keyCode: number;
    key?: string;
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
  }

  export class KeyboardMatcher {

    private _params: KeyboardMatcherParams;
    
    constructor(params: KeyboardMatcherParams) {
      if (!params) throw new Error('"params" is mandatory');
      this._params = params;
    }

    match(e: JQueryKeyEventObject) {
      let p = this._params;
      if (e.keyCode !== p.keyCode) return false;
      if (p.ctrl && !e.ctrlKey) return false;
      if (p.shift && !e.shiftKey) return false;
      if (p.alt && !e.altKey) return false;
      return true;
    }

    toString() {
      return (
        (this._params.ctrl ? 'CTRL+' : '') +
        (this._params.shift ? 'SHIFT+' : '') + 
        (this._params.alt ? 'ALT+' : '') + 
        (this._params.key || String.fromCharCode(this._params.keyCode))
      );
    }
  }

}
