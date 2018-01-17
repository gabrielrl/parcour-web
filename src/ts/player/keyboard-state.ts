
namespace PRKR.Player {

  /** Maps a key code (number) to a "pressed" state (boolean) */
  interface StateMap {
    [keyCode: number]: boolean;
  }

  export class KeyboardState extends EventEmitter {

    /** The current keyboard state. */
    private _state: StateMap;

    constructor(source?: Element | Window) {
      super();

      if (!source) source = window;

      this._state = {};

      let $source = $(source);
      $source.on('keydown', e => this._onKeyDown(e));
      $source.on('keyup', e => this._onKeyUp(e));
    }

    isKeyDown(keyCode: number) {
      return keyCode in this._state ? this._state[keyCode] : false;
    }

    isKeyUp(keyCode: number) {
      return keyCode in this._state ? !this._state[keyCode] : true;
    }

    private _onKeyDown(e: JQueryKeyEventObject) {
      if (this.isKeyUp(e.which)) {
        this._state[e.which] = true;
        this.emit('keydown', e);
      }
    }

    private _onKeyUp(e: JQueryKeyEventObject) {
      if (this.isKeyDown(e.which)) {
        this._state[e.which] = false;
        this.emit('keyup', e);
      }
    }
  }
}