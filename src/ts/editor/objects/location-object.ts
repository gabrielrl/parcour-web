/// <reference path="../../defs/prkr.bundle.d.ts" />

namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Mesh = THREE.Mesh;

  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;
  import Location = PRKR.Model.Location;
  import LocationKind = PRKR.Model.LocationKind;

  export class LocationObject extends EditorObject {

    /** The mesh used to display the location in the editor. */
    private _locationMesh: THREE.Mesh = null;

    constructor(locationModel: Location, parcour: Parcour) {
      super(locationModel, parcour);
      this.update();
    }

    get location() { return <Location>this.model; }

    get name() {
      return this.model.name || `${ Model.locationKindToString(this.location.kind) } location`;
    }

    /**
     * Gets true because locations can be moved.
     * Override.
     */
    get movable(): true { return true; }

    /**
     * Gets the current object's move constraints.
     * Override if `movable` returns true.
     */
    get moveConstraints(): MoveConstraints {
      return new SteppedMoveConstraints(new THREE.Vector3(1, 0, 1));
    }

    /** Override. */
    get resizable(): boolean { return false; }

    public update() {
      this._updateSceneObject();
      super.invalidateAll();
      super.update();
    }

    protected _updateSceneObject() {
      if (this._locationMesh) {
        this.sceneObject.remove(this._locationMesh);
      }
      this._locationMesh = this._buildMesh();
      this.sceneObject.add(this._locationMesh);
      this.getWorldPosition(this.sceneObject.position);
      return this._locationMesh;
    }

    /** Override */
    protected _buildSelectionHotSpot() {
      return this._locationMesh;
    }

    /**
     * Gets the world position for the current object.
     * @param target Optional target for the world position.
     * @returns the world position for the current object.
     */
    public getWorldPosition(target?: Vector3): Vector3 {
      if (!target) { target = new Vector3(); }
      let locationObject = <Location>this.model;
      let areaId = locationObject.areaId;
      let area = this.parcour.getObjectById(areaId);
      if (!area) {
        throw new Error(`Area with ID ${areaId} could not be found`);
      } else if (!(area instanceof Area)) {
        throw new Error(`Object with ID ${areaId} is not of type "Area"`);
      } else {
        target.addVectors(area.location, locationObject.location);
      }
      return target;
    }

    /** Override */
    protected _computeBoundingBox() {
      let box = new THREE.Box3(
        new THREE.Vector3(-.5, 0, -.5),
        new THREE.Vector3(.5, 2.54, .5)
      );
      return box;
    }

    private static StartMaterial = new THREE.MeshBasicMaterial({
      color: 0x46ff26,
      transparent: true,
      opacity: .75
    });

    private static FinishMaterial = new THREE.MeshBasicMaterial({
      color: 0xff1111,
      transparent: true,
      opacity: .75
    });

    private _buildMesh() {
      let location = <Location>this.model;
      let w = .85;
      let h = 2.54;
      let g = new THREE.CubeGeometry(w, h, w);

      let material = location.kind === LocationKind.Start
        ? LocationObject.StartMaterial
        : LocationObject.FinishMaterial;

      let mesh = new THREE.Mesh(g, material);
      mesh.position.set(0, h / 2, 0);
      return mesh;
    }
  }
}