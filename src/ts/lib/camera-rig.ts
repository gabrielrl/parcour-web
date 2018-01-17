namespace PRKR {

  import Object3D = THREE.Object3D;
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import Euler = THREE.Euler;
  import OrthographicCamera = THREE.OrthographicCamera;
  import PerspectiveCamera = THREE.PerspectiveCamera;

  /**
   * Camera rig object.
   * Add it to a scene. Set its position to define what will be centered in the view.
   * Set its `elevation` to rotate around the +X axis. Set its `orientation` to rotate
   * around the +Y axis. Set its `fieldOfView` to "zoom". Set its `aspectRatio` to match
   * the viewport. Use one of its cameras (perspective or orthographic) to render using
   * all the supplied parameters.
   */
  export class CameraRig extends Object3D {

    /** Viewport aspect ratio: width divided by height. */
    private _aspectRatio: number;

    /** Camera field of view. TODO expand description. */
    private _fieldOfView: number = 10 * Math.SQRT2;

    /** Pivot rotation expressed as a "Euler" object. */
    private _euler: Euler = new Euler(0, 0, 0, 'YXZ');

    /** Target orientation if not null. */
    private _targetOrientation: number = null;

    /** Direction of the orientation shift (±1) */
    private _rotationDirection: number = 0;

    /** The orthographic camera. */
    private _orthoCamera: OrthographicCamera;
    /** The perspective camera. */
    private _perspectiveCamera: PerspectiveCamera;

    /** The pivot object around which cameras rotate. */
    private _pivot: Object3D;

    /**
     * 
     * @param aspectRatio Rendering viewport's width / height ratio.
     * @param fieldOfView Horizontal "field of view".
     */
    constructor(aspectRatio: number, fieldOfView: number) {
      super();
      this.name = 'camrig';

      // Build the object hierarchy.
      this._pivot = new Object3D();
      this._pivot.name = 'camrig-pivot';

      if (aspectRatio === 0) { aspectRatio = 1; }
      if (fieldOfView === 0) { fieldOfView = 10; }

      this._aspectRatio = aspectRatio;
      this._fieldOfView = fieldOfView;

      this._orthoCamera = new OrthographicCamera(
        -1, 1, 1, -1, 0, 500
      );
      this._orthoCamera.name = 'camrig-ortho';

      this._perspectiveCamera = new PerspectiveCamera(50, aspectRatio, 1, 500);
      this._perspectiveCamera.name = 'camrig-persp';

      this._updateCameras();

      this._pivot.add(this._orthoCamera);
      this._pivot.add(this._perspectiveCamera);
      this.add(this._pivot);
    }

    get aspectRatio() { return this._aspectRatio; }
    set aspectRatio(value) {
      this._aspectRatio = value;
      this._updateCameras();
    }

    get fieldOfView() { return this._fieldOfView; }
    set fieldOfView(value) {
      this._fieldOfView = value;
      this._updateCameras();
    }

    get orientation() { return this._euler.y; }
    set orientation(value) {
      value = M.wrapNumber(value, 0, M.TWO_PI);
      this._euler.y = value;
      this.updatePivot();
    }

    get elevation() { return -this._euler.x; }
    set elevation(value) {
      value = M.clamp(value, -M.PI_OVER_TWO, M.PI_OVER_TWO);
      this._euler.x = -value;
      this.updatePivot();
    }

    get orthographicCamera() { return this._orthoCamera; }
    get perspectiveCamera() { return this._perspectiveCamera; }

    /** 
     * Rotates (alter the orientation) of the camera rig by
     * the specified angle.
     * @param angle Angle in radian.
     */
    public rotateBy(angle: number) {
      let target: number;
      if (this._targetOrientation != null) {
        target = this._targetOrientation + angle;
      } else {
        target = this.orientation + angle;
      }
      target = M.wrapNumber(target, 0, M.TWO_PI);
      this._targetOrientation = target;
      let diff = M.wrappedDiff(target, this.orientation, 0, M.TWO_PI);
      this._rotationDirection = diff >= 0 ? 1 : -1;
    }

    public update(delta: number, ellapsed: number) {
      if (this._targetOrientation != null) {
        let step = Math.PI / 500 * delta;
        let diff = M.wrappedDiff(
          this._targetOrientation, this.orientation, 0, M.TWO_PI);
       
        if (Math.abs(diff) < step) {
          this.orientation = this._targetOrientation;
          this._targetOrientation = null;
        } else {
          this.orientation += step * this._rotationDirection;
        }

      }
    }

    private _updateCameras() {

      // TODO drop the zoom...
      //this._fieldOfView
      let width: number;
      let height: number;
      if (this._aspectRatio > 1) {
        // Wide
        height = this._fieldOfView;
        width = this._fieldOfView * this._aspectRatio;

      } else {
        // Tall
        width = this._fieldOfView;
        height = this._fieldOfView / this._aspectRatio;
      }
      
      this._orthoCamera.left = width / -2;
      this._orthoCamera.right = width / 2;
      this._orthoCamera.bottom = height / -2;
      this._orthoCamera.top = height / 2;
      this._orthoCamera.position.z = 100;

      // Perspective camera.
      this._perspectiveCamera.aspect = this._aspectRatio;      
      // Camera position in the rig.      
      this._perspectiveCamera.position.z = this._fieldOfView; // FIX
      this._orthoCamera.position.z = 100; // Adjust?

      this._orthoCamera.updateProjectionMatrix();
      this._perspectiveCamera.updateProjectionMatrix();

    }

    private updatePivot() {
      this._pivot.setRotationFromEuler(this._euler);
    }
  }
}