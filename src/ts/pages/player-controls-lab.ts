/// <reference path="../defs/threex-keyboardstate.d.ts" />
// References to the core library.
/// <reference path="../defs/prkr.bundle.d.ts" />

declare var Detector: any; // typedefs?
declare var Stats: any; // typedefs??

interface UpdateFunction {
  (delta: number, elapsed: number, shouldLog: boolean): any
}

class Page {
  public scene: THREE.Scene;
  public renderer: THREE.Renderer;
  public camera: THREE.PerspectiveCamera;

  public playerCharacter: PRKR.Character;

  public orbitControls: THREE.OrbitControls;
  public keyboard: THREEx.KeyboardState;

  public playerControls: PRKR.PlayerControls;

  public stats: any;

  private _clock: THREE.Clock = new THREE.Clock();
  private _updateFunctions: UpdateFunction[] = [];
  private _logNext: boolean = false;

  constructor() {
  }

  public init() {
    let container = document.createElement('div');
    document.body.appendChild(container);

    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer = renderer;

    document.body.appendChild(renderer.domElement); 

    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
    camera.position.set(0, 0, 12);
    camera.up.set(0, 1, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera = camera;

    this.scene = new THREE.Scene();    

    this.setupLights();
    this.setupHelpers();
    this.setupRooms();
    this.setupCharacter();

    this.orbitControls = this.useOrbitControls();
    this.keyboard = this.useKeyboardState(document, container);

    this.stats = this.useStats(document, container);

    window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    window.addEventListener('resize', (e) => this.onWindowResize(e), false);

    return this;
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    let delta = this._clock.getDelta();
    let elapsed = this._clock.getElapsedTime();

    if (this._logNext) {
      console.debug('----- Page # animate -----');
      console.debug('delta=', delta, 'elapsed=', elapsed);
    }

    this.stats.begin();

    for (let updateFunction of this._updateFunctions) {
      updateFunction(delta, elapsed, this._logNext);
    }

    this.render();

    this.stats.end()

    this._logNext = false;
  }

  private onKeyDown(event: KeyboardEvent) {
    // space
    if (event.keyCode === 32) {
      // log next iteration.
      this._logNext = true;
    }
  }

  private setupLights() {
    // soft white light
    let ambientLigth = new THREE.AmbientLight( 0x404040 );
    this.scene.add( ambientLigth );

    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(20, 30, 0);
    this.scene.add(spotLight);			
  }

  private setupHelpers() {
    // GRID
    let grid = new THREE.GridHelper(20, 1, 0x888888, 0x444444);
    this.scene.add(grid);

    // WORLD ORIGIN AXIS.
    let axis = new THREE.AxisHelper();
    this.scene.add(axis);

  }

  private setupRooms() {
    let roomMat = new THREE.MeshLambertMaterial({
      color: 0xffffff
    });
    let Def = PRKR.Model.RoomArea;
    let Repr = PRKR.Representations.RoomRepresentation;
    // Room number 1
    let def = new Def({
      location: PRKR.M.Vector3.Zero,
      size: new THREE.Vector3(4, 3, 2.54)
    });
    let repr = new Repr(def);
    let so = repr.getSceneObject();
    this.scene.add(so);
    // Room number 2
    def = new Def({
      location: new THREE.Vector3(4, 0, 0),
      size: new THREE.Vector3(3, 2.54, 5)
    });
    repr = new Repr(def);
    so = repr.getSceneObject();
    so.position.set(4, 0, 0);
    this.scene.add(so);
    // Room number 3
    def = new Def({
      location: new THREE.Vector3(0, 0, 3),
      size: new THREE.Vector3(4, 2.54, 2)
    });
    repr = new Repr(def);
    so = repr.getSceneObject();
    so.position.set(0, 0, 3);
    this.scene.add(so);
  }

  private setupCharacter() {
    let meshFactory = new PRKR.MeshFactory();
    // "bob" setting
    meshFactory.loadGeometryJson('assets/bob_mesh.json');
    meshFactory.loadAnimations('assets/bob_anims.prkr.json');
    meshFactory.loadedCallback = (f) => this.onCharacterReady(f);
  }

  private onCharacterReady(factory: PRKR.MeshFactory) {
    // Build a character.
    let character = factory.buildCharacter();
    var s = 0.133333;
    character.mesh.scale.set(s, s, s);
    this.scene.add(character.mesh);

    // Build a PlayerControls instance.
    let playerControls = new PRKR.PlayerControls({
      character: character,
      keyboard: this.keyboard,
      orbitControls: this.orbitControls,
      camera: this.camera
    });

    // Set-up the update function.
    this._updateFunctions.push(
      (d: number, e: number, l: boolean) => this.updatePlayer(d, e, l));

    // Keep the character and control references.
    this.playerCharacter = character;
    this.playerControls = playerControls;
  }

  private updatePlayer(delta: number, elapsed: number, shouldLog: boolean) {
    this.playerControls.update(delta, shouldLog);
    this.playerCharacter.update(delta);
  }

  public run() {
    this.animate();
    return this;
  }

  private useStats(document: Document, container: HTMLElement) {
    let stats = new Stats();
    container.appendChild( stats.dom );

    return stats;
  }

  private useOrbitControls() {
    let orbitControls = new THREE.OrbitControls(
      this.camera, this.renderer.domElement);
    //orbitControls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.25;
    orbitControls.enableZoom = true;

    this._updateFunctions.push(() => this.updateOrbitControls());

    return orbitControls;
  }

  private updateOrbitControls() {
    this.orbitControls.update();
  }

  private useKeyboardState(document: Document, container: HTMLElement) {
    let keyboard	= new THREEx.KeyboardState(this.renderer.domElement);
    this.renderer.domElement.setAttribute("tabIndex", "0");
    this.renderer.domElement.focus();

    return keyboard;
  }

  private onWindowResize(e: UIEvent) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( width, height );
  }  
}

// run

if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
} else {
  new Page().init().run();
}
