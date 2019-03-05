
// Custom Ammo declaration file

declare namespace Ammo {

  // Math

  class btVector3 {

    constructor(x?: number, y?: number, z?: number);

    ptr: number;

    x(): number;
    y(): number;
    z(): number;

    setX(value: number): void;
    setY(value: number): void;
    setZ(value: number): void;
    setValue(x: number, y: number, z: number): void;
    normalize(): void;
    dot(v: btVector3): number;

    /**
     * Multiplies v with this vector.
     * @param v 
     * @returns itself.
     */
    op_mul(v: btVector3): btVector3;

    /**
     * Adds v with this vector.
     * @param v 
     * @returns itself.
     */
    op_add(v: btVector3): btVector3;

    /**
     * Subtract v from this vector.
     * @param v 
     * @returns itself.
     */
    op_sub(v: btVector3): btVector3;

    length(): number;
    

  }

  interface btQuadWord {
    x(): number;
    y(): number;
    z(): number;
    w(): number;
    setX(x: number): void;
    setY(y: number): void;
    setZ(z: number): void;
    setW(w: number): void;
  }

  class btQuaternion implements btQuadWord {
    // void btQuaternion(float x, float y, float z, float w);
    constructor(x, y, z, w); // ??
    setValue(x: number, y: number, z: number, w: number): void;
    setEulerZYX(z: number, y: number, x: number): void;
    setRotation(axis: /*[Ref]*/ btVector3, angle: number): void;
    normalize(): void;
    length2(): number;
    length(): number;
    dot(q: /*[Ref]*/ btQuaternion): number;
    normalized(): /*[Value]*/ btQuaternion;
    getAxis(): /*[Value]*/ btVector3;
    inverse(): /*[Value]*/ btQuaternion;
    getAngle(): number;
    getAngleShortestPath(): number;
    angle(q: /*[Ref]*/ btQuaternion): number;
    angleShortestPath(q: /*[Ref]*/ btQuaternion): number;
    op_add(q: /*[Ref]*/ btQuaternion): /*[Operator="+=", Ref]*/ btQuaternion;
    op_sub(q: /*[Ref]*/ btQuaternion): /*[Operator="-=", Ref]*/ btQuaternion;
    op_mul(s: number): /*[Operator="*=", Ref]*/ btQuaternion;

    op_mulq(q: /*[Ref]*/ btQuaternion): /*[Operator="*=", Ref]*/ btQuaternion;
    op_div(s: number): /*[Operator="/=", Ref]*/ btQuaternion;

    x(): number;
    y(): number;
    z(): number;
    w(): number;
    setX(x: number): void;
    setY(y: number): void;
    setZ(z: number): void;
    setW(w: number): void;

  }

  interface btMatrix3x3 {
    setEulerZYX(ex: number, ey: number, ez: number): void;
    getRotation(q: /*[Ref]*/ btQuaternion): void;
    getRow(y: number): /*[Value]*/ btVector3;
  }

  interface btTransform {
    setIdentity(): void;
    setOrigin(origin: /*[Ref]*/ btVector3): void;
    setRotation(rotation: /*[Ref]*/ btQuaternion): void;
    getOrigin(): /*[Ref]*/ btVector3;
    getRotation(): /*[Value]*/ btQuaternion;
    getBasis(): /*[Ref]*/ btMatrix3x3;
    setFromOpenGLMatrix(m: number[]): void;
  }

  class btTransform implements btTransform {
    constructor(q: /*[Ref]*/ btQuaternion, v: /*[Ref]*/ btVector3);
    constructor();
  }

  interface btMotionState {
    getWorldTransform(worldTrans: /*[Ref]*/ btTransform): void;
    setWorldTransform(worldTrans: /*[Ref]*/ btTransform): void;
  }  

  interface btDefaultMotionState extends btMotionState {
    /*[Value] attribute*/ m_graphicsWorldTrans: btTransform;
  }  
  class btDefaultMotionState {
    constructor(startTrans?: /*[Ref] optional*/ btTransform, centerOfMassOffset?: /*[Ref] optional*/ btTransform);    
  }

  // Collision 

  class btCollisionObject {
    setAnisotropicFriction(anisotropicFriction: btVector3, frictionMode: number): void;
    getCollisionShape(): btCollisionShape;
    setContactProcessingThreshold(contactProcessingThreshold: number): btCollisionShape;
    setActivationState(newState: number): void;
    forceActivationState(newState: number): void;
    activate(forceActivation?: boolean): void;
    isActive(): boolean;
    isKinematicObject(): boolean;
    setRestitution(rest: number): void;
    setFriction(frict: number): void;
    setRollingFriction(frict: number): void;
    getWorldTransform(): btTransform;
    getCollisionFlags(): number;
    setCollisionFlags(flags: number): void;
    setWorldTransform (worldTrans: btTransform): void;
    setCollisionShape (collisionShape: btCollisionShape): void;
    setCcdMotionThreshold (ccdMotionThreshold: number): void;
    setCcdSweptSphereRadius (radius: number): void;
    getUserIndex(): number;
    setUserIndex(index: number): void;
    getUserPointer(): /*VoidPtr*/ any;
    setUserPointer(userPointer: /*VoidPtr*/ any): void;

