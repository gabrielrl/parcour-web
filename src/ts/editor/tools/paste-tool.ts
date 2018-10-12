namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import ParcourObject = Model.ParcourObject;
  import BoundingBoxHelper = Helpers.BoundingBoxHelper;

  let modelIsArea = (x: Model.ParcourObject) => x instanceof Model.Area;

  export class PasteTool extends Tool {

    private _pastePayload = [];
    private _areaMode: boolean;
    private _helpers: BoundingBoxHelper[];
    private _helpersRoot: THREE.Group = null;

    constructor(private _editor: ParcourEditor) {
      super()
     }

    get name() { return 'paste'; }

    get displayName() { return 'Paste'; }

    /** Enabled if the clipboard is not empty. */
    get enabled() { 
      return !Clipboard.isEmpty;
    }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 86, /* V */
      });
    }

    /** Informs the Tool that it's being activated. */
    activate() {
            
      if (!Clipboard.isEmpty) {

        this._init();

      }
      
    }

    /** Informs the Tool that it's being deactivated. */
    deactivate() {

      if (this._helpersRoot) {
        this._editor.removeFromScene(this._helpersRoot);
        this._editor.requestRender();
      }
      
    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      let intersect = this._editor.projectMouseOnFloor(new THREE.Vector2(event.clientX, event.clientY));
      if (intersect) {

        // let area = this._editor.getAreaAtLocation(intersect.point);

        let target = intersect.point.round();

        this._helpersRoot.position.copy(target);
        this._helpersRoot.visible = true;

      } else {

        this._helpersRoot.visible = false;

      }

      this._editor.requestRender();

    }

    notifyMouseUp(event: JQueryMouseEventObject) {

      // TODO

    }

    private _init() {
      
      if (this._helpersRoot) {
        this._editor.removeFromScene(this._helpersRoot);
      }

      this._pastePayload = [];
      this._helpers = [];
      this._helpersRoot = new THREE.Group();

      try {

        let payload = JSON.parse(Clipboard.get());
        if (!_.isArray(payload)) throw new Error('Clipboard content is not an array');

        if (payload.length === 0) return;

        let models = payload.map(x => ParcourObject.fromObject(x));
        this._areaMode = modelIsArea(models[0]);
        if (this._areaMode) {

          console.log('paste: area mode not implemented yet');

        } else {

          // Working in object mode:          
          this._initObjects(models);

        }

        this._editor.addToScene(this._helpersRoot);

      } catch(err) {

        console.error(err);
      
      }

    }

    private _initObjects(models: ParcourObject[]) {

      // Finds payload center (rounded).
      let payloadOrigin = new Vector3();
      let count = 0;
      models.forEach(x => {
        if (x instanceof Model.AreaElement) {
          payloadOrigin.add(x.location);
          count++;
        }
      });
      payloadOrigin.divideScalar(count).setY(0).round();

      // Prepare paste payload for each object.

      models.forEach(x => {
        if (x instanceof Model.AreaElement) {
          let pastee = x.toObject();
          let newLocation = [
            pastee.location[0] - payloadOrigin.x,
            pastee.location[1] - payloadOrigin.y,
            pastee.location[2] - payloadOrigin.z,
          ];
          pastee.location = newLocation;
          let pasteeModel = <Model.AreaElement>ParcourObject.fromObject(pastee);
          let box = pasteeModel.getBoundingBox();
          if (box == null) {
            box = new THREE.Box3(
              pasteeModel.location.clone(),
              M.Vector3.Zero.clone()
            ).expandByScalar(0.5);
          }
          let helper = new BoundingBoxHelper(box, {
            useFaces: true,
            useLines: false,
            faceMaterial: Constants.Materials.Faces.Valid,
            lineMaterial: Constants.Materials.Lines.Valid
          });
          this._pastePayload.push(pastee);
          this._helpers.push(helper);
          this._helpersRoot.add(helper);
        }
      });
    }

  }
}