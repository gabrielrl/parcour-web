namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import BoundingBoxHelper = PRKR.Helpers.BoundingBoxHelper;
  import AddObjectStep = EditSteps.AddObjectStep;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import C = PRKR.Editor.Tools.Constants;

  /**
   * A Tool to insert new static objects by drawing shapes.
   */
  export class AddStaticObjectTool extends Tool {

    /** Indicates if the user is currently drawing. */
    private _drawing: boolean = false;

    /** Indicates if the current drawing is valid. */
    private _drawingValid: boolean = true;

    /** Drawing starting point. */
    private _start: AreaLocation = null;

    /** Drawing ending point. */
    private _end: AreaLocation = null;

    /** Drawn rectangle raw (unadjusted) location. */
    private _rawLocation: Vector3 = new Vector3();

    /** Drawn rectangle raw (unadjusted) size. */
    private _rawSize: Vector3 = new Vector3();
    
    /** Drawn room (adjusted, final) location. */
    private _location: Vector3 = new Vector3();

    /** Drawn room (adjusted, final) size. */
    private _size: Vector3 = new Vector3();

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
     * Gets if the add static object tool is enabled.
     * True if there are areas in the parcour.
     */
    get enabled() {
      return this._editor.getAreas().length !== 0;
    }

    get name() { return 'add-static-object'; }

    public activate() {
      this._drawing = false;
      this._editor.addToScene(this._rawHelper);
      this._editor.addToScene(this._helper);
    }

    public deactivate() {
      this._drawing = false;
      this._editor.removeFromScene(this._rawHelper);
      this._editor.removeFromScene(this._helper);
    }


    public notifyMouseDown(event: JQueryMouseEventObject): void {

      let position = this._getPosition(event);
      if (position) {
        this._start = position;
        this._end = position;
        this._drawing = true;

        this._computeLocationAndSize();
        this._validateDrawing();
        this._updateHelpers();
        this._editor.requestRender();
      }
    }

    public notifyMouseMove(event: JQueryMouseEventObject): void {
      
      if (this._drawing) {

        let position = this._getPosition(event);
        if (position && position.areaId === this._start.areaId) {
          this._end = position;

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

        // // Set the helpers color according to drawing validity.
        // if (this._drawingValid) {
          this._helper.setFaceMaterial(C.Materials.Faces.Valid);
          this._rawHelper.setLineMaterial(C.Materials.Lines.Valid);
        // } else {
        //   this._helper.setFaceMaterial(C.Materials.Faces.Invalid);
        //   this._rawHelper.setLineMaterial(C.Materials.Lines.Invalid);
        // }

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
      let start = this._start.location;
      let end = this._end.location;
      let rawMin = new Vector3(
        Math.min(start.x, end.x),
        0,
        Math.min(start.z, end.z)
      );
      let rawMax = new Vector3(
        Math.max(start.x, end.x),
        1,
        Math.max(start.z, end.z)
      );
      
      // let min = new Vector3(
      //   Math.floor(rawMin.x), rawMin.y, Math.floor(rawMin.z)
      // );
      // let max = new Vector3(
      //   Math.ceil(rawMax.x), rawMax.y, Math.ceil(rawMax.z)
      // );

      this._rawLocation.copy(rawMin);
      this._rawSize.subVectors(rawMax, rawMin);
      
      this._location.copy(rawMin);
      this._size.subVectors(rawMax, rawMin);
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
        $type: 'StaticObject',
        location: this._location.toArray(),
        size: this._size.toArray()
      })
    }

    /**
     * Gets the current "area location" from mouse event.
     */
    private _getPosition(mouseEvent: JQueryMouseEventObject): AreaLocation {

      let intersect = this._editor.projectMouseOnFloor(
        new THREE.Vector2(mouseEvent.clientX, mouseEvent.clientY));

      if (intersect) {

        let area = this._editor.getAreaAtLocation(intersect.point);
        if (area) {

          return {
            areaId: area.id,
            location: intersect.point
          };
        }        
      } 
      return null;      
    }
    
  }
}