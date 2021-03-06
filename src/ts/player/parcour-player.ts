/// <reference path="../defs/prkr.bundle.d.ts" />
/// <reference path="../defs/ammo.d.ts" />
/// <reference path="./constants.ts" />

namespace PRKR.Player {

  import Vector3 = THREE.Vector3;
  import RuntimeObject = Model.RuntimeObject;
  import C = Player.Constants;

  /** Parcour player (run-time) main class. */
  export class ParcourPlayer {

    constructor(configuration: PRKR.Configuration) {
      if (!configuration) {
        throw new Error('"configuration" is mandatory.');
      }
      this._configuration = configuration;

      this._localConfiguration = LocalConfiguration.get();
      LocalConfiguration.addChangeListener(cfg => this._onLocalConfigurationChange(cfg));
    }

    /** Global configuration. Like application wide URLs and paths. */
    private _configuration: PRKR.Configuration;

    /** Local configuration. Like debug options and user preferences. */
    private _localConfiguration: PRKR.Player.LocalConfiguration;

    /** Currently loaded parcour. */
    private _parcour: Model.RuntimeParcour;

    /** The player's top-level viewport. Includes the HTML and WebGL. */
    private _viewport: HTMLElement;
    private _domRoot: HTMLElement;

    private _menu: Menu;

    /** Keyboard state */
    private _keyboard: KeyboardState;

    // Three.js stuff
    /** The three.js WebGL scene. */
    private _scene: THREE.Scene;

    /** Three three.js WebGL renderer. */
    private _renderer: THREE.WebGLRenderer;

    /** The physics component. */
    private _physics: Physics.ParcourPhysics;

    /** The player character runtime object. */
    private _character: RuntimeObject;

    /** Debug helper to expose the character stand point. */
    private _standPointDisplay: THREE.Object3D;

    /** Material for the debug helper to expose the character stand point */
    private _standPointDisplayMaterial: THREE.MeshBasicMaterial;

    /** Current force applied from player input. */
    private _activeForce: Ammo.btVector3 = new Ammo.btVector3();

    /** Current game state. */
    private _state: GameState = GameState.Playing;

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

