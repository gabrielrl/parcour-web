namespace PRKR.Editor.Commands {
  export interface Command {
    /** Gets the current command's name. Used as a unique key. */
    name: string;

    /** Gets the current command's displayable name. */
    displayName: string;

    /** Gets the current command's keyboard shortcut. */
    keyboardShortcut: KeyboardMatcher;

    /** Indicates if the current command is enabled. */
    enabled: boolean;

    /**
     * Indicates if the current command should be highlighted to draw the user's
     * attention on it.
     */
    highlighted: boolean;

    /** Run the command. */
    run();
  }
}
