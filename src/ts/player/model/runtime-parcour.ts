namespace PRKR.Player.Model {

  import Vector3 = THREE.Vector3;

  /**
   * A run-time version of a parcour.
   */
  export class RuntimeParcour {

    private _parcour: PRKR.Model.Parcour;

    /** Indicates if the current object has been initialized. */
    private _initialized = false;

    /** Areas composing the current parcour. */
    private _areas: RuntimeArea[] = null;

    /** Areas composing the current parcour arranged by ID. */
    private _areaMap: { [id: string]: RuntimeArea } = null;

    private _doorways: RuntimeDoorway[] = null;

    private _completed = false;

    /** The character's start location in the current parcour. */
    private _startLocation = new THREE.Vector3();

    /** The character's destination in the current parcour. */
    private _endLocation = new THREE.Vector3();

    private _updateFunctions: UpdateFunction[] = [];

    constructor(model: PRKR.Model.Parcour) {
      if (!model) throw new Error('Missing argument "model".');
      this._parcour = model;
    }

    /** Gets the core model on which the current object is based. */
    get model() { return this._parcour; }

    get areas() { return this._areas; }
    get doorways() { return this._doorways; }

    get scenes(): THREE.Scene[] {
      return this._areas.map(a => a.scene);
    }

    /** Gets the parcour's start location. */
    get startLocation() { return this._startLocation; }

    /** Gets the parcour's end (destination) location. */
    get endLocation() { return this._endLocation; }

    /** Gets a boolean indicating if the current parcour is completed. */
    get completed() { return this._completed; }

    /** Builds everything. */
    public init(
      scene: THREE.Scene,
      physics: Physics.ParcourPhysics
    ) {

      // Process areas.
      this._areas = [];
      this._areaMap = {};
      this._parcour.getAreas().forEach(area => {
        if (area instanceof PRKR.Model.RoomArea) {
          let rtArea = new Model.RuntimeRoomArea(area, this);
          rtArea.init(physics);
          this._areas.push(rtArea);
          this._areaMap[area.id] = rtArea;
        } else {
          console.warn(`Unhandled area type. ${area.id}`, area);
        }
      });

      // Process static objects
      let staticObjects = <PRKR.Model.StaticObject[]>_.filter(
        this._parcour.objects,
        o => o instanceof PRKR.Model.StaticObject
      );
      staticObjects.forEach(staticObject => {
        let rt = new Model.RuntimeStaticObject(staticObject, this);
        rt.init(physics);

        this._areaMap[rt.model.areaId].scene.add(rt.renderObject);
      });

      // Process doorways.
      let doorways = <PRKR.Model.Doorway[]>_.filter(
        this._parcour.objects,
        o => o instanceof PRKR.Model.Doorway
      );
      this._doorways = [];
      doorways.forEach(doorway => {

        let rtDoorway = new Model.RuntimeDoorway(doorway, this);
        rtDoorway.init();

        // TODO Only consider doorways that have a valid destination.
        // if (rtDoorway.areas.length >= 2) {
          // TODO Which scene? where?
          scene.add(rtDoorway.renderObject);
          this._doorways.push(rtDoorway);
        // }

      });

      // Process locations.

      // Look for the start location.
      let start = new THREE.Vector3();
      let startLocation = <PRKR.Model.Location> _.find(
        this._parcour.objects,
        o => {
          return o instanceof PRKR.Model.Location && o.kind === PRKR.Model.LocationKind.Start
        });
      
      if (startLocation) {
        start.copy(startLocation.location).add(this._parcour.getAreaById(startLocation.areaId).location);
      } else {
        // Start from the middle of the first (arbitrary) room.
        let room = this._parcour.getAreas()[0];
        if (room) {
          start.set(
            room.location.x + room.size.x * .5,
            1.25,
            room.location.z + room.size.z * .5
          );
        }
      }

      console.debug('setting start location to', start);
      this._startLocation.copy(start);
      
      // Look for the "end" location (destination).
      let destination = <PRKR.Model.Location>_.find(this._parcour.objects,
        o => o instanceof PRKR.Model.Location && o.kind === PRKR.Model.LocationKind.End);
      if (destination) {
        let destinationArea = this.getAreaById(destination.areaId);
        this._endLocation.addVectors(
          destination.location,
          destinationArea.location
        );

        let destinationRto = 
          new Model.RuntimeLocation(destination, this);

        this._updateFunctions.push(
          (d, e) => destinationRto.updateRenderObject(d, e));
        
        destinationArea.scene.add(destinationRto.renderObject);

      } else {
        this._endLocation = null;
      }

      this._initialized = true;

      return this;
    }

    public update(delta: number, ellapsed: number) {
      this._updateFunctions.forEach(u => u(delta, ellapsed));
    }

    public getAreaById(id: string): RuntimeArea {
      return this._areaMap[id];
    }

    /**
     * Gets the run-time area at the specified location.
     * @param location 
     */
    public getAreaAtLocation(location: THREE.Vector3): RuntimeArea {
      let area = this._parcour.getAreaAtLocation(location);
      if (area) {
        return this._areaMap[area.id];
      }
      return null;
    }

    /** Called by the player once the parcour is completed. */
    public setCompleted() {
      this._completed = true;
    }


    
  }
}