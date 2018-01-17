/// <reference path="../model/doorway.ts" />

namespace PRKR.Builders {

  import Doorway = Model.Doorway;
  import Area = Model.Area;

  /**
   * Builds an Object3D which represents a doorway.
   */
  export class DoorwayMeshBuilder {

    constructor (
      private _doorway: Model.Doorway,
      private _parcour: Model.Parcour
    ) { }

    buildMesh(material: THREE.Material): THREE.Object3D {
      let doorway = this._doorway;
      let w = doorway.width;
      let h = doorway.height;
      let t = PRKR.Model.Constants.WallThickness;

      let frameWidth = Doorway.FRAME_WIDTH;
      let frameOutset = Doorway.FRAME_OUTSET;

      let boxSideGeometry = new THREE.BoxGeometry(
        frameWidth,
        h + frameWidth - frameOutset,
        t + frameOutset * 2
      );
      let boxTopGeometry = new THREE.BoxGeometry(
        w - frameWidth - 2 * frameOutset,
        frameWidth,
        t + frameOutset * 2
      );
      let boxBottomGeometry = new THREE.BoxGeometry(
        w,
        frameOutset,
        t + frameOutset * 4
      );
      let boxLeftMesh = new THREE.Mesh(boxSideGeometry, material);
      boxLeftMesh.position.set(
        -(w * .5 - frameOutset),
        (h + frameWidth - frameOutset) / 2,
        0
      );
      let boxRightMesh = new THREE.Mesh(boxSideGeometry, material);
      boxRightMesh.position.set(
        w * .5 - frameOutset,
        (h + frameWidth - frameOutset) / 2,
        0
      );
      let boxTopMesh = new THREE.Mesh(boxTopGeometry, material);
      boxTopMesh.position.set(
        0,
        h + frameWidth * .5 - frameOutset,
        0
      );
      let boxBottomMesh = new THREE.Mesh(boxBottomGeometry, material);
      boxBottomMesh.position.set(
        0,
        0,
        0
      );

      let frame = new THREE.Object3D();
      frame.add(boxLeftMesh);
      frame.add(boxRightMesh);
      frame.add(boxTopMesh);
      frame.add(boxBottomMesh);

      frame.quaternion.setFromUnitVectors(
        M.Vector3.PositiveZ,
        this._computeNormal()
      );

      return frame;
    }

    private _computeNormal(target?: THREE.Vector3): THREE.Vector3 {
      if (!target) target = new THREE.Vector3();
      
      // Find the wall we're on.
      let area = <Area>this._parcour.getObjectById(this._doorway.areaId);
      let walls = area.getWallDefinitions();
      let wall = _.filter(walls, w => w.contains(this._doorway.location))[0];
      if (wall) {
        target.copy(wall.orientation.normal);
      } else {
        console.warn('Attempting to compute doorway normal but can\'t find a suitable wall');
        target.copy(M.Vector3.Zero);
      }
      return target;
    }
  }
}