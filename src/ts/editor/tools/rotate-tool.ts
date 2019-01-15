namespace PRKR.Editor.Tools {

  import EditorObject = Objects.EditorObject;

  export class RotateTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super();
    }

    private _rotating: boolean = false;

    private _rotationValid: boolean = false;

    private _targets: EditorObject[] = [];

    private _widgets: RotationWidget[] = [];    

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

      this._editor.requestRender();

    }

    /** Informs the Tool that it's being deactivated. */
    deactivate() {

      this._reset();

      this._editor.requestRender();

    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      let intersections = this._widgets.map(w => w.test(event, this._editor));

      let intersection = _.minBy(intersections, i => i.distance);
      if (intersection) {

        this._editor.setStatus('Click and drag to rotate object around ' + intersection.widget.name);

        this._widgets.forEach(w => {
          if (w === intersection.widget) {
            w.setState(WidgetState.Hovered);
          } else {
            w.setState(WidgetState.Normal);
          }
        });

        this._editor.requestRender();

      }

    }

    notifyMouseDown(event: JQueryMouseEventObject): void { }

    notifyMouseUp(event: JQueryMouseEventObject): void { }
    
    notifyKeyDown(event: JQueryKeyEventObject): void { }

    private _reset() {

      if (this._widgets) {
        this._widgets.forEach(w => this._editor.removeFromScene(w.threeObject));
      }

      this._rotating = false;
      this._targets = [];
      this._widgets = [];

    }

    private _setUp() {

      if (this._editor.selectedObjects.length === 0) return;

      // TEMPORARY SINGLE TARGET MODE
      let target = this._editor.selectedObjects[0];

      this._targets = [ target ];

      // Build rotation widgets

      // rotate around Y
      let wy = new RotationWidget('Y', Helpers.OrthoPlane.XZ, 0x00ff00);

      // rotate around X
      let wx = new RotationWidget('X', Helpers.OrthoPlane.YZ, 0xff0000);

      // rotate around Z
      let wz = new RotationWidget('Z', Helpers.OrthoPlane.XY, 0x0000ff);

      this._widgets = [ wx, wy, wz ];

      this._widgets.forEach(w => {
        w.setPosition(target.getWorldPosition());
        this._editor.addToScene(w.threeObject);
      });

    }

  }
}
