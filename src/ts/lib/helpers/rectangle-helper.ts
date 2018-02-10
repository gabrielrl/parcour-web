/// <reference path="./constants.ts" />

namespace PRKR.Helpers {

  import LineSegments = THREE.LineSegments;
  import Object3D = THREE.Object3D;
  import Box2 = THREE.Box2;
  import Geometry = THREE.Geometry;
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import Mesh = THREE.Mesh;
  import C = PRKR.Helpers.Constants;
  
  export enum OrthoPlane {
    XZ = 1,
    XY = 2
    // TODO (when needed) XY, ZY ...
  };

  export interface RectangleHelperOptions {
    useLines?: boolean,
    useFaces?: boolean,
    lineMaterial?: THREE.LineBasicMaterial | THREE.LineDashedMaterial,
    faceMaterial?: THREE.Material
  }

  export class RectangleHelper extends Object3D {

    private _useLines: boolean = true;
    private _useFaces: boolean = true;

    private _lines: RectangleLineHelper;
    private _faces: RectangleFaceHelper;

    constructor(
      rect: Box2,
      options?: RectangleHelperOptions,
      plane?: OrthoPlane
    ) {
      super();

      // Apply options.
      if (options) {
        if (options.useLines !== undefined) this._useLines = !!options.useLines;
        if (options.useFaces !== undefined) this._useFaces = !!options.useFaces;
      }

      // Setup lines.
      if (this._useLines) {
        let lineMaterial = (options && options.lineMaterial)
          ? options.lineMaterial
          : null;
        this._lines = new RectangleLineHelper(rect, plane, lineMaterial);
        this.add(this._lines);
      }

      // Setup faces.
      if (this._useFaces) {
        let faceMaterial = (options && options.faceMaterial)
          ? options.faceMaterial
          : null;
        this._faces = new RectangleFaceHelper(rect, plane, faceMaterial);
        this.add(this._faces);
      }
    }

    public setLineMaterial(material: THREE.Material) {
      if (this._lines) {
        this._lines.material = material;
      }
    }

    public setFaceMaterial(material: THREE.Material) {
      if (this._faces) {
        this._faces.material = material;
      }
    }
  }

  export class RectangleLineHelper extends LineSegments {

    constructor(
      rect: Box2,
      plane?: OrthoPlane,
      material?: THREE.LineBasicMaterial | THREE.LineDashedMaterial
    ) {

      let p = plane || OrthoPlane.XZ;
      let m = material || C.DefaultLineMaterial;
      let g = new Geometry();

      RectangleLineHelper.pushVertices(g.vertices, rect, p);

      super(g, m);

      g.computeLineDistances();
    }

    static pushVertices(array: Vector3[], rect: Box2, plane: OrthoPlane) {

      if (!plane) { throw new Error('plane must be defined'); }

      let mapping = getMappingFromOrthoPlane(plane);

      array.push(mapping(rect.min.x, rect.min.y));
      array.push(mapping(rect.max.x, rect.min.y));
      array.push(mapping(rect.max.x, rect.min.y));
      array.push(mapping(rect.max.x, rect.max.y));
      array.push(mapping(rect.max.x, rect.max.y));
      array.push(mapping(rect.min.x, rect.max.y));
      array.push(mapping(rect.min.x, rect.max.y));
      array.push(mapping(rect.min.x, rect.min.y));
    }
  }

  export class RectangleFaceHelper extends Mesh {

    constructor(rect: Box2, plane?: OrthoPlane, material?: THREE.Material) {

      let p = plane || OrthoPlane.XZ;
      let m = material || C.DefaultFaceMaterial;

      let g = RectangleFaceHelper.buildGeometry(rect, p);

      super(g, m);
    }

    static buildGeometry(
      rect: Box2,
      plane: OrthoPlane
    ): Geometry {

      let mapping = getMappingFromOrthoPlane(plane);

      let g = new Geometry();

      g.vertices.push(mapping(rect.min.x, rect.min.y));
      g.vertices.push(mapping(rect.min.x, rect.max.y));
      g.vertices.push(mapping(rect.max.x, rect.max.y));
      g.vertices.push(mapping(rect.max.x, rect.min.y));

      g.faces.push(new THREE.Face3(0, 1, 2));
      g.faces.push(new THREE.Face3(2, 3, 0));

      return g;
    }

  }

  function getMappingFromOrthoPlane(plane: OrthoPlane): (x: number, y: number) => Vector3 {
      let mapping: (x: number, y: number) => Vector3;

      switch(plane) {
        case OrthoPlane.XZ: {
          mapping = (x, y) => { return new Vector3(x, 0, y); }
          break;
        } case OrthoPlane.XY: {
          mapping = (x, y) => { return new Vector3(x, y, 0); }
          break;
        }
      }

      if (!mapping) { throw new Error(`Unsupported plane type ${plane}`); }

      return mapping;
  }
}