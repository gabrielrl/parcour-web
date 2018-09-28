/// <reference path="../colors.ts" />

/// <reference path="./tool.ts" />
/// <reference path="../edit-steps/move-step.ts" />
/// <reference path="../edit-steps/composed-step.ts" />

/// <reference path="../../defs/prkr.bundle.d.ts" />

namespace PRKR.Editor.Tools {

  // Convinience imports.
  import Vector3 = THREE.Vector3;
  import BoundingBoxHelper = PRKR.Helpers.BoundingBoxHelper;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import IValidationResult = PRKR.Validators.IValidationResult;
  
  export class MoveTool extends Tool {

    static HelperColor = Colors.TOOL_SUCCESS_COLOR;
    static HelperErrorColor = Colors.TOOL_ERROR_COLOR;

    private _targets: Objects.EditorObject[] = [];

    private _moving: boolean = false;

    /**
     * Indicates if the current movement is valid.
     */
    private _movementValid: boolean = false;

    private _origin: Vector3 = new THREE.Vector3();
    private _targetMovements: Vector3[] = [];

    private _sceneObject: THREE.Object3D = new THREE.Object3D();

    private _moveHelper: MoveHelper = new MoveHelper();

    private _targetHelpers: BoundingBoxHelper[] = [];
    private _targetAdjustedHelpers: BoundingBoxHelper[] = [];

    public get name() { return 'move'; }

    constructor(private _editor: ParcourEditor) {
      super();
      this._sceneObject.add(this._moveHelper);
    }
    
    public get displayName() { return 'Move'; }

    public get enabled() {
      return this._editor.selectedObjects.length > 0;
    }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({ keyCode: 84 /* T */ });
    }

    private _movement: Vector3 = new Vector3();

    public activate() {
      this._editor.setStatus(`Click and drag to move ${ this._buildObjectsString() }`);
    }

    public notifyMouseDown(event: JQueryMouseEventObject): void {

      if (this._moving) return;

      let sel = this._editor.selectedObjects;
      let current = this._getPosition(event);            
      if (sel.length > 0 && current != null) {

        this._targets = [].concat(this._editor.selectedObjects);
        this._origin.copy(current);
        this._targetMovements = [];
        this._targets.forEach((t) => this._targetMovements.push(new Vector3()));
        this._moving = true;

        // console.debug('move start. origin:', this._origin);

        this._moveHelper.visible = false;
        this._targetHelpers = this._buildTargetHelpers({
          useLines: true,
          useFaces: false,
          lineMaterial: new THREE.LineDashedMaterial({
            color: MoveTool.HelperColor,
            dashSize: 0.25,
            gapSize: 0.125
          })
        });
        this._targetAdjustedHelpers = this._buildTargetHelpers({
          useLines: false,
          useFaces: true,
          // lineMaterial: new THREE.LineBasicMaterial({
          //   color: MoveTool.HelperColor
          // }),
          faceMaterial: new THREE.MeshBasicMaterial({
            color: MoveTool.HelperColor,
            transparent: true,
            opacity: 0.333
          })
        });

        let link = (o: THREE.Object3D) => { this._sceneObject.add(o); };
        this._targetHelpers.forEach(link);
        this._targetAdjustedHelpers.forEach(link);

        this._editor.addToScene(this._sceneObject);
        this._editor.requestRender();
        this._editor.setPointer('-webkit-grabbing');
        this._editor.setStatus(`Release to move ${ this._buildObjectsString() }`);
      }
    }