    ptr: number /* emscripten */
  }

  /*[NoDelete]*/
  interface btCollisionObjectWrapper {
  }  

  /**
   * [Prefix="btCollisionWorld::"]
   * abstract base class, no constructor
   */
  abstract class RayResultCallback {
    hasHit(): boolean;
    /* attribute */ get_m_collisionFilterGroup(): number;
    /* attribute */ get_m_collisionFilterMask(): number;
    /* [Const] attribute */ get_m_collisionObject(): btCollisionObject;
  }
  
  class ClosestRayResultCallback extends RayResultCallback {
    constructor(
      /* [Const, Ref] */ from: btVector3,
      /* [Const, Ref] */ to: btVector3
    );
  
    /* [Value] attribute btVector3 */ get_m_rayFromWorld(): btVector3;
    /* [Value] attribute btVector3 */ get_m_rayToWorld(): btVector3;
    /* [Value] attribute btVector3 */ get_m_hitNormalWorld(): btVector3;
    /* [Value] attribute btVector3 */ get_m_hitPointWorld(): btVector3;
  }

  interface btCollisionShape {
    setLocalScaling(scaling: /*[Const, Ref]*/ btVector3): void;
    calculateLocalInertia(mass: number, inertia: /*[Ref]*/ btVector3): void;
    setMargin(margin: number): void;
    getMargin(): number;
  }

  interface btConvexShape extends btCollisionShape {
  }

  interface btBoxShape extends btCollisionShape {
    setMargin(margin: number): void;
    getMargin(): number;
  }

  class btBoxShape implements btBoxShape {
    constructor(boxHalfExtents: /*[Ref]*/ btVector3)
  }

  interface btCapsuleShape extends btCollisionShape {
    setMargin(margin: number): void;
    getMargin(): number;
  }
  class btCapsuleShape {
    constructor(radius: number, height: number);
  }

  interface btCapsuleShapeX extends btCapsuleShape {
    setMargin(margin: number): void;
    getMargin(): number;
  }
  class btCapsuleShapeX {
    constructor(radius: number, height: number);
  }

  interface btCapsuleShapeZ extends btCapsuleShape {
    setMargin(margin: number): void;
    getMargin(): number;
  }
  class btCapsuleShapeZ {
    constructor(radius: number, height: number);
  }

  interface btSphereShape extends btCollisionShape {
    setMargin(margin: number): void;
    getMargin(): number;
  }
  class btSphereShape {
    constructor(radius: number)
  }

  interface btDefaultCollisionConstructionInfo {
    btDefaultCollisionConstructionInfo(): void;
  }

  // class btDefaultCollisionConfiguration
  // interface btDefaultCollisionConfiguration {
  // }
  class btDefaultCollisionConfiguration {
    constructor(info?: /*[Ref] optional*/ btDefaultCollisionConstructionInfo);
  }

  interface btManifoldPoint {
    getPositionWorldOnA(): /*[Const, Ref]*/ btVector3 ;
    getPositionWorldOnB(): /*[Const, Ref]*/ btVector3 ;
    getAppliedImpulse(): /*[Const]*/ number;
    getDistance(): /*[Const]*/ number;
    m_localPointA: /*[Value] attribute */ btVector3;
    m_localPointB: /*[Value] attribute */ btVector3;
    m_positionWorldOnB: /*[Value] attribute */ btVector3;
    m_positionWorldOnA: /*[Value] attribute */ btVector3;
    m_normalWorldOnB: /*[Value] attribute */ btVector3;
  }  

  interface ConvexResultCallback {
    // abstract base class, no constructor
    hasHit(): boolean;
    /*attribute*/ m_collisionFilterGroup: number;
    /*attribute*/ m_collisionFilterMask: number;
    /*attribute*/ m_closestHitFraction: number;
  } 

  /*[Prefix="btCollisionWorld::"]*/
  interface ContactResultCallback {
    addSingleResult(cp: /*[Ref]*/ btManifoldPoint, colObj0Wrap: /*[Const]*/ btCollisionObjectWrapper, partId0: number, index0: number, colObj1Wrap: /*[Const]*/ btCollisionObjectWrapper, partId1: number, index1: number): number;
  }

