namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;

  export interface AxisResizeHandleOptions {

    /** A short string used to identify the handle in a set and to match it across helpers. */
    label: string;

    /** The handle's radius. */
    radius: number;

    /** The axis along witch the handle moves */
    axis: Vector3;

    /** The handle's resting location (base position). */
    location: Vector3;

    /** User provided function to apply the handle movement on the axis as a resize operation. */
    applyDelta: (v: number) => ResizeDelta;

    /** Minimum valid delta value. */
    minDelta?: number;

    /** Axis color. */
    color?: number;
  }

  export class AxisResizeHandle implements ResizeHandle {

    private static Geometry = new THREE.SphereBufferGeometry(1, 22, 12);

    private static DefaultColor = 0x0000ff;

    /** A short string used to identify the handle in a set and to match it across helpers. */
    private _label: string;

    /** The handle's radius. */
    private _radius: number;

    /** The axis along witch the handle moves */
    private _axis: Vector3 = new Vector3();

    /** The handle's resting location (base position). */
    private _location: Vector3 = new Vector3();

    /** User provided function to apply the handle movement on the axis as a resize operation. */
    private _applyDelta: (v: number) => ResizeDelta = null;

    /** Minimum valid delta value. */
    private _minDelta?: number;

    private _hovered: boolean = false;

    private _resizing: boolean = false;

    /** The current delta (movement) away from the resting location. */
    private _delta: number = 0;

    /** The movement's origin. It is the world location of the hit point on the handle. */
    private _origin: THREE.Vector3 = null;

    /** The handle's color. */
    private _color: THREE.Color;

    private _root: THREE.Group = new THREE.Group();

    private _handleMaterial: THREE.MeshBasicMaterial;

    private _arrowMaterial: THREE.MeshBasicMaterial;

    /** The handle mesh. */
    private _handleMesh: THREE.Mesh;

    private _arrows: THREE.Group = new THREE.Group();

    constructor(options: AxisResizeHandleOptions) {

      if (!options) throw new Error('"options" must be defined');

      this._label = options.label;
      this._radius = options.radius;
      this._axis.copy(options.axis);
      this._location.copy(options.location);
      this._applyDelta = options.applyDelta;

      if (options.minDelta != null) {
        this._minDelta = options.minDelta;
      } else {
        this._minDelta = null;
      }

      if (options.color != null) {
        this._color = new THREE.Color(options.color);
      } else {
        this._color = new THREE.Color(AxisResizeHandle.DefaultColor);
      }

      this._build();

    }

    public get hovered() { return this._hovered; }
    public set hovered(value: boolean) {
      this._hovered = value;
      this._update();
    }

    public get visible() { return this._root.visible; }
    public set visible(value) {
      this._root.visible = value;
    }

    /** A short string used to identify the handle in a set and to match it across helpers. */
    get label() {
      return this._label;
    }

    /** The Object3D to add to the scene to display. */
    get sceneObject(): THREE.Object3D {
      return this._root;
    }

    /** The Object3D to use for hit test. */
    get hitObject(): THREE.Object3D {
      return this._handleMesh;
    }

    resizeStart(hit: ResizeHelperHit) {
      if (!hit) throw new Error('"hitInfo" parameter can not be null or undefined');

      this._origin = hit.point;
      this._resizing = true;
      this._delta = 0;

      this._update();
    }

    resizeMove(mouseEvent: JQueryMouseEventObject, editor: ParcourEditor): number {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');
      if (!this._resizing) return;

      // Cross the camera orientation and the axis to get a plane on which we project the mouse cursor.
      let c = new Vector3().crossVectors(
        editor.getCameraRig().getWorldDirection(),
        this._axis
      );
      c.add(this._origin);

      let plane = new THREE.Plane().setFromCoplanarPoints(
        this._origin,
        this._axis.clone().add(this._origin),
        c
      );

      let intersection =
        editor.projectMouseOnPlane(
          new THREE.Vector2(mouseEvent.clientX, mouseEvent.clientY),
          this._origin,
          plane.normal
        );

        let delta = new Vector3();
        delta.subVectors(intersection.point, this._origin);

        let restricted = delta.clone().projectOnVector(this._axis);

        this._delta = restricted.length();
        let dot = delta.clone().dot(this._axis);
        if (dot < 0) this._delta *= -1;

        // Update state.
        this._update();
  
        return this._delta;
      }

    resizeEnd(mouseEvent: JQueryMouseEventObject): number {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');

      this._resizing = false;
      this._origin = null;

      this._update();

      return this._delta;
    }

    applyDelta(handleDelta: number): ResizeDelta {

      if (this._minDelta != null && handleDelta < this._minDelta) {
        handleDelta = this._minDelta;
      }

      if (this._applyDelta) {
        return this._applyDelta(handleDelta);
      } else {
        return null;
      }
    }

    /**
     * Checks if another resize handle is compatible with the current one.
     * 
     * @param handle Another resize handle to check for compatibility.
     */
    isCompatible(handle: ResizeHandle): boolean {
      return handle instanceof AxisResizeHandle && handle.label === this._label;
    }


    private _update() {

      if (this._resizing) {
        this._handleMaterial.opacity = 1;
        this._arrowMaterial.opacity = 1;
        this._arrows.visible = true;
      } else if (this._hovered) {
        this._handleMaterial.opacity = 1;
        this._arrowMaterial.opacity = 0.333;
        this._arrows.visible = true;
      } else {
        this._handleMaterial.opacity = 0.333;
        this._arrows.visible = false;
      }

      // Update our position.
      this._root.position.copy(this._location);

      if (this._resizing) {
        this._root.position.addScaledVector(this._axis, this._delta);
      }

    }

    private _build() {

      this._handleMaterial = new THREE.MeshBasicMaterial({
        color: this._color || 0x0000ff,
        depthTest: false,
        transparent: true,
        opacity: 0.333,
        side: THREE.FrontSide
      }); 

      this._handleMesh = new THREE.Mesh(AxisResizeHandle.Geometry, this._handleMaterial);

      this._handleMesh.scale.set(this._radius, this._radius, this._radius);

      this._arrowMaterial = new THREE.MeshBasicMaterial({
        color: this._color,
        depthTest: false,
        transparent: true,
        opacity: 0.333,
        side: THREE.FrontSide
      });       

      // let cylinder = new THREE.CylinderGeometry(0.1, 0.1, 0.666, 12);
      let cone = new THREE.ConeGeometry(0.2, .5, 12);
      // cone.translate(0, 0.5, 0);
      // cylinder.merge(cone);
      // let arrow = new THREE.Mesh(cylinder, this._arrowMaterial);
      let arrow = new THREE.Mesh(cone, this._arrowMaterial);
      arrow.position.set(0, 0.666, 0);
      this._arrows.add(arrow);

      // cylinder = new THREE.CylinderGeometry(0.1, 0.1, 0.666, 12);
      cone = new THREE.ConeGeometry(0.2, .5, 12);
      // cone.translate(0, 0.5, 0);
      // cylinder.merge(cone);
      cone.scale(1, -1, 1);
      arrow = new THREE.Mesh(cone, this._arrowMaterial);
      arrow.position.set(0, -0.666, 0);
      this._arrows.add(arrow);

      this._arrows.visible = false;

      this._root.add(this._handleMesh);
      this._root.add(this._arrows);
      this._root.position.copy(this._location);
      this._root.quaternion.setFromUnitVectors(M.Vector3.PositiveY, this._axis);

    }
  

  }

}