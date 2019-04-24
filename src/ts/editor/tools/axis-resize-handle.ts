namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;

  export interface AxisResizeHandleOptions {

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
  }

  export class AxisResizeHandle implements ResizeHandle {

    private static Geometry = new THREE.SphereBufferGeometry(1, 22, 12);

    private static BaseMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.FrontSide
    });

    private static HoveredMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.FrontSide
    });

    private static ResizingMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      side: THREE.FrontSide
    });

    private static ArrowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      depthTest: false,
      transparent: false,
      side: THREE.FrontSide
    });

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

    private _root: THREE.Group = new THREE.Group();

    /** The handle mesh. */
    private _handleMesh: THREE.Mesh = new THREE.Mesh(AxisResizeHandle.Geometry, AxisResizeHandle.BaseMaterial);

    private _arrows: THREE.Group = new THREE.Group();

    constructor(options: AxisResizeHandleOptions) {

      if (!options) throw new Error('"options" must be defined');

      this._radius = options.radius;
      this._axis.copy(options.axis);
      this._location.copy(options.location);
      this._applyDelta = options.applyDelta;

      if (options.minDelta != null) {
        this._minDelta = options.minDelta;
      } else {
        this._minDelta = null;
      }

      this._handleMesh.scale.set(this._radius, this._radius, this._radius);

      let cylinder = new THREE.CylinderGeometry(0.1, 0.1, 0.666, 12);
      let cone = new THREE.ConeGeometry(0.15, .333, 12);
      cone.translate(0, 0.55, 0);
      cylinder.merge(cone);
      let arrow = new THREE.Mesh(cylinder, AxisResizeHandle.ArrowMaterial);
      arrow.position.set(0, 0.666, 0);
      this._arrows.add(arrow);

      cylinder = new THREE.CylinderGeometry(0.1, 0.1, 0.666, 12);
      cone = new THREE.ConeGeometry(0.15, .333, 12);
      cone.translate(0, 0.55, 0);
      cylinder.merge(cone);
      cylinder.scale(1, -1, 1);
      arrow = new THREE.Mesh(cylinder, AxisResizeHandle.ArrowMaterial);
      arrow.position.set(0, -0.666, 0);
      this._arrows.add(arrow);

      this._arrows.visible = false;
      
//      this._handleMesh.add(arrows);

      this._root.add(this._handleMesh);
      this._root.add(this._arrows);
      this._root.position.copy(this._location);
      this._root.quaternion.setFromUnitVectors(M.Vector3.PositiveY, this._axis);
    }

    public get hovered() { return this._hovered; }
    public set hovered(value: boolean) {
      this._hovered = value;
      this._updateHandleObject();
    }

    public get visible() { return this._handleMesh.visible; }
    public set visible(value) {
      this._handleMesh.visible = value;
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

      this._updateHandleObject();
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
        this._updateHandleObject();
  
        return this._delta;
      }

    resizeEnd(mouseEvent: JQueryMouseEventObject): number {
      if (!mouseEvent) throw new Error('"mouseEvent" can not be null or undefined');

      this._resizing = false;
      this._origin = null;

      this._updateHandleObject();

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


    private _updateHandleObject() {

      let handle = this._handleMesh;

      // Set handle material from current state.
      let handleMaterial = AxisResizeHandle.BaseMaterial;
      let arrowsMaterial = null;
      this._arrows.visible = false;
      if (this._resizing) {
        handleMaterial = AxisResizeHandle.ResizingMaterial;
        arrowsMaterial = AxisResizeHandle.ArrowMaterial;
        // arrowsMaterial = AxisResizeHandle.ResizingMaterial;
      } else if (this._hovered) {
        handleMaterial = AxisResizeHandle.HoveredMaterial;
        arrowsMaterial = AxisResizeHandle.ArrowMaterial;
        // arrowsMaterial = AxisResizeHandle.BaseMaterial;
      }

      handle.material = handleMaterial;
      if (!arrowsMaterial) {
        this._arrows.visible = false;
      } else {
        this._arrows.visible = true;
        this._arrows.traverse(o3d => {
          if (o3d instanceof THREE.Mesh) {
            o3d.material = arrowsMaterial;
          }
        });
      }

      // // Set rotation and scale from current state.
      // handle.scale.set(this._width, this._height, 1);
      // //handle.rotation
      // let normal = this._normal || Helpers.getNormalFromOrthoPlane(this._plane);
      // handle.quaternion.setFromUnitVectors(M.Vector3.PositiveZ, normal);

      // Update our position.
      this._root.position.copy(this._location);

      if (this._resizing) {
        this._root.position.addScaledVector(this._axis, this._delta);
      }

    }

  }
}