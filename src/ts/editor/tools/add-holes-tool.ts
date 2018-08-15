namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import EmbeddedRectanglesHelper = Helpers.EmbeddedRectanglesHelper;
  import BoundingBoxHelper = Helpers.BoundingBoxHelper;
  import RectangleHelper = Helpers.RectangleHelper;
  import ResultLevel = Validators.ResultLevel;
  /**
   * Tool that allows the user to add holes to room areas.
   */
  export class AddHolesTool extends Tool {

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
        lineMaterial: Constants.Materials.Lines.Valid
      });

    /** The adjusted helper bounding box displayed when the user draws. */
    private _helper: BoundingBoxHelper =
      new BoundingBoxHelper(M.Box3.Unit, {
        useFaces: true,
        useLines: false,
        faceMaterial: Constants.Materials.Faces.Valid
      });

    constructor(private _editor: ParcourEditor) {
      super();
    }

    get name() { return 'add-holes'; }

    get displayName() { return 'Add holes'; }

    /** Gets if the tool is currently enabled. True if there are room areas in the current parcour. */
    get enabled() {
      return this._editor.getAreas().length > 0;
    }

    activate() {
      this._drawing = false;

      this._editor.addToScene(this._rawHelper);
      this._editor.addToScene(this._helper);
      this._editor.addToScene(this._embeddedRectanglesHelper);
      this._editor.setPointer('crosshair');
      this._editor.setStatus(this._buildStatusMessage());
    }

    deactivate() {
      this._drawing = false;

      this._editor.removeFromScene(this._embeddedRectanglesHelper);
      this._editor.removeFromScene(this._helper);
      this._editor.removeFromScene(this._rawHelper);
    }

    notifyMouseMove(event: JQueryMouseEventObject) {

      let areaLocation: AreaLocation = this._editor.projectMouseOnAreas(event);


      if (areaLocation != null && areaLocation.area != null) {

        if (this._drawing) {

         this._end = areaLocation;

        } else {

          // TODO Set helper feedback on whether or not we can "paint" holes here.
          
          this._embeddedRectanglesHelper.visible = true;
          let box = M.getAreaFloorBox2(areaLocation.area);
          this._embeddedRectanglesHelper.setRect1(box);
          
          let min = new Vector2(areaLocation.worldLocation.x, areaLocation.worldLocation.z);
          let max = new Vector2(areaLocation.worldLocation.x, areaLocation.worldLocation.z);
          box.set(min, max);
          this._embeddedRectanglesHelper.setRect2(box);
         // this._embedd
       
        }

      } else {

        this._embeddedRectanglesHelper.visible = false;

      }


      if (this._drawing) {
        this._end = areaLocation;
        this._computeLocationAndSize();
        this._validateDrawing();
      }
      
      this._updateHelpers(areaLocation);
      this._editor.requestRender();
      this._editor.setStatus(this._buildStatusMessage());

    }

    notifyMouseDown(event: JQueryMouseEventObject) {

      if (event.which === 3) { // right button.
      
        // Cancel
        this._drawing = false;
        event.preventDefault();

      } else if (event.which === 1) { // left button 
      
        let areaLocation = this._editor.projectMouseOnAreas(event);
        if (areaLocation && areaLocation.area) {
          this._start = areaLocation;
          this._end = areaLocation;
          this._drawing = true;

          this._computeLocationAndSize();
          this._validateDrawing();
          this._updateHelpers(areaLocation);
          this._editor.requestRender();
        }

      }
      this._editor.setStatus(this._buildStatusMessage());
    }

    notifyMouseUp(event: JQueryMouseEventObject) {

      if (event.which === 1) { // left button

        this._computeLocationAndSize();

        if (this._drawing) {

          if (this._validateDrawing()) {
            let step = this._buildEditStep();
            let result = this._editor.addEditStep(step);
            if (result.dirtyIds.length > 0) {
              this._editor.selectByIds(result.dirtyIds);
            }
          }
          this._drawing = false;

        }

        this._updateHelpers(null);
        this._editor.requestRender();
        this._editor.setStatus(this._buildStatusMessage());  
      }

    }

    private _buildStatusMessage() {
      if (!this._drawing) {
        return 'Click and drag inside an area to cut a hole out of the floor';
      } else {
        return 'Drag to draw the rectangle to cut out';
      }
    }

    /** Returns a new array of only the rooms in `objects`. */
    private static _getRooms(objects: Objects.EditorObject[]) {
      return _.filter(objects, o => {
        return o instanceof Objects.RoomObject;
      });
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
          helper.setLineMaterial(Constants.Materials.Lines.Valid);
          helper.setFaceMaterial(Constants.Materials.Faces.Valid)
        } else {
          helper.setLineMaterial(Constants.Materials.Lines.Invalid);
          helper.setFaceMaterial(Constants.Materials.Faces.Invalid);
        }

        helper.visible = true;
      }

      if (!this._drawing) {

        // Hide some helpers.
        this._rawHelper.visible = false;
        this._helper.visible = false;

        // Show some helpers.
        if (!position) {
          this._embeddedRectanglesHelper.visible = false;
        } else {
          this._embeddedRectanglesHelper.visible = true;          
          if (position.area) {
            let box = M.getAreaFloorBox2(position.area);
            this._embeddedRectanglesHelper.setRect1(box);

            let min = new Vector2(position.worldLocation.x, position.worldLocation.z);
            let max = new Vector2(position.worldLocation.x, position.worldLocation.z);
            box.set(min, max);
            this._embeddedRectanglesHelper.setRect2(box);
            this._embeddedRectanglesHelper.setLineMaterial(Constants.Materials.Lines.Valid);
          } else {
            let box = M.getTileFloorBox2(position.worldLocation);
            this._embeddedRectanglesHelper.setRect1(box);
            let min = new Vector2(position.worldLocation.x, position.worldLocation.z);
            let max = new Vector2(position.worldLocation.x, position.worldLocation.z);
            box.set(min, max);
            this._embeddedRectanglesHelper.setRect2(box);
            this._embeddedRectanglesHelper.setLineMaterial(Constants.Materials.Lines.Invalid); // ...
          }
        }

      } else { // drawing
        
        // let startArea = <Model.Area>this._editor.getObjectById(this._start.areaId).model;
        // let box = M.getAreaFloorBox2(startArea);
        // this._embeddedRectanglesHelper.setRect1(box);

        // box.setFromPoints([
        //   new Vector2(this._location.x, this._location.z),
        //   new Vector2(this._location.x + this._size.x, this._location.z + this._size.z)
        // ]);
        // this._embeddedRectanglesHelper.setRect2(box);
        // this._embeddedRectanglesHelper.visible = true;

        // // At this stage, validity depends on having a non-empty area.
        // let area = this._size.x * this._size.z;
        // let valid = Math.abs(startArea) > 0.001;

        // if (valid) {
        //   this._embeddedRectanglesHelper.setLineMaterial(Constants.Materials.Lines.Valid);
        // } else {
        //   this._embeddedRectanglesHelper.setLineMaterial(Constants.Materials.Lines.Invalid);
        // }

        // setHelper(this._rawHelper, this._rawLocation, this._rawSize, valid);
        // setHelper(this._helper, this._location, this._size, valid);

        setHelper(this._rawHelper, this._rawLocation, this._rawSize, this._drawingValid);
        setHelper(this._helper, this._location, this._size, this._drawingValid);
      }

    }

    /**
     * Computes `_location`, `_size`, `_rawLocation` and `_rawSize` from
     * `_start` and `_end` values.
     */
    private _computeLocationAndSize() {
      let start = this._start.worldLocation;
      let end = this._end.worldLocation;
      let rawMin = new Vector3(
        Math.min(start.x, end.x),
        0,
        Math.min(start.z, end.z)
      );
      let rawMax = new Vector3(
        Math.max(start.x, end.x),
        0,
        Math.max(start.z, end.z)
      );

      // Clamp values inside start area's box.
      let area = this._start.area;
      let areaBox = M.getAreaBox3(area);
      let min = new Vector3();
      min.copy(rawMin).clamp(areaBox.min, areaBox.max);
      let max = new Vector3();
      max.copy(rawMax).clamp(areaBox.min, areaBox.max);

      // Apply grid.
      min.floor();
      max.ceil()

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
    private _buildEditStep(): EditSteps.EditStep /* AddHolesStep */ {

      // Here, location = min and size = (full) size.
      // For 'DynamicObject', location = center and size = half extents

      let area = this._start.area;

      let center = new Vector3();
      center.copy(this._location)
        .addScaledVector(this._size, 0.5)
        .sub(area.location);

      let halfExtents = new Vector3();
      halfExtents.copy(this._size).multiplyScalar(0.5);      

      return null; // TODO
      // return new AddObjectStep({
      //   $type: 'DynamicObject',
      //   areaId: this._start.areaId,
      //   location: center.toArray(),
      //   size: halfExtents.toArray()
      // });
    }



  }
}