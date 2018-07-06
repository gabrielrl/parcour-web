namespace PRKR.Editor.Behaviors {

  /** Behavior interface. Reading order is intentional (like always). */
  export interface Behavior {   
    
    /** Gets if this behavior is currently enabled. Being enabled means it will receive hover() messages. */
    enabled: boolean;

    /** Notifies this behavior that the pointer is hovering. */
    hover(event: JQueryMouseEventObject);

    /**
     * Gets if the behavior could be activated next. Value might take into account the current
     * editor state and the last call to `hover`.
     */
    ready: boolean;

    /** Gets the editor pointer for the current state. */
    pointer: string;

    /** Gets the editor status message for the current state. */
    statusMessage: string;

    /** 
     * Notifies this behavior that a button has been pressed. After a call to down, the behavior 
     * knows that:
     * - there migth be 0 to n call to `move`,
     * - there will be one call to either a `up` or `cancel`.
     */
    down(event: JQueryMouseEventObject);

    /** Notifies this behavior that the pointer has moved. `down` will have been called before. */
    move(event: JQueryMouseEventObject);

    /** Notifies this behavior that a button has been released, completing the action. */
    up(event: JQueryMouseEventObject);

    /** Notifies this behavior that a previous `down` has been canceled. */
    cancel(event: JQueryInputEventObject);
  }
  
}