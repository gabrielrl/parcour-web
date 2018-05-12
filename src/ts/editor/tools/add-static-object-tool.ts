namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import RectangleHelper = PRKR.Helpers.RectangleHelper;
  import BoundingBoxHelper = PRKR.Helpers.BoundingBoxHelper;
  import AddObjectStep = EditSteps.AddObjectStep;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import C = PRKR.Editor.Tools.Constants;
  import EmbeddedRectanglesHelper = PRKR.Helpers.EmbeddedRectanglesHelper;

  /**
   * A Tool to insert new static objects by drawing shapes.
   */
  export class AddStaticObjectTool extends Tool {

    /** Indicates if the user is currently drawing. */
    private _drawing: boolean = false;

    /** The current drawing step. */
    private _drawingStep: number = 0;

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
    
    /** Drawn rectangle (adjusted, final) location. */
    private _location: Vector3 = new Vector3();

    /** Drawn rectangle (adjusted, final) size. */
    private _size: Vector3 = new Vector3();

    /** Rectangle on the floor helper. */
    private _firstStepHelper: EmbeddedRectanglesHelper = new EmbeddedRectanglesHelper();

    /** The helper bounding box displayed when the user draws. */
    private _rawHelper: RectangleHelper =
      new RectangleHelper(M.Box2.Unit, {
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
      this._editor.addToScene(this._firstStepHelper);
      this._editor.setPointer('crosshair');
      this._editor.setStatus(this._buildStatusMessage());
    }

    public deactivate() {
      this._drawing = false;
      this._editor.removeFromScene(this._firstStepHelper);
      this._editor.removeFromScene(this._helper);
      this._editor.removeFromScene(this._rawHelper);
    }


    public notifyMouseDown(event: JQueryMouseEventObject): void {

      if (event.which === 3) { // right button.

        if (this._drawing) {
          // cancel drawing.
          this._drawing = false;
          this._drawingStep = 0;
          event.preventDefault();
        }

      } else if (event.which === 1) { // left button.

        if (!this._drawing) {

          let position = this._getAreaLocation(event);
          if (position && position.areaId) {
            this._start = position;
            this._end = position;
            this._drawing = true;
            this._drawingStep = 0;

            this._computeLocationAndSize();
            this._validateDrawing();
            this._updateHelpers(position);
            this._editor.requestRender();
          }
        }
      }
    }

    public notifyMouseMove(event: JQueryMouseEventObject): void {

      let position = this._getAreaLocation(event);
     
      if (this._drawing) {

        if (position /* && position.areaId === this._start.areaId */) {
          this._end = position;

          this._computeLocationAndSize();
          this._validateDrawing();
        }
      }
      
      this._updateHelpers(position);
      this._editor.requestRender();      
    }

    public notifyMouseUp(event: JQueryMouseEventObject): void {

      if (event.which === 1) { // left button

        if (this._drawing) {
          if (this._drawingStep === 0) {

            // move to next step.
            this._drawingStep = 1;

          } else {

            // TODO
            // if (this._drawing && this._drawingValid) {
            //   let editStep = this._buildEditStep();
            //   let result = this._editor.addEditStep(editStep);
            //   if (result.dirtyIds.length > 0) {
            //     this._editor.selectByIds(result.dirtyIds);
            //   }
            // }
            this._drawing = false;

          }
          this._updateHelpers(null);
          this._editor.requestRender();          
        }
      }
    }

    /**
     * Updates the helpers location, size and materials.
     * `_computeLocationAndSize` must have been called prior to calling
     * this method.
     */
    private _updateHelpers(position: AreaLocation) {
      if (!this._drawing) {

        // Hide some helpers.
        this._rawHelper.visible = false;
        this._helper.visible = false;

        // Show some helpers.
        if (position && position.areaId) {
          let box = this._getAreaFloorBox2(position.areaId);
          // let area = <PRKR.Model.Area>this._editor.getObjectById(position.areaId).model;
          // let min = new Vector2(area.location.x, area.location.z);
          // let max = new Vector2(area.location.x + area.size.x, area.location.z + area.size.z) 
          // let box = new THREE.Box2(min, max);
          this._firstStepHelper.setRect1(box);

          let min = new Vector2(position.location.x, position.location.z);
          let max = new Vector2(position.location.x, position.location.z);
          box.set(min, max);
          this._firstStepHelper.setRect2(box);    
          this._firstStepHelper.visible = true;      

        } else {
          this._firstStepHelper.visible = false;
        }

      } else { // this._drawing == true

        if (this._drawingStep === 0) {
          // Drawing the floor-level shape (first step).

          let box = this._getAreaFloorBox2(this._start.areaId);
          this._firstStepHelper.setRect1(box);

          // let minx = Math.min(this._start.location.x, this._end.location.x);
          // let maxx = Math.max(this._start.location.x, this._end.location.x);
          // let miny = Math.min(this._start.location.z, this._end.location.z);
          // let maxy = Math.max(this._start.location.z, this._end.location.z);
          // let min = new Vector2(minx, miny);
          // let max = new Vector2(maxx, maxy);
          // box.set(min, max);
          box.setFromPoints([
            new Vector2(this._location.x, this._location.z),
            new Vector2(this._location.x + this._size.x, this._location.z + this._size.z)
          ]);
          this._firstStepHelper.setRect2(box);    
          this._firstStepHelper.visible = true;      
        }

        // Sets the helper's position and scale.
        this._rawHelper.position.copy(this._rawLocation);
        let helperScale = this._rawHelper.scale;
        helperScale.copy(this._rawSize);        
        // Prevent scaling by zero.
        if (helperScale.x === 0) helperScale.x = 0.001;
        if (helperScale.y === 0) helperScale.y = 0.001;
        if (helperScale.z === 0) helperScale.z = 0.001;
        
        // Set the adjusted helper's position and scale.
        this._helper.position.copy(this._location);
        helperScale = this._helper.scale;
        helperScale.copy(this._size);
        // Prevent scaling by zero.
        if (helperScale.x === 0) helperScale.x = 0.001;
        if (helperScale.y === 0) helperScale.y = 0.001;
        if (helperScale.z === 0) helperScale.z = 0.001;

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

    // Good candidate for a utility function.
    private _getAreaFloorBox2(areaId): THREE.Box2 {
      let area = <PRKR.Model.Area>this._editor.getObjectById(areaId).model;
      let min = new Vector2(area.location.x, area.location.z);
      let max = new Vector2(area.location.x + area.size.x, area.location.z + area.size.z) 
      let box = new THREE.Box2(min, max);
      return box;
    }

    /** Gets a slim Box3 of just the floor of the specified area. */
    private _getAreaFloorBox3(areaId): THREE.Box3 {
      let area = <PRKR.Model.Area>this._editor.getObjectById(areaId).model;
      let min = new Vector3(area.location.x, 0, area.location.z);
      let max = new Vector3(area.location.x + area.size.x, 0, area.location.z + area.size.z) 
      let box = new THREE.Box3(min, max);
      return box;
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

      // Clamp values inside start area's floor.
      let floor = this._getAreaFloorBox3(this._start.areaId);
      let min = new Vector3();
      min.copy(rawMin).clamp(floor.min, floor.max);
      let max = new Vector3();
      max.copy(rawMax).clamp(floor.min, floor.max);

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
        $type: 'StaticObject',
        location: this._location.toArray(),
        size: this._size.toArray()
      })
    }

    /**
     * Gets the current "area location" from mouse event.
     */
    private _getAreaLocation(mouseEvent: JQueryMouseEventObject): AreaLocation {

      let intersect = this._editor.projectMouseOnFloor(
        new THREE.Vector2(mouseEvent.clientX, mouseEvent.clientY));

      if (intersect) {

        let area = this._editor.getAreaAtLocation(intersect.point);
        return {
          location: intersect.point,
          areaId: area ? area.id : null
        };
      }
      return null;      
    }

    /**
     * Builds a message for the status bar from the current state.
     */
    private _buildStatusMessage() {

      if (!this._drawing) {
        return 'Click and drag inside an area to insert an object';
      } else if (this._drawingStep === 0) {
        return 'Drag to draw the shape of the object on the floor';
      } else {
        return 'TODO';
      }

    }
    
  }
}