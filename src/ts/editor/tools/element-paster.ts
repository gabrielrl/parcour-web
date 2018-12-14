namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import ParcourObject = Model.ParcourObject;
  import AreaElement = Model.AreaElement;
  import BoundingBoxHelper = Helpers.BoundingBoxHelper;
  import getMoveConstraints = Objects.getMoveConstraints;
  import getLocationConstraints = Objects.getLocationConstraints;

  export class ElementPaster implements Paster {

    private _editor: ParcourEditor;
    private _payload: any[] = [];

    private _helpers: BoundingBoxHelper[] = [];
    private _helpersRoot: THREE.Group = new THREE.Group();
    private _adjustedHelpers: BoundingBoxHelper[] = [];
    private _adjustedHelpersRoot: THREE.Group = new THREE.Group();

    constructor(editor: ParcourEditor, models: ParcourObject[]) {

      if (editor == null) throw new Error('"editor" can not be null or undefined');
      if (models == null) models = [];

      this._editor = editor;

      // Since it's the "element" paster, we make sure to filter our payload to only keep elements.
      let elements = <AreaElement[]>_.filter(models, m => m instanceof AreaElement);

      // Finds payload center (rounded and at ground level).
      let payloadOrigin = new Vector3();
      let count = 0;
      elements.forEach(element => {
        payloadOrigin.add(element.location);
        count++;
      });
      payloadOrigin.divideScalar(count).setY(0).round();

      // Prepare paste payload for each element.

      elements.forEach(element => {
        let pastee = element.toObject();

        // Express location relatively to the payload center
        pastee.location = [
          pastee.location[0] - payloadOrigin.x,
          pastee.location[1] - payloadOrigin.y,
          pastee.location[2] - payloadOrigin.z,
        ];

        // Get box 
        let pasteeModel = <AreaElement>ParcourObject.fromObject(pastee);
        let box = pasteeModel.getBoundingBox();
        if (box == null) {
          // Safety net for when the object doesn't offer a bounding box but it's ugly and should not be relyed on.
          // TODO make bounding box mandatory?
          box = new THREE.Box3(
            pasteeModel.location.clone(),
            M.Vector3.Zero.clone()
          ).expandByScalar(0.5);
        }

        // Make the box relative to the object's position. It is more useful when adjusting the helper's position
        // afterward.
        box.translate(pasteeModel.location.clone().negate());

        let helper = new BoundingBoxHelper(box, {
          useFaces: false,
          useLines: true,
          faceMaterial: Constants.Materials.Faces.Valid,
          lineMaterial: Constants.Materials.Lines.Valid
        }, element.id);
        helper.position.copy(pasteeModel.location);

        let adjustedHelper = new BoundingBoxHelper(box, {
          useFaces: true,
          useLines: false,
          faceMaterial: Constants.Materials.Faces.Valid,
          lineMaterial: Constants.Materials.Lines.Valid
        }, element.id);
        this._payload.push(pastee);
        this._helpers.push(helper);
        this._helpersRoot.add(helper);
        this._adjustedHelpers.push(adjustedHelper);
        this._adjustedHelpersRoot.add(adjustedHelper);
        
      });

    }

    get helpers() {
      return [].concat(this._helpersRoot, this._adjustedHelpersRoot);
    }

    buildEditStep(location: THREE.Vector3): EditSteps.EditStep {

      let adjustedPayload: any[] = [];
      let adjustedTarget = new Vector3();
      this._payload.forEach(pastee => {

        let result = _.cloneDeep(pastee);

        if (pastee.id) {
          result.$$id = pastee.id;

          if (this._editor.getObjectById(pastee.id) != null) {
            delete result.id;
          }
        }

        let po = Model.ParcourObject.fromObject(pastee);

        // Restrict location
        adjustedTarget.copy(location);
        let moveConstraints = getMoveConstraints(po);
        if (moveConstraints) {
          moveConstraints.apply(adjustedTarget);
        }

        // Express location from the current target.
        let newWorldLocation = new Vector3(
          adjustedTarget.x + pastee.location[0],
          adjustedTarget.y + pastee.location[1],
          adjustedTarget.z + pastee.location[2],
        );

        let locationContstraints = getLocationConstraints(po);
        if (locationContstraints) {
          locationContstraints.apply(newWorldLocation, this._editor.model);
        }

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

      if (editStep) {

        if (_.some(validation, validationIsError)) {
          this._helpers.forEach(setInvalidMaterial);
          this._adjustedHelpers.forEach(setInvalidMaterial);
        } else {
          this._helpers.forEach(setValidMaterial);
          this._adjustedHelpers.forEach(setValidMaterial);
        }
      
        // only show the helpers for objects that actualy gets pasted (objects falling outside of all areas are
        // excluded in `_buildEditStep`).
        this._helpers.forEach(helper => {
          helper.visible = _.some(
            (<EditSteps.ComposedStep>editStep).steps,
            step => (<EditSteps.AddObjectStep>step).data.$$id === helper.helperFor
          );
        });
        this._adjustedHelpers.forEach(helper => {
          let step = _.find(
            (<EditSteps.ComposedStep>editStep).steps,
            step => (<EditSteps.AddObjectStep>step).data.$$id === helper.helperFor
          );
          if (step) {
            let addObjectStep = <EditSteps.AddObjectStep>step;
            let area = this._editor.model.getAreaById(addObjectStep.data.areaId);
            helper.position.fromArray(addObjectStep.data.location).add(area.location);
            
            helper.visible = true;
          } else {
            helper.visible = false;
          }
        });

      } else {

        this._helpers.forEach(setInvalidMaterial);
        this._helpers.forEach(h => h.visible = true);
        this._adjustedHelpers.forEach(setInvalidMaterial);
        this._adjustedHelpers.forEach(h => h.visible = false);

      } 
    
      this._helpersRoot.position.copy(location);
      this._helpersRoot.visible = true;
      this._adjustedHelpersRoot.visible = true;

    }


  }

}