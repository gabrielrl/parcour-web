namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Quaternion = THREE.Quaternion;
  import Box3 = THREE.Box3;
  import Mesh = THREE.Mesh;
  import StaticModel = PRKR.Model.StaticObject;

  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;

  export class StaticObject extends EditorObject {

    private _geometry: THREE.Geometry = null;
    private _mesh: Mesh = null;

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

    get geometry(): THREE.Geometry {
      if (!this._geometry) {
        this._geometry = this._buildGeometry();
      }
      return this._geometry;
    }

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

    /**
     * Gets the current static object's rotation.
     * @param target Optional target for the object's rotation.
     */
    public getRotation(target?: Quaternion): Quaternion {
      target = target || new Quaternion();
      target.copy((<StaticModel>this.model).rotation);
      return target;
    }

    /** Override */
    protected _computeBoundingBox(): Box3 {

      let staticModel = <StaticModel>this.model;
      let min = new Vector3();
      min.copy(staticModel.size).multiplyScalar(-1);
      let max = new Vector3();
      max.copy(staticModel.size);
      let box = new Box3(min, max);
      
      M.rotateBox3(box, staticModel.rotation);
      return box;
    }

    private static Material = new THREE.MeshPhongMaterial({
      color: 0xcccccc
    });

    private _buildGeometry() {
      let model = <StaticModel>this.model;

      switch(model.shape) {
        case Model.Shape.Box:
        default: {
          return new THREE.CubeGeometry(
            model.size.x * 2,
            model.size.y * 2,
            model.size.z * 2
          );
        }
        
        case Model.Shape.Sphere: {
          let radius = Math.min(
            model.size.x,
            model.size.y,
            model.size.z,
          )
          return new THREE.SphereGeometry(radius, 24, 18);
        }
      }

    }

    private _buildMesh() {

      let mesh = new Mesh(this.geometry, StaticObject.Material);
      let model = <StaticModel>this.model;
      mesh.quaternion.copy(model.rotation);
      return mesh;
    }
  }

}