  interface btPersistentManifold {
    // btPersistentManifold();
    getBody0(): btCollisionObject;
    getBody1(): btCollisionObject;
    getNumContacts(): number;
    getContactPoint(index: number): btManifoldPoint;
  }

  interface btDispatcher {
    getNumManifolds(): number;
    getManifoldByIndexInternal(index: number): btPersistentManifold;
  }

  interface btCollisionDispatcher extends btDispatcher {
  }
  class btCollisionDispatcher {
    constructor(
      conf: btDefaultCollisionConfiguration
    );
  }

  interface btOverlappingPairCallback {
  }

  interface btOverlappingPairCache {
    setInternalGhostPairCallback(ghostPairCallback: btOverlappingPairCallback): void;
  }

  interface btAxisSweep3 {
    btAxisSweep3(worldAabbMin: /*[Ref]*/ btVector3, worldAabbMax: /*[Ref]*/ btVector3, maxHandles?: number, pairCache?: btOverlappingPairCache, disableRaycastAccelerator?: boolean): void;
  }

  interface btBroadphaseInterface {
  }

  interface btDbvtBroadphase {
  } 
  class btDbvtBroadphase implements btDbvtBroadphase { }

  interface btSequentialImpulseConstraintSolver {
  }
  /** Constructor */
  function btSequentialImpulseConstraintSolver(): void /* btSequentialImpulseConstraintSolver */

  interface btBroadphaseInterface {
  }

  interface btCollisionConfiguration {
  }

  interface btConstraintSolver {
  }  

  interface btDispatcherInfo {
    /*attribute*/ m_timeStep: number;
    /*attribute*/ m_stepCount: number;
    /*attribute*/ m_dispatchFunc: number;
    /*attribute*/ m_timeOfImpact: number;
    /*attribute*/ m_useContinuous: boolean;
    /*attribute*/ m_enableSatConvex: boolean;
    /*attribute*/ m_enableSPU: boolean;
    /*attribute*/ m_useEpa: boolean;
    /*attribute*/ m_allowedCcdPenetration: number;
    /*attribute*/ m_useConvexConservativeDistanceUtil: boolean;
    /*attribute*/ m_convexConservativeDistanceThreshold: number;
  }

  interface btCollisionWorld {
    getDispatcher(): btDispatcher;
    rayTest(rayFromWorld: /*[Const, Ref]*/ btVector3, rayToWorld: /*[Const, Ref]*/ btVector3, resultCallback: /*[Ref]*/ RayResultCallback): void;
    getPairCache(): btOverlappingPairCache;
    getDispatchInfo(): /*[Ref]*/ btDispatcherInfo;
    addCollisionObject(collisionObject: btCollisionObject, collisionFilterGroup?: number, collisionFilterMask?: number): void;
    getBroadphase(): /*[Const]*/ btBroadphaseInterface;
    convexSweepTest(castShape: /*[Const]*/ btConvexShape, from: /*[Const, Ref]*/ btTransform, to: /*[Const, Ref]*/ btTransform, resultCallback: /*[Ref]*/ ConvexResultCallback, allowedCcdPenetration: number): void;
    contactPairTest(colObjA: /*[Const]*/ btCollisionObject, colObjB: /*[Const]*/ btCollisionObject, resultCallback: /*[Ref]*/ ContactResultCallback): void;
    contactTest(colObj: /*[Const]*/ btCollisionObject, resultCallback: /*[Ref]*/ ContactResultCallback): void;
  }  

  interface btContactSolverInfo {
    /*attribute*/ m_splitImpulse: boolean;
    /*attribute*/ m_splitImpulsePenetrationThreshold: number;
    /*attribute*/ m_numIterations: number;
  }

  // Dynamics

  /*[Prefix="btRigidBody::"]*/
  interface btRigidBodyConstructionInfo {
    /*attribute*/ get_m_linearDamping(): number;
    /*attribute*/ set_m_linearDamping(v: number);
    /*attribute*/ get_m_angularDamping(): number;
    /*attribute*/ set_m_angularDamping(v: number);
    /*attribute*/ get_m_friction(): number;
    /*attribute*/ set_m_friction(v: number);
    /*attribute*/ get_m_rollingFriction(): number;
    /*attribute*/ set_m_rollingFriction(v: number);
    /*attribute*/ get_m_restitution(): number;
    /*attribute*/ set_m_restitution(v: number);
    /*attribute*/ get_m_linearSleepingThreshold(): number;
    /*attribute*/ set_m_linearSleepingThreshold(v: number);
    /*attribute*/ get_m_angularSleepingThreshold(): number;
    /*attribute*/ set_m_angularSleepingThreshold(v: number);
    /*attribute*/ get_m_additionalDamping(): boolean;
    /*attribute*/ set_m_additionalDamping(v: boolean);
    /*attribute*/ get_m_additionalDampingFactor(): number;
    /*attribute*/ set_m_additionalDampingFactor(v: number);
    /*attribute*/ get_m_additionalLinearDampingThresholdSqr(): number;
    /*attribute*/ set_m_additionalLinearDampingThresholdSqr(v: number);
    /*attribute*/ get_m_additionalAngularDampingThresholdSqr(): number;
    /*attribute*/ set_m_additionalAngularDampingThresholdSqr(v: number);
    /*attribute*/ get_m_additionalAngularDampingFactor(): number;
    /*attribute*/ set_m_additionalAngularDampingFactor(v: number);
  }
  class btRigidBodyConstructionInfo {
    constructor(mass: number, motionState: btMotionState, collisionShape: btCollisionShape, localInertia?: /*[Ref]*/ btVector3);
  }

