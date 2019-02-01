namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Quaternion = THREE.Quaternion;
  import Box3 = THREE.Box3;
  import Mesh = THREE.Mesh;
  import DynamicModel = PRKR.Model.DynamicObject;

  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;

  export class DynamicObject extends EditorObject {

    private _geometry: THREE.Geometry = null;
    private _mesh: Mesh = null;

    constructor(model: DynamicModel, parcour: Parcour) {
      super(model, parcour);
      this.update();
    }

    /** Gets true because dynamic objects are movable. */
    get movable(): true { return true; }

    /** Gets true because dynamic objects are rotatable. */
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

    /**
     * Gets the current static object's rotation.
     * @param target Optional target for the object's rotation.
     */
    public getRotation(target?: Quaternion): Quaternion {
      target = target || new Quaternion();
      target.copy((<DynamicModel>this.model).rotation);
      return target;
    }

    /**
     * from https://en.wikipedia.org/wiki/Density#Various_materials
     */
    private static DensityExamples: {value: number; text: string}[] = [
      { value: 1.2, text: 'air' },
      { value: 240, text: 'cork' },
      { value: 700, text: 'wood' },
      { value: 1000, text: 'water' },
      { value: 2400, text: 'concrete' },
      { value: 3500, text: 'diamond' },
      { value: 7870, text: 'iron' },
      { value: 8940, text: 'copper' },
      { value: 10500, text: 'silver' },
      { value: 19320, text: 'gold' }
    ];

    private static Properties: PRKR.Model.Property[] = [
      {
        name: 'densityValue',
        display: 'Density Value',
        info: 'The object\'s density as text',
        type: 'string',
        editor: 'display',
        getValue: o => {
          if (o instanceof DynamicModel) {
            let v = o.density;
            let ex = DynamicObject.DensityExamples
            let diff = Infinity;
            let candidate = null;
            for (let i = 0; i < ex.length; i++) {
              let d = Math.abs(ex[i].value - v);
              if (d < diff) {
                diff = d;
                candidate = ex[i];
              }
            }

            if (candidate) {
              return v.toFixed(3) + ' kg/m³ similar to ' + candidate.text + ' (' + candidate.value + ')';
            } else {
              return v.toFixed(3) + ' kg/m³';
            }
          }
        }
      },
      {
        name: 'volume',
        display: 'Volume',
        info: 'The object\'s volume',
        type: 'string',
        editor: 'display',
        getValue: o => {
          if (o instanceof DynamicModel) {
            return o.volume.toFixed(3) + ' m³'
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
            return o.mass.toFixed(3) + ' kg'
          }
        }
      }
    ];

      /** Overrides getProperties to add some infos. */
    public getProperties() {
      let props = [].concat(this.model.getProperties(), DynamicObject.Properties);
      return props;
    }

    /** Override */
    protected _computeBoundingBox() {

      let staticModel = <DynamicModel>this.model;
      let min = new Vector3();
      min.copy(staticModel.size).multiplyScalar(-1);
      let max = new Vector3();
      max.copy(staticModel.size);
      let box = new Box3(min, max);
      M.rotateBox3(box, staticModel.rotation);
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

    private _buildGeometry() {
      let model = <DynamicModel>this.model;
      return new THREE.CubeGeometry(
        model.size.x * 2,
        model.size.y * 2,
        model.size.z * 2
      );
    }

    private _buildMesh() {

      let model = <DynamicModel>this.model;
      let material = DynamicObject.Material.clone();
      material.color.lerp(DynamicObject.MaxDensityColor, DynamicModel.densityToLinear(model.density))
      let mesh = new Mesh(this.geometry, material);
      mesh.quaternion.copy(model.rotation);
      return mesh;
    }


  }
}

