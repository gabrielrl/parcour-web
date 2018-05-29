namespace PRKR.Player.Model {

  import Vector3 = THREE.Vector3;
  import Mesh = THREE.Mesh;

  export class RuntimeDynamicObject implements RuntimeObject {

    private _mesh: Mesh = null;
    private _body: Ammo.btRigidBody = null;

    constructor(private _model: PRKR.Model.DynamicObject, private _parcour: RuntimeParcour) {
      if (!_model) throw new Error('Missing argument "model".');
      if (!_parcour) throw new Error('Missing argument "parcour".');
    }
    
    get renderObject(): THREE.Object3D { return this._mesh; }

    get physicBodies(): Ammo.btRigidBody[] { return [ this._body ]; }

    get updateRenderObject(): boolean { return true; }
    
    get model() { return this._model }

    public init(physics: Physics.ParcourPhysics) {
      this._buildVisualRepresentation();
      this._buildPhysicalRepresentation(physics);
    }

    private static Material = new THREE.MeshPhongMaterial({
      color: 0xffff00
    });

    private _buildVisualRepresentation() {
      let model = this._model;
      let geometry = new THREE.BoxGeometry(model.size.x * 2, model.size.y * 2, model.size.z * 2);
      let mesh = new THREE.Mesh(geometry, RuntimeDynamicObject.Material);
      mesh.position.addVectors(
        this._parcour.getAreaById(model.areaId).location,
        model.location
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this._mesh = mesh;

    }

    private _buildPhysicalRepresentation(physics: Physics.ParcourPhysics) {

      let area = this._parcour.getAreaById(this._model.areaId);

      let position = area.location.clone();
      position.add(this._model.location);

      let size = this._model.size.clone();
      size.multiplyScalar(2);

      let box = physics.createBox({
        mass: 1,
        size,
        position
      });

      this._body = box;

      physics.add(this);
    }    
  }
}