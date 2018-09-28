/// <reference path="./tool.ts" />

namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;

  export class CameraPanTool extends Tool {

    /** Indicates if the camera is currently being moved. */
    private _panning: boolean = false;

    private _origin: Vector2 = new Vector2();

    private _originalCameraPosition: Vector3 = new Vector3();
    
    constructor(private _editor: ParcourEditor) {
      super();
    }

    public get name() { return 'camera-pan'; }

    public get displayName() { return 'Pan Camera'; }

    public get enabled() { return true; }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({ keyCode: 86 /* V */ });
    }

    public activate() {
      this._editor.setPointer('-webkit-grab');
      this._editor.setStatus('Click and drag to pan camera');
    }

    public notifyMouseDown(event: JQueryMouseEventObject): void {

      this._panning = true;
      this._origin.set(event.offsetX, event.offsetY);
      this._editor.getCameraPosition(this._originalCameraPosition);

      this._editor.setPointer('-webkit-grabbing');
    }

    public notifyMouseMove(event: JQueryMouseEventObject): void {

      if (this._panning) {

        let delta = new Vector2(
          (event.offsetX - this._origin.x),
          (event.offsetY - this._origin.y)
        );

        // console.debug('CameraPan mouse move', 'delta=', delta);

        /** Converts from screen to world. */
        

        let target = new Vector3().copy(this._originalCameraPosition);

        let x = new Vector3();
        let y = new Vector3();
        this._editor.computeScreenToWorldVectors(x, y);
        target.addScaledVector(x, -delta.x);
        target.addScaledVector(y, -delta.y);
        this._editor.setCameraPosition(target);

        // let newPosition = new Vector3(
        //   this._originalCameraPosition.x + delta.x * ,
        //   this._originalCameraPosition.y,
        //   this._originalCameraPosition.z + delta.y
        // );
        // this._editor.setCameraPosition(newPosition);

      }

    }

    public notifyMouseUp(event: JQueryMouseEventObject): void {

      this._panning = false;
      this._editor.setPointer('-webkit-grab');

    }
  }
}