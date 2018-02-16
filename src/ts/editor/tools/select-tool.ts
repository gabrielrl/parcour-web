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

    public activate() {
      this._setStatusMessage();
    }

    public notifyMouseDown(e: JQueryMouseEventObject) {

      // Switch to "selecting" mode.
      this._selecting = true;
      this._selectionTarget = this._target;
      this._mouseDownEvent = e;

      this._update();
    }
    
    public notifyMouseMove(e: JQueryMouseEventObject) {

      if (this._moving) {
        this._getMoveTool().notifyMouseMove(e);
        return;
      } 
      
      this._updateTarget(e);

      if (this._selecting) {
        if (this._selectionTarget && this._selectionTarget.selected) {

          // Moving the mouse after having clicked a selected object...
          // Switch to "move mode".
          this._moving = true;
          let moveTool = this._getMoveTool();
          moveTool.activate();
          moveTool.notifyMouseDown(this._mouseDownEvent);
          this._selecting = false;
          this._selectionTarget = null;
          
          return;
        }
      }

      this._update();
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

        let moveTool = this._getMoveTool();        
        moveTool.notifyMouseUp(e);
        moveTool.deactivate();
        this._moving = false;   

      }

      this._update();

    }

    public notifyClick(e: JQueryMouseEventObject) { }

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
     * Sets the editor  based on the current state.
     */
    private _update(): void {
      // In "moving" mode, we let the move tool set the .
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

    private _moveTool: MoveTool = null;
    private _getMoveTool() {
      if (!this._moveTool) {
        this._moveTool = <MoveTool> this._editor.getToolByName('move');
      }
      return this._moveTool;
    }
  }
}