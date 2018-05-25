namespace PRKR.Helpers {

  import LineSegments = THREE.LineSegments;
  import Object3D = THREE.Object3D;
  import Box2 = THREE.Box2;
  import Geometry = THREE.Geometry;
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import Mesh = THREE.Mesh;
  import C = PRKR.Helpers.Constants;

  export class EmbeddedRectanglesHelper extends Object3D {

    private _rect1: Box2 = new Box2();
    private _rect2: Box2 = new Box2();
    private _plane: OrthoPlane;

    private _outsideRect: Box2;
    private _insideRect: Box2;

    private _useLines: boolean = true;
    private _useFaces: boolean = true;   

    private _line1: RectangleLineHelper;
    private _line2: RectangleLineHelper;
    private _embeddingHelpers: RectangleLineHelper[];

    constructor(
      r1?: Box2,
      r2?: Box2,
      options?: RectangleHelperOptions,
      plane?: OrthoPlane
    ) {
      super();

      r1 = r1 || M.Box2.Unit;
      r2 = r2 || M.Box2.Unit;
      plane = plane || OrthoPlane.XZ;

      this._plane = plane;

      // Apply options.
      if (options) {
        if (options.useLines !== undefined) this._useLines = !!options.useLines;
        if (options.useFaces !== undefined) this._useFaces = !!options.useFaces;
      }

      // Setup rectangle lines.
      if (this._useLines) {
        let lineMaterial = (options && options.lineMaterial)
          ? options.lineMaterial
          : C.DefaultLineMaterial;
        this._line1 = new RectangleLineHelper(M.Box2.Unit, plane, lineMaterial);
        this._line2 = new RectangleLineHelper(M.Box2.Unit, plane, lineMaterial);

        this.add(this._line1);
        this.add(this._line2);

        this._embeddingHelpers = [
          new RectangleLineHelper(M.Box2.Unit, plane),
          new RectangleLineHelper(M.Box2.Unit, plane)
        ];

        this.add(this._embeddingHelpers[0]);
        this.add(this._embeddingHelpers[1]);
      }

      // Setup rectangle faces.
      // if (this._useFaces) {
      //   let faceMaterial = (options && options.faceMaterial)
      //     ? options.faceMaterial
      //     : C.DefaultFaceMaterial;
      //   this._face1 = new RectangleFaceHelper(r1, plane, faceMaterial);
      //   this._face2 = new RectangleFaceHelper(r2, plane, faceMaterial);
      //   this.add(this._face1);
      //   this.add(this._face2);
      // }

      this.setRect1(r1);
      this.setRect2(r2);
    }

    public setPlane(plane: OrthoPlane) {
      // TODO needs to rebuild helpers.
      throw new Error('EmbeddedRectanglesHelper.setPlane() not implemented yet.');
    }

    public setRect1(rect: Box2) {
      if (rect) {
        this._rect1.copy(rect);
        let size = rect.getSize();
        if (size.x < 0.001) {
          this._rect1.min.x -= 0.01;
          this._rect1.max.x += 0.01;
        }
        if (size.y < 0.001) {
          this._rect1.min.y -= 0.01;
          this._rect1.max.y += 0.01;
        }
        this._resizeHelpers();
      }
    }

    public setRect2(rect: Box2) {
      if (rect) {
        this._rect2.copy(rect);
        let size = rect.getSize();
        if (size.x < 0.001) {
          this._rect2.min.x -= 0.01;
          this._rect2.max.x += 0.01;
        }
        if (size.y < 0.001) {
          this._rect2.min.y -= 0.01;
          this._rect2.max.y += 0.01;
        }
        this._resizeHelpers();
      }
    }

    public setLineMaterial(material: THREE.Material) {
      this._line1.material = material;
      this._line2.material = material;
      this._embeddingHelpers.forEach(helper => {
        helper.material = material;
      });
    }

    private _resizeHelpers() {
     
      if (this._line1) {
        this._setPositionAndScale(this._line1, this._rect1);
      }
      // if (this._face1) {
      //   this._setPositionAndScale(this._face1, this._rect1);
      // }
      if (this._line2) {
        this._setPositionAndScale(this._line2, this._rect2);
      }
      // if (this._face2) {
      //   this._setPositionAndScale(this._face2, this._rect2);
      // }
      this._setInsideOutside();
      if (this._outsideRect) {
        let r = new Box2(
          new Vector2(this._outsideRect.min.x, this._insideRect.min.y),
          new Vector2(this._outsideRect.max.x, this._insideRect.max.y)
        );
        this._setPositionAndScale(this._embeddingHelpers[0], r);
        r.set(
          new Vector2(this._insideRect.min.x, this._outsideRect.min.y),
          new Vector2(this._insideRect.max.x, this._outsideRect.max.y)
        )
        this._setPositionAndScale(this._embeddingHelpers[1], r);
      }
      
    }

    private _setPositionAndScale(target: Object3D, rect: Box2) {
      let mapping = getMappingFromOrthoPlane(this._plane);

      let origin = mapping(rect.min.x, rect.min.y);
      let size = rect.getSize();
      if (size.x === 0) size.setX(0.001);
      if (size.y === 0) size.setY(0.001);
      let scale = mapping(size.x, size.y, 1);

      target.position.copy(origin);
      target.scale.copy(scale);
    }

    /**
     * sets `_outsideRect` and `_insideRect` from current `_rect1` and `_rect2`.
     */
    private _setInsideOutside() {
      if (this._rect1.containsBox(this._rect2)) {
        this._outsideRect = this._rect1;
        this._insideRect = this._rect2;
      } else if (this._rect2.containsBox(this._rect1)) {
        this._outsideRect = this._rect2;
        this._insideRect = this._rect1;
      } else {
        this._outsideRect = null;
        this._insideRect = null;
      }
    }
  }

}