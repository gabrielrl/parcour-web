namespace PRKR.Player.Model {

  export class RuntimeDoorway implements RuntimeObject {

    private static MATERIAL = new THREE.MeshPhongMaterial({ color: 0xffffff });

    private _doorway: PRKR.Model.Doorway;

    private _renderObject: THREE.Object3D = null;

    /**
     * Areas from which this doorway comes / leads to.
     */
    private _areas: RuntimeArea[] = null;

    constructor(model: PRKR.Model.Doorway, private _parcour: RuntimeParcour) {
      if (!model) throw new Error('Missing argument "model".');
      this._doorway = model;
    }

    get areas(): RuntimeArea[] { return [].concat(this._areas); }

    get renderObject(): THREE.Object3D { return this._renderObject; }

    get physicBodies(): Ammo.btRigidBody[] { return []; }

    get updateRenderObject(): boolean { return false; }

    init() {
      // Finds the related areas.
      let areas = this._parcour.model.getAreasByDoorway(
        this._doorway);
      this._areas = areas.map(a => this._parcour.getAreaById(a.id));

      let builder = new PRKR.Builders.DoorwayMeshBuilder(
        this._doorway, this._parcour.model);
      let doorwayMesh = builder.buildMesh(RuntimeDoorway.MATERIAL);
      doorwayMesh.receiveShadow = true;
      doorwayMesh.traverse(o => o.receiveShadow = true);
      doorwayMesh.position.addVectors(this._doorway.location, this._areas[0].location);

      this._renderObject = doorwayMesh;
    }

  }
}