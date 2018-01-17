namespace PRKR.Validators {

  export interface IValidationResult {
    code: string;
    displayText: string;
    level: ResultLevel;
  }

  export enum ResultLevel {
    Information = 0,
    Warning = 1,
    Error = 2
  }

  export class ValidationResult implements IValidationResult {
    
    private _level: ResultLevel;
    public get level() { return this._level; }

    private _code: string;
    public get code() { return this._code };

    private _displayText: string;
    public get displayText() { return this._displayText; }

    constructor (level: ResultLevel, code: string, displayText: string) {
      this._level = level;
      this._code = code;
      this._displayText = displayText;
    }
    
  }
}