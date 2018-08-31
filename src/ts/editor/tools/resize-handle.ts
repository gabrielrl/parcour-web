/// <reference path="./resize-helper.ts" />

namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;

  /** Option object passed to `ResizeHandle`'s constructor. */
  export interface ResizeHandleOptions {
    width: number;
    height: number;
    /** Axes on which the handle can move. Each component should be either 0 or 1. */
    axes?: Vector3;
    /** The handle's resting location (base position). */
    location?: Vector3;
    minDelta?: Vector3;
    maxDelta?: Vector3;

    applyDelta?: Function;
  }

  export class ResizeHandle extends THREE.Object3D {

    private static Geometry = new THREE.PlaneGeometry(1, 1);

    private static BaseMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    private static HoveredMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    private static ResizingMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    private _width: number;

    private _height: number;

    /** Axes on which the handle can move. Each component should be either 0 or 1. */
    private _axes: Vector3 = new Vector3();

    /** The handle's resting location (base position). */
    private _location: Vector3 = new Vector3();

    /** The minimum allowed delta value. Can be null. */
    private _minDelta: Vector3 = null;

    /** The maximum allowed delta value. Can be null. */
    private _maxDelta: Vector3 = null;

    /** User provided function to apply the handle delta. */
    private _applyDelta: Function = null;

    private _hovered: boolean = false;

    private _resizing: boolean = false;

    /** The current delta (movement) away from the resting location. */
    private _delta: Vector3 = new Vector3();

    /** The movement's origin. It is the world location of the hit point on the handle. */
    private _origin: THREE.Vector3 = null;

    /** The handle mesh. */
    private _handleMesh: THREE.Mesh = new THREE.Mesh(ResizeHandle.Geometry, ResizeHandle.BaseMaterial);

    constructor(
      private _editor: ParcourEditor,
      options: ResizeHandleOptions
    ) {
      super();

      if (!options) throw new Error('"options" must be defined');

      this._width = options.width;
      this._height = options.height;
      this._axes.copy(options.axes);

      if (options.location) {
        this._location.copy(options.location);
      }
      if (options.minDelta) {
        this._minDelta = new Vector3().copy(options.minDelta);
      }
      if (options.maxDelta) {
        this._maxDelta = new Vector3().copy(options.maxDelta);
      }
      if (options.applyDelta) {
        this._applyDelta = options.applyDelta;
      }

      this.add(this._handleMesh);

      this._handleMesh.setRotationFromAxisAngle(M.Vector3.PositiveX, M.PI_OVER_TWO);

      this._updateHandleObject();
    }

    public get width() { return this._width; }
    public set width(value) { this._width = value; }

    public get height() { return this._height; }
    public set height(value) { this._height = value;}

    public get location() { return this._location; }

    public applyDelta(...args) {
      if (this._applyDelta) {
        return this._applyDelta(...args);
      } else {
        return null;
      }
    }

    public get hovered() { return this._hovered; }
    public set hovered(value: boolean) { this._hovered = value; }

    /**
     * Updates the object. Call after modifying any property.
     */
    public update() {
      this._updateHandleObject();      
    }

    public resizeStart(hitInfo: PRKR.Editor.Tools.ResizeHelperHit) {
      if (!hitInfo) throw new Error('"hitInfo" parameter can not be null or undefined');

      this._origin = hitInfo.point;
      
      this._resizing = true;
      this._delta.set(0, 0, 0);

      this._updateHandleObject();
    }

    /**
     * Returns the current resize delta.
     */
    public resizeMove(mouseEvent: JQueryMouseEventObject) {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');
      if (!this._resizing) return;

      let intersection = this._editor.projectMouseOnFloor(new THREE.Vector2(mouseEvent.clientX, mouseEvent.clientY));

      let delta = new Vector3();
      delta.subVectors(intersection.point, this._origin);

      // Adjust delta keeping only supported axes.
      delta.set(
        delta.x * this._axes.x,
        delta.y * this._axes.y,
        delta.z * this._axes.z
      );

      // Apply the minimal allowed delta.
      if (this._minDelta) {
        delta.max(this._minDelta);
      }
      // Apply the maximal allowed delta.
      if (this._maxDelta) {
        delta.min(this._maxDelta);
      }

      console.debug('delta restricted to direction and minimum = ', delta);

      // Update state.
      this._delta.copy(delta);

      this._updateHandleObject();

      return delta;
    }

    /**
     * Returns the current resize delta.
     */
    public resizeEnd(mouseEvent: JQueryMouseEventObject) {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');

      this._resizing = false;
      this._origin = null;

      this._updateHandleObject();

      return this._delta.clone();
    }

    /**
     * Updates the object (and handle) to reflect the current state.
     */
    private _updateHandleObject() {
      let handle = this._handleMesh;

      // Set handle material from current state.
      let material = ResizeHandle.BaseMaterial;
      if (this._resizing) {
        material = ResizeHandle.ResizingMaterial;
      } else if (this._hovered) {
        material = ResizeHandle.HoveredMaterial;
      }

      handle.material = material;

      // Set rotation and scale from current state.
      handle.scale.set(this._width, this._height, 1);

      // Update our position.
      this.position.addVectors(
        this._location,
        new THREE.Vector3(this._width / 2, 0, this._height / 2)
      );

      if (this._resizing) {
        this.position.add(this._delta);
      }

    }
  }
}