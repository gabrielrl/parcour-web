/// <reference path="./editor-object.ts" />
/// <reference path="../../defs/prkr.bundle.d.ts" />

namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Area = PRKR.Model.Area;
  import AreaElement = PRKR.Model.AreaElement;

  export class UnknownObject extends EditorObject {

    constructor(model: ParcourObject, parcour: Parcour) {
      super(model, parcour);
      this.sceneObject.add(this._buildHelper());
      this.update();
    }

    /** Override. Call parent. */
    public update() {
      this.getWorldPosition(this.sceneObject.position);
      super.update();
    }

    public getWorldPosition(target?: Vector3): Vector3 {
      if (!target) { target = new Vector3(); }
      if (this.model instanceof Area) {
        target.copy((<Area>this.model).location);
      } else if (this.model instanceof AreaElement) {
        let element = <AreaElement>this.model;
        let area = <Area>this.parcour.getObjectById(element.areaId);
        if (area) {
          target.addVectors(area.location, element.location);
        }
      }
      return target;
    }

    /**
     * Gets the properties of the current object.
     * @returns the properties of the current object.
     */
    public getProperties(): Property[] {

      return [];
    }

    /** Override */
    protected _computeBoundingBox(): Box3 {
      return M.Box3.CenteredUnit;
    }

    private static MATERIAL = new THREE.LineBasicMaterial({
      color: 0xff0000,
      depthTest: false
    });

    private _buildHelper(): THREE.Object3D {
      let V = Vector3;
      let g = new THREE.Geometry();
      g.vertices.push(
        new V(-1, 0, 0),
        new V(1, 0, 0),
        new V(0, -1, 0),
        new V(0, 1, 0),
        new V(0, 0, -1),
        new V(0, 0, 1)
      );
      let helper = new THREE.LineSegments(g, UnknownObject.MATERIAL);

      return helper;
    }
  }
}