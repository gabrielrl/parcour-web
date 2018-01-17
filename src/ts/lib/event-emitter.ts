namespace PRKR {
  export class EventEmitter {

    private _registrations: { [key: string]: Function[]} = {};

    public addEventListener(eventName: string, callback: Function) {
      let r = this._getRegistrations(eventName);
      if (r.indexOf(callback) === -1) {
        r.push(callback);
      }
    }

    public on(eventName: string, callback: Function) {
      this.addEventListener(eventName, callback);
    }

    public removeEventListener(eventName: string, callback: Function) {
      let r = this._getRegistrations(eventName);
      let i = r.indexOf(callback);
      if (i !== -1) {

      }
    }

    public off(eventName: string, callback: Function) {
      this.removeEventListener(eventName, callback);
    }

    protected emit(eventName: string, ...args: any[])  {
      let r = this._getRegistrations(eventName);
      r.forEach(f => f(...args));
    }

    private _getRegistrations(eventName: string): Function[] {
      if (!(eventName in this._registrations)) {
        this._registrations[eventName] = [];
      }
      return this._registrations[eventName];
    }
  }
}