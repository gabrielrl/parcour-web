/// <reference path="../defs/prkr.bundle.d.ts" />
/// <reference path="../defs/ammo.d.ts" />

namespace PRKR.Player {

  import Vector3 = THREE.Vector3;
  import RuntimeObject = Model.RuntimeObject;

  /** Parcour player (run-time) main class. */
  export class ParcourPlayer {

    constructor(configuration: PRKR.Configuration) {
      if (!configuration) {
        throw new Error('"configuration" is mandatory.');
      }
      this._configuration = configuration;
    }

    /** Global configuration. */
    private _configuration: PRKR.Configuration;

    /** Currently loaded parcour. */
    private _parcour: Model.RuntimeParcour;

    /** The player's top-level viewport. Includes the HTML and WebGL. */
    private _viewport: HTMLElement;
    private _domRoot: HTMLElement;

    /** Keyboard state */
    private _keyboard: KeyboardState;

    // Three.js stuff
    /** The three.js WebGL scene. */
    private _scene: THREE.Scene;

    /** Three three.js WebGL renderer. */
    private _renderer: THREE.WebGLRenderer;

    /** The physics component. */
    private _physics: Physics.ParcourPhysics;

    private _character: RuntimeObject;
    private _activeForce: Ammo.btVector3 = new Ammo.btVector3();

    /** The completion state of the current parcour. */
    private _completed: boolean = false;

    /** Camera rig. */
    private _cameras: CameraRig;

    /** The currently active camera. */
    private _activeCamera: THREE.Camera;

    /** Simulation start time (milliseconds). */
    private _t0: number;

    /**
     * Area where the player is (determined during the last
     * call to `_render`).
     */
    private _currentArea: Model.RuntimeArea;

    /** Time at which the last render occured (milliseconds). */
    private _lastRender: number;

    /** Time at which the last simulation occured (seconds). */
    private _lastSimulate: number;

    /** The number of render passes that will be logged to the console. */
    private _shouldLog: number = 0;

    /**
     * Initializes the player.
     * @returns Itself.
     */
    public init(): ParcourPlayer {
      console.debug('init() called');

      if (!this._viewport) this._viewport = document.body;

      this._initDomLayout();
      this._initThreeJs();
      // this._initGrid();
      this._initPhysics();

      this._keyboard = new KeyboardState();

      if (window.location.search) {
        let idMatch = window.location.search.match(/id=(.*)/);
        if (idMatch && idMatch.length == 2) {
          let id = idMatch[1];
          let url = this._configuration.backend + this._configuration.parcours + '/' + id;
          $.getJSON(url)
          .then(
            (data, status, xhr) => {
              this.load(new PRKR.Model.Parcour(data));
              this.run();
            },
            (xhr, status, err) => {
              let message = 'Unable to fetch or process parcour ID "' + id + "'.";
              console.error(message);
              alert(message);
            }
          );
        } else if (window.location.search && window.location.search.match(/el=/)) {
          let linkHandler = new EditorLinkHandler(this);
          linkHandler.init(window);
          linkHandler.notifyReady();
        }
      }

      console.log('init ok.'); 

      return this;

    }

    /**
     * Loads the specified parcour.
     * @param parcour Parcour to load
     * @returns Itself.
     */
    public load(parcour: PRKR.Model.Parcour): ParcourPlayer {
      console.debug('load called', 'parcour=', parcour);

      this._parcour = new Model.RuntimeParcour(parcour);
      this._parcour.init(this._scene, this._physics);

      // Set start location.
      let start = this._parcour.startLocation;
      this._character.renderObject.position.copy(start);
      this._physics.setBodyPosition(this._character.physicBodies[0], start);

      return this;
    }

    /**
     * Launches the player.
     * @return Itself.
     */
    public run(): ParcourPlayer {

      console.debug('run() called');

      this._keyboard.on('keydown', e => this._onKeyPress(e));

      this._startLoop();
      
      return this;
    }

    static JUMP_IMPULSE: Ammo.btVector3 = new Ammo.btVector3(0, 5, 0);
    static AMMO_VECTOR_0: Ammo.btVector3 = new Ammo.btVector3(0, 0, 0);
    public jump() {
      this._character.physicBodies[0]
        .applyImpulse(ParcourPlayer.JUMP_IMPULSE, ParcourPlayer.AMMO_VECTOR_0);
      this._character.physicBodies[0].activate();
    }

