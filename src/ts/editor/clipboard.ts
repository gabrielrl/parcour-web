namespace PRKR.Editor {

  // A global clipboard object. Stores information in the browser's local storage.
  export class Clipboard {

    private static StorageKey = 'cb';

    // Disables instance constructor (all static class).
    private constructor() { }

    static get isEmpty(): boolean {
      let item = localStorage.getItem(Clipboard.StorageKey);

      return item == null || !_.isString(item) || item.length === 0;
    }

    static get() {
      return localStorage.getItem(Clipboard.StorageKey);
    }

    static set(value) {
      localStorage.setItem(Clipboard.StorageKey, value);
    }

    static clear() {
      localStorage.removeItem(Clipboard.StorageKey);
    }

  }
}