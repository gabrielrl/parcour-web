/// <reference path="../../defs/prkr.bundle.d.ts" />

/// <reference path="../edit-steps/add-object-step.ts" />

/// <reference path="./tool.ts" />
/// <reference path="./constants.ts" />

namespace PRKR.Editor.Tools {

  // Imports
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import BoundingBoxHelper = PRKR.Helpers.BoundingBoxHelper;
  import AddObjectStep = EditSteps.AddObjectStep;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import C = PRKR.Editor.Tools.Constants;

  /**
   * A tool to draw new rooms to add to the current parcour.
   */
  export class RoomDrawingTool extends Tool {

    /** Default height for drawn rooms. */
    static ROOM_HEIGHT = 2.54;

    /** Indicates if the user is currently drawing. */
    private _drawing: boolean = false;

    /** Indicates if the current drawing is valid. */
    private _drawingValid: boolean = true;

    /** Drawing starting point. */
    private _start: Vector3 = new Vector3();

    /** Drawing ending point. */
    private _end: Vector3 = new Vector3();

    /** Drawn room raw (unadjusted) location. */
    private _rawLocation: Vector3 = new Vector3();

    /** Drawn room raw (unadjusted) size. */
    private _rawSize: Vector3 = new Vector3();

    /** Drawn room (adjusted, final) location. */
    private _location: Vector3 = new Vector3();

    /** Drawn room (adjusted, final) size. */
    private _size: Vector3 = new Vector3();

    /** Default status message. */
    private static DEFAULT_STATUS: string = 'Click and drag to add a room by drawing a rectangle';

    /** The helper bounding box displayed when the user draws. */
    private _rawHelper: BoundingBoxHelper =
      new BoundingBoxHelper(M.Box3.Unit, {
        useFaces: false,
        useLines: true,
        lineMaterial: C.Materials.Lines.Valid
      });

    /** The adjusted helper bounding box displayed when the user draws. */
    private _helper: BoundingBoxHelper =
      new BoundingBoxHelper(M.Box3.Unit, {
        useFaces: true,
        useLines: false,
        faceMaterial: C.Materials.Faces.Valid
      });

    constructor(private _editor: ParcourEditor) {
      super();

    }

    /** 
     * Gets if the room drawing tool is enabled.
     * Always return true.
     */
    get enabled() { return true; }

    get name() { return 'room-drawing'; }

    public activate() {
      this._drawing = false;  
      this._editor.addToScene(this._rawHelper);
      this._editor.addToScene(this._helper);

      this._editor.setPointer('crosshair');
      this._editor.setStatus(RoomDrawingTool.DEFAULT_STATUS);
    }

    public deactivate() {
      this._drawing = false;
      this._editor.removeFromScene(this._rawHelper);
      this._editor.removeFromScene(this._helper);
    }

    public notifyMouseDown(event: JQueryMouseEventObject): void {

      let position = this._getPosition(event);
      if (position) {
        this._start.copy(position);
        this._end.copy(position);
        this._drawing = true;

        this._computeLocationAndSize();
        this._validateDrawing();
        this._updateHelpers();
        this._editor.requestRender();

        this._editor.setStatus('Release to add room');
      }
    }

    public notifyMouseMove(event: JQueryMouseEventObject): void {
      
      if (this._drawing) {

        let position = this._getPosition(event);
        if (position) {
          this._end.copy(position);

          this._computeLocationAndSize();
          this._validateDrawing();
          this._updateHelpers();
          this._editor.requestRender();
        }
      }
    }

    public notifyMouseUp(event: JQueryMouseEventObject): void {

      if (this._drawing && this._drawingValid) {
        let editStep = this._buildEditStep();
        let result = this._editor.addEditStep(editStep);
        if (result.dirtyIds.length > 0) {
          this._editor.selectByIds(result.dirtyIds);
        }
      }
      
      this._drawing = false;
      this._updateHelpers();
      this._editor.setStatus(RoomDrawingTool.DEFAULT_STATUS);
      this._editor.requestRender();

    }

    /**
     * Updates the helpers location, size and materials.
     * `_computeLocationAndSize` must have been called prior to calling
     * this method.
     */
    private _updateHelpers() {
      if (!this._drawing) {

        // Hide the helpers
        this._rawHelper.visible = false;
        this._helper.visible = false;

      } else {

        // Sets the helper's position and scale.
        this._rawHelper.position.copy(this._rawLocation);
        let helperScale = this._rawHelper.scale;
        helperScale.copy(this._rawSize);        
        // Prevent scaling by zero.
        if (helperScale.x === 0) helperScale.x = 0.001;
        if (helperScale.z === 0) helperScale.z = 0.001;
        
        // Set the adjusted helper's position and scale.
        this._helper.position.copy(this._location);
        this._helper.scale.copy(this._size);

        // Set the helpers color according to drawing validity.
        if (this._drawingValid) {
          this._helper.setFaceMaterial(C.Materials.Faces.Valid);
          this._rawHelper.setLineMaterial(C.Materials.Lines.Valid);
        } else {
          this._helper.setFaceMaterial(C.Materials.Faces.Invalid);
          this._rawHelper.setLineMaterial(C.Materials.Lines.Invalid);
        }

        // Show the helpers.
        this._rawHelper.visible = true;
        this._helper.visible = true;

      }
    }

    /**
     * Computes `_location`, `_size`, `_rawLocation` and `_rawSize` from
     * `_start` and `_end` values.
     */
    private _computeLocationAndSize() {

        let rawMin = new Vector3(
          Math.min(this._start.x, this._end.x),
          0,
          Math.min(this._start.z, this._end.z)
        );
        let rawMax = new Vector3(
          Math.max(this._start.x, this._end.x),
          RoomDrawingTool.ROOM_HEIGHT,
          Math.max(this._start.z, this._end.z)
        );
        
        let min = new Vector3(
          Math.floor(rawMin.x), rawMin.y, Math.floor(rawMin.z)
        );
        let max = new Vector3(
          Math.ceil(rawMax.x), rawMax.y, Math.ceil(rawMax.z)
        );

        this._rawLocation.copy(rawMin);
        this._rawSize.subVectors(rawMax, rawMin);
        
        this._location.copy(min);
        this._size.subVectors(max, min);
    }

    /**
     * Validates the current drawing against the parcour and set
     * `_drawingValid`.
     * `_location` and `_size` must be up to date.
     */
    private _validateDrawing(): boolean {
      // Validate the drawing.
      let editStep = this._buildEditStep();
      let validation = this._editor.validateEditStep(editStep);
      
      // Are there errors?
      let errorCount = 0;
      for (let i = 0; i < validation.length; i++) {
        if (validation[i].level === ResultLevel.Error) errorCount++;
      }
      this._drawingValid = errorCount === 0;
      return this._drawingValid;
    }

    /**
     * Builds the edit step that correspond to the current drawing.
     * `_location` and `_size` must be up to date.
     */
    private _buildEditStep(): AddObjectStep {
      return new AddObjectStep({
        $type: 'RoomArea',
        location: this._location.toArray(),
        size: this._size.toArray()
      })
    }

    /**
     * Gets the current world position from mouse event.
     */
    private _getPosition(mouseEvent: JQueryMouseEventObject): THREE.Vector3 {
      let intersect = this._editor.projectMouseOnFloor(
        new Vector2(mouseEvent.clientX, mouseEvent.clientY));
      
      return intersect ? intersect.point : null;
    }
  }
}