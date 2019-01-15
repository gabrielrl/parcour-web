namespace PRKR.Editor.Tools {

  import OrthoPlane = Helpers.OrthoPlane;

  export class RotationWidget {

    private _name: string;
    private _color: number;
    private _plane: OrthoPlane;
    private _state: WidgetState;

    private _threeObject: THREE.Object3D;
    private _material: THREE.MeshBasicMaterial;

    constructor(name: string, plane: OrthoPlane, color: number) {

      this._name = name;
      this._plane = plane;
      this._color = color;
      this._state = WidgetState.Normal;

      this._buildObject();

    }

    get name(): string {
      return this._name;
    }

    get threeObject(): THREE.Object3D {
      return this._threeObject;
    }

    setPosition(p: THREE.Vector3) {

      this._threeObject.position.copy(p);

    }

    setState(state: WidgetState) {
      if (state == null) state = WidgetState.Normal;

      this._state = state;

      switch(this._state) {
        case WidgetState.Normal:
        default:
          this._material.opacity = 0.333;
          break;

        case WidgetState.Hovered:
          this._material.opacity = 1;
          break;
      }
    }

    test(mouse: JQueryMouseEventObject, editor: ParcourEditor): WidgetHitTestResult {
      let intersection = editor.projectMouseOnPlane(
        new THREE.Vector2(mouse.clientX, mouse.clientY),
        this._threeObject.position,
        Helpers.getNormalFromOrthoPlane(this._plane)
      );

      let result = Object.assign(intersection, {
        widget: this
      });

      return  result;
    }

    private _buildObject(): void {

      let ringGeo = new THREE.RingBufferGeometry(0.75, 1, 20, 1);
      this._material = new THREE.MeshBasicMaterial({
        color: this._color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      let ring = new THREE.Mesh(ringGeo, this._material);

      let normal = Helpers.getNormalFromOrthoPlane(this._plane);

      ring.quaternion.setFromUnitVectors(M.Vector3.PositiveZ, normal);

      this._threeObject = ring;
      
    }

  }
}
