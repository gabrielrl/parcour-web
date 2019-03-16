namespace PRKR.Editor.Components {

  import Property = Model.Property;

  /**
   * Base class for all the property editors that can be hosted in a properties panel.
   */
  export abstract class PropertyEditor implements Component {

    /** Property description. */
    private _prop: Property;

    /** Current property value. */
    private _value: any;

    /** Callback that handles value changes. */
    private _callback: PropertyChangedCallback;

    constructor(prop: Property, value?: any, callback?: PropertyChangedCallback) {
      if (!prop) throw new Error('"prop" must be defined');
      this._prop = prop;

      if (value != null) {
        this._value = value;
      } else {
        this._value = null;
      }

      if (callback) {
        this._callback = callback;
      } else {
        this._callback = null;
      }
    }

    /** Gets the property description. */
    get prop(): Property { return this._prop; }

    /** Gets the property name. */
    get name(): string { return this._prop.name; }

    /** Gets the current property value. */
    get value(): any { return this._value; }

    /**
     * Sets the value of the edited property.
     * @param newValue New value for the edited property
     * @param quiet Mute the callback invocation. Optional, defaults to false.
     */
    setValue(newValue: any, quiet?: boolean) {
      if (newValue != null) {
        this._value = newValue;
      } else {
        this._value = null;
      }

      this._onValueChanged(newValue);

      if (!quiet && this._callback) {
        this._callback(this._prop, newValue);
      }
    }

    /**
     * Sets a callback that is invoked when the value changes.
     * @param callback Property changed callback function.
     */
    onValueChange(callback: PropertyChangedCallback) {
      if (callback != null) {
        this._callback = callback;
      } else {
        this._callback = null;
      }
    }

    /** Gets the HTML root for the editor. */
    abstract get dom(): HTMLElement;

    /**
     * Internally handles a change in the value. 
     * @param newValue 
     */
    protected abstract _onValueChanged(newValue: any);

  }
}
