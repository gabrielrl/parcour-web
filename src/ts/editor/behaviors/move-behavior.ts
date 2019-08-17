namespace PRKR.Editor.Behaviors {

  // Convinience imports.
  import Vector3 = THREE.Vector3;
  import LineDashedMaterial = THREE.LineDashedMaterial;
  import MeshBasicMaterial = THREE.MeshBasicMaterial;
  import BoundingBoxHelper = PRKR.Helpers.BoundingBoxHelper;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import IValidationResult = PRKR.Validators.IValidationResult;

  /** Possible behavior's state. */
  enum MovingState {

    /** Moving nothing yet. */
    Idle = 0,

    /** Moving objects parallel to the floor level. */
    HorizontalMoving = 1,

    /** Moving objects vertically (Y only). */
    VerticalMoving = 2

  }

  /** TODO I need more comments */
  export class MoveBehavior implements Behavior {

    static SuccessColor = EditorConstants.ToolSuccessColor;
    static SuccessColorDim = EditorConstants.ToolSuccessColorDim;
    static ErrorColor = EditorConstants.ToolErrorColor;
    static ErrorColorDim = EditorConstants.ToolErrorColorDim;

    static HelperLineMaterial = new LineDashedMaterial({
      color: MoveBehavior.SuccessColor,
      dashSize: 0.25,
      gapSize: 0.125,
      depthTest: false,
      depthWrite: false
    });

    static AdjustedHelperFaceMaterial = new MeshBasicMaterial({
      color: MoveBehavior.SuccessColor,
      transparent: true,
      opacity: 0.333
    });

    static VerticalHelperLineMaterial = new LineDashedMaterial({
      color: MoveBehavior.SuccessColorDim,
      dashSize: 0.125,
      gapSize: 0.075,
      depthTest: false,
      depthWrite: false
    });

    private _editor: ParcourEditor;

    /** Object currently under the pointer (if not performing a movement). */
    private _target: Objects.EditorObject;

    /** Objects being moved. */
    private _targets: Objects.EditorObject[] = [];

    /** Indicates if vertical movement is enabled. Set in `down` and valid until `up` or `cancel`. */
    private _verticalityEnabled: boolean = false;

    /** Current behavior state. */
    private _state: MovingState = MovingState.Idle;

    /**
     * Indicates if the current movement is valid.
     */
    private _movementValid: boolean = false;

    /** Movement origin. It is the point at which the user started to move from.*/
    private _origin: Vector3 = new Vector3();

    /** Movement destination. It is the point in the workd at which the user moved to. */
    private _destination: Vector3 = new Vector3();

    /** Adjusted movement for each target in `_targets`. */
    private _targetMovements: Vector3[] = [];

    /** Root object of all the helpers. */
    private _sceneObject: THREE.Object3D = new THREE.Object3D();

    // TODO rename that mess...s
    private _targetHelpers: BoundingBoxHelper[] = [];
    private _targetAdjustedHelpers: BoundingBoxHelper[] = [];
    private _targetVerticalHelpers: BoundingBoxHelper[] = [];

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
    hover(e: JQuery.MouseEventBase) {
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
      return (this._state === MovingState.Idle)
        ? '-webkit-grab'
        : '-webkit-grabbing';
      // return this._moving ? '-webkit-grabbing' : '-webkit-grab';
    }

    get statusMessage(): string {
      return (this._state === MovingState.Idle)
        ? `Click and drag to move ${ this._buildObjectsString() }`
        : `Release to move ${ this._buildObjectsString() }`;

      // return this._moving
      //   ? `Release to move ${ this._buildObjectsString() }`
      //   : 'TODO ;-)';
    }

    /**
     * Starts moving operation. Sets `_targets` and `_origin`.
     * @param e 
     */
    down(e: JQuery.MouseEventBase) {
      if (this._state !== MovingState.Idle) return;

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

        // Determine if verticality is enabled.
        this._verticalityEnabled = false;
        for (let i = 0; i < movables.length; i++) {
          let movable = movables[i];
          let moveConstraints = movable.moveConstraints;
          if (moveConstraints.yEnabled) {
            this._verticalityEnabled = true;
            break;
          }
        }
        this._origin.copy(current);
        this._destination.copy(current);
        this._targetMovements = this._targets.map(() => new Vector3());
        if (e.ctrlKey) {
          this._state = MovingState.VerticalMoving;
        } else {
          this._state = MovingState.HorizontalMoving;
        }

        this._targetHelpers = this._buildTargetHelpers({
          useLines: true,
          useFaces: false,
          lineMaterial: MoveBehavior.HelperLineMaterial,
          renderOrder: 10000 // TODO Extract
        });
        this._targetAdjustedHelpers = this._buildTargetHelpers({
          useLines: false,
          useFaces: true,
          faceMaterial: MoveBehavior.AdjustedHelperFaceMaterial
        });
        if (this._verticalityEnabled) {
          this._targetVerticalHelpers = this._buildTargetVerticalHelpers({
            useLines: true,
            useFaces: false,
            lineMaterial: MoveBehavior.VerticalHelperLineMaterial,
            renderOrder: 9999 // TODO Extract.
          });
        } else {
          this._targetVerticalHelpers = [];
        }

        let link = (o: THREE.Object3D) => { if(o) this._sceneObject.add(o); };
        this._targetHelpers.forEach(link);
        this._targetAdjustedHelpers.forEach(link);        
        this._targetVerticalHelpers.forEach(link);

        this._editor.hideSelectionOverlays();
        this._editor.addToScene(this._sceneObject);

      }

    }

    keyDown(e: JQuery.KeyboardEventBase) { }

    move(e: JQuery.MouseEventBase) {
      let current = this._getPosition(e);
      if (current) {
        this._destination.copy(current);
        let delta = new Vector3();
        delta.subVectors(this._destination, this._origin);

        // compute each target's adjusted destination.
        let adjustedMovement = new Vector3();
        let exact = new Vector3();
        let adjusted = new Vector3();
        this._targets.forEach((target, index) => {
          adjustedMovement.copy(delta);
          if (target.movable) {
            target.moveConstraints.apply(adjustedMovement);
          }

          let targetWorldPosition = target.getWorldPosition();

          exact.addVectors(targetWorldPosition, delta);
          adjusted.addVectors(targetWorldPosition, adjustedMovement);

          if (target.locationContstraints) {
            target.locationContstraints.apply(adjusted, this._editor.model);
          }

          this._targetMovements[index].subVectors(adjusted, targetWorldPosition);

          this._targetHelpers[index].position.copy(exact);
          this._targetAdjustedHelpers[index].position.copy(adjusted);

          let vertical = this._targetVerticalHelpers[index];
          if (vertical) {
            vertical.position.copy(adjusted).setY(0);
          }
          
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

          MoveBehavior.HelperLineMaterial.color.set(MoveBehavior.ErrorColor);
          MoveBehavior.AdjustedHelperFaceMaterial.color.set(MoveBehavior.ErrorColor);
          MoveBehavior.VerticalHelperLineMaterial.color.set(MoveBehavior.ErrorColorDim);

        } else {
          this._movementValid = true;

          MoveBehavior.HelperLineMaterial.color.set(MoveBehavior.SuccessColor);
          MoveBehavior.AdjustedHelperFaceMaterial.color.set(MoveBehavior.SuccessColor);
          MoveBehavior.VerticalHelperLineMaterial.color.set(MoveBehavior.SuccessColorDim);

        }

      }
      this._editor.requestRender();        
    }

    /** Notifies this behavior that the button has been released, completing the move action. */
    up(e: JQuery.MouseEventBase) {

      if (this._state !== MovingState.Idle) {

        if (this._movementValid) {
          // Apply the edit step.
          let step = this._buildEditStep();
          this._editor.addEditStep(step);
        }

        this._cleanUp();
      }

    }

    /** Notifies this behavior that the current action has been cancelled. */
    cancel(e: JQueryInputEventObject) {

      if (this._state !== MovingState.Idle) {
        this._cleanUp();
      }

    }

    /** Cleans up and resets editor state. Called upon finish (up) and cancel. */
    private _cleanUp() {

      // Unlink helpers.
      let unlink = (o: THREE.Object3D) => { this._sceneObject.remove(o); };
      this._targetHelpers.forEach(unlink);
      this._targetAdjustedHelpers.forEach(unlink);
      this._targetVerticalHelpers.forEach(unlink);

      // Reset state.
      this._targets = [];
      this._verticalityEnabled = false;
      this._targetMovements = [];
      this._targetHelpers = [];
      this._targetAdjustedHelpers = [];
      this._targetVerticalHelpers = [];
      this._origin.copy(M.Vector3.Zero);
      this._destination.copy(M.Vector3.Zero);
      this._state = MovingState.Idle;

      this._editor.restoreSelectionOverlays();
      this._editor.removeFromScene(this._sceneObject);
      this._editor.requestRender();

    }

    public getCategory(o: Objects.EditorObject) {
      // TODO Make static?
      if (o.model instanceof Model.Area) {
        return MoveCategory.Area;
      } else if (o.model instanceof Model.AreaElement) {
        return MoveCategory.AreaElement;
      } else {
        return MoveCategory.Unclassified;
      }
    }

    private _getMovables(): Objects.EditorObject[] {
      return this._editor.selectedObjects.filter(o => o.model);
    }

    private _getPosition(e: JQuery.MouseEventBase) {

      let mouse = new THREE.Vector2(e.clientX, e.clientY);
      let vertical = this._verticalityEnabled && e.ctrlKey;
      let intersect: THREE.Intersection;

      if (this._state === MovingState.Idle) {
        intersect = this._editor.projectMouseOnFloor(mouse);
      } else if (!vertical) {
        intersect = this._editor.projectMouseOnPlane(
          mouse,
          this._destination,
          M.Vector3.PositiveY
        );
      } else /* vertical */ {
        let n = this._editor.getCameraRig().getWorldDirection();        
        n.setY(0).normalize().negate();
        intersect = this._editor.projectMouseOnPlane(
          mouse,
          this._destination,
          n
        );
        if (intersect) {
          // only consider the Y component of the movement when moving vertically.
          intersect.point.setX(this._destination.x).setZ(this._destination.z);
        }
      }
    
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
      options: PRKR.Helpers.HelperOptions
    ): BoundingBoxHelper[] {

      let helpers: BoundingBoxHelper[] = [];

      this._targets.forEach(target => {

        let bbox = target.boundingBox;
        let helper = new BoundingBoxHelper(bbox, options);
        helpers.push(helper);

        target.getWorldPosition(helper.position);
        
      });

      return helpers;
    }

    private _buildTargetVerticalHelpers(
      options: PRKR.Helpers.HelperOptions
    ): BoundingBoxHelper[] {

      let helpers: BoundingBoxHelper[] = [];

      this._targets.forEach(target => {

        let model = target.model;

        if (model instanceof PRKR.Model.AreaElement) {

          let area =<Model.Area>this._editor.getObjectById(model.areaId).model;
          let bbox = target.boundingBox;
          let box = new THREE.Box3(
            new Vector3(bbox.min.x, area.location.y, bbox.min.z),
            new Vector3(bbox.max.x, area.location.y + area.size.y, bbox.max.z)
          );
          let helper = new BoundingBoxHelper(box, options);
          helpers.push(helper);

        } else {
          helpers.push(null);
        }

      });

      return helpers;
    }

  }

}