/// <reference path="../editor-api.ts" />


namespace PRKR.Editor.Tools {

  export abstract class Tool {
    /** Gets the current tool's name. Used as a unique key. */
    name: string;

    /** Gets the current tool's displayable name. */
    displayName: string;

    /** Gets if the current tool is enabled. Computed from the editor's state. */
    enabled: boolean;

    /** Informs the Tool that it's being activated. */
    activate() { }

    /** Informs the Tool that it's being deactivated. */
    deactivate() { }

    notifyMouseMove(event: JQueryMouseEventObject): void { }

    notifyMouseDown(event: JQueryMouseEventObject): void { }

    notifyMouseUp(event: JQueryMouseEventObject): void { }
    
    notifyClick(event: JQueryMouseEventObject): void { }
  }
}