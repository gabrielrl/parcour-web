namespace PRKR.Builders {

  import Vector3 = THREE.Vector3;

  /** The logic to build a geometry from a shape and a size. */
  export class ShapeGeometryBuilder {

    private constructor() { }

    /**
     * Builds a geometry object from a shape value and a size (in "half extents", being the size "from the center" in
     * every direction).
     * @param shape A shape to build
     * @param halfExtents Half extents, 
     */
    public static buildGeometry(shape: Model.Shape, halfExtents: Vector3): THREE.Geometry {

      switch (shape) {

        case Model.Shape.Box:
        default:

          return new THREE.CubeGeometry(
            halfExtents.x * 2,
            halfExtents.y * 2,
            halfExtents.z * 2
          );

          // break;

        case Model.Shape.Sphere:

          let r = Math.min(halfExtents.x, halfExtents.y, halfExtents.z);
          return new THREE.SphereGeometry(r, 24, 18);

          // break;

        case Model.Shape.Cylinder:

          r = Math.min(halfExtents.x, halfExtents.z);
          return new THREE.CylinderGeometry(r, r, halfExtents.y * 2, 24);

          // break;

        case Model.Shape.Capsule:

          r = Math.min(halfExtents.x, halfExtents.y, halfExtents.z);
          let g = new THREE.CylinderGeometry(r, r, (halfExtents.y - r) * 2, 24, 1, true);
          let s = new THREE.SphereGeometry(r, 24, 9, 0, M.TWO_PI, 0, M.PI_OVER_TWO);
          s.translate(0, halfExtents.y - r, 0);
          g.merge(s);

          s = new THREE.SphereGeometry(r, 24, 9, 0, M.TWO_PI, 0, M.PI_OVER_TWO);
          s.rotateZ(Math.PI);
          s.translate(0, -(halfExtents.y - r), 0);
          g.merge(s);

          return g;
        
          // break;

        case Model.Shape.Cone:

          r = Math.min(halfExtents.x, halfExtents.z);
          return new THREE.ConeGeometry(r, halfExtents.y * 2, 24);

          // break;
      }

    }
  }
}
