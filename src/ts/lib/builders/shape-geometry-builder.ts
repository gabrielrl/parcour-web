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
          
      }

    }
  }
}
