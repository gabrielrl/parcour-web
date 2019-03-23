namespace PRKR.Helpers {

  import MeshPhongMaterial = THREE.MeshPhongMaterial;

  /**
   * A threejs object that represents the character.
   * 
   * In such early stage of development, all you get is a capsule (that curiously matches the phsycical body used to
   * approximate the character's interactions with the world).
   */
  export class CharacterHelper extends THREE.Object3D {

    private _material = new MeshPhongMaterial({ color: 0x0000ff });

    constructor() {

      super();

      // Add a character capsule.
      let radius = 0.25;
      let height = 1;
      let capsuleMesh = this._buildCapsuleMesh(radius, height, this._material);
      capsuleMesh.position.set(0, 1.5 - height, 0);

      this.add(capsuleMesh);
      
    }

    get material() { return this._material; }

    private _buildCapsuleMesh(radius: number, height: number, material: THREE.Material): THREE.Mesh {

      
      let g = Builders.ShapeGeometryBuilder.buildGeometry(
        PRKR.Model.Shape.Capsule, new THREE.Vector3(radius, height * .5, radius));
      let m = new THREE.Mesh(g, material);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;

    }

  }
}
