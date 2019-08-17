/// <reference path="../editor-api.ts" />

namespace PRKR.Editor.Tools {

  export abstract class Tool {
    /** Gets the current tool's name. Used as a unique key. */
    name: string;

    /** Gets the current tool's displayable name. */
    displayName: string;

    /** Gets if the current tool is enabled. Computed from the editor's state. */
    enabled: boolean;

    /** Gets the current tool's keyboard shortcut. */
    keyboardShortcut: KeyboardMatcher;

    /**
     * Gets the current tool's editable properties.
     * Override if necessary, extend super's result.
     */
    get properties(): Model.Property[] { return []; }

    /** Informs the Tool that it's being activated. */
    activate() { }

    /** Informs the Tool that it's being deactivated. */
    deactivate() { }

    notifyMouseMove(event: JQuery.MouseEventBase): void { }

    notifyMouseDown(event: JQuery.MouseEventBase): void { }

    notifyMouseUp(event: JQuery.MouseEventBase): void { }
    
    notifyClick(event: JQuery.MouseEventBase): void { }

    notifyKeyDown(event: JQuery.KeyDownEvent): void { }

  }
}
