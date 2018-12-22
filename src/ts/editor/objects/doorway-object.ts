namespace PRKR.Editor.Objects {
  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Parcour = PRKR.Model.Parcour;
  import Area = PRKR.Model.Area;
  import Doorway = PRKR.Model.Doorway;
  import Location = PRKR.Model.Location;

  export class DoorwayObject extends EditorObject {

    private _frame: THREE.Object3D = null;

    constructor(doorwayModel: Doorway, parcour: Parcour) {
      super(doorwayModel, parcour);
      this.update();
    }

    get doorway(): Doorway { return <Doorway>this.model };
    get area(): Area {
      return <Area>this.parcour.getObjectById(this.doorway.areaId);
    }

    get movable() {
      return true;
    }

    /**
     * Gets the world position for the current object.
     * @param target Optional target for the world position.
     * @returns the world position for the current object.
     */
    public getWorldPosition(target?: Vector3): Vector3 {
      if (!target) target = new Vector3();
      target.copy(this.doorway.location).add(this.area.location);
      return target;
    }

    public update() {
      super.invalidateAll();
      this._updateSceneObject();
    }

    private _updateSceneObject() {
      if (this._frame) {
        this.sceneObject.remove(this._frame);
      }
      this._frame = this._buildFrame();
      // temp debug
      this._frame.add(this.selectionHotSpot);
      this.sceneObject.add(this._frame);
      this.getWorldPosition(this.sceneObject.position);
    }

    /** Compute the current object's bounding box. Coordinates are relative to the object's location. */
    protected _computeBoundingBox(): Box3 {
      let box = new THREE.Box3();
      let doorway = this.doorway;

      let wall = this._getWall();
      if (wall && wall.orientation.normal.x !== 0.0) {

        box.min.set(
          -Model.Constants.WallThickness - DoorwayObject.FRAME_OUTSET,
          0,
          doorway.width * -.5 - DoorwayObject.FRAME_WIDTH
        );
        box.max.set(
          Model.Constants.WallThickness + DoorwayObject.FRAME_OUTSET,
          doorway.height + DoorwayObject.FRAME_WIDTH - DoorwayObject.FRAME_OUTSET,
          doorway.width * .5 + DoorwayObject.FRAME_WIDTH
        );

      } else {
      
        box.min.set(
          doorway.width * -.5 - DoorwayObject.FRAME_WIDTH,
          0,
          -Model.Constants.WallThickness - DoorwayObject.FRAME_OUTSET
        );
        box.max.set(
          doorway.width * .5 + DoorwayObject.FRAME_WIDTH,
          doorway.height + DoorwayObject.FRAME_WIDTH - DoorwayObject.FRAME_OUTSET,
          Model.Constants.WallThickness + DoorwayObject.FRAME_OUTSET
        );

      }

      return box;
    }

    static SelectionMaterial: THREE.Material = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
      wireframe: false,
      transparent: false,
      color: 0xffffff
    });

    /** Override. */
    protected _buildSelectionHotSpot(): THREE.Object3D {
      let box = this._computeBoundingBox();
      let helper = new Helpers.BoxFaceHelper(box, DoorwayObject.SelectionMaterial);
      return helper;
    }

    private static FRAME_WIDTH = 0.1;
    private static FRAME_OUTSET = 0.01;

    private static MATERIAL = new THREE.MeshLambertMaterial({
      color: 0xffffff
    });
    
    private _buildFrame() {
      let doorway = this.doorway;
      let w = doorway.width;
      let h = doorway.height;
      let t = PRKR.Model.Constants.WallThickness;
      let m = DoorwayObject.MATERIAL;

      let frameWidth = DoorwayObject.FRAME_WIDTH;
      let frameOutset = DoorwayObject.FRAME_OUTSET;

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
      let boxLeftMesh = new THREE.Mesh(boxSideGeometry, m);
      boxLeftMesh.position.set(
        -(w * .5 - frameOutset),
        (h + frameWidth - frameOutset) / 2,
        0
      );
      let boxRightMesh = new THREE.Mesh(boxSideGeometry, m);
      boxRightMesh.position.set(
        w * .5 - frameOutset,
        (h + frameWidth - frameOutset) / 2,
        0
      );
      let boxTopMesh = new THREE.Mesh(boxTopGeometry, m);
      boxTopMesh.position.set(
        0,
        h + frameWidth * .5 - frameOutset,
        0
      );

      let frame = new THREE.Object3D();
      frame.add(boxLeftMesh);
      frame.add(boxRightMesh);
      frame.add(boxTopMesh);
      frame.quaternion.setFromUnitVectors(
        M.Vector3.PositiveZ,
        this._computeNormal()
      )

      return frame;
    }

    /** Compute the doorway's normal axis. */
    private _computeNormal(target?: Vector3): Vector3 {
      if (!target) target = new Vector3();

      // find the wall we're on.
      let wall = this._getWall();
      if (wall) {
        target.copy(wall.orientation.normal);
      } else {
        console.warn('Attempting to compute doorway normal but can\'t find a suitable wall');
        target.copy(M.Vector3.Zero);
      }
      return target;
    }

    /** Gets the wall definition the current doorway is part of. */
    private _getWall() {
      let wall = _.filter(
        this.area.getWallDefinitions(),
        w => w.contains(this.doorway.location)
      )[0];
      return wall;
    }

  }
}