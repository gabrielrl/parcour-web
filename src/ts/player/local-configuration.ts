namespace PRKR.Player {

  /**
   * Holds all the locally configurable parameters, like debug flags and user preferences.
   * 
   * Persisted in the local storage only.
   */
  export class LocalConfiguration {

    public static LocalStorageKey = 'prkr-player.config';

    private static _value: LocalConfiguration;

    public static _changeListeners: Function[] = [];

    private _data: { [key: string]: any };

    private constructor(data: string | Object) {
      if (!data) data = {};

      if (_.isString(data)) {
        this._data = JSON.parse(data);
      } else {
        this._data = data;
      }

    }

    get displayStandingPoint(): boolean {
      return this._data['displayStandingPoint'];
    }

    set displayStandingPoint(value: boolean) {
      this._data['displayStandingPoint'] = value;
    }

    /**
     * The current configuration as a JSON string.
     */
    getJson() {
      return JSON.stringify({
        displayStandingPoint: this.displayStandingPoint
      });      
    }


    static get(): LocalConfiguration {

      if (!LocalConfiguration._value) {
        LocalConfiguration._value = new LocalConfiguration(
          localStorage.getItem(LocalConfiguration.LocalStorageKey)
        );
      }

      return LocalConfiguration._value;

    }

    static set(value: LocalConfiguration | string | Object) {

      LocalConfiguration._value = new LocalConfiguration(value);
      
      localStorage.setItem(LocalConfiguration.LocalStorageKey, LocalConfiguration._value.getJson());

      LocalConfiguration._changeListeners.forEach(callback => callback(LocalConfiguration._value));

    }

    static addChangeListener(callback: Function) {

      LocalConfiguration._changeListeners.push(callback);

    }
  }
}
