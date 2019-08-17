// References to the core library.
/// <reference path="../defs/threex-keyboardstate.d.ts" />
// References to the core library.
/// <reference path="../defs/prkr.bundle.d.ts" />

// References to the editor library.
/// <reference path="../defs/prkr-editor.bundle.d.ts" />


declare var Detector: any; // typedefs?
declare var Stats: any; // typedefs??

interface UpdateFunction {
  (delta: number, elapsed: number, shouldLog: boolean): any
}

class RoomEditorPage {

  public scene: THREE.Scene;
  public renderer: THREE.Renderer;
  public camera: THREE.PerspectiveCamera;

  public orbitControls: THREE.OrbitControls;
  public keyboard: THREEx.KeyboardState;

  private _model: PRKR.Model.Parcour;
  private _representations: PRKR.Representations.IAreaRepresentation[];

  private _clock: THREE.Clock = new THREE.Clock();
  private _updateFunctions: UpdateFunction[] = [];
  private _logNext: boolean = false;

  constructor() { }

  public init() {
    // Init model
    this._initModel();

    // Init Three.js
    let container = document.createElement('div');
    document.body.appendChild(container);

    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer = renderer;

    document.body.appendChild(renderer.domElement);

    this.camera = 
      new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 1, 500);
     
    this.scene = new THREE.Scene();    

    this.setupLights();

    // Init model representation.
    this._initRepresentation();

    // Set-up controls.
    this.orbitControls = this._useOrbitControls();

    // Set-up tool box.
    this._setupToolbox();

    // Set-up listeners.
    window.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    window.addEventListener('resize', (e) => this._onWindowResize(e), false);
    let $window = $(window);
    $window.on('mousemove', (e) => this._onMouseMove(e));
    $window.on('mousedown', (e) => this._onMouseDown(e));
    $window.on('mouseup', (e) => this._onMouseUp(e));
    $window.on('click', (e) => this._onClick(e));

    // 
    this.resetCamera();
    this.orbitControls.update();

    return this;  
  }

  public resetCamera() {
    // TODO See everything.
    let center = new THREE.Vector3(1.5, 1.25, 1.5);
    let pos = center.clone().add(new THREE.Vector3(6, 6, 6));
    this.camera.position.copy(pos);
    // this.camera.lookAt(center);
    this.orbitControls.target.copy(center);
  }

  /**
   * Initializes Parcour model.
   */
  private _initModel() {
    let parcour = new PRKR.Model.Parcour();
    // Init basic Room model.
    let area: PRKR.Model.Area = new PRKR.Model.RoomArea({
      location: PRKR.M.Vector3.Zero,
      size: new THREE.Vector3(3, 2.54, 3)
    });
    parcour.objects.push(area);

    this._model = parcour;
  }

  private _initRepresentation() {
    let representations: PRKR.Representations.IAreaRepresentation[] = [];
    if (this._model) {
      let areas = this._model.getAreas();
      for (let a of areas) {
        if (a instanceof PRKR.Model.RoomArea) {
          let r = new PRKR.Representations.RoomRepresentation(a);
          representations.push(r);
          this.scene.add(r.getSceneObject());
        } else {
          // TODO handle other area type? or log a warning? or default behaviour?
        }
      }
    }
    this._representations = representations;
  }

  public run() {
    this._render();
    return this;
  }

  private _render() {
    this.renderer.render(this.scene, this.camera);
  }

  private _useOrbitControls() {
    let orbitControls = new THREE.OrbitControls(
      this.camera, this.renderer.domElement);
    orbitControls.addEventListener('change', () => this._render()); // add this only if there is no animation loop (requestAnimationFrame)
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.25;
    orbitControls.enableZoom = true;

    // this._updateFunctions.push(() => this.updateOrbitControls());

    return orbitControls;
  }

  private setupLights() {
    let ambientLigth = new THREE.AmbientLight( 0x404040 ); // soft white light
    this.scene.add(ambientLigth);

    let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set(.25, 1, 0.25).normalize();
    this.scene.add(directionalLight);
  }

  private _onKeyDown(e: KeyboardEvent) {
    // TODO.
  }

  private _onWindowResize(e: UIEvent) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( width, height );

    this._render();
  }

  // REALLY TEMPORARY TODO REMOVE
  private _activeTool: PRKR.Editor.Tools.Tool;

  private _setupToolbox() {
    // let select = new PRKR.Editor.Tools.SelectTool();
  }

  private _onMouseMove(e: JQuery.MouseEventBase) {
    // console.log('mousemove', e);
    if (this._activeTool) {
      this._activeTool.notifyMouseMove(e);
    }
  }

  private _onMouseDown(e: JQuery.MouseEventBase) {
    // console.log('mousedown', e);
    if (this._activeTool) {
      this._activeTool.notifyMouseDown(e);
    }
  }

  private _onMouseUp(e: JQuery.MouseEventBase) {
    // console.log('mouseup', e);
    if (this._activeTool) {
      this._activeTool.notifyMouseUp(e);
    }
  }

  private _onClick(e: JQuery.MouseEventBase) {
    // console.log('click', e);
    if (this._activeTool) {
      this._activeTool.notifyClick(e);
    }
  }
}

// run

if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
} else {
  new RoomEditorPage().init().run();
}
