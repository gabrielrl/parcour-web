namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import ParcourObject = Model.ParcourObject;

  let modelIsArea = (x: Model.ParcourObject) => x instanceof Model.Area;
  let validationIsError = (v: Validators.ValidationResult) => v.level === Validators.ResultLevel.Error;

  export class PasteTool extends Tool {

    private _paster: Paster = null;

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

      if (this._paster) {
        this._paster.helpers.forEach(h => this._editor.removeFromScene(h));
      }

      this._editor.requestRender();
      this._editStep = null;
      
    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      if (!this._paster) return;

      let intersect = this._editor.projectMouseOnFloor(new THREE.Vector2(event.clientX, event.clientY));
      if (intersect) {

        let target = intersect.point;

        this._editStep = this._buildEditStep(target);
        let validation: Validators.IValidationResult[] = [];

        if (this._editStep) {
          validation = this._editor.validateEditStep(this._editStep);
        }

        this._paster.updateHelpers(target, this._editStep, validation);


      } else {

        this._paster.helpers.forEach(h => h.visible = false);

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

      if (this._paster) {
        this._paster.helpers.forEach(h => this._editor.removeFromScene(h));
      }
      
      this._paster = null;

      try {

        let payload = JSON.parse(Clipboard.get());
        if (payload == null) return;
        if (!_.isArray(payload)) throw new Error('Clipboard content is not an array');
        if (payload.length === 0) return;

        let models = payload.map(x => ParcourObject.fromObject(x));
        let someArea = _.some(models, m => m instanceof Model.Area);
        if (someArea) {
          this._paster = new AreaPaster(this._editor, models);
        } else {
          this._paster = new ElementPaster(this._editor, models);
        }

        if (this._paster) {
          this._paster.helpers.forEach(h => this._editor.addToScene(h));
        }
        this._editor.requestRender();

      } catch(err) {
        console.error(err);
      }

    }

    /**
     * Builds an edit step that adds the paste payload to the current parcour at the current user location specified
     * by `target`.
     * @param target current user target for the paste payload.
     */
    private _buildEditStep(target: Vector3) {

      if (this._paster) {
        return this._paster.buildEditStep(target);
      }
      else return null;
    }
  }
}