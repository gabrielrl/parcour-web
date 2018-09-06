namespace PRKR.Player.Model {

  import Vector3 = THREE.Vector3;
  import Mesh = THREE.Mesh;

  export class RuntimeRoomArea implements RuntimeArea {

    private _room: PRKR.Model.RoomArea;

    private _mesh: THREE.Mesh = null;
    private _bodies: Ammo.btRigidBody[] = null;

    private _scene: THREE.Scene = null;

    constructor(model: PRKR.Model.RoomArea, private _parcour: RuntimeParcour) {
      if (!model) throw new Error('Missing argument "model".');
      this._room = model;
    }

    get renderObject() { return this._mesh; }

    get physicBodies() { return this._bodies; }

    get updateRenderObject() { return false; }

    get model() { return this._room; }

    get id() { return this._room.id; }

    get scene(): THREE.Scene { return this._scene; }

    get location() { return this._room.location; }
    get size() { return this._room.size; }

    public init(physics: Physics.ParcourPhysics) {

      let builder = new PRKR.Builders.RoomGeometryBuilder(
        this._room, this._parcour.model);     

      this._buildVisualRepresentation(builder);
      this._buildPhysicalRepresentation(builder, physics);

    }

    private _buildVisualRepresentation(
      builder: PRKR.Builders.RoomGeometryBuilder
    ) {
      const geometry = builder.getGeometry();
      const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(this._room.location);
      mesh.castShadow = false;
      mesh.receiveShadow = true;

      this._mesh = mesh;

      this._scene = new THREE.Scene();
      this._scene.add(mesh);

      const light = this._room.light;
      const hue = light.hue != null ? light.hue * 2 * Math.PI : 0;
      const saturation = light.color != null ? light.color : 0;
      const value = light.intensity != null ? light.intensity : 1;
      const lightColor = Utils.colorFromHsv(hue, saturation, value);
      const spotLight = new THREE.SpotLight(lightColor);

      const ambiantHue = hue + (4.1887902048 /* 240° or blue */ - hue) * .2;;

      let ambiantLightColor = Utils.colorFromHsv(ambiantHue, saturation, .05 + value * .1);
      let ambientLigth = new THREE.AmbientLight( ambiantLightColor );
      this._scene.add(ambientLigth);

      const roomLocation = this._room.location;
      const roomSize = this._room.size;
      const roomDiag = Math.sqrt(roomSize.x * roomSize.x + roomSize.z * roomSize.z);
      const spotLightHeight = roomSize.y + 0.5 + roomDiag * .5 * value;
      spotLight.position.set(
        roomLocation.x + roomSize.x * 0.5,
        spotLightHeight,
        roomLocation.z + roomSize.z * 0.5
      );
      spotLight.target.position.set(
        roomLocation.x + roomSize.x * 0.5,
        0,
        roomLocation.z + roomSize.z * 0.5
      );
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.25;
      spotLight.castShadow = true;
      this._scene.add(spotLight);
      this._scene.add(spotLight.target);

      spotLight.shadow.mapSize.width = 1024;  
      spotLight.shadow.mapSize.height = 1024; 
      (<THREE.PerspectiveCamera>spotLight.shadow.camera).near = spotLightHeight - roomSize.y - .5;
      (<THREE.PerspectiveCamera>spotLight.shadow.camera).far = spotLightHeight + 2;
      spotLight.shadow.bias = 0.00022;
    }

    private _buildPhysicalRepresentation(
      builder: PRKR.Builders.RoomGeometryBuilder,
      physics: Physics.ParcourPhysics
    ) {
      // Build physical representation.
      var boxLocation = new THREE.Vector3();
      var boxSize = new THREE.Vector3();

      // Floor
      let roomLocation = this._room.location;
      let roomSize = this._room.size;
      boxLocation.set(
        roomLocation.x + roomSize.x / 2,
        roomLocation.y - 0.5,
        roomLocation.z + roomSize.z / 2
      );
      boxSize.set(roomSize.x, 1, roomSize.z);

      var bodies: Ammo.btRigidBody[] = [];

      // Roof
      boxLocation.set(
        roomLocation.x + roomSize.x / 2,
        roomLocation.y + roomSize.y + 0.5,
        roomLocation.z + roomSize.z / 2
      )
      let box = physics.createBox({
        mass: 0,
        friction: Constants.StaticObjects.DefaultFriction,
        position: boxLocation,
        size: boxSize
      });
      bodies.push(box);

      // Floor tiles

      boxSize.set(1, 3, 1);

      for (let x = 0; x < roomSize.x; x++) {
        for (let z = 0; z < roomSize.z; z++) {
          let type = this._room.getTile(x, z);
          switch(type) {
            case PRKR.Model.TileType.Floor:
              boxLocation.set(
                roomLocation.x + x + .5,
                roomLocation.y - boxSize.y * .5,
                roomLocation.z + z + .5)
              box = physics.createBox({
                mass: 0,
                friction: Constants.StaticObjects.DefaultFriction,
                position: boxLocation,
                size: boxSize
              });
              bodies.push(box);
              break;
          }
        }
      }

      // Walls
      let walls = builder.getPysicsWalls();

      walls.forEach(wall => {
        wall.box.getCenter(boxLocation);
        boxLocation.add(roomLocation);
        wall.box.getSize(boxSize);
        box = physics.createBox({
          mass: 0,
          friction: Constants.StaticObjects.DefaultFriction,
          position: boxLocation,
          size: boxSize
        });
        bodies.push(box);
      });

      this._bodies = bodies;

      physics.add(this);
    }
    
  }
}