    private static JumpImpulse: Ammo.btVector3 = new Ammo.btVector3(0, C.Character.JumpImpulse, 0);
    private static AmmoVector0: Ammo.btVector3 = new Ammo.btVector3(0, 0, 0);

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
      this._initDebug();

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
    public load(parcour: PRKR.Model.Parcour, options?: any): ParcourPlayer {
      console.debug('load called', 'parcour=', parcour);

      this._parcour = new Model.RuntimeParcour(parcour);
      this._parcour.init(this._scene, this._physics);

      // Set start location.
      let start = this._parcour.startLocation.clone();

      if (options && options.startLocation && _.isArray(options.startLocation)) {
        start = start.fromArray(options.startLocation);
      }

      let area = this._parcour.getAreaAtLocation(start);
      if (area) {
        let ray = this._physics.rayCast(
          new Vector3(start.x, area.location.y + area.size.y - 0.1, start.z),
          new Vector3(start.x, area.location.y, start.z)
        );
        if (ray) {
          start.y = ray.position.y + C.Character.CapsuleHeight * .5 + C.Character.LegGap;
        }
      }

      let minHeight = C.Character.CapsuleHeight * .5 + C.Character.LegGap;
      if (start.y < minHeight) {
        start.setY(minHeight);
      }

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

    /** Sets the current character direction. */
    public setDirection(v: THREE.Vector3) {
      this._activeForce.setValue(v.x, v.y, v.z);
    }

    private _reset() {
      // TODO Make sure to destroy/free everything.
      // TODO On the physics side.
      this._physics.reset();

      // TODO On the three.js side.

      this._parcour = null;
    }

    private _onLocalConfigurationChange(cfg: LocalConfiguration) {
      this._localConfiguration = cfg;
    }

    private _onKeyPress(e: JQueryKeyEventObject) {
      // console.debug('key pressed', e.which);
      let handled = false;
      if (e.which === 76 /* L */) {

        this._shouldLog = 2;
        console.group(`Log capture for the next ${this._shouldLog} render pass(es)`);

        handled = true;

      } else if (e.which === 32 /* Space */) {
        
        this._jumpTriggered = true;

        handled = true;

      } else if (e.which === 37 /* Left arrow */) {

        // Rotate camera, a quarter turn to the left.
        this._cameras.rotateBy(-PRKR.M.PI_OVER_TWO);

        handled = true;

      } else if (e.which === 39 /* Right arrow */) {

        // Rotate camera, a quarter turn to the right.
        this._cameras.rotateBy(PRKR.M.PI_OVER_TWO);

        handled = true;
      } else if (e.which === 27 /* Escape */) {

        this._menu.toggle();

        handled = true;
      }

      // } else if (e.which === 38 /* Up arrow */) {
      // } else if (e.which === 40 /* Bottom arrow */) {

      if (handled) {
        e.preventDefault();
      }
    }

    private _actuator: THREE.Vector3 = new THREE.Vector3();
    private _running: boolean = false;
    private _crouching: boolean = false;
    private _jumpTriggered: boolean = false;
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

      this._running = this._keyboard.isKeyDown(16); // SHIFT (left or right)
      this._crouching = this._keyboard.isKeyDown(67); // C

      if (this._actuator.length() > 0.001) {
        // Rotate actuator from camera orientation.
        this._actuator.applyAxisAngle(M.Vector3.PositiveY, this._cameras.orientation);
        this.setDirection(this._actuator.normalize().multiplyScalar(C.Character.DirectionMagnitude));
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

    private static __simulate_relativePosition = new Ammo.btVector3();
    private static __simulate_force = new Ammo.btVector3();
    private static __simulate_v2 = new THREE.Vector3();
    private _simulate() {

      // Time keeping.
      let now = performance.now() / 1000;
      let delta = now - this._lastSimulate;
      if (this._shouldLog) {
        let clock = now - this._t0 / 1000;
        console.log(`# [${clock.toFixed(3)}] simulate`, 'delta=', delta);
      }

      // Apply character forces.
      const characterForce = ParcourPlayer.__simulate_force;
      const characterBody = this._character.physicBodies[0];
      const velocity = characterBody.getLinearVelocity();
      const jumpImpulse = ParcourPlayer.JumpImpulse;

      // Compute legs component.
      const legRayResult = this._castLegRays();
      let dynamicStandPoint: Vector3 = null;
      if (legRayResult == null) {

        // The character isn't standing on anything (free falling).
        // Applies a fraction of the active force so the player still has "some" control.
        // Though it is physically incorrect, it yields more interesting gameplay.
        const coeff = C.Character.FreeFallingDirectionCoefficient;
        characterForce.setValue(
          this._activeForce.x() * coeff,
          this._activeForce.y() * coeff,
          this._activeForce.z() * coeff
        );
        characterBody.applyCentralForce(characterForce);

      } else if (!legRayResult.stable) {

        // The character is sliding on something.
        // Applies a fraction of the active force so the player still has "some" control.
        const coeff = C.Character.FreeFallingDirectionCoefficient;
        characterForce.setValue(
          this._activeForce.x() * coeff,
          this._activeForce.y() * coeff,
          this._activeForce.z() * coeff
        );
        characterBody.applyCentralForce(characterForce);

        if (this._jumpTriggered) {    
          
          let j = legRayResult.normal.clone().lerp(M.Vector3.PositiveY, 0.5).normalize();
          let a = jumpImpulse.y();
          let jump = new Ammo.btVector3(j.x * a, j.y * a, j.z * a);

          characterBody.applyImpulse(jump, ParcourPlayer.AmmoVector0);

          // Apply the character's jump counter-force on the object on which the character stands (if it is dynamic).
          if (legRayResult.object && legRayResult.object.updateRenderObject) {

            let legLocation = legRayResult.location;
            let body = legRayResult.object.physicBodies[0];
            let origin = body.getWorldTransform().getOrigin();
            let relativePosition = ParcourPlayer.__simulate_relativePosition;
  
            relativePosition.setValue(
              legLocation.x - origin.x(),
              legLocation.y - origin.y(),
              legLocation.z - origin.z()
            );

            jump.setValue(-jump.x(), -jump.y(), -jump.z());
 
            body.applyImpulse(
              jump,
              relativePosition
            );

          }
        }

      } else {

        // The character is standing on something.

        const targetLegGap = C.Character.LegGap;
        const currentLegGap = legRayResult.legGap;

        let coeff = this._crouching ? C.Character.CrouchingLegGapCoefficient : 1;

        if (currentLegGap < targetLegGap) {
          characterForce.setValue(
            0,
            (targetLegGap * coeff - currentLegGap) * C.Character.MaxLegForce / targetLegGap
              + C.Character.Mass * C.World.Gravity
              - C.Character.LegDamping * velocity.y(),
            0
          );
        }

        coeff = C.Character.CrouchingDirectionCoefficient;
        characterForce.op_add(this._activeForce);
        if (this._running) {
          characterForce.op_add(this._activeForce);
        }
        if (this._crouching) {
          characterForce.setValue(
            characterForce.x() * coeff,
            characterForce.y() * coeff,
            characterForce.z() * coeff,
          )
        }

        characterForce.setX(characterForce.x() - velocity.x() * C.Character.DirectionDamping);
        characterForce.setZ(characterForce.z() - velocity.z() * C.Character.DirectionDamping);
  
        // Apply control + leg forces on character.
        characterBody.activate();
        characterBody.applyCentralForce(characterForce);

        if (this._jumpTriggered) {

          characterBody.applyImpulse(jumpImpulse, ParcourPlayer.AmmoVector0);
        }

        // Apply the character's counter-force on the object on which the character stands (if it is dynamic).
        if (legRayResult && legRayResult.object && legRayResult.object.updateRenderObject) {

          // Negates to get counter force.
          characterForce.setValue(-characterForce.x(), -characterForce.y(), -characterForce.z());

          let legLocation = legRayResult.location;
          let body = legRayResult.object.physicBodies[0];
          let origin = body.getWorldTransform().getOrigin();
          let relativePosition = ParcourPlayer.__simulate_relativePosition;

          relativePosition.setValue(
            legLocation.x - origin.x(),
            legLocation.y - origin.y(),
            legLocation.z - origin.z()
          );

          body.applyForce(
            characterForce,
            relativePosition
          )
          body.activate();

          if (this._jumpTriggered) {

            let y = jumpImpulse.y();
            jumpImpulse.setY(-y);

            body.applyImpulse(
              jumpImpulse,
              relativePosition
            );

            jumpImpulse.setY(y);  
  
          }

          // Keep track of dynamic object relative location of the standing point.
          dynamicStandPoint = legRayResult.object.renderObject.worldToLocal(legLocation.clone());
        }

      }

      // Update debug info
      // Stand-point
      if (!this._localConfiguration.displayStandingPoint) {
        this._standPointDisplay.visible = false;
      } else if (legRayResult == null) {
        this._standPointDisplay.visible = false;
      } else if (!legRayResult.stable) {
        this._standPointDisplay.visible = true;
        this._standPointDisplayMaterial.color.set(0xff0000);
        this._standPointDisplay.position.copy(legRayResult.location);
        this._standPointDisplay.quaternion.setFromUnitVectors(M.Vector3.PositiveY, legRayResult.normal);
      } else {
        this._standPointDisplay.visible = true;
        this._standPointDisplayMaterial.color.set(0x0000ff);
        this._standPointDisplay.position.copy(legRayResult.location);
        this._standPointDisplay.quaternion.setFromUnitVectors(M.Vector3.PositiveY, legRayResult.normal);
      }

      this._jumpTriggered = false;

      // Step physic simulation.
      this._physics.simulate(delta);
      this._lastSimulate = now;

      // HACKy, update character location if it was standing on a dynamic object.
      // This approach works OK for now ... 
      if (dynamicStandPoint != null) {

        let ro = legRayResult.object.renderObject;
        ro.updateMatrixWorld(true);

        dynamicStandPoint = ro.localToWorld(dynamicStandPoint);
        let diff = dynamicStandPoint.clone().sub(legRayResult.location); // .setY(0);
        let l = diff.length();

        if (l > 0.001) {

          // TODO Test and adjust this arbitrary max speed.
          let max = ( 1 /* m/s */ ) * delta;
          if (l > max) {
            diff = diff.multiplyScalar(max / l);
          }

          this._physics.translateBodies(this._character.physicBodies, diff);
          this._character.renderObject.position.add(diff);
        }

        this._physics.translateBodies(this._character.physicBodies, diff);
        this._character.renderObject.position.add(diff);

      }

      this._testGameLogic();

      setTimeout(() => this._simulate());
    }

    /**
     * Test game related logic / state stuff. Like did the character reach the end of the parcour? Is he dead cause
     * he felt in a hole... stuff like that. */
    private _testGameLogic() {

      if (this._state === GameState.Playing) {

        // Did the character felt in a hole?
        if (this._character.renderObject.position.y < Constants.Rules.HoleFallingThreshold) {
          this._setFallen();
        } else {
          let destination = this._parcour.endLocation;
          // Is the parcour completed?
          if (destination) {
            let v = ParcourPlayer.__simulate_v2;
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
      }

    }

    private static __ray0 = new Vector3();
    private static __ray1 = new Vector3();

    /** Cast leg rays for the character and return current "leg gap" value. */
    private _castLegRays(): LegRayResult {
      const v1 = ParcourPlayer.__ray0;
      const v2 = ParcourPlayer.__ray1;
      const halfCapsuleHeight = C.Character.CapsuleHeight * .5;
      const radius = C.Character.CapsuleRadius;
      const legGap = C.Character.LegGap;
      let rays = [{
        x: 0, z: 0
      }, {
        x: radius - .05, z: 0
      }, {
        x: -(radius - .05), z: 0
      }, {
        x: 0, z: radius - .05
      }, {
        x: 0, z: -(radius - .05)
      }];

      let highestStable: Physics.RayResult = null;
      let lowestUnstable: Physics.RayResult = null;

      rays.forEach(ray => {

        v1.copy(this._character.renderObject.position);
        v1.setX(v1.x + ray.x).setZ(v1.z + ray.z);
        v1.setY(v1.y - halfCapsuleHeight + radius);

        v2.copy(v1).addScaledVector(M.Vector3.NegativeY, legGap + radius);

        let hit = this._physics.rayCast(v1, v2);

        if (hit) {

          if (hit.normal.y > .7071) {

            if (!highestStable || hit.position.y > highestStable.position.y) {
              highestStable = hit;
            }

          } else {

            if (!lowestUnstable || hit.position.y < lowestUnstable.position.y) {
              lowestUnstable = hit;
            }
            
          }          
        }
  
      });

      let result: Physics.RayResult;
      let stable: boolean;

      if (highestStable) {
        result = highestStable;
        stable = true;
      } else if (lowestUnstable) {
        result = lowestUnstable;
        stable = false;
      }

      if (!result) return null;

      // determine leg gap.
      let currentLegGap = 
        this._character.renderObject.position.y
        - C.Character.CapsuleHeight * .5
        - result.position.y;

      // console.log('_castLegRays: Found a highest hit. Its position is', highest, 'Determined legGap is', legGap);

      return {
        legGap: currentLegGap,
        location: result.position,
        normal: result.normal,
        object: result.object,
        stable
      };

    }

    private _setFallen() {
      let fallenTime = performance.now();
      let ellapsed = fallenTime - this._t0;
      // ms to minutes:seconds... (TODO get 'moment')

      console.debug('_setFallen called');
      console.log('Fallen at ' + new Date().toTimeString());
      console.debug(`ellapsed ${ellapsed} ms.`)

      let $root = $(this._domRoot);
      let $overlay = $root.find('#prpl-overlay');
      let $caption = $overlay.find('.prpl-overlay-caption');
      let $body = $overlay.find('.prpl-overlay-body');
      let $footer = $overlay.find('.prpl-overlay-footer');

      $caption.html('Oh that\'s too bad!');
      $body.html(
        `You felt after ` + 
        `<span class="number">${(ellapsed / 1000).toFixed(2)}</span>&nbsp;seconds.`
      );
      $footer.html('[ RETRY ] [ OK ]');
      $overlay.fadeIn(400);

      this._state = GameState.Fallen;
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

      this._state = GameState.Completed;
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
      </div>`);

      main.appendChild(overlay[0]);

      this._menu = new Menu();
      main.appendChild(this._menu.dom);

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
      let radius = C.Character.CapsuleRadius;
      let height = C.Character.CapsuleHeight;
      let capsuleMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
      let capsuleMesh = this._buildCapsuleMesh(radius, height, capsuleMaterial);
      capsuleMesh.position.set(0, C.Character.Height - height, 0);

      // HIDDEN mesh does not display that well... :( needs more work.
      // We must be a able to choose behind which objects it appears -- as an example, it shouldn't display for
      // doorway frames.
      // let hiddenMaterial = new THREE.MeshBasicMaterial({
      //   color: 0x000088,
      //   depthTest: true,
      //   depthFunc: THREE.GreaterDepth,
      //   depthWrite: false
      // })
      // let hiddenMesh = this._buildCapsuleMesh(radius, height, hiddenMaterial);
      // capsuleMesh.add(hiddenMesh);

      let capsuleBody = this._physics.createCapsule({
        mass: C.Character.Mass,
        friction: C.Character.Friction,
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

    private _initDebug() {

      // Expose character standing point.
      let g = new THREE.CylinderBufferGeometry(0.125, 0.125, 0.05, 24);
      let m = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
      });
      let standPoint = new THREE.Mesh(g, m);
      standPoint.castShadow = false;
      standPoint.receiveShadow = false;
      standPoint.visible = false;

      this._standPointDisplay = standPoint;
      this._standPointDisplayMaterial = m;

      this._scene.add(this._standPointDisplay);

    }

    /**
     * Builds a capsule mesh.
     */
    private _buildCapsuleMesh(radius: number, height: number, material: THREE.Material): THREE.Mesh {

      let g = Builders.ShapeGeometryBuilder.buildGeometry(
        PRKR.Model.Shape.Capsule, new Vector3(radius, height * .5, radius));
      let m = new THREE.Mesh(g, material);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;

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
        mass: 50,
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
        mass: 50,
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
