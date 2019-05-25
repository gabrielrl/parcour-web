namespace PRKR.Player.Model {

  import Vector3 = THREE.Vector3;
  import Mesh = THREE.Mesh;

  export class RuntimeDynamicObject implements RuntimeObject {

    private _body: Ammo.btRigidBody = null;

    /** Relative center of mass. Set during `_buildPhysicalRepresentation`. Is null if equal to the origin. */
    private _centerOfMass: Vector3 = null;

    private _mesh: THREE.Object3D = null;

    constructor(private _model: PRKR.Model.DynamicObject, private _parcour: RuntimeParcour) {
      if (!_model) throw new Error('Missing argument "model".');
      if (!_parcour) throw new Error('Missing argument "parcour".');
    }
    
    get renderObject(): THREE.Object3D { return this._mesh; }

    get physicBodies(): Ammo.btRigidBody[] { return [ this._body ]; }

    get updateRenderObject(): boolean { return true; }
    
    get model() { return this._model }

    public init(physics: Physics.ParcourPhysics) {
      this._buildPhysicalRepresentation(physics);
      this._buildVisualRepresentation();
    }

    private static Material = new THREE.MeshPhongMaterial({
      color: 0xffff00
    });

    private static DenseColor = new THREE.Color(0xff0000);

    private _buildVisualRepresentation() {
      let model = this._model;

      let geometry = Builders.ShapeGeometryBuilder.buildGeometry(model.shape, model.size);

      let material = RuntimeDynamicObject.Material.clone();
      material.color.lerp(RuntimeDynamicObject.DenseColor, PRKR.Model.DynamicObject.densityToLinear(model.density));

      let mesh: THREE.Object3D = new THREE.Mesh(geometry, material);
      mesh.position.addVectors(
        this._parcour.getAreaById(model.areaId).location,
        model.location
      );
      mesh.quaternion.copy(this._model.rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (this._model.shape === PRKR.Model.Shape.Slope) {
        let proxy = new THREE.Group();
        proxy.position.copy(mesh.position).add(this._centerOfMass);
        proxy.quaternion.copy(mesh.quaternion);        
        proxy.add(mesh);
        mesh.position.copy(this._centerOfMass).negate();
        mesh.quaternion.set(0, 0, 0, 1);
        mesh = proxy;
      }

      this._mesh = mesh;

    }

    private _buildPhysicalRepresentation(physics: Physics.ParcourPhysics) {

      let area = this._parcour.getAreaById(this._model.areaId);

      let position = area.location.clone();
      position.add(this._model.location);

      let size = this._model.size.clone().multiplyScalar(2);

      let body: Ammo.btRigidBody = null;
      switch(this._model.shape) {
        default:
        case PRKR.Model.Shape.Box: {
          body = physics.createBox({
            mass: this._model.mass,
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
            mass: this._model.mass,
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
            mass: this._model.mass,
            radius,
            height: size.y,
            position,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });

          break;
        }

        case PRKR.Model.Shape.Capsule: {

          let s = this._model.size;
          let radius = Math.min(s.x, s.z);

          body = physics.createCapsule({
            mass: this._model.mass,
            radius,
            height: size.y,
            position,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });

          break;
        }

        case PRKR.Model.Shape.Cone: {

          let s = this._model.size;
          let radius = Math.min(s.x, s.z);

          body = physics.createCone({
            mass: this._model.mass,
            radius,
            height: size.y,
            position,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });
          break;
        }

        case PRKR.Model.Shape.Slope: {

          let g = PRKR.Builders.ShapeGeometryBuilder.buildGeometry(
            PRKR.Model.Shape.Slope, this._model.size);

          let avg = g.vertices
            .reduce((p, c) => p.add(c), new Vector3())
            .divideScalar(g.vertices.length);
          let points = g.vertices.map(v => v.clone().sub(avg));
          
          let centerOfMass = avg.clone().applyQuaternion(this._model.rotation).add(position);

          body = physics.createConvexHull({
            mass: this._model.mass,
            points,
            position: centerOfMass,
            rotation: this._model.rotation,
            friction: Constants.StaticObjects.DefaultFriction
          });

          this._centerOfMass = avg;
          break;
        }

      }

      this._body = body;
      
      physics.add(this);
    }    
  }
}