    public setDirection(v: THREE.Vector3) {
      this._activeForce.setValue(v.x, v.y, v.z);

      if (this._activeForce.length() > 0.001) {
        this._character.physicBodies[0].activate();
        this._character.physicBodies[0].setDamping(0.2, 0);
      } else {
        this._character.physicBodies[0].setDamping(0.75, 0.75);
      }
    }

    private _reset() {
      // TODO Make sure to destroy/free everything.
      // TODO On the physics side.
      this._physics.reset();

      // TODO On the three.js side.

      this._parcour = null;
    }

    private _onKeyPress(e: JQueryKeyEventObject) {
      // console.debug('key pressed', e.which);
      let handled = false;
      if (e.which === 76 /* L */) {

        this._shouldLog = 2;
        console.group(`Log capture for the next ${this._shouldLog} render pass(es)`);

        handled = true;

      } else if (e.which === 32 /* Space */) {
        
        this.jump();

        handled = true;

      } else if (e.which === 69 /* E */) {

        let radius = 0.30;
        if (e.ctrlKey) radius = 0.15;
        if (e.shiftKey) radius = 0.40;

        this._spawnSphere(radius);

        handled = true;

      } else if (e.which === 82 /* R */) {

        let size = 0.60;
        if (e.ctrlKey) size = 0.30;
        if (e.shiftKey) size = 0.80;

        this._spawnCube(size);

        handled = true;

      } else if (e.which === 37 /* Left arrow */) {

        // Rotate camera, a quarter turn to the left.
        this._cameras.rotateBy(-PRKR.M.PI_OVER_TWO);

        handled = true;

      } else if (e.which === 39 /* Right arrow */) {

        // Rotate camera, a quarter turn to the right.
        this._cameras.rotateBy(PRKR.M.PI_OVER_TWO);

        handled = true;
      }

      // } else if (e.which === 38 /* Up arrow */) {
      // } else if (e.which === 40 /* Bottom arrow */) {

      if (handled) {
        e.preventDefault();
      }
    }

    private _actuator: THREE.Vector3 = new THREE.Vector3();
    private _processInput() {

      this._actuator.set(0, 0, 0);

      // Set direction from keyboard state.
      if (this._keyboard.isKeyDown(65) /* A */) {

        this._actuator.add(M.Vector3.NegativeX);

      }
      if (this._keyboard.isKeyDown(83) /* S */) {

        this._actuator.add(M.Vector3.PositiveZ);

      }
      if (this._keyboard.isKeyDown(68) /* D */ ) {

        this._actuator.add(M.Vector3.PositiveX);

      } 
      if (this._keyboard.isKeyDown(87) /* W */ ) {

        this._actuator.add(M.Vector3.NegativeZ);

      }

      if (this._actuator.length() > 0.001) {
        // Rotate actuator from camera orientation.
        this._actuator.applyAxisAngle(M.Vector3.PositiveY, this._cameras.orientation);
        this.setDirection(this._actuator.normalize().multiplyScalar(5));
      } else {
        this.setDirection(M.Vector3.Zero);
      }
    }

    private _startLoop() {
      let now = performance.now();
      this._lastRender = now;
      this._lastSimulate = (now - 1) / 1000;
      this._t0 = now;
      requestAnimationFrame(() => this._render());
      setTimeout(() => this._simulate());
    }

    private _render() {

      // Process input at render time.
      this._processInput();

      let now = performance.now();
      let delta = now - this._lastRender;
      let ellapsed = now - this._t0;

      if (this._shouldLog > 0) {
        let clock = ellapsed / 1000;
        console.log(`# [${clock.toFixed(3)}] render`);

        this._shouldLog--;
        if (this._shouldLog == 0) {
          console.groupEnd();
        }
      }

      this._parcour.update(delta, ellapsed);
      this._cameras.update(delta, ellapsed);

      this._cameras.position.set(
        this._character.renderObject.position.x,
        0,
        this._character.renderObject.position.z
      );

      let current = this._findCurrentArea();
      if (current) {
        if (current !== this._currentArea) {
          // Adjust doorway visibility.
          this._parcour.doorways.forEach(d => {
            let visible = d.areas.map(a => a.id).indexOf(current.id) !== -1;
            d.renderObject.visible = visible;
            if (visible) {
              current.scene.add(d.renderObject);
            }
          });
          // Move character to the right scene.
          current.scene.add(this._character.renderObject); // TODO needs remove??
        }
        this._currentArea = current;
      }

      this._lastRender = now;

      this._renderer.clear();
      this._renderer.render(this._scene, this._activeCamera);
      if (this._currentArea) {
        this._renderer.render(this._currentArea.scene, this._activeCamera);
      }

      // this._parcour.scenes.forEach(s => {
      //   this._renderer.render(s, this._activeCamera);
      // });

      requestAnimationFrame(() => this._render());
    }

