namespace PRKR.Player.Model {

  import Vector3 = THREE.Vector3;
  import Mesh = THREE.Mesh;

  export class RuntimeStaticObject implements RuntimeObject {

    private _mesh: Mesh = null;
    private _body: Ammo.btRigidBody = null;

    constructor(private _model: PRKR.Model.StaticObject, private _parcour: RuntimeParcour) {
      if (!_model) throw new Error('Missing argument "model".');
      if (!_parcour) throw new Error('Missing argument "parcour".');
    }
    
    get renderObject(): THREE.Object3D { return this._mesh; }

    get physicBodies(): Ammo.btRigidBody[] { return [ this._body ]; }

    get updateRenderObject(): boolean { return false; }
    
    get model() { return this._model }

    public init(physics: Physics.ParcourPhysics) {
      this._buildVisualRepresentation();
      this._buildPhysicalRepresentation(physics);
    }

    private static Material = new THREE.MeshPhongMaterial({
      color: 0xcccccc
    });

    private _buildVisualRepresentation() {
      let model = this._model;
      
      let geometry = Builders.ShapeGeometryBuilder.buildGeometry(model.shape, model.size);

      let mesh = new THREE.Mesh(geometry, RuntimeStaticObject.Material);
      mesh.position.addVectors(
        this._parcour.getAreaById(model.areaId).location,
        model.location
      );
      mesh.quaternion.copy(this._model.rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this._mesh = mesh;

    }

    private _buildPhysicalRepresentation(physics: Physics.ParcourPhysics) {

      let area = this._parcour.getAreaById(this._model.areaId);

      let position = area.location.clone().add(this._model.location);

      let size = this._model.size.clone().multiplyScalar(2);

      let body: Ammo.btRigidBody = null;
      switch(this._model.shape) {
        default:
        case PRKR.Model.Shape.Box: {
          body = physics.createBox({
            mass: 0,
            size,
            position,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });

          break;
        }

        case PRKR.Model.Shape.Sphere: {
          let s = this._model.size;
          let radius = Math.min(s.x, s.y, s.z);

          body = physics.createSphere({
            mass: 0,
            radius,
            position,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });

          break;
        }

        case PRKR.Model.Shape.Cylinder: {
          let s = this._model.size;
          let radius = Math.min(s.x, s.z);

          body = physics.createCylinder({
            mass: 0,
            radius,
            height: size.y,
            position,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });
        }
      }

      

      this._body = body;

      physics.add(this);
    }    
  }
}