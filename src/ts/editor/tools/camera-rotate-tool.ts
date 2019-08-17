/// <reference path="./tool.ts" />

namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;

  export class CameraRotateTool extends Tool {

    /** Indicates if the camera is currently being rotated. */
    private _rotating: boolean = false;

    private _origin: Vector2 = new Vector2();

    private _originalElevation: number;
    private _originalOrientation: number;

    constructor(private _editor: ParcourEditor) {
      super();
    }

    get name() { return 'camera-rotate'; }
    get displayName() { return 'Rotate Camera'; }
    get enabled() { return true; }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher { 
      return KeyboardMatcher.for({ keyCode: 66 /* B */ });
    }    

    public activate() {
      this._editor.setPointer('-webkit-grab');
      this._editor.setStatus('Click and drag to rotate camera');
    }

    public notifyMouseDown(event: JQuery.MouseEventBase): void {

      this._rotating = true;
      let rig: CameraRig = this._editor.getCameraRig();
      this._origin.set(event.offsetX, event.offsetY);
      this._originalElevation = rig.elevation;
      this._originalOrientation = rig.orientation;

      // console.debug(
      //   'CameraRotate mouse down',
      //   'elevation=', rig.elevation,
      //   'orientation=', rig.orientation);

      this._editor.setPointer('-webkit-grabbing');
    }

    public notifyMouseMove(event: JQuery.MouseEventBase): void {
      if (this._rotating) {
        let delta = new Vector2(
          (event.offsetX - this._origin.x),
          (event.offsetY - this._origin.y)
        );

        /** X is orientation and Y is elevation. */

        let rig = this._editor.getCameraRig();
        rig.elevation = this._originalElevation + delta.y * 0.02;
        rig.orientation = this._originalOrientation + delta.x * -0.02;

      // console.debug(
      //   'CameraRotate mouse down',
      //   'elevation=', rig.elevation,
      //   'orientation=', rig.orientation);

        this._editor.requestRender();

      }
    }

    public notifyMouseUp(event: JQuery.MouseEventBase): void {

      this._rotating = false;
      this._editor.setPointer('-webkit-grab');

    }

  }
}