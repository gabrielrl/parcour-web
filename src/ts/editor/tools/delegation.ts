namespace PRKR.Editor.Tools {

  export interface QuitCondition {
     (e: JQuery.MouseEventBase): boolean;
  };

  export class Delegation {

    constructor(tool: Tool, quitCondition: QuitCondition) {
      this._tool = tool;
      this._quitCondition = quitCondition;
    }

    private _tool: Tool;
    private _quitCondition: QuitCondition;

    get tool() { return this._tool; }
    get quitCondition() { return this._quitCondition }
  }
}