/// <reference path="./tool.ts" />
/// <reference path="./move-tool.ts" />


namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  export class SelectTool extends Tool {

    private _editor: ParcourEditor = null;

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
     * The "mouse down" event that triggered the "selecting" mode.
     */
    private _mouseDownEvent: JQueryMouseEventObject = null;

    /**
     * Indicates if in "moving" mode, where mouse events are passed to the move
     * tool.
     */
    private _moving: boolean = false;

    get name() { return 'select'; }
    
    get displayName() { return 'Select'; }

    constructor(editorApi: ParcourEditor) {
      super();
      this._editor = editorApi;
    }

    get enabled() {
      // Select is always enabled.
      return true;
    }

    public notifyMouseDown(e: JQueryMouseEventObject) {

      // Switch to "selecting" mode.
      this._selecting = true;
      this._selectionTarget = this._target;
      this._mouseDownEvent = e;

      this._updateCursor();
    }
    
    public notifyMouseMove(e: JQueryMouseEventObject) {

      this._updateTarget(e);

      if (this._selecting) {
        if (this._selectionTarget && this._selectionTarget.selected) {

          // Moving the mouse after having clicked a selected object...
          // Switch to "move mode".
          this._moving = true;
          this._getMoveTool().notifyMouseDown(this._mouseDownEvent);
          this._selecting = false;
          this._selectionTarget = null;
          // this._mouseDownEvent = null;
          
        }
      } 
      
      if (this._moving) {
        this._getMoveTool().notifyMouseMove(e);
      } 

      this._updateCursor();
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

        this._getMoveTool().notifyMouseUp(e);
        this._moving = false;   

      }

      this._updateCursor();

    }

    public notifyClick(e: JQueryMouseEventObject) { }

    /**
     * Updates the `_target` property with the closet object under the mouse
     * cursor using the specified mouse event, `e`.
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
     * Sets the editor cursor based on the current state.
     */
    private _updateCursor(): void {
      // In "moving" mode, we let the move tool set the cursor.
      if (!this._moving) {
        let pointer: string = null;        
        if (this._target != null) {
          if (this._target.selected) {
            pointer = '-webkit-grab'; // says "you can move that".
          } else {
            pointer = 'pointer'; // says "you can select that".
          }
        }
        this._editor.setPointer(pointer);
      }
    }

    private _moveTool: MoveTool = null;
    private _getMoveTool() {
      if (!this._moveTool) {
        this._moveTool = <MoveTool> this._editor.getToolByName('move');
      }
      return this._moveTool;
    }
  }
}