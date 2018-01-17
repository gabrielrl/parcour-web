/// <reference path="./resize-helper.ts" />

namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;

  export interface ResizeHandleOptions {
    width: number;
    height: number;
    direction?: Vector3;
    location?: Vector3;
    minDelta?: Vector3;
  }
  
  export class ResizeHandle extends THREE.Object3D {

    private static DEFAULT_DIRECTION = new Vector3(1, 0, 1);

    private static GEOMETRY = new THREE.PlaneGeometry(1, 1);

    private static MATERIAL = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    private static HOVERED_MATERIAL = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    private static RESIZING_MATERIAL = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    private _width: number;

    private _height: number;

    /** The handle's resize direction(s). */
    private _direction: Vector3 = new Vector3();

    /** The handle's resting location. (base position) */
    private _location: Vector3 = new Vector3();

    /** The minimum allowed delta value. Can be null. */
    private _minDelta: Vector3 = null;

    private _hovered: boolean = false;

    private _resizing: boolean = false;

    private _delta: Vector3 = new Vector3();

    private _origin: THREE.Vector3 = null;

    /** The handle mesh. */
    private _handleMesh: THREE.Mesh = new THREE.Mesh(ResizeHandle.GEOMETRY, ResizeHandle.MATERIAL);

    constructor(
      private _editor: ParcourEditor,
      options: ResizeHandleOptions
    ) {
      super();

      this._direction.copy(ResizeHandle.DEFAULT_DIRECTION);

      this._width = options.width;
      this._height = options.height;
      this._direction.copy(options.direction);

      if (options.location) {
        this._location.copy(options.location);
      }

      if (options.minDelta) {
        this._minDelta = new Vector3().copy(options.minDelta);
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
     * Returns the current resize delta. Internal object, do not modify!
     */
    public resizeMove(mouseEvent: JQueryMouseEventObject) {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');
      if (!this._resizing) return;

      let intersection = this._editor.projectMouseOnFloor(new THREE.Vector2(mouseEvent.clientX, mouseEvent.clientY));

      let delta = new Vector3();
      delta.subVectors(intersection.point, this._origin);

      // Adjust delta keeping only configured direction(s).
      delta.set(
        delta.x * this._direction.x,
        delta.y * this._direction.y,
        delta.z * this._direction.z
      );

      // Apply the minimal allowed delta.
      if (this._minDelta) {
        delta.max(this._minDelta);
      }

      console.debug('delta restricted to direction and minimum = ', delta);

      // Update state.
      this._delta.copy(delta);

      this._updateHandleObject();

      return this._delta;
    }

    /**
     * Returns the current resize delta. Internal object, do not modify!
     */
    public resizeEnd(mouseEvent: JQueryMouseEventObject) {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');

      this._resizing = false;
      this._origin = null;

      this._updateHandleObject();

      return this._delta;
    }

    /**
     * Updates the object (and handle) to reflect the current state.
     */
    private _updateHandleObject() {
      let handle = this._handleMesh;

      // Set handle material from current state.
      let material = ResizeHandle.MATERIAL;
      if (this._resizing) {
        material = ResizeHandle.RESIZING_MATERIAL;
      } else if (this._hovered) {
        material = ResizeHandle.HOVERED_MATERIAL;
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