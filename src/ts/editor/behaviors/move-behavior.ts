namespace PRKR.Editor.Behaviors {

  // Convinience imports.
  import Vector3 = THREE.Vector3;
  import BoundingBoxHelper = PRKR.Helpers.BoundingBoxHelper;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import IValidationResult = PRKR.Validators.IValidationResult;

  /** TODO I need more comments */
  export class MoveBehavior implements Behavior {

    static HelperColor = Colors.TOOL_SUCCESS_COLOR;
    static HelperErrorColor = Colors.TOOL_ERROR_COLOR;

    private _editor: ParcourEditor;

    /** Object currently under the pointer (if not performing a movement). */
    private _target: Objects.EditorObject;

    /** Objects being moved. */
    private _targets: Objects.EditorObject[] = [];

    private _moving: boolean = false;

    private _movement: Vector3 = new Vector3();

    /**
     * Indicates if the current movement is valid.
     */
    private _movementValid: boolean = false;

    private _origin: Vector3 = new Vector3();
    private _targetMovements: Vector3[] = [];

    /** Root object of all the helpers. */
    private _sceneObject: THREE.Object3D = new THREE.Object3D();
    private _targetHelpers: BoundingBoxHelper[] = [];
    private _targetAdjustedHelpers: BoundingBoxHelper[] = [];

    constructor(editor: ParcourEditor) {
      if (!editor) throw new Error('editor can not be null or undefined');
      this._editor = editor;
    }

    /** 
     * Gets if the move behavior is enabled. 
     * @returns true if there is at least one movable object in the current selection.
     */
    get enabled(): boolean {
      let sel = this._editor.selectedObjects;
      let m = _.find(sel, o => o.movable);
      return m != null;
    }

    /**
     * Notifies the pointer moved. Updates our target.
     */
    hover(e: JQueryMouseEventObject) {
      // Update target
      let intersections = this._editor.projectMouseOnObjects(
        new THREE.Vector2(e.clientX, e.clientY),
        this._getMovables().map(o => o.selectionHotSpot)
      );
      if (intersections && intersections.length > 0) {
        this._target = intersections[0].object.userData;
      } else {
        this._target = null;
      }
    }

    /**
     * Gets if the move behavior can be started from the current pointer location.
     * @returns True if the pointer is over a selected movable object.
     */
    get ready(): boolean {
      return this._target != null;
    }

    get pointer(): string {
      return this._moving ? '-webkit-grabbing' : '-webkit-grab';
    }

    get statusMessage(): string {
      return this._moving
        ? `Release to move ${ this._buildObjectsString() }`
        : 'TODO ;-)';
    }

    down(e: JQueryMouseEventObject) {
      if (this._moving) return;

      // Pick the objects we will be moving around.
      // From all the movable objects (selected & movable), pick those that are of the same category
      // as the current target (object under the pointer).
      let targetCategory = this.getCategory(this._target);
      let movables: Objects.EditorObject[];
      if (targetCategory !== MoveCategory.Unclassified) {
        movables = _.filter(this._getMovables(), m => this.getCategory(m) === targetCategory);
      } else {
        movables = [ this._target ];
      }

      let current = this._getPosition(e);

      if (movables.length > 0 && current != null) {
        this._targets = movables;
        this._origin.copy(current);
        this._targetMovements = [];
        this._targets.forEach(t => this._targetMovements.push(new Vector3()));
        this._moving = true;

        this._targetHelpers = this._buildTargetHelpers({
          useLines: true,
          useFaces: false,
          lineMaterial: new THREE.LineDashedMaterial({
            color: MoveBehavior.HelperColor,
            dashSize: 0.25,
            gapSize: 0.125
          })
        });
        this._targetAdjustedHelpers = this._buildTargetHelpers({
          useLines: false,
          useFaces: true,
          faceMaterial: new THREE.MeshBasicMaterial({
            color: MoveBehavior.HelperColor,
            transparent: true,
            opacity: 0.333
          })
        });

        let link = (o: THREE.Object3D) => { this._sceneObject.add(o); };
        this._targetHelpers.forEach(link);
        this._targetAdjustedHelpers.forEach(link);

        this._editor.addToScene(this._sceneObject);

      }

    }

    move(e: JQueryMouseEventObject) {
      let current = this._getPosition(e);
      if (!current) {
        this._movement.set(0, 0, 0);
        // this._moveHelper.visible = false;
      } else {
        this._movement.subVectors(current, this._origin);
        // this._moveHelper.visible = true;
        // this._moveHelper.update(this._origin, current);

        // compute each target's destination.
        let adjustedMovement = new Vector3();
        let exact = new Vector3();
        let adjusted = new Vector3();
        this._targets.forEach((target, index) => {
          adjustedMovement.copy(this._movement);
          if (target.moveConstraints) {
            let steps = target.moveConstraints.steps;

            if (steps.x === 0) {
              adjustedMovement.setX(0);
            } else {
              let s = steps.x;
              adjustedMovement.setX(
                Math.round(this._movement.x * s) / s
              );
            }

            if (steps.y === 0) {
              adjustedMovement.setY(0);
            } else {
              let s = steps.y;
              adjustedMovement.setY(
                Math.round(this._movement.y * s) / s
              );
            }

            if (steps.z === 0) {
              adjustedMovement.setZ(0);
            } else {
              let s = steps.z;
              adjustedMovement.setZ(
                Math.round(this._movement.z * s) / s
              );
            }
          }

          let targetWorldPosition = target.getWorldPosition();

          exact.addVectors(targetWorldPosition, this._movement);
          adjusted.addVectors(targetWorldPosition, adjustedMovement);

          this._targetMovements[index].subVectors(adjusted, targetWorldPosition);
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
          this._targetHelpers.forEach((h) => { h.setColor(MoveBehavior.HelperErrorColor); });
          this._targetAdjustedHelpers.forEach((h) => { h.setColor(MoveBehavior.HelperErrorColor); });
        } else {
          this._movementValid = true;
          this._targetHelpers.forEach((h) => { h.setColor(MoveBehavior.HelperColor); });
          this._targetAdjustedHelpers.forEach((h) => { h.setColor(MoveBehavior.HelperColor); });
        }

      }
      this._editor.requestRender();        
    }

    /** Notifies this behavior that the button has been released, completing the move action. */
    up(e: JQueryMouseEventObject) {

      if (this._moving) {

        if (this._movementValid) {
          // Apply the edit step.
          let step = this._buildEditStep();
          this._editor.addEditStep(step);
        }

        this._cleanUp();
      }

    }

    cancel(e: JQueryInputEventObject) {

      if (this._moving) {
        this._cleanUp();
      }

    }

    /** Cleans up and resets editor state. Called upon finish (up) and cancel. */
    private _cleanUp() {

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
      this._movement.copy(M.Vector3.Zero);

      this._editor.removeFromScene(this._sceneObject);
      this._editor.requestRender();

    }

    public getCategory(o: Objects.EditorObject) {
      if (o.model instanceof Model.Area) {
        return MoveCategory.Area;
      } else if (o.model instanceof Model.AreaElement) {
        return MoveCategory.AreaElement;
      } else {
        return MoveCategory.Unclassified;
      }
    }

    private _getMovables() {
      return _.filter(this._editor.selectedObjects, o => o.model);
    }

    private _getPosition(e: JQueryMouseEventObject) {
      let intersect = this._editor.projectMouseOnFloor(
        new THREE.Vector2(e.clientX, e.clientY));
    
      return intersect ? intersect.point : null;
    }

    /**
     * Builds the current edit step from `_targetMovements` values.
     */
    private _buildEditStep(): EditSteps.EditStep {
      let targetSteps: EditSteps.EditStep[] = [];
      this._targets.forEach((target, index) => {
        let category = this.getCategory(target);
        if (category === MoveCategory.Area) {
          targetSteps.push(
            new EditSteps.MoveStep(
              this._targetMovements[index], [target.id]
            )
          );
        } else if (category === MoveCategory.AreaElement) {
          let dest = target.getWorldPosition().add(this._targetMovements[index]);
          let destArea = this._editor.getAreaAtLocation(dest);
          if (!destArea || destArea.id === (<Model.AreaElement>target.model).areaId) {
            targetSteps.push(
              new EditSteps.MoveStep(
                this._targetMovements[index], [target.id]
              )
            );
          } else {
            let areaLocation = new Vector3();
            areaLocation.subVectors(dest, destArea.location);
            targetSteps.push(
              new EditSteps.MoveToStep(target.id, destArea.id, areaLocation)
            );
          }
          
        }
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
        objectsString = `${ sel.length } object${ sel.length > 1 ? 's' : '' }`;
      }
      return objectsString;
    }

    private _buildTargetHelpers(
      options: PRKR.Helpers.BoundingBoxHelperOptions
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

}