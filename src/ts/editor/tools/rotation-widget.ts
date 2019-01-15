namespace PRKR.Editor.Tools {

  import OrthoPlane = Helpers.OrthoPlane;

  export class RotationWidget {

    private _name: string;
    private _color: number;
    private _plane: OrthoPlane;
    private _state: WidgetState;

    private _root: THREE.Object3D;
    private _clippedRing: THREE.Mesh;
    private _fullRing: THREE.Mesh;
    private _clippedMaterial: THREE.MeshBasicMaterial;
    private _fullMaterial: THREE.MeshBasicMaterial;

    constructor(name: string, plane: OrthoPlane, color: number) {

      this._name = name;
      this._plane = plane;
      this._color = color;
      this._state = WidgetState.Normal;

      this._buildObject();
      this._applyState();

    }

    get name(): string {
      return this._name;
    }

    get plane(): OrthoPlane {
      return this._plane;
    }

    get threeObject(): THREE.Object3D {
      return this._root;
    }

    setPosition(p: THREE.Vector3) {

      this._root.position.copy(p);

    }

    setState(state: WidgetState) {
      if (state == null) state = WidgetState.Normal;

      this._state = state;

      this._applyState(state);
    }

    setClippingPlanes(clippingPlanes: THREE.Plane[]) {
      this._clippedMaterial.clippingPlanes = [].concat(clippingPlanes);
    }

    test(mouse: JQueryMouseEventObject, editor: ParcourEditor): WidgetHitTestResult {
      let intersection = editor.projectMouseOnPlane(
        new THREE.Vector2(mouse.clientX, mouse.clientY),
        this._clippedRing.position,
        Helpers.getNormalFromOrthoPlane(this._plane)
      );

      let result = Object.assign(intersection, {
        widget: this
      });

      return  result;
    }

    private _buildObject(): void {

      let ringGeo = new THREE.RingBufferGeometry(0.75, 1, 20, 1);
      this._clippedMaterial = new THREE.MeshBasicMaterial({
        color: this._color,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      this._fullMaterial = new THREE.MeshBasicMaterial({
        color: this._color,
        transparent: true,
        opacity: 0.333,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      this._clippedRing = new THREE.Mesh(ringGeo, this._clippedMaterial);
      this._fullRing = new THREE.Mesh(ringGeo, this._fullMaterial);

      this._root = new THREE.Group();
      this._root.add(this._clippedRing);
      this._root.add(this._fullRing);

      let normal = Helpers.getNormalFromOrthoPlane(this._plane);
      this._root.quaternion.setFromUnitVectors(M.Vector3.PositiveZ, normal);

    }

    private _applyState(state?: WidgetState) {

      switch(state || this._state) {
        case WidgetState.Normal:
        default:
          this._clippedMaterial.opacity = 0.333;
          this._fullRing.visible = false;
          break;

        case WidgetState.Hovered:
          this._clippedMaterial.opacity = 1;
          this._fullRing.visible = true;
          break;
      }

    }

  }
}
