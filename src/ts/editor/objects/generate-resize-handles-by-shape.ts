namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Quaternion = THREE.Quaternion;
  
  /**
   * Generates resize handles for a specified shape.
   * 
   * @param shape A shape to generate handles for.
   * @param halfExtents The shape's half extents.
   * @param origin The shape's origin in world coordinate.
   * @param rotation The shape's (world) rotation.
   */
  export function generateResizeHandlesByShape(
    shape: Model.Shape,
    halfExtents: Vector3,
    origin: Vector3,
    rotation: Quaternion
  ) {

    let handles = [];
    let radius = 0.25;

    function applyDeltaGenerator(locationFactor: Vector3, sizeFactor: Vector3) {
      return (delta: number) => {
        return {
          location: new Vector3(
            delta * locationFactor.x,
            delta * locationFactor.y,
            delta * locationFactor.z              
          ),
          size: new Vector3(
            delta * sizeFactor.x,
            delta * sizeFactor.y,
            delta * sizeFactor.z              
          )
        };          
      };
    }

    switch (shape) {
      case Model.Shape.Box:
      default: {
        // + X
        let axis = M.Vector3.PositiveX.clone().applyQuaternion(rotation);
        let location = new Vector3(halfExtents.x, 0, 0).applyQuaternion(rotation).add(origin);
        let m = Model.StaticObject.GridSize / 2;
        let min = halfExtents.clone().multiplyScalar(2).subScalar(m).negate();

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(
            axis.clone().multiplyScalar(.5),
            new Vector3(.5, 0, 0)
          ),
          minDelta: min.x
        }));

        // - X
        axis = M.Vector3.NegativeX.clone().applyQuaternion(rotation);
        location = new Vector3(-halfExtents.x, 0, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(
            axis.clone().multiplyScalar(.5),
            new Vector3(.5, 0, 0)
          ),
          minDelta: min.x
        }));

        // + Y
        axis = M.Vector3.PositiveY.clone().applyQuaternion(rotation);
        location = new Vector3(0, halfExtents.y, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(
            axis.clone().multiplyScalar(.5),
            new Vector3(0, .5, 0)
          ),
          minDelta: min.y
        }));

        // - Y
        axis = M.Vector3.NegativeY.clone().applyQuaternion(rotation);
        location = new Vector3(0, -halfExtents.y, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(
            axis.clone().multiplyScalar(.5),
            new Vector3(0, .5, 0)
          ),
          minDelta: min.y
        }));

        // + Z
        axis = M.Vector3.PositiveZ.clone().applyQuaternion(rotation);
        location = new Vector3(0, 0, halfExtents.z).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(
            axis.clone().multiplyScalar(.5),
            new Vector3(0, 0, .5)
          ),
          minDelta: min.z
        }));

        // - Z
        axis = M.Vector3.NegativeZ.clone().applyQuaternion(rotation);
        location = new Vector3(0, 0, -halfExtents.z).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(
            axis.clone().multiplyScalar(.5),
            new Vector3(0, 0, .5)
          ),
          minDelta: min.z
        }));
      } break;

      case Model.Shape.Sphere: {

        let radiusDelta = new Vector3(.5, .5, .5);

        // + X
        let axis = M.Vector3.PositiveX.clone().applyQuaternion(rotation);
        let location = new Vector3(halfExtents.x, 0, 0).applyQuaternion(rotation).add(origin);
        let min = halfExtents.clone().multiplyScalar(2).subScalar(Model.StaticObject.GridSize).negate();

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.x
        }));

        // - X
        axis = M.Vector3.NegativeX.clone().applyQuaternion(rotation);
        location = new Vector3(-halfExtents.x, 0, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.x
        }));

        // + Y
        axis = M.Vector3.PositiveY.clone().applyQuaternion(rotation);
        location = new Vector3(0, halfExtents.y, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.y
        }));

        // - Y
        axis = M.Vector3.NegativeY.clone().applyQuaternion(rotation);
        location = new Vector3(0, -halfExtents.y, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.y
        }));

        // + Z
        axis = M.Vector3.PositiveZ.clone().applyQuaternion(rotation);
        location = new Vector3(0, 0, halfExtents.z).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.z
        }));

        // - Z
        axis = M.Vector3.NegativeZ.clone().applyQuaternion(rotation);
        location = new Vector3(0, 0, -halfExtents.z).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.z
        }));

      } break;

      case Model.Shape.Capsule:
      case Model.Shape.Cone:
      case Model.Shape.Cylinder: {

        let radiusDelta = new Vector3(.5, 0, .5);

        // + X
        let axis = M.Vector3.PositiveX.clone().applyQuaternion(rotation);
        let location = new Vector3(halfExtents.x, 0, 0).applyQuaternion(rotation).add(origin);
        let m = new Vector3(Model.StaticObject.GridSize, Model.StaticObject.GridSize / 2, Model.StaticObject.GridSize);
        let min = halfExtents.clone().multiplyScalar(2).sub(m).negate();

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.x
        }));

        // - X
        axis = M.Vector3.NegativeX.clone().applyQuaternion(rotation);
        location = new Vector3(-halfExtents.x, 0, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.x
        }));

        // + Y
        axis = M.Vector3.PositiveY.clone().applyQuaternion(rotation);
        location = new Vector3(0, halfExtents.y, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), new Vector3(0, .5, 0)),
          minDelta: min.y
        }));

        // - Y
        axis = M.Vector3.NegativeY.clone().applyQuaternion(rotation);
        location = new Vector3(0, -halfExtents.y, 0).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), new Vector3(0, .5, 0)),
          minDelta: min.y
        }));

        // + Z
        axis = M.Vector3.PositiveZ.clone().applyQuaternion(rotation);
        location = new Vector3(0, 0, halfExtents.z).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.z
        }));

        // - Z
        axis = M.Vector3.NegativeZ.clone().applyQuaternion(rotation);
        location = new Vector3(0, 0, -halfExtents.z).applyQuaternion(rotation).add(origin);

        handles.push(new Tools.AxisResizeHandle({
          radius,
          axis,
          location,
          applyDelta: applyDeltaGenerator(axis.clone().multiplyScalar(.5), radiusDelta),
          minDelta: min.z
        }));

      } break;


    }


    return handles;
  }


}