    private static __simulate_v = new THREE.Vector3();
    private _simulate() {
      let now = performance.now() / 1000;
      let delta = now - this._lastSimulate;
      if (this._shouldLog) {
        let clock = now - this._t0 / 1000;
        console.log(`# [${clock.toFixed(3)}] simulate`, 'delta=', delta);
      }

      // Apply control effects on character.
      this._character.physicBodies[0].applyCentralForce(this._activeForce);
      // Step physic simulation.
      this._physics.simulate(delta);
      this._lastSimulate = now;

      // Test game logic...
      if (!this._completed) {
        let destination = this._parcour.endLocation;
        // Is the parcour completed?
        if (destination) {
          let v = ParcourPlayer.__simulate_v;
          v.subVectors(
            destination,
            // assumes it is updated during simulation above!
            this._character.renderObject.position 
          ).setY(0);
          if (v.length() < 0.5) {
            this._setCompleted();
          }
        }
      }

      setTimeout(() => this._simulate());
    }

    private _setCompleted() {

      let completionTime = performance.now();
      let ellapsed = completionTime - this._t0;
      // ms to minutes:seconds... (TODO get 'moment')

      console.debug('_setCompleted called');
      console.log('Parcour completed at ' + new Date().toTimeString());
      console.debug(`ellapsed ${ellapsed} ms.`)

      let $root = $(this._domRoot);
      let $overlay = $root.find('#prpl-overlay');
      let $caption = $overlay.find('.prpl-overlay-caption');
      let $body = $overlay.find('.prpl-overlay-body');
      let $footer = $overlay.find('.prpl-overlay-footer');

      $caption.html('Congratulation!');
      $body.html(
        `You completed the parcour in ` + 
        `<span class="number">${(ellapsed / 1000).toFixed(2)}</span>&nbsp;seconds.`
      );
      $footer.html('[ RETRY ] [ OK ]');
      $overlay.fadeIn(400);

      this._completed = true;
      this._parcour.setCompleted();
    }

    private _initDomLayout() {

      let main = document.createElement('div');
      main.id = 'prpl-main';

      this._viewport.appendChild(main);
      let overlay = $(`<div id="prpl-overlay">
        <div class="prpl-overlay-caption" />
        <div class="prpl-overlay-body" />
        <div class="prpl-overlay-footer" />
      </div>`)

      main.appendChild(overlay[0]);

      this._domRoot = main;
    }

    private _initThreeJs() {
      let renderer = this._renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.autoClear = false;
      renderer.setClearColor(0);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      let container = this._domRoot;
      renderer.setSize(container.clientWidth, container.clientHeight);

      $(container).prepend(renderer.domElement);
      // container.appendChild(renderer.domElement);

      this._scene = new THREE.Scene();
      this._initCameras();
      this._initLights();
    }

    /**
     * Creates the camera instances.
     * Called by _initThreeJs
     */
    private _initCameras() {
      let domElement = this._renderer.domElement;
      let w = domElement.clientWidth;
      let h = domElement.clientHeight;
      let aspectRatio = w / h;

      this._cameras = new PRKR.CameraRig(aspectRatio, 10);
      
      this._activeCamera = this._cameras.orthographicCamera;
      // this._activeCamera = this._cameras.perspectiveCamera;
      
      this._scene.add(this._cameras);

      this._cameras.elevation = Math.PI / 4;
      this._cameras.orientation = Math.PI / -4;

    }  

    private _initLights() {
      let ambientLigth = new THREE.AmbientLight( 0x404040 ); // soft white light
      this._scene.add(ambientLigth);

      let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
      directionalLight.position.set(-.25, 1, 0.25).normalize();
      directionalLight.castShadow = true;

      this._scene.add(directionalLight);

      directionalLight.shadow.mapSize.width = 1024;  // default 512
      directionalLight.shadow.mapSize.height = 1024; // default 512
      let shadowCamera = <THREE.OrthographicCamera>directionalLight.shadow.camera;
      shadowCamera.near = -20;   // default .5
      shadowCamera.far = 20      // default 500
      shadowCamera.left = -10;
      shadowCamera.right = 10;
      shadowCamera.top = 10;
      shadowCamera.bottom = -10;

      // this._scene.add(new THREE.CameraHelper(shadowCamera));
    }

