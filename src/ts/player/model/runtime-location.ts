namespace PRKR.Player.Model {
  export class RuntimeLocation {
    constructor(
      private _model: PRKR.Model.Location,
      private _parcour: RuntimeParcour
    ) { }

    private _renderObject: THREE.Mesh;
    private _material: THREE.MeshBasicMaterial;

    get renderObject(): THREE.Object3D {

      if (!this._renderObject) {
        this._renderObject = this._buildRenderObject();
      }
      return this._renderObject;
    }

    public updateRenderObject(delta: number, ellapsed: number) {

      if (this._material) {
        if (!this._parcour.completed) {
          this._material.opacity =
            .25 + (Math.sin(ellapsed * 0.005) + 1) * 0.25;
        } else {
          this._material.opacity = 0.5;
          this._material.color.setHex(0x00ff00);
        }
      }

    }

    private _buildRenderObject(): THREE.Mesh {
      let w = 1 - PRKR.Model.Constants.WallThickness * 2;
      let area = this._parcour.model.getAreaById(this._model.areaId);
      let h = area.size.y;

      let g = new THREE.BoxBufferGeometry(w, h, w);

      if (!this._material) {
        this._material = this._buildMaterial();
      }

      let worldPosition = new THREE.Vector3();
      worldPosition.addVectors(
        this._model.location,
        area.location
      );

      let mesh = new THREE.Mesh(g, this._material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.position.set(worldPosition.x, h / 2, worldPosition.z);
      return mesh;
    }

    private _buildMaterial() {
      return new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        transparent: true,
        opacity: 0.5
      });
    }
  }
}