namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import Quaternion = THREE.Quaternion;
  import EditorObject = Objects.EditorObject;

  export class RotateTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super();
    }

    private _targets: EditorObject[] = [];

    private _pivot: Vector3 = new Vector3();

    private _widgets: RotationWidget[] = [];

    private _rotating: boolean = false;

    private _rotation: Quaternion;

    private _activeWidget: RotationWidget;

    private _from: Vector3 = new Vector3();

    private _to: Vector3 = new Vector3();

    private _rotationValid: boolean = false;

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
        this._to.copy(intersection.point);

        let v1 = new Vector3().subVectors(this._from, this._pivot);
        let v2 = new Vector3().subVectors(this._to, this._pivot);

        let nv1 = v1.clone().normalize();
        let nv2 = v2.clone().normalize();
        this._rotation.setFromUnitVectors(nv1, nv2);
        // this._rotation

        let angle = v1.angleTo(v2);
        let degrees = angle / M.TWO_PI * 360;

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

        this._editor.setStatus('Click and drag to rotate object around ' + this._activeWidget.name + ' by ' + degrees.toFixed(0) + '°');

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
      if (step) {
        this._editor.addEditStep(step);
      }

      this._rotating = false;
      this._activeWidget = null;

      this._reset();
      this._setUp();

      // Simulate mouse move to update state.
      this.notifyMouseMove(event);

    }
    
    notifyKeyDown(event: JQueryKeyEventObject): void {

    }

    private _reset() {

      if (this._widgets) {
        this._widgets.forEach(w => this._editor.removeFromScene(w.threeObject));
      }

      this._rotating = false;
      this._rotation = null;
      this._targets = [];
      this._widgets = [];

    }

    private _setUp() {

      if (this._editor.selectedObjects.length === 0) return;

      // TEMPORARY SINGLE TARGET MODE
      let target = this._editor.selectedObjects[0];
      this._pivot.copy(target.getWorldPosition());

      this._targets = [ target ];

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
        w.setPosition(target.getWorldPosition());
        this._editor.addToScene(w.threeObject);
      });

    }

    private _getNearestWidgetIntersection(mouse: JQueryMouseEventObject): WidgetHitTestResult {
      let intersections = this._widgets.map(w => w.test(mouse, this._editor));
      return _.minBy(intersections, i => i.distance);
    }

    private _buildEditStep() {
      if (!this._rotation) return null;

      let step = new EditSteps.RotateStep(
        this._rotation,
        this._targets.map(x => x.id)
      );
      return step;
    }

  }
}
