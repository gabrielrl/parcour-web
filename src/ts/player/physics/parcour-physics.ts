/// <reference path="../../defs/ammo.d.ts" />

namespace PRKR.Player.Physics {
  
  export class ParcourPhysics {
    constructor() {}

    /** Ammo.js stuff */
    private _collisionConfiguration: Ammo.btDefaultCollisionConfiguration;
    private _dispatcher: Ammo.btCollisionDispatcher;
    private _overlappingPairCache: Ammo.btDbvtBroadphase;
    private _solver: Ammo.btSequentialImpulseConstraintSolver;
    private _dynamicsWorld: Ammo.btDiscreteDynamicsWorld;

    private _bodies: Ammo.btRigidBody[] = [];

    private _objects: Model.RuntimeObject[] = [];

    public init() {

      // Using Ammo.js...

      this._collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      this._dispatcher = new Ammo.btCollisionDispatcher(this._collisionConfiguration);
      this._overlappingPairCache    = new Ammo.btDbvtBroadphase();
      this._solver = new Ammo.btSequentialImpulseConstraintSolver();
      this._dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration);

      this._dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    }

    public reset() {
      // Delete all bodies.
      this._bodies.forEach(b => this._dynamicsWorld.removeRigidBody(b));
      this._bodies = [];

      // TODO Ammo.destroy here?

      this._objects = [];
    }

    public destroy() {

      // TODO Add missing stufff      
      Ammo.destroy(this._dynamicsWorld);
      Ammo.destroy(this._solver);
      Ammo.destroy(this._overlappingPairCache);
      Ammo.destroy(this._dispatcher);
      Ammo.destroy(this._collisionConfiguration);
    }

    public createBox(data: BoxDescription): Ammo.btRigidBody {

      if (!data) throw new Error('"data" is required.');
      if (!data.size) throw new Error('"data.size" is required.')

      let halfExtents = new Ammo.btVector3(data.size.x / 2, data.size.y / 2, data.size.z / 2);
      let shape = new Ammo.btBoxShape(halfExtents);

      return this._createRigidBody(shape, data);
    }

    public createSphere(data: SphereDescription): Ammo.btRigidBody {
      if (!data) throw new Error('"data" is required.');

      let shape = new Ammo.btSphereShape(data.radius);

      return this._createRigidBody(shape, data);
    }

    public createCapsule(data: CapsuleDescription): Ammo.btRigidBody {
      if (!data) throw new Error('"data" is required.');

      let shape = new Ammo.btCapsuleShape(data.radius, data.height);

      return this._createRigidBody(shape, data);
    }

    public add(obj: Model.RuntimeObject) {
      if (obj && obj.physicBodies) {
        obj.physicBodies.forEach(b => this._addRigidBody(b));
      }
      this._objects.push(obj);
    }

    private static __transform = new Ammo.btTransform();
    private static __origin = new Ammo.btVector3();
    public setBodyPosition(body: Ammo.btRigidBody, position: THREE.Vector3) {
      let t = ParcourPhysics.__transform;
      let o = ParcourPhysics.__origin;
      let ms = body.getMotionState();
      // ms.getWorldTransform(t);
      // o.setValue(position.x, position.y, position.z);
      // t.setOrigin(o);
      // ms.setWorldTransform(t);
      t.setIdentity();
      o.setValue(position.x, position.y, position.z);
      t.setOrigin(o);
      body.setWorldTransform(t);
      ms.setWorldTransform(t);
    }

    private _addRigidBody(body: Ammo.btRigidBody) {
      this._bodies.push(body);
      this._dynamicsWorld.addRigidBody(body);
    }

    public simulate(delta: number) {
      this._dynamicsWorld.stepSimulation(delta, 10);
      var t = ParcourPhysics.__transform;
      this._objects.forEach(o =>  {
        if (o.updateRenderObject && o.physicBodies.length === 1 && o.renderObject) {
          let body = o.physicBodies[0];
          body.getMotionState().getWorldTransform(t);
          let origin = t.getOrigin();
          let rotation = t.getRotation();
          // console.log(
          //   `world pos = [${origin.x().toFixed(2)}, ${origin.y().toFixed(2)}, ${origin.z().toFixed(2)}]`);
          o.renderObject.position.set(origin.x(), origin.y(), origin.z());
          o.renderObject.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
      });
    }

    /**
     * Creates a rigid body instance from a collision shape and a
     * body description.
     * @param shape A collision shape.
     * @param data Body description data.
     */
    private _createRigidBody(shape: Ammo.btCollisionShape, data: BodyDescription) {
      let transform = new Ammo.btTransform();
      transform.setIdentity();
      if (data.position) {
        transform.setOrigin(new Ammo.btVector3(data.position.x, data.position.y, data.position.z));
      }

      let mass = data.mass;
      let dynamic = (mass !== 0);
      let localInertia = new Ammo.btVector3(0, 0, 0);

      if (dynamic) {
        shape.calculateLocalInertia(mass, localInertia);
      }

      let motionState = new Ammo.btDefaultMotionState(transform)
      let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
      let body = new Ammo.btRigidBody(rbInfo);

      return body;
    }
  }
}