  class btRigidBody extends btCollisionObject {
    constructor(constructionInfo: /*[Const, Ref]*/ btRigidBodyConstructionInfo);
    getCenterOfMassTransform(): /*[Const, Ref]*/ btTransform;
    setCenterOfMassTransform(xform: /*[Const, Ref]*/ btTransform): void;
    setSleepingThresholds(linear: number, angular: number): void;
    setDamping(lin_damping: number, ang_damping: number): void;
    setMassProps(mass: number, inertia: /*[Const, Ref]*/ btVector3): void;
    setLinearFactor(linearFactor: /*[Const, Ref]*/ btVector3): void;
    applyTorque(torque: /*[Const, Ref]*/ btVector3): void;
    applyLocalTorque(torque: /*[Const, Ref]*/ btVector3): void;
    applyForce(force: /*[Const, Ref]*/ btVector3, rel_pos: /*[Const, Ref]*/ btVector3): void;
    applyCentralForce(force: /*[Const, Ref]*/ btVector3): void;
    applyCentralLocalForce(force: /*[Const, Ref]*/ btVector3): void;
    applyTorqueImpulse(torque: /*[Const, Ref]*/ btVector3): void;
    applyImpulse(impulse: /*[Const, Ref]*/ btVector3, rel_pos: /*[Const, Ref]*/ btVector3): void;
    applyCentralImpulse(impulse: /*[Const, Ref]*/ btVector3): void;
    updateInertiaTensor(): void;
    getLinearVelocity(): /*[Const, Ref]*/ btVector3
    getAngularVelocity(): /*[Const, Ref]*/ btVector3
    setLinearVelocity(lin_vel: /*[Const, Ref]*/ btVector3): void;
    setAngularVelocity(ang_vel: /*[Const, Ref]*/ btVector3): void;
    getMotionState(): btMotionState;
    setMotionState(motionState: btMotionState): void;
    setAngularFactor(angularFactor: /*[Const, Ref]*/ btVector3): void;
    upcast(colObj: /*[Const]*/ btCollisionObject): btRigidBody;
  }

  interface btDynamicsWorld extends btCollisionWorld {
    addAction(action: btActionInterface): void;
    removeAction(action: btActionInterface): void;
    getSolverInfo(): /*[Ref]*/ btContactSolverInfo;
  }

  interface btDiscreteDynamicsWorld extends btDynamicsWorld{
      setGravity(gravity: /*[Ref]*/ btVector3): void;
      getGravity(): /*[Value]*/ btVector3;

      addRigidBody(body: btRigidBody): void;
      addRigidBody(body: btRigidBody, group: number, mask: number): void;
      removeRigidBody(bodybtRigidBody: btRigidBody): void;

      addConstraint(constraint: btTypedConstraint, disableCollisionsBetweenLinkedBodies?: boolean): void;
      removeConstraint(constraint: btTypedConstraint): void;

      /**
       * @param timeStep Time elapsed since last simulation (seconds)
       */
      stepSimulation(timeStep: number, maxSubSteps?: number, fixedTimeStep?: number): number;
  }
  /** Constructor */
  class btDiscreteDynamicsWorld implements btDiscreteDynamicsWorld {
    constructor(
      dispatcher: btDispatcher, pairCache: btBroadphaseInterface,
      constraintSolver: btConstraintSolver,
      collisionConfiguration: btCollisionConfiguration
    );
  }

  interface btTypedConstraint {
    enableFeedback(needsFeedback: boolean): void;
    getBreakingImpulseThreshold(): /*[Const]*/ number;
    setBreakingImpulseThreshold(threshold: /*[Const]*/ number): void;
  }  

  interface btActionInterface {
    updateAction (collisionWorld: btCollisionWorld, deltaTimeStep: number): void;
  }


  function destroy(o: any);

}