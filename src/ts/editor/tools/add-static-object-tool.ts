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

  /** Possible drawing states. */
  enum DrawingState {

    /** Not yet started. Hovering over the floor level. */
    NotStarted = 0,

    /** Horizontally drawing a shape at the floor level. */
    HorizontalDrawing = 1,

    /** Relocating before drawing the vertical shape. */
    Pause = 2,

    /** Vertically drawing a shape. */
    VerticalDrawing = 3
  };

  /**
   * A Tool to insert new static objects by drawing shapes.
   */
  export class AddStaticObjectTool extends Tool {

    public static GridStep = .25;

    /** Current drawing state. */
    private _state: DrawingState = DrawingState.NotStarted;

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
    private _embeddedRectanglesHelper: EmbeddedRectanglesHelper = new EmbeddedRectanglesHelper();

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
      this._state = DrawingState.NotStarted;

      this._editor.addToScene(this._rawHelper);
      this._editor.addToScene(this._helper);
      this._editor.addToScene(this._embeddedRectanglesHelper);
      this._editor.setPointer('crosshair');
      this._editor.setStatus(this._buildStatusMessage());
    }

    public deactivate() {
      this._state = DrawingState.NotStarted;
      this._editor.removeFromScene(this._embeddedRectanglesHelper);
      this._editor.removeFromScene(this._helper);
      this._editor.removeFromScene(this._rawHelper);
    }


    public notifyMouseDown(event: JQueryMouseEventObject): void {

      if (event.which === 3) { // right button.

        this._state = DrawingState.NotStarted;
        event.preventDefault();

      } else if (event.which === 1) { // left button.

        if (this._state === DrawingState.NotStarted) {

          let position = this._getAreaLocation(event);
          if (position && position.areaId) {
            this._start = position;
            this._end = position;
            this._state = DrawingState.HorizontalDrawing;

            this._computeLocationAndSize();
            this._validateDrawing();
            this._updateHelpers(position);
            this._editor.requestRender();
          }
        } else if (this._state === DrawingState.Pause) {

          let position = this._getVerticalLocation(event);
          if (position) {
            this._start.location.setY(position.location.y);
            this._end.location.setY(position.location.y);
            this._state = DrawingState.VerticalDrawing;

            this._computeLocationAndSize();
            this._validateDrawing();
            this._updateHelpers(position);
            this._editor.requestRender();            
          }

        }
      }
      this._editor.setStatus(this._buildStatusMessage());      
    }

    public notifyMouseMove(event: JQueryMouseEventObject): void {

      let position: AreaLocation = null;

      switch(this._state) {
        case DrawingState.NotStarted:
          position = this._getAreaLocation(event);
          break;

        case DrawingState.HorizontalDrawing:
          position = this._getAreaLocation(event);
          if (position != null) {
            this._end = position;
          }
          break;

        case DrawingState.Pause:
          position = this._getVerticalLocation(event);
          if (position != null) {
            this._start.location.setY(position.location.y);
            this._end.location.setY(position.location.y);
          }
          break;

        case DrawingState.VerticalDrawing:
          position = this._getVerticalLocation(event);
          if (position != null) {
            this._end = position;
          }
          break;        
      }
     
      if (this._state !== DrawingState.NotStarted && position != null) {
        this._computeLocationAndSize();
        this._validateDrawing();
      }
      
      this._updateHelpers(position);
      this._editor.requestRender();
      this._editor.setStatus(this._buildStatusMessage());      
    }

    public notifyMouseUp(event: JQueryMouseEventObject): void {

      if (event.which === 1) { // left button

        this._computeLocationAndSize();
        
        if (this._state === DrawingState.HorizontalDrawing) {

          // Check if we have a non null area
          let area = this._size.x * this._size.z;
          if (Math.abs(area) > 0.001) {

            // Move to next step.
            this._state = DrawingState.Pause;

          } else {

            // Go back to original state.
            this._state = DrawingState.NotStarted;

          }

        } else if (this._state === DrawingState.VerticalDrawing) {

          if (this._validateDrawing()) {
            let step = this._buildEditStep();
            let result = this._editor.addEditStep(step);
            if (result.dirtyIds.length > 0) {
              this._editor.selectByIds(result.dirtyIds);
            }
          }
          this._state = DrawingState.NotStarted;
        }

        this._updateHelpers(null);
        this._editor.requestRender();
        this._editor.setStatus(this._buildStatusMessage());  
      }
    }

    /**
     * Updates the helpers location, size and materials.
     * `_computeLocationAndSize` must have been called prior to calling
     * this method.
     */
    private _updateHelpers(position: AreaLocation) {

      function setHelper(
        helper: RectangleHelper | BoundingBoxHelper,
        location: Vector3,
        size: Vector3,
        drawingValid: boolean
      ) {
        helper.position.copy(location);
        let helperScale = helper.scale;
        helperScale.copy(size);        
        // Prevent scaling by zero.
        if (helperScale.x === 0) helperScale.x = 0.001;
        if (helperScale.y === 0) helperScale.y = 0.001;
        if (helperScale.z === 0) helperScale.z = 0.001;

        // Set the helpers color according to drawing validity.
        if (drawingValid) {
          helper.setLineMaterial(C.Materials.Lines.Valid);
          helper.setFaceMaterial(C.Materials.Faces.Valid)
        } else {
          helper.setLineMaterial(C.Materials.Lines.Invalid);
          helper.setFaceMaterial(C.Materials.Faces.Invalid);
        }

        helper.visible = true;
      }

      switch (this._state) {

        case DrawingState.NotStarted:

          // Hide some helpers.
          this._rawHelper.visible = false;
          this._helper.visible = false;

          // Show some helpers.
          if (position) {
            this._embeddedRectanglesHelper.visible = true;          
            if (position.areaId) {
              let box = this._getAreaFloorBox2(position.areaId);
              this._embeddedRectanglesHelper.setRect1(box);

              let min = new Vector2(position.location.x, position.location.z);
              let max = new Vector2(position.location.x, position.location.z);
              box.set(min, max);
              this._embeddedRectanglesHelper.setRect2(box);
              this._embeddedRectanglesHelper.setLineMaterial(C.Materials.Lines.Valid);
            } else {
              let box = this._getCellFloorBox2(position.location);
              this._embeddedRectanglesHelper.setRect1(box);
              let min = new Vector2(position.location.x, position.location.z);
              let max = new Vector2(position.location.x + .001, position.location.z + .001);
              box.set(min, max);
              this._embeddedRectanglesHelper.setRect2(box);
              this._embeddedRectanglesHelper.setLineMaterial(C.Materials.Lines.Invalid); // ...
            }
          } else {
            this._embeddedRectanglesHelper.visible = false;
          }
        
          break;

        case DrawingState.HorizontalDrawing:
        case DrawingState.Pause:

          // Drawing the floor-level shape (first step).
          let box = this._getAreaFloorBox2(this._start.areaId);
          this._embeddedRectanglesHelper.setRect1(box);

          box.setFromPoints([
            new Vector2(this._location.x, this._location.z),
            new Vector2(this._location.x + this._size.x, this._location.z + this._size.z)
          ]);
          this._embeddedRectanglesHelper.setRect2(box);
          this._embeddedRectanglesHelper.visible = true;

          // At this stage, validity depends on having a non-empty area.
          let area = this._size.x * this._size.z;
          let valid = Math.abs(area) > 0.001;

          if (valid) {
            this._embeddedRectanglesHelper.setLineMaterial(C.Materials.Lines.Valid);
          } else {
            this._embeddedRectanglesHelper.setLineMaterial(C.Materials.Lines.Invalid);
          }

          setHelper(this._rawHelper, this._rawLocation, this._rawSize, valid);
          setHelper(this._helper, this._location, this._size, valid);
        
          break;

        default:

          setHelper(this._rawHelper, this._rawLocation, this._rawSize, this._drawingValid);
          setHelper(this._helper, this._location, this._size, this._drawingValid);
       
          break;

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

    private _getCellFloorBox2(position: Vector3): THREE.Box2 {
      let box = new THREE.Box2(
        new Vector2(Math.floor(position.x), Math.floor(position.z)),
        new Vector2(Math.ceil(position.x), Math.ceil(position.z))
      );
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

    private _getAreaBox3(areaId) : THREE.Box3 {
      let area = <PRKR.Model.Area>this._editor.getObjectById(areaId).model;
      let min = new Vector3(area.location.x, area.location.y, area.location.z);
      let max = new Vector3(area.location.x + area.size.x, area.location.y + area.size.y, area.location.z + area.size.z) 
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
        Math.min(start.y, end.y),
        Math.min(start.z, end.z)
      );
      let rawMax = new Vector3(
        Math.max(start.x, end.x),
        Math.max(start.y, end.y),
        Math.max(start.z, end.z)
      );

      // Clamp values inside start area's box.
      let floor = this._getAreaBox3(this._start.areaId);
      let min = new Vector3();
      min.copy(rawMin).clamp(floor.min, floor.max);
      let max = new Vector3();
      max.copy(rawMax).clamp(floor.min, floor.max);

      // Apply grid.
      min.divideScalar(AddStaticObjectTool.GridStep).round()
        .multiplyScalar(AddStaticObjectTool.GridStep);
      max.divideScalar(AddStaticObjectTool.GridStep).round()
        .multiplyScalar(AddStaticObjectTool.GridStep);

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

      // It must have a volume.
      let volume = this._size.x * this._size.y * this._size.z;
      if (Math.abs(volume) < 0.001) {
        this._drawingValid = false;
        return this._drawingValid;
      }

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

      // Here, location = min and size = (full) size.
      // For 'StaticObject', location = center and size = half extents

      let area = <Model.Area>this._editor.getObjectById(this._start.areaId).model;

      let center = new Vector3();
      center.copy(this._location)
        .addScaledVector(this._size, 0.5)
        .sub(area.location);

      let halfExtents = new Vector3();
      halfExtents.copy(this._size).multiplyScalar(0.5);      

      return new AddObjectStep({
        $type: 'StaticObject',
        areaId: this._start.areaId,
        location: center.toArray(),
        size: halfExtents.toArray()
      });
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

    private _getVerticalLocation(mouseEvent: JQueryMouseEventObject): AreaLocation {

      let camera = this._editor.getCameraRig().orthographicCamera;
      let n = camera.getWorldDirection();
      n.setY(0).normalize().negate();

      let intersect = this._editor.projectMouseOnPlane(
        new THREE.Vector2(mouseEvent.clientX, mouseEvent.clientY),
        this._end.location,
        n
      );

      if (intersect) {
        return {
          location: new THREE.Vector3(
            this._end.location.x,
            intersect.point.y,
            this._end.location.z
          ),
          areaId: this._end.areaId
        }
      }
      return null;
    }

    /**
     * Builds a message for the status bar from the current state.
     */
    private _buildStatusMessage() {

      switch(this._state) {
        case DrawingState.NotStarted:
          return 'Click and drag inside an area to insert an object';
        case DrawingState.HorizontalDrawing:
          return 'Drag to draw the shape of the object on the floor';
        case DrawingState.Pause:
          return 'Click and drag to define vertical range of the object';
        case DrawingState.VerticalDrawing:
          return 'Drag to draw the vertical shape of the object';
        default:
          return 'TODO';
      }

    }
    
  }
}