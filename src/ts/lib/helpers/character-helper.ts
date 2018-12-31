namespace PRKR.Helpers {

  import MeshPhongMaterial = THREE.MeshPhongMaterial;

  /**
   * A threejs object that represents the character.
   * 
   * In such early stage of development, all you get is a capsule (that curiously matches the phsycical body used to
   * approximate the character impact on the world).
   */
  export class CharacterHelper extends THREE.Object3D {

    private _material = new MeshPhongMaterial({ color: 0x0000ff });

    constructor() {

      super();

      // Add a character capsule.
      let radius = 0.25;
      let height = 1 - radius * 2;
      let capsuleMesh = this._buildCapsuleMesh(radius, height, this._material);
      capsuleMesh.position.set(0, 1.5 - height, 0);

      this.add(capsuleMesh);
      
    }

    get material() { return this._material; }

    private _buildCapsuleMesh(radius: number, height: number, material: THREE.Material): THREE.Mesh {

      let cylinderGeometry = new THREE.CylinderBufferGeometry(radius, radius, height);
      let sphereGeometry = new THREE.SphereBufferGeometry(radius);

      let capsuleMesh = new THREE.Mesh(cylinderGeometry, material);
      capsuleMesh.castShadow = true;
      capsuleMesh.receiveShadow = true;
      
      // Top sphere.
      let sphereMesh = new THREE.Mesh(sphereGeometry, material);
      sphereMesh.position.set(0, height / 2, 0);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      capsuleMesh.add(sphereMesh);
      // Bottom sphere.
      sphereMesh = new THREE.Mesh(sphereGeometry, material);
      sphereMesh.position.set(0, height / -2, 0);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      capsuleMesh.add(sphereMesh);

      return capsuleMesh;
    }

  }
}