    public notifyMouseMove(event: JQueryMouseEventObject): void {
      if (this._moving) {
        let current = this._getPosition(event);
        if (!current) {
          this._movement.set(0, 0, 0);
          this._moveHelper.visible = false;
        } else {
          this._movement.subVectors(current, this._origin);
          this._moveHelper.visible = true;
          this._moveHelper.update(this._origin, current);

          // compute each target's destination.
          let exact = new THREE.Vector3();
          let adjusted = new THREE.Vector3();
          this._targets.forEach((target, index) => {
            exact.addVectors(target.getWorldPosition(), this._movement);
            adjusted.copy(exact).round();

            this._targetMovements[index].subVectors(adjusted, target.getWorldPosition());
            this._targetHelpers[index].position.copy(exact);
            this._targetAdjustedHelpers[index].position.copy(adjusted);
          });

          // Build the corresponding edit step.
          let editStep = this._buildEditStep();
          // Validate it.
          let validations = this._editor.validateEditStep(editStep);

          // See if there are any errors.
          let errors: IValidationResult[] = [];
          for (let i = 0; i < validations.length; i++) {
            if (validations[i].level === ResultLevel.Error) {
              errors.push(validations[i]);
            }
          }

          // Determine movement validity and update helpers.
          if (errors.length) {
            this._movementValid = false;
            this._targetHelpers.forEach((h) => { h.setColor(MoveTool.HelperErrorColor); });
            this._targetAdjustedHelpers.forEach((h) => { h.setColor(MoveTool.HelperErrorColor); });
          } else {
            this._movementValid = true;
            this._targetHelpers.forEach((h) => { h.setColor(MoveTool.HelperColor); });
            this._targetAdjustedHelpers.forEach((h) => { h.setColor(MoveTool.HelperColor); });
          }

        }
        this._editor.requestRender();        
      } else {
        this._editor.setPointer('-webkit-grab');
      }
    }

    public notifyMouseUp(event: JQueryMouseEventObject): void {

      if (this._moving) {

        if (this._movementValid) {
          // Apply the edit step.
          let step = this._buildEditStep();
          this._editor.addEditStep(step);
        }

        // Clean up.
        // Unlink helpers.
        let unlink = (o: THREE.Object3D) => { this._sceneObject.remove(o); };
        this._targetHelpers.forEach(unlink);
        this._targetAdjustedHelpers.forEach(unlink);
        // Reset state.
        this._targets = [];
        this._targetMovements = [];
        this._targetHelpers = null;
        this._targetAdjustedHelpers = null;
        this._origin.set(0, 0, 0);
        this._moving = false;

        this._editor.removeFromScene(this._sceneObject);
        this._editor.requestRender();
        this._editor.setPointer(null);
      }
    }
    
    public notifyClick(event: JQueryMouseEventObject): void { }

    /**
     * Computes the current scene position from the mouse position.
     */
    private _getPosition(event: JQueryMouseEventObject) {
      let intersect = this._editor.projectMouseOnFloor(
          new THREE.Vector2(event.clientX, event.clientY));
      
      if (intersect == null) return null;

      return intersect.point;
    }

    /**
     * Builds the current edit step from `_targetMovements` values.
     */
    private _buildEditStep(): EditSteps.EditStep {
      let targetSteps: EditSteps.MoveStep[] = [];
      this._targets.forEach((target, index) => {
        targetSteps.push(
          new EditSteps.MoveStep(
            this._targetMovements[index], [target.id]
          )
        );
      });

      let editStep = new EditSteps.ComposedStep(targetSteps);
      return editStep;
    }

    /**
     * Builds a string to describe the objects that are
     * currently selected.
     */
    private _buildObjectsString(): string {

      var objectsString = '';
      let sel = this._editor.selectedObjects;
      if (sel.length === 1) {
        objectsString = `'${ sel[0].name}'`;
      } else {
        objectsString = `${ sel.length } objects`;
      }
      return objectsString;
    }

    private _buildTargetHelpers(
      options: PRKR.Helpers.HelperOptions
    ): BoundingBoxHelper[] {

      let helpers: BoundingBoxHelper[] = [];

      this._targets.forEach((target) => {

        let bbox = target.boundingBox;
        let helper = new BoundingBoxHelper(bbox, options);
        helpers.push(helper);

        target.getWorldPosition(helper.position);

      });

      return helpers;
    }
  }

  class MoveHelper extends THREE.LineSegments {

    private _axisOrigin: THREE.AxisHelper;
    private _axisDest: THREE.AxisHelper;

    constructor() {
      let g = new THREE.Geometry();
      g.vertices.push(new THREE.Vector3());
      g.vertices.push(new THREE.Vector3());

      let m = new THREE.LineBasicMaterial({
        color: 0x008800,
        depthTest: false
      });

      super (g, m);

      this._axisOrigin = new THREE.AxisHelper(1);
      this._axisDest = new THREE.AxisHelper(1);

      this.add(this._axisOrigin);
      this.add(this._axisDest);
    }

    update(origin: THREE.Vector3, dest: THREE.Vector3) {
      let g = <THREE.Geometry>this.geometry;
      g.vertices[0].copy(origin);
      g.vertices[1].copy(dest);
      g.verticesNeedUpdate = true;

      this._axisOrigin.position.copy(origin);
      this._axisDest.position.copy(dest);
    }
  }
}