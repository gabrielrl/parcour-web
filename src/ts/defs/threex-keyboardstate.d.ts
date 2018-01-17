// Definition file for threex.keyboardstate.js
// Hand-written by Gabriel Roy-Lortie

declare namespace THREEx {
  export class KeyboardState {
    constructor(document: HTMLElement | Document);

    /**
     * To stop listening of the keyboard events
     */
    destroy(): void;

    /**
     * query keyboard state to know if a key is pressed of not
     *
     * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
     * @returns {Boolean} true if the key is pressed, false otherwise
    */
    pressed(keyDesc: string): boolean;

    /**
     * return true if an event match a keyDesc
     * @param  {KeyboardEvent} event   keyboard event
     * @param  {String} keyDesc string description of the key
     * @return {Boolean}         true if the event match keyDesc, false otherwise
     */
    eventMatches(event: KeyboardEvent, keyDesc: string): boolean;

    
  }
}
