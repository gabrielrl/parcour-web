namespace PRKR.Player.Model {

  export interface RuntimeObject {

    renderObject: THREE.Object3D;
    physicBodies: Ammo.btRigidBody[];

    updateRenderObject: boolean;

  }

}