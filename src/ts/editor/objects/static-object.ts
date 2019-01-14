namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Mesh = THREE.Mesh;
  import StaticModel = PRKR.Model.StaticObject;

  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;

  export class StaticObject extends EditorObject {

    private _mesh: THREE.Mesh = null;

    constructor(model: StaticModel, parcour: Parcour) {
      super(model, parcour);
      this.update();
    }

    /** Gets true because static objects are movables. */
    get movable(): true { return true; }

    /** Gets true because static objects are rotatable. */
    get rotatable(): true { return true; }

    /** Override. */
    get resizable(): boolean { return true; }

    public update() {
      this._updateSceneObject();
      super.invalidateAll();
      super.update();
    }

    protected _updateSceneObject() {
      if (this._mesh) {
        this.sceneObject.remove(this._mesh);
      }
      this._mesh = this._buildMesh();
      this.sceneObject.add(this._mesh);
      this.getWorldPosition(this.sceneObject.position);
      return this._mesh;
    }

    /** Override */
    protected _buildSelectionHotSpot() {
      return this._mesh;
    }

    /**
     * Gets the world position for the current object.
     * @param target Optional target for the world position.
     * @returns the world position for the current object.
     */
    public getWorldPosition(target?: Vector3): Vector3 {
      if (!target) { target = new Vector3(); }
      let staticModel = <StaticModel>this.model;
      let areaId = staticModel.areaId;
      let area = this.parcour.getObjectById(areaId);
      if (!area) {
        throw new Error(`Area with ID ${ areaId } could not be found`);
      } else if (!(area instanceof Area)) {
        throw new Error(`Object with ID ${ areaId } is not of type "Area"`);
      } else {
        target.addVectors(area.location, staticModel.location);
      }
      return target;
    }

    /** Override */
    protected _computeBoundingBox() {

      // TODO need to take rotation into account
      let staticModel = <StaticModel>this.model;
      let min = new Vector3();
      min.copy(staticModel.size).multiplyScalar(-1);
      let max = new Vector3();
      max.copy(staticModel.size);
      let box = new THREE.Box3(min, max);
      return box;
    }

    private static Material = new THREE.MeshPhongMaterial({
      color: 0xcccccc
    });

    private _buildMesh() {

      let staticModel = <StaticModel>this.model;
      let area = <Model.Area>this.parcour.getObjectById(staticModel.areaId);
      let g = new THREE.CubeGeometry(
        staticModel.size.x * 2,
        staticModel.size.y * 2,
        staticModel.size.z * 2
      ); 
      let mesh = new THREE.Mesh(g, StaticObject.Material);
      return mesh;
    }
  }

}

