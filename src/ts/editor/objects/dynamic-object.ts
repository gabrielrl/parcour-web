namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Mesh = THREE.Mesh;
  import DynamicModel = PRKR.Model.DynamicObject;

  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;

  export class DynamicObject extends EditorObject {

    private _mesh: THREE.Mesh = null;

    constructor(model: DynamicModel, parcour: Parcour) {
      super(model, parcour);
      this.update();
    }

    /** Override. */
    get resizable(): boolean { return true;}

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
      let staticModel = <DynamicModel>this.model;
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

      /** Overrides getProperties to add some infos. */
    public getProperties() {
      let props = [].concat(this.model.getProperties(), [
        {
          name: 'volume',
          display: 'Volume',
          info: 'The object\'s volume',
          type: 'string',
          editor: 'display',
          getValue: o => {
            if (o instanceof DynamicModel) {
              return o.volume.toPrecision(3) + ' m³'
            }
          }
        },
        {
          name: 'mass',
          display: 'Mass',
          info: 'The object\'s mass',
          type: 'string',
          editor: 'display',
          getValue: o => {
            if (o instanceof DynamicModel) {
              return o.mass.toPrecision(3) + ' kg'
            }
          }
        }
      ]);
      return props;
    }


    /** Override */
    protected _computeBoundingBox() {

      // TODO need to take rotation into account
      let staticModel = <DynamicModel>this.model;
      let min = new Vector3();
      min.copy(staticModel.size).multiplyScalar(-1);
      let max = new Vector3();
      max.copy(staticModel.size);
      let box = new THREE.Box3(min, max);
      return box;
    }

    /** Default material from which a new object material is cloned. */
    private static Material = new THREE.MeshPhongMaterial({
      color: 0xffff00
    });

    /**
     * Color of object that are the most dense. The default material has the color of the
     * lightest possible object.
     */
    private static MaxDensityColor = new THREE.Color(0xff0000);

    private _buildMesh() {

      let dynamicModel = <DynamicModel>this.model;
      let area = <Model.Area>this.parcour.getObjectById(dynamicModel.areaId);
      let g = new THREE.CubeGeometry(
        dynamicModel.size.x * 2,
        dynamicModel.size.y * 2,
        dynamicModel.size.z * 2
      ); 

      let material = DynamicObject.Material.clone();
      material.color.lerp(DynamicObject.MaxDensityColor, DynamicModel.densityToLinear(dynamicModel.density))
      let mesh = new THREE.Mesh(g, material);

      return mesh;
    }


  }
}

