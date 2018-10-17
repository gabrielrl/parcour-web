/// <reference path="./constants.ts" />

namespace PRKR.Helpers {

  import LineSegments = THREE.LineSegments;
  import Object3D = THREE.Object3D;
  import Box3 = THREE.Box3;
  import Geometry = THREE.Geometry;
  import Vector3 = THREE.Vector3;
  import C = Helpers.Constants;

  export class BoundingBoxHelper extends Object3D {

    private _useLines: boolean = true;
    private _useFaces: boolean = true;

    private _lines: BoxLineHelper;
    private _faces: BoxFaceHelper;

    constructor(box: Box3, options?: HelperOptions, helperFor?: string) {

      super();

      // Apply options.
      if (options) {
        if (options.useLines !== undefined) this._useLines = !!options.useLines;
        if (options.useFaces !== undefined) this._useFaces = !!options.useFaces;
        if (options.renderOrder !== undefined) this.renderOrder = options.renderOrder;
      }

      if (helperFor) {
        this.helperFor = helperFor;
      }

      // Setup lines.
      if (this._useLines) {
        let lineMaterial = (options && options.lineMaterial)
          ? options.lineMaterial
          : null;
        this._lines = new BoxLineHelper(box, lineMaterial);
        this.add(this._lines);
      }

      // Setup faces.
      if (this._useFaces) {
        let faceMaterial = (options && options.faceMaterial)
          ? options.faceMaterial 
          : null;
        this._faces = new BoxFaceHelper(box, faceMaterial);
        this.add(this._faces);
      }
    }

    /** Optional user reference. Suggestion, put the ID of an object that the box represents. */
    public helperFor?: string;

    //  TODO ... deprecate and remove ...
    public setColor(value: number) {
      if (this._lines) {
        (<THREE.LineBasicMaterial>this._lines.material).color.set(value);
      }
      if (this._faces) {
        (<THREE.MeshBasicMaterial>this._faces.material).color.set(value);
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

  export class BoxLineHelper extends LineSegments {

    constructor(
      box: Box3,
      material?: THREE.LineBasicMaterial | THREE.LineDashedMaterial
    ) {
      let m = material || C.DefaultLineMaterial;
      let g = new Geometry();

      BoxLineHelper.pushVertices(g.vertices, box);

      super(g, m);

      g.computeLineDistances();
    }

    static pushVertices(array: THREE.Vector3[], box: THREE.Box3) {
      // BOTTOM
      // along x
      array.push(new Vector3(box.min.x, box.min.y, box.min.z));
      array.push(new Vector3(box.max.x, box.min.y, box.min.z));
      array.push(new Vector3(box.min.x, box.min.y, box.max.z));
      array.push(new Vector3(box.max.x, box.min.y, box.max.z));
      // along z
      array.push(new Vector3(box.min.x, box.min.y, box.min.z));
      array.push(new Vector3(box.min.x, box.min.y, box.max.z));
      array.push(new Vector3(box.max.x, box.min.y, box.min.z));
      array.push(new Vector3(box.max.x, box.min.y, box.max.z));

      // TOP
      // along x
      array.push(new Vector3(box.min.x, box.max.y, box.min.z));
      array.push(new Vector3(box.max.x, box.max.y, box.min.z));
      array.push(new Vector3(box.min.x, box.max.y, box.max.z));
      array.push(new Vector3(box.max.x, box.max.y, box.max.z));
      // along z
      array.push(new Vector3(box.min.x, box.max.y, box.min.z));
      array.push(new Vector3(box.min.x, box.max.y, box.max.z));
      array.push(new Vector3(box.max.x, box.max.y, box.min.z));
      array.push(new Vector3(box.max.x, box.max.y, box.max.z));

      // SIDES
      array.push(new Vector3(box.min.x, box.min.y, box.min.z));
      array.push(new Vector3(box.min.x, box.max.y, box.min.z));
      array.push(new Vector3(box.max.x, box.min.y, box.min.z));
      array.push(new Vector3(box.max.x, box.max.y, box.min.z));
      array.push(new Vector3(box.min.x, box.min.y, box.max.z));
      array.push(new Vector3(box.min.x, box.max.y, box.max.z));
      array.push(new Vector3(box.max.x, box.min.y, box.max.z));
      array.push(new Vector3(box.max.x, box.max.y, box.max.z));

      return array;
    }
  }

  export class BoxFaceHelper extends THREE.Mesh {

    constructor(box: Box3, material?: THREE.Material) {
      let w = box.max.x - box.min.x;
      let h = box.max.y - box.min.y;
      let d = box.max.z - box.min.z;
      let g = new THREE.BoxGeometry(w, h, d);
      g.translate(box.min.x, box.min.y, box.min.z);
      let m = material || C.DefaultFaceMaterial;

      super(g, m);

      this.position.set(w * .5, h * .5, d * .5);
    }
  }
}