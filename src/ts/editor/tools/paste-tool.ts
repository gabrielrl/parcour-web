namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import ParcourObject = Model.ParcourObject;
  import BoundingBoxHelper = Helpers.BoundingBoxHelper;

  let modelIsArea = (x: Model.ParcourObject) => x instanceof Model.Area;
  let validationIsError = (v: Validators.ValidationResult) => v.level === Validators.ResultLevel.Error;

  export class PasteTool extends Tool {

    private _pastePayload = [];
    private _areaMode: boolean;

    private _helpers: BoundingBoxHelper[];
    private _helpersRoot: THREE.Group = null;

    /** Last built edit step. */
    private _editStep: EditSteps.EditStep = null;

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
      
      this._editStep = null;

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

      this._editStep = null;
      
    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      let intersect = this._editor.projectMouseOnFloor(new THREE.Vector2(event.clientX, event.clientY));
      if (intersect) {

        let setValidMaterial = (helper: BoundingBoxHelper) => {
          helper.setLineMaterial(Constants.Materials.Lines.Valid);
          helper.setFaceMaterial(Constants.Materials.Faces.Valid);
        };
        let setInvalidMaterial = (helper: BoundingBoxHelper) => {
          helper.setLineMaterial(Constants.Materials.Lines.Invalid);
          helper.setFaceMaterial(Constants.Materials.Faces.Invalid);
    };

        let target = intersect.point.round();

        this._editStep = this._buildEditStep(target);
        if (this._editStep) {
          let validation = this._editor.validateEditStep(this._editStep);
          // validation.forEach((v, i) => console.log('validation ' + i + ':', v));

          // let errors = validation.filter(v => v.level === Validators.ResultLevel.Error);
          // if (errors.length !== 0) {

          if (_.some(validation, validationIsError)) {
            this._helpers.forEach(setInvalidMaterial);
          } else {
            this._helpers.forEach(setValidMaterial);
          }

          // only show the helpers for objects that actualy gets pasted (objects falling outside of all areas are
          // excluded in `_buildEditStep`).
          this._helpers.forEach(helper => {
            if (!helper.helperFor) {
              helper.visible = false;
            } else {
              helper.visible = _.some(
                (<EditSteps.ComposedStep>this._editStep).steps,
                step => (<EditSteps.AddObjectStep>step).data.$$id === helper.helperFor
              );
            }
          });           
        } else {
          this._helpers.forEach(setInvalidMaterial);
          this._helpers.forEach(h => h.visible = true);
        }

        this._helpersRoot.position.copy(target);
        this._helpersRoot.visible = true;

      } else {

        this._helpersRoot.visible = false;

      }

      this._editor.requestRender();

    }

    notifyMouseUp(event: JQueryMouseEventObject) {

      if (this._editStep) {
        let validation = this._editor.validateEditStep(this._editStep);

        if (_.some(validation, validationIsError)) {

          this._editor.setStatus("Errors while pasting. See the console");
          console.log('Error during paste. validation=', validation);

        } else {

          this._editor.addEditStep(this._editStep);

        }
      }

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

          // Express location relatively to the payload center
          let newLocation = [
            pastee.location[0] - payloadOrigin.x,
            pastee.location[1] - payloadOrigin.y,
            pastee.location[2] - payloadOrigin.z,
          ];
          pastee.location = newLocation;

          // Get box 
          let pasteeModel = <Model.AreaElement>ParcourObject.fromObject(pastee);
          let box = pasteeModel.getBoundingBox();
          if (box == null) {
            // Safety net for when the object doesn't offer a bounding box but it's ugly and should not be relyed on.
            // TODO make bounding box mandatory?
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
          }, x.id);
          this._pastePayload.push(pastee);
          this._helpers.push(helper);
          this._helpersRoot.add(helper);
        }
      });
    }

    /**
     * Builds an edit step that adds the paste payload to the current parcour at the current user location specified
     * by `target`.
     * @param target current user target for the paste payload.
     */
    private _buildEditStep(target: Vector3) {

      let payload = [];
      this._pastePayload.forEach(pastee => {

        let result = _.cloneDeep(pastee);

        if (pastee.id) {
          result.$$id = pastee.id;
        }

        if (pastee.id && this._editor.getObjectById(pastee.id) != null) {
          delete result.id;
        }

        // Express location from the current target.
        let newWorldLocation = new Vector3(
          target.x + pastee.location[0],
          target.y + pastee.location[1],
          target.z + pastee.location[2],
        );

        // Is the new location inside an area?
        let area = this._editor.getAreaAtLocation(newWorldLocation);
        if (area) {

          let newLocation = [
            newWorldLocation.x - area.location.x,
            newWorldLocation.y - area.location.y,
            newWorldLocation.z - area.location.z
          ];
          
          result.areaId = area.id;
          result.location = newLocation;
          payload.push(result);

        }

      });

      let addSteps = payload.map(pastee => new EditSteps.AddObjectStep(pastee));

      if (addSteps.length !== 0) {
        return new EditSteps.ComposedStep(addSteps);
      }

      return null;

    }

  }
}