namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import EmbeddedRectanglesHelper = Helpers.EmbeddedRectanglesHelper;

  /**
   * Tool that allows the user to add holes to room areas.
   */
  export class AddHolesTool extends Tool {

    private _drawing: boolean = false;

    /** Rectangle on the floor helper. */
    private _embeddedRectanglesHelper: EmbeddedRectanglesHelper = new EmbeddedRectanglesHelper();

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

      this._editor.addToScene(this._embeddedRectanglesHelper);
      this._editor.setPointer('crosshair');
      this._editor.setStatus(this._buildStatusMessage());
    }

    deactivate() {
      this._drawing = false;
      this._editor.removeFromScene(this._embeddedRectanglesHelper);

    }

    notifyMouseMove(event: JQueryMouseEventObject) {

      let areaLocation: AreaLocation = this._editor.projectMouseOnAreas(event);


      if (areaLocation != null && areaLocation.areaId != null) {
        let area = <Model.Area>this._editor.getObjectById(areaLocation.areaId).model;

        if (this._drawing) {

         // TODO Add the location to the list of tiles to set as holes.


        } else {

          // TODO Set helper feedback on whether or not we can "paint" holes here.
          
          this._embeddedRectanglesHelper.visible = true;
          let box = M.getAreaFloorBox2(area);
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

      this._editor.requestRender();
      this._editor.setStatus(this._buildStatusMessage());

    }

    notifyMouseDown(event: JQueryMouseEventObject) {

      // 

    }

    notifyMouseUp(event: JQueryMouseEventObject) {

      // 

    }

    private _buildStatusMessage() {
      return 'TODO ;)';
    }

    

    /** Returns a new array of only the rooms in `objects`. */
    private static _getRooms(objects: Objects.EditorObject[]) {
      return _.filter(objects, o => {
        return o instanceof Objects.RoomObject;
      });
    }

  }
}