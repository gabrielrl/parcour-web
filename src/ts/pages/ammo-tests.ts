/// <reference path="../defs/prkr.bundle.d.ts" />
/// <reference path="../defs/ammo.d.ts" />

namespace PRKR.Pages {

  export class AmmoTests {
    constructor() {}

    public init() {

      //

      // debugger;

      // var v = new Ammo.btVector3(0, 1, 2);

      // var x = v.x();
      // var y = v.y();
      // var z = v.z();

      // v.setX(1);
      // v.setY(2);
      // v.setZ(3);

      // x = v.x();
      // y = v.y();
      // z = v.z();
      
      // var length = v.length();
      //

      return this;
    }

    public run() {

      let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      let overlappingPairCache    = new Ammo.btDbvtBroadphase();
      let solver = new Ammo.btSequentialImpulseConstraintSolver();
      let dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);

      dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

      var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50));
      var bodies = [];
      var groundTransform = new Ammo.btTransform();

      groundTransform.setIdentity();
      groundTransform.setOrigin(new Ammo.btVector3(0, -56, 0)); 

      (function() {
        var mass          = 0,
            isDynamic     = (mass !== 0),
            localInertia  = new Ammo.btVector3(0, 0, 0);

        if (isDynamic)
          groundShape.calculateLocalInertia(mass, localInertia);

        var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
        var rbInfo        = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
        var body          = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
      })();

      (function() {
        var colShape        = new Ammo.btSphereShape(1),
            startTransform  = new Ammo.btTransform();
        
        startTransform.setIdentity();

        var mass          = 1,
            isDynamic     = (mass !== 0),
            localInertia  = new Ammo.btVector3(0, 0, 0);
        
        if (isDynamic)
          colShape.calculateLocalInertia(mass,localInertia);

        startTransform.setOrigin(new Ammo.btVector3(2, 10, 0));
      
        var myMotionState = new Ammo.btDefaultMotionState(startTransform),
            rbInfo        = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
            body          = new Ammo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
      })();

      var trans = new Ammo.btTransform(); 

      for (var i = 0; i < 135; i++) {
        dynamicsWorld.stepSimulation(1/60, 10);
        
        bodies.forEach(function(body) {
          if (body.getMotionState()) {
            body.getMotionState().getWorldTransform(trans);
            console.log("world pos = " + [trans.getOrigin().x().toFixed(2), trans.getOrigin().y().toFixed(2), trans.getOrigin().z().toFixed(2)]);
          }
        });
      }

      // Delete objects we created through |new|. We just do a few of them here, but you should do them all if you are not shutting down ammo.js
      // we'll free the objects in reversed order as they were created via 'new' to avoid the 'dead' object links
      Ammo.destroy(dynamicsWorld);
      Ammo.destroy(solver);
      Ammo.destroy(overlappingPairCache);
      Ammo.destroy(dispatcher);
      Ammo.destroy(collisionConfiguration);

      console.log('ok.'); 

      // let name = 'btDiscreteDynamicsWorld';
      // let instance = dynamicsWorld;
      // let dts = this._generatePlaceholderTsDeclaration(instance, name, '  ');
      // console.log(`### Placeholder TypeScript declaration for ${name} ###`);
      // console.log(dts);

      // let name = 'btCollisionWorld';
      // let subject = Ammo[name];
      // let dts = this._generatePlaceholderTsDeclaration(subject, name);

      // console.log(`### Placeholder TypeScript declaration for ${name} ###`);
      // console.log(dts);

      return this;
    }

    /*
    private _generatePlaceholderTsDeclaration(instance: any, name: string, indent?: string): string {
      let result = '';
      if (!indent) { indent = ''; }

      // Treat them as "class-like".
      let members = [];
      let nl = '\n  ' + indent;

      for(var key in instance) {
        let isOwn = instance.hasOwnProperty(key);
        let value = instance[key];
        var declaration: string = null;
        switch(typeof value) {
          case 'number': {
            // treat it as a property.
            declaration =
            `// property "${key}" TODO${nl}` +
            `${key}: number;`;
            break;
          }
          case 'function': {
            // treat it as a public function.
            let params = [];
            for (let i = 0; i < value.length; i++) {
              params.push(`p${i}: any`);
            }
            declaration =
            `// function "${key}" TODO${nl}` +
            `${key}(${_.join(params, ', ')}): any;`;
            break;
          }
          default: {
            // leave a note...
            declaration = 
            `// found "${key}" a "${typeof value}"`;
          }
        }
        if (declaration) {
          members.push(
            (isOwn ? '' : '// Not an "own" property...' + nl) + 
            declaration + nl);
        }
      }

      result = 
        `${indent}// class ${name} TODO\n` +
        `${indent}class ${name} {${nl}` +
        _.join(members, nl) +
        `\n}`;

      return result;
    }
    */
  }
}

// Run...

new PRKR.Pages.AmmoTests().init().run();