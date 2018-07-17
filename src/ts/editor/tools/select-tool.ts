/// <reference path="./tool.ts" />
/// <reference path="./move-tool.ts" />


namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  export class SelectTool extends Tool {

    private _editor: ParcourEditor = null;

    /**
     * Closest object under the mouse when `_updateTarget` was last called.
     */
    private _target: EditorObject = null;

    /**
     * Indicates if the tool is currently in "selecting" mode. Meaning the user
     * clicked an object but hasn't yet released the mouse button.
     */
    private _selecting: boolean = false;

    /** 
     * The object that was under the mouse pointer when the user clicked,
     * putting the tool in "selecting" mode.
     */
    private _selectionTarget: EditorObject = null;

    /**
     * Move behavior instance; since the select tool can be used to move objects as well as
     * select them.
     */
    private _moveBehavior: Behaviors.MoveBehavior = null;

    /**
     * Indicates if in "moving" mode, where mouse events are passed to the move
     * behavior.
     */
    private _moving: boolean = false;

    /** Gets the internal name of the tool. */
    get name() { return 'select'; }
    
    /** Gets a display name for the tool. */
    get displayName() { return 'Select'; }

    constructor(editor: ParcourEditor) {
      super();
      this._editor = editor;
      this._moveBehavior = new Behaviors.MoveBehavior(editor);
    }

    /** Gets true (select is always enabled). */
    get enabled(): true {
      return true;
    }

    public activate() {
      this._setStatusMessage();
    }

    public notifyMouseDown(e: JQueryMouseEventObject) {

      // Give priority to the move behavior
      if (
        this._moveBehavior.enabled &&
        this._moveBehavior.ready &&
        this._target.selected
      ) {

        this._moveBehavior.down(e);
        this._moving = true;

      } else {

        // Switch to "selecting" mode.
        this._selecting = true;
        this._selectionTarget = this._target;
        
      }

      this._updateEditor();
    }
    
    public notifyMouseMove(e: JQueryMouseEventObject) {

      if (this._moving) {
        this._moveBehavior.move(e);
      } else {
        this._moveBehavior.hover(e);
      }
      
      this._updateTarget(e);
      this._updateEditor();
    }

    public notifyMouseUp(e: JQueryMouseEventObject) {

      if (this._selecting) {

        if (this._selectionTarget) {
          this._updateTarget(e);
          if (this._target === this._selectionTarget) {
            if (e.ctrlKey) {
              if (this._selectionTarget.selected) {
                this._editor.removeFromSelection(this._selectionTarget);
              } else {
                this._editor.addToSelection(this._selectionTarget);
              }
            } else {
              this._editor.select(this._selectionTarget);
            }
          }
        } else {
          this._editor.select(null);
        }

        this._selecting = false;
        this._selectionTarget = null;

      } else if (this._moving) {

        let behavior = this._moveBehavior;
        behavior.up(e);

        // moveTool.deactivate();
        this._moving = false;   

      }

      this._updateEditor();

    }

    public notifyClick(e: JQueryMouseEventObject) { }

    public notifyKeyDown(e: JQueryKeyEventObject) {
      if (this._moving) {
        this._moveBehavior.keyDown(e);
      }
    }

    /**
     * Updates the `_target` property with the closet object under the mouse
     *  using the specified mouse event, `e`.
     * @returns `this._target`.
     */
    private _updateTarget(e: JQueryMouseEventObject): EditorObject {
      let selectables = this._editor.getSelectableObjectsAt(e.clientX, e.clientY);
      if (selectables && selectables.length > 0) {
        this._target = selectables[0];
      } else {
        this._target = null;
      }
      return this._target;
    }

    /**
     * Sets the editor state (pointer and status message) based on the current state.
     */
    private _updateEditor(): void {
      if (this._moving) {

        this._editor.setPointer(this._moveBehavior.pointer);
        this._editor.setStatus(this._moveBehavior.statusMessage);

      } else {

        let pointer: string = null;      
        if (this._target == null) {
          pointer = 'crosshair';
        } else if (this._target.selected && this._moveBehavior.ready) {
            pointer = '-webkit-grab'; // says "you can move that".
        } else {
          pointer = 'pointer'; // says "you can select that".
        }
        this._editor.setPointer(pointer);
        this._setStatusMessage();

      }
    }

    private _setStatusMessage() {
      // console.log('_setStatusMesasge');
      this._editor.setStatus(this._buildStatusMessage());
    }

    private _buildStatusMessage() {

      if (this._selecting) {

        if (this._selectionTarget) {
          if (this._target && this._selectionTarget === this._target) {
            return `Release to select '${ this._target.name }'`;
          } else {
            return 'Release to cancel selection';
          }
          
        } else {
          return 'Release to clear selection';
        }

      } else {

        let sel = this._editor.selectedObjects;
        if (sel.length === 0) {
          if (this._target) {
            return `Click to select '${ this._target.name }'`;
          } else {
            return 'Click an object to select it';
          }

        } else {          
          if (this._target) {
            if (sel.indexOf(this._target) !== -1) {
              return `Click and drag to move '${ this._target.name }'`
            } else {
              return `Click to select '${ this._target.name }'. CTRL to multi-select`;
            }
          } else {
            return 'Click to clear selection';
          }          
        }      
      } 
    }
  }
}