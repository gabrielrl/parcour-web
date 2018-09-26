namespace PRKR.Editor {

  export interface KeyboardMatcherParams {
    keyCode: number;
    key?: string;
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
  }

  let paramsToString = (params: KeyboardMatcherParams) => (
    (params.ctrl ? 'Ctrl+' : '') +
    (params.shift ? 'Shift+' : '') + 
    (params.alt ? 'Alt' : '') + 
    (params.key || String.fromCharCode(params.keyCode))
  );

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

    toString() { return paramsToString(this._params); }

    private static _map: { [key: string]: KeyboardMatcher } = {};
    static for(params) {
      let map = KeyboardMatcher._map;
      let key = paramsToString(params);
      if (!(key in map)) {
        let matcher = new KeyboardMatcher(params);
        map[key] = matcher;
      }
      return map[key];
    }
    
  }

}
