/// <reference path="./tool.ts" />
/// <reference path="./plane-resize-handle.ts" />

/// <reference path="../objects/editor-object.ts" />
/// <reference path="../edit-steps/resize-step.ts" />


namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;
  import IValidationResult = PRKR.Validators.IValidationResult;
  import ResultLevel = PRKR.Validators.ResultLevel;

  /** This tool allows the user to resize objects which support it. */
  export class ResizeTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super();
    }

    /** Indicates if a resize operation is in progress. */
    private _resizing: boolean = false;

    /** Indicates if the current resize operation is valid. */
    private _resizeValid: boolean = false;

    private _targets: Objects.EditorObject[] = [];

    /** Resize helpers for each resizable selected object. */
    private _helpers: ResizeHelper[] = [];

    /** Currently active "resize helper hit" description. */
    private _activeHit: ResizeHelperHit = null;

    /** Gets the current tool's name. Used as a unique key. */
    public get name(): string { return 'resize'; }

    /** Gets the current tool's displayable name. */
    public get displayName(): string { return 'Resize'; }

    /** Gets if the current tool is enabled. Computed from the editor's state. */
    public get enabled(): boolean {

      return _.some(this._editor.selectedObjects, o => o.resizable);

    }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({ keyCode: 89 /* Y */ });
    }

    /** Override. */
    public activate() {
      this._reset();
      this._updateEditor();
      this._editor.requestRender();
    }

    /** Override. */
    public deactivate() {
      // Remove all helpers from scene.
      for (let i = 0; i < this._helpers.length; i++) {
        this._editor.removeFromScene(this._helpers[i]);
      }

      // Reset everything (unlink memory).
      this._resizing = false;
      this._targets = [];
      this._helpers = [];
      
      this._editor.requestRender();
    }

    /**
     * Handles mouse down.
     */
    public notifyMouseDown(event: JQueryMouseEventObject): void {

      if (this._activeHit) {

        // There is an active helper under the mouse pointer.
        this._activeHit.helper.resizeStart(event, this._activeHit);
        this._resizing = true;
        this._updateEditor(ResizeDelta.Empty);
        this._editor.requestRender();

      }

    }

    /**
     * Handles mouse move.
     */
    public notifyMouseMove(event: JQueryMouseEventObject): void {

      if (!this._resizing) {

        let hits: ResizeHelperHit[] = [];
        for (let i = 0; i < this._helpers.length; i++) {
          let helper = this._helpers[i];
          let hit = helper.test(event);
          if (hit) {
            hits.push(hit);
          }
        }

        // Find the active helper; it's the nearest.
        let helper: ResizeHelper = null;
        let hit: ResizeHelperHit = null;
        if (hits.length > 0) {

          // Use hit with the shortest distance.
          hit = hits[0];
          for (let i = 1; i < hits.length; i++) {
            if (hits[i].distance < hit.distance) hit = hits[i];
          }
          helper = hit.helper;
        }

        // Update active helper state.
        if (hit) {
          if (this._activeHit && this._activeHit.handle !== hit.handle) {
            this._activeHit.helper.setHovered(null);
          }
          hit.helper.setHovered(hit);
          this._editor.requestRender();
        } else { // !hit
          if (this._activeHit) { 
            this._activeHit.helper.setHovered(null);
            this._editor.requestRender();
          }
        }
        this._activeHit = hit;
        this._updateEditor();

      } else { // Resizing.

        let resizeDelta = this._activeHit.helper.resizeMove(event);

        if (resizeDelta) {
          // Build the corresponding edit step.
          let editStep = this._buildEditStep(resizeDelta);
          // Validate it.
          let validations = this._editor.validateEditStep(editStep);
          let someErrors = _.some(validations, x => x.level === ResultLevel.Error)

          // Validate resize and update helpers.
          if (someErrors) {
            // console.log('Some errors in validation', validations);
            this._resizeValid = false;
            this._helpers.forEach(h => h.setError());
          } else {
            this._resizeValid = true;
            this._helpers.forEach(h => h.unsetError());
          }
        }

        this._updateEditor(resizeDelta);
        this._editor.requestRender();
      }
    }

    /**
     * Handles mouse up.
     */
    public notifyMouseUp(mouseEvent: JQueryMouseEventObject) {

      if (this._resizing && this._resizeValid) {

        let resizeDelta = this._activeHit.helper.resizeEnd(mouseEvent);
        if (resizeDelta) {      

          let editStep = this._buildEditStep(resizeDelta);
          this._editor.addEditStep(editStep);

        }
      }

      this._resizing = false;
      this._reset();

      this._updateEditor();
      this._editor.requestRender();
    }

    private _reset() {

      // Clean up if necessary.
      if (this._helpers) {
        this._helpers.forEach(h => this._editor.removeFromScene(h));
      }

      // Build resize helpers for every resizable selected object.
      this._targets = [];
      this._helpers = [];
      let sel = this._editor.selectedObjects;

      for (let i = 0; i < sel.length; i++) {
        if (sel[i].resizable) {
          this._targets.push(sel[i]);
          let helper = new ResizeHelper(sel[i], this._editor);
          this._helpers.push(helper);
          this._editor.addToScene(helper);
        }
      }

    }

    /** Sets status and pointer from current state on the editor. */
    private _updateEditor(resizeDelta?: ResizeDelta) {
      if (!this._resizing) {
        if (this._activeHit) {
          this._editor.setStatus('Click and drag handle to resize selected objects');
          this._editor.setPointer('-webkit-grab');
        } else {
          this._editor.setStatus('Click and drag handles to resize selected objects');
          this._editor.setPointer('crosshair');
        }
      } else {
        if (resizeDelta) {

          let po = this._targets[0].model;

          let newSize = new THREE.Vector3();
          if (po instanceof Model.RoomArea) {
            newSize.copy(po.size).add(resizeDelta.size);
          } else if (po instanceof Model.StaticObject || po instanceof Model.DynamicObject) {
            newSize.copy(po.size).add(resizeDelta.size).multiplyScalar(2);
          }

          this._editor.setStatus('Release to resize. New dimensions: [' +
            newSize.x.toFixed(2) + ', ' + 
            newSize.y.toFixed(2) + ', ' + 
            newSize.z.toFixed(2) + ']');
        } else {
          this._editor.setStatus('Release to resize');
        }
        this._editor.setPointer('-webkit-grabbing');
      }
    }

    /** */
    private _buildEditStep(resizeDelta: ResizeDelta) {
      let editStep = 
        new PRKR.Editor.EditSteps.ResizeStep(
          resizeDelta.location,
          resizeDelta.size,
          this._targets.map(t => { return t.id })
        );
      return editStep;
    }
  }

}
