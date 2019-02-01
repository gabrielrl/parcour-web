namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import Quaternion = THREE.Quaternion;
  import EditorObject = Objects.EditorObject;

  let isArea = (editorObject: EditorObject) => editorObject.model instanceof Model.Area;

  export class RotateTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super();
    }

    /** Objects that could be rotated with the tool as per the last setup. */
    private _targets: EditorObject[] = [];

    /** True if `_targets` contains only areas. */
    private _areaMode: boolean;

    /** Pivot point, rotation origin. */
    private _pivot: Vector3 = new Vector3();

    /** Rotation widgets. */
    private _widgets: RotationWidget[] = [];

    /** True if the author is rotating right now. */
    private _rotating: boolean = false;

    /** Current rotation as per the last mouse move (if rotating). */
    private _rotation: Quaternion;

    /**
     * One adjusted translation per target.
     */
    private _adjustedTranslations: Vector3[];

    /**
     * One adjusted location per target.
     */
    private _adjustedRotations: Quaternion[];

    private _rotationValid: boolean = false;

    private _activeWidget: RotationWidget;

    private _from: Vector3 = new Vector3();

    private _to: Vector3 = new Vector3();

    private _helpers: EditorObjectHelper[] = [];

    /** Gets the current tool's name. Used as a unique key. */
    get name(): string { return 'rotate'; }

    /** Gets the current tool's displayable name. */
    get displayName(): string { return 'Rotate' }

    /** Gets if the current tool is enabled. Computed from the editor's state. */
    get enabled(): boolean {
      return _.some(this._editor.selectedObjects, x => x.rotatable);
    }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({ keyCode: 82, /* R */ });
    }

    /** Informs the Tool that it's being activated. */
    activate() {

      this._reset();
      this._setUp();

      // Simulate mouse down to update.
      if (this._editor.lastMouseEvent) {
        this.notifyMouseMove(this._editor.lastMouseEvent);
      }
      this._editor.setPointer('crosshair');
      this._editor.requestRender();

    }

    /** Informs the Tool that it's being deactivated. */
    deactivate() {

      this._reset();

      this._editor.requestRender();

    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      if (!this._rotating) {

        let intersection = this._getNearestWidgetIntersection(event);
        if (intersection) {

          this._editor.setStatus('Click and drag to rotate object around ' + intersection.widget.name);

          this._widgets.forEach(w => {
            if (w === intersection.widget) {
              w.setState(WidgetState.Hovered);
            } else {
              w.setState(WidgetState.Normal);
            }
          });

        }
      } else {

        // Rotating
        let intersection = this._activeWidget.test(event, this._editor);
        if (intersection) {

          this._to.copy(intersection.point);

          let v1 = new Vector3().subVectors(this._from, this._pivot);
          let v2 = new Vector3().subVectors(this._to, this._pivot);

          let angle = v1.angleTo(v2);
          let degrees = angle / M.TWO_PI * 360;

          let nv1 = v1.clone().normalize();
          let nv2 = v2.clone().normalize();
          this._rotation.setFromUnitVectors(nv1, nv2);

          // Compute rotation and position for each target.
          this._adjustedTranslations = [];
          this._adjustedRotations = [];
          // Adjust 
          this._targets.forEach((t, i) => {
            let origin = t.getWorldPivot();
            let p = new Vector3().subVectors(origin, this._pivot);
            if (p.length() > 0.001 && t.movable) {
              p.applyQuaternion(this._rotation)
              p.add(this._pivot);
              let m = new Vector3().subVectors(p, origin);
              if (t.moveConstraints) {
                t.moveConstraints.apply(m);
              }
              this._adjustedTranslations.push(m);
            } else {
              this._adjustedTranslations.push(null);
            }

            let adjustedRotation = this._rotation.clone();
            if (t.rotateConstraints) {
              t.rotateConstraints.apply(adjustedRotation);
            }
            this._adjustedRotations.push(adjustedRotation);
          });

          let planes: THREE.Plane[] = [];
          let n = new Vector3().subVectors(v2, v1);
          let projection = n.clone().projectOnVector(v1);
          n.sub(projection).normalize();
          planes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(n, this._pivot));

          n.subVectors(v1, v2);
          projection = n.clone().projectOnVector(v2);
          n.sub(projection).normalize();
          planes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(n, this._pivot));
          this._activeWidget.setClippingPlanes(planes);

          // Rotate all the helpers
          this._helpers.forEach((h, i) => {
            h.setRotateBy(this._adjustedRotations[i]);
            if (this._adjustedTranslations[i]) {
              h.setMoveBy(this._adjustedTranslations[i]);
            } else {
              h.setMoveBy(M.Vector3.Zero);
            }
          });

          let step = this._buildEditStep();
          if (step) {
            let validation = this._editor.validateEditStep(step);
            let someErrors = _.some(validation, Validators.isError);
            this._rotationValid = !someErrors;
          } else {
            this._rotationValid = false;
          }
    
          this._helpers.forEach(h => h.setValidState(this._rotationValid));
          this._editor.setStatus('Release to rotate object around ' + this._activeWidget.name + ' by ' + degrees.toFixed(0) + '°');

        }
      }

      this._editor.requestRender();

    }

    notifyMouseDown(event: JQueryMouseEventObject): void {

      let intersection = this._getNearestWidgetIntersection(event);
      if (intersection) {
        this._rotating = true;
        this._rotation = new Quaternion();
        this._activeWidget = intersection.widget;
        this._from.copy(intersection.point);
        this._to.copy(intersection.point);

        this._widgets.forEach(w => {
          if (w !== this._activeWidget) {
            w.setState(WidgetState.Hidden);
          }
        });

        this._editor.requestRender();

      }

    }

    notifyMouseUp(event: JQueryMouseEventObject): void {

      let step = this._buildEditStep();
      let finalStatus: string = null;
      if (step) {
        let validation = this._editor.validateEditStep(step);
        let errors = _.filter(validation, Validators.isError);
        if (errors.length === 0) {
          this._editor.addEditStep(step);
        } else {
          finalStatus = `Could not rotate because of ${ errors.length  } validation error(s)`;
          console.log('Validation errors:', errors);
        }
      }

      this._rotating = false;
      this._activeWidget = null;

      this._reset();
      this._setUp();

      // Simulate mouse move to update state.
      this.notifyMouseMove(event);

      if (finalStatus) {
        this._editor.setStatus(finalStatus);
      }

    }
    
    notifyKeyDown(event: JQueryKeyEventObject): void {

    }

    /**
     * Reverts to neutral state.
     */
    private _reset() {

      if (this._widgets) {
        this._widgets.forEach(w => this._editor.removeFromScene(w.threeObject));
      }
      if (this._helpers) {
        this._helpers.forEach(h => this._editor.removeFromScene(h));
      }

      this._rotating = false;
      this._rotation = null;
      this._areaMode = false;
      this._targets = [];
      this._widgets = [];
      this._helpers = [];

    }

    private _setUp() {

      this._targets = _.filter(this._editor.selectedObjects, o => o.rotatable);

      if (this._targets.length === 0) return;

      this._areaMode = _.some(this._targets, isArea);
      if (this._areaMode) {
        // Sanitize the target list. We only keep the targets.
        this._targets = _.filter(this._targets, isArea);
      }

      this._pivot.set(0, 0, 0);      
      this._targets.forEach(t => this._pivot.add(t.getWorldPivot()));
      this._pivot.divideScalar(this._targets.length);

      // Build visual helper for all the targets.
      this._helpers = this._targets.map(t => {
        let h = new EditorObjectHelper(t);
        t.getWorldPivot(h.position);
        h.setRestRotation(t.getRotation());
        h.setMoveBy(M.Vector3.Zero);
        this._editor.addToScene(h);
        return h;
      });

      // Build rotation widgets

      // rotate around Y
      let wy = new RotationWidget('Y', Helpers.OrthoPlane.XZ, 0x00ff00);

      // rotate around X
      let wx = new RotationWidget('X', Helpers.OrthoPlane.YZ, 0xff0000);

      // rotate around Z
      let wz = new RotationWidget('Z', Helpers.OrthoPlane.XY, 0x0000ff);

      this._widgets = [ wx, wy, wz ];

      let cameraOrientation = this._editor.getCameraRig().getWorldDirection();
      let clippingPlanes: THREE.Plane[] = [];
      this._widgets.forEach(w => {
        let n = Helpers.getNormalFromOrthoPlane(w.plane);
        let dot = n.dot(cameraOrientation);
        if (dot > 0) {
          n.negate(); 
        }
        let p = this._pivot.clone();
        p.addScaledVector(n, -0.001);

        clippingPlanes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(n, p));
      });

      this._widgets.forEach(w => {
        w.setClippingPlanes(clippingPlanes);
        w.setPosition(this._pivot);
        this._editor.addToScene(w.threeObject);
      });
    }

    private _getNearestWidgetIntersection(mouse: JQueryMouseEventObject): WidgetHitTestResult {
      let intersections = this._widgets.map(w => w.test(mouse, this._editor));
      return _.minBy(intersections, i => i ? i.distance : Infinity);
    }

    private _buildEditStep() {

      if (!this._targets || !this._rotation) return null;

      let steps: EditSteps.EditStep[] = this._targets.map(
        (t, i) => new EditSteps.RotateStep(this._adjustedRotations[i], [ t.id ])
      );
      this._targets.forEach((t, i) => {
        if (this._adjustedTranslations[i]) {
          if (t.model instanceof Model.AreaElement) {
            let newWorldPos = t.getWorldPosition(new Vector3()).add(this._adjustedTranslations[i]);
            let newArea = this._editor.getAreaAtLocation(newWorldPos);
            if (newArea && newArea.id !== t.model.areaId) {
              let newAreaLocation = new Vector3().subVectors(newWorldPos, newArea.location);
              steps.push(new EditSteps.MoveToStep(t.id, newArea.id, newAreaLocation));                
            } else {
              steps.push(new EditSteps.MoveStep(this._adjustedTranslations[i], [ t.id ]));
            }
          } else {
            steps.push(new EditSteps.MoveStep(this._adjustedTranslations[i], [ t.id ]));
          }
        }
      });

      return new EditSteps.ComposedStep(steps);

    }

  }
}
