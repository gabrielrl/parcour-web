namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import ParcourObject = Model.ParcourObject;
  import BoundingBoxHelper = Helpers.BoundingBoxHelper;

  export class AreaPaster implements Paster {

    private _editor: ParcourEditor;

    private _areaPayload: any[] = [];
    private _elementPayload: any[] = [];

    private _helpers: BoundingBoxHelper[] = [];
    private _helpersRoot: THREE.Group = new THREE.Group();
    private _adjustedHelpers: BoundingBoxHelper[] = [];
    private _adjustedHelpersRoot: THREE.Group = new THREE.Group();
    
    constructor(editor: ParcourEditor, models: Model.ParcourObject[]) {

      if (editor == null) throw new Error('"editor" can not be null or undefined');
      if (models == null) models = [];

      this._editor = editor;

      // Sort areas and area elements.
      let areas: Model.Area[] = [];
      let areaElements: Model.AreaElement[] = [];

      models.forEach(m => {
        if (m instanceof Model.Area) {

          areas.push(m);
          
        } else if (m instanceof Model.AreaElement) {

          areaElements.push(m);
        }
      });

      // Finds payload center (rounded and at ground level).
      let payloadOrigin = new Vector3();
      let count = 0;
      areas.forEach(a => {
        payloadOrigin.add(a.location);
        count++;
      });
      payloadOrigin.divideScalar(count).setY(0).round();

      // Prepare paste payload for each object.
      // First the areas

      areas.forEach(area => {
        let pastee = area.toObject();

        // Express location relatively to the payload center
        pastee.location = [
          pastee.location[0] - payloadOrigin.x,
          pastee.location[1] - payloadOrigin.y,
          pastee.location[2] - payloadOrigin.z,
        ];

        // Get box 
        let pasteeModel = <Model.Area>ParcourObject.fromObject(pastee);
        let box = pasteeModel.getBoundingBox();

        let helper = new BoundingBoxHelper(box, {
          useFaces: false,
          useLines: true,
          faceMaterial: Constants.Materials.Faces.Valid,
          lineMaterial: Constants.Materials.Lines.Valid
        }, area.id);
        // helper.position.copy(pasteeModel.location);

        let adjustedHelper = new BoundingBoxHelper(
          new THREE.Box3(M.Vector3.Zero, box.getSize()), {
          useFaces: true,
          useLines: false,
          faceMaterial: Constants.Materials.Faces.Valid,
          lineMaterial: Constants.Materials.Lines.Valid
        }, area.id);

        this._areaPayload.push(pastee);
        this._helpers.push(helper);
        this._helpersRoot.add(helper);
        this._adjustedHelpers.push(adjustedHelper);
        this._adjustedHelpersRoot.add(adjustedHelper);

      });

      // Then the area elements.
      areaElements.forEach(element => {

        if (!PasteTool.shouldExclude(element, this._editor)) {

          // Exclude elements that doen't belong to any of the areas to paste.
          let area = _.find(areas, a => a.id === element.areaId);
          if (area) {
            let pastee = element.toObject();
            this._elementPayload.push(pastee);
          }
        }

      });

    }

    get helpers() {
      return [].concat(this._helpersRoot, this._adjustedHelpersRoot);
    }

    buildEditStep(location: THREE.Vector3): EditSteps.EditStep {

      let adjustedPayload: any[] = [];
      let adjustedTarget = new Vector3();

      this._areaPayload.forEach(pastee => {

        let result = _.cloneDeep(pastee);

        if (result.id) {
          result.$$id = pastee.id;
        } else {
          result.id = Utils.uuid();
        }

        while (this._editor.getObjectById(result.id) != null) {
          result.id = Utils.uuid();
        }

        let po = <Model.Area>Model.ParcourObject.fromObject(pastee);

        // Restrict location
        adjustedTarget.copy(location);
        let moveConstraints = Objects.getMoveConstraints(po);
        if (moveConstraints) {
          moveConstraints.apply(adjustedTarget);
        }

        // Express location from the current target.
        let newWorldLocation = new Vector3(
          adjustedTarget.x + pastee.location[0],
          adjustedTarget.y + pastee.location[1],
          adjustedTarget.z + pastee.location[2],
        );

        let locationContstraints = Objects.getLocationConstraints(po);
        if (locationContstraints) {
          locationContstraints.apply(newWorldLocation, this._editor.model);
        }

        result.location = newWorldLocation.toArray();

        adjustedPayload.push(result);
      });

      this._elementPayload.forEach(pastee => {

        let result = _.cloneDeep(pastee);

        if (pastee.id) {
          if (this._editor.getObjectById(pastee.id) != null) {
            delete result.id;
          }
        }

        let area = _.find(adjustedPayload, x => x.$$id === pastee.areaId);
        if (area) {
          result.areaId = area.id;
          adjustedPayload.push(result);
        }
      });

      let addSteps = adjustedPayload.map(pastee => new EditSteps.AddObjectStep(pastee));

      if (addSteps.length !== 0) {
        return new EditSteps.ComposedStep(addSteps);
      }
    
      return null;


    }

    updateHelpers(
      location: THREE.Vector3,
      editStep: EditSteps.EditStep,
      validation: Validators.IValidationResult[]
    ): void {

      let validationIsError = (v: Validators.ValidationResult) =>
        v.level === Validators.ResultLevel.Error;
      let setValidMaterial = (helper: BoundingBoxHelper) => {
        helper.setLineMaterial(Constants.Materials.Lines.Valid);
        helper.setFaceMaterial(Constants.Materials.Faces.Valid);
      };
      let setInvalidMaterial = (helper: BoundingBoxHelper) => {
        helper.setLineMaterial(Constants.Materials.Lines.Invalid);
        helper.setFaceMaterial(Constants.Materials.Faces.Invalid);
      };

      if (!editStep) {

        this._helpers.forEach(setInvalidMaterial);
        this._helpers.forEach(h => h.visible = true);
        this._adjustedHelpers.forEach(setInvalidMaterial);
        this._adjustedHelpers.forEach(h => h.visible = false);

      } else {

        if (_.some(validation, validationIsError)) {
          this._helpers.forEach(setInvalidMaterial);
          this._adjustedHelpers.forEach(setInvalidMaterial);
        } else {
          this._helpers.forEach(setValidMaterial);
          this._adjustedHelpers.forEach(setValidMaterial);
        }

        this._adjustedHelpers.forEach(helper => {
          let step = _.find(
            (<EditSteps.ComposedStep>editStep).steps,
            step => (<EditSteps.AddObjectStep>step).data.$$id === helper.helperFor
          );
          if (step) {
            let addObjectStep = <EditSteps.AddObjectStep>step;
            helper.position.fromArray(addObjectStep.data.location);
            helper.visible = true;
          } else {
            helper.visible = false;
          }
        });

      }

      this._helpersRoot.position.copy(location);
      this._helpersRoot.visible = true;
      this._adjustedHelpersRoot.visible = true;

    }
  }

}