    private _initGrid() {
      let gh = new THREE.GridHelper(10, 20);
      this._scene.add(gh);      
    }
    
    private _initPhysics() {

      this._physics = new Physics.ParcourPhysics();
      this._physics.init();

      // Add a character capsule.
      let radius = 0.2;
      let height = .75;
      let capsuleMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
      let capsuleMesh = this._buildCapsuleMesh(radius, height, capsuleMaterial);
      capsuleMesh.position.set(0, 1.25, 0);

      // HIDDEN mesh does not display that well... :( needs more work.
      // IT'S because of the composition of meshes.
      // let hiddenMaterial = new THREE.MeshBasicMaterial({
      //   color: 0x000088,
      //   depthTest: true,
      //   depthFunc: THREE.GreaterDepth,
      //   depthWrite: false
      // })
      // let hiddenMesh = this._buildCapsuleMesh(radius, height, hiddenMaterial);
      // capsuleMesh.add(hiddenMesh);

      let capsuleBody = this._physics.createCapsule({
        mass: 1,
        radius: radius,
        height: height,
        position: capsuleMesh.position, 
      });
      // Lock its rotation.
      capsuleBody.setAngularFactor(new Ammo.btVector3(0, 0, 0));
      // Add it to the scene and physic world.
      this._scene.add(capsuleMesh);
      this._character = {
        renderObject: capsuleMesh,
        physicBodies: [ capsuleBody ],
        updateRenderObject: true
      };
      this._physics.add(this._character);
    }

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

    private static SPHERE_MATERIAL = new THREE.MeshPhongMaterial({ color: 0xff0000 });

    /**
     * 
     * @param radius Sphere radius. Optional. Defaults to 0.30 m.
     */
    private _spawnSphere(radius?: number): RuntimeObject {

      let currentArea = this._findCurrentArea();
      if (!currentArea) return null;

      if (radius == null) radius = 0.30;
      let sphereGeometry = new THREE.SphereBufferGeometry(radius, 12, 8);
      let sphereMaterial = ParcourPlayer.SPHERE_MATERIAL;
      let sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;

      let position = this._getRandomSpawnPosition(currentArea.model);

      sphereMesh.position.copy(position);
      let sphereBody = this._physics.createSphere({
        mass: 1,
        radius: radius,
        position: sphereMesh.position, 
      });
      currentArea.scene.add(sphereMesh);
      let rt: RuntimeObject = {
        renderObject: sphereMesh,
        physicBodies: [ sphereBody ],
        updateRenderObject: true
      };
      this._physics.add(rt);

      return rt;
    }

    private static CUBE_MATERIAL = new THREE.MeshPhongMaterial({ color: 0xffffff });

    /**
     * 
     * @param size Cube size. Optional. Defaults to 0.6 m.
     */
    private _spawnCube(size?: number): RuntimeObject {

      let currentArea = this._findCurrentArea();
      if (!currentArea) return null;
      
      if (size == null) size = 0.6;
      let boxGeometry = new THREE.BoxBufferGeometry(size, size, size);
      let boxMaterial = ParcourPlayer.CUBE_MATERIAL;
      let boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;

      let position = this._getRandomSpawnPosition(currentArea.model);

      boxMesh.position.copy(position);
      let boxBody = this._physics.createBox({
        mass: 1,
        size: new Vector3(size, size, size),
        position: boxMesh.position
      });
      currentArea.scene.add(boxMesh);
      let rt: RuntimeObject = {
        renderObject: boxMesh,
        physicBodies: [ boxBody ],
        updateRenderObject: true
      }
      this._physics.add(rt);
      return rt;
    }

    /**
     * Gets the area where the character is.
     */
    private _findCurrentArea(): Model.RuntimeArea {
      return this._parcour.getAreaAtLocation(this._character.renderObject.position);
    }

    private _getRandomSpawnPosition(
      area: PRKR.Model.Area,
      target?: Vector3
    ): Vector3 {
      if (!target) target = new THREE.Vector3();

      let rx = Math.random();
      let ry = Math.random();

      target.set(
        area.location.x + area.size.x * rx,
        area.location.y + area.size.y * 0.5,
        area.location.z + area.size.z * ry);

      return target;      
    } 

  }
}