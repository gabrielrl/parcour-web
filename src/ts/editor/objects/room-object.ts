/// <reference path="./editor-object.ts" />
/// <reference path="../../defs/prkr.bundle.d.ts" />


namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Mesh = THREE.Mesh;
  import MeshLambertMaterial = THREE.MeshLambertMaterial;
  import Parcour = PRKR.Model.Parcour;
  import RoomArea = PRKR.Model.RoomArea;

  export class RoomObject extends EditorObject {

    /** The room mesh used to display the room in the editor. */
    private _roomMesh: THREE.Mesh = null;

    static DEFAULT_MATERIAL = new THREE.MeshLambertMaterial({
      color: 0xcccccc
    });

    constructor(room: RoomArea, parcour: Parcour) {
      super(room, parcour);
      this.update();
    }

    /**
     * Gets the room model object represented by the current object.
     * @return `this.model` casted to the `RoomArea` type.
     */
    get roomArea(): RoomArea { return <RoomArea> this.model; }

    /** Gets true because room objects are movable. */
    public get movable(): true { return true; }

    /** Gets true because room objects are rotatable. */
    public get rotatable(): true { return true; }

    /** Override. */
    public get resizable(): boolean { return true; }

    /** Builds an array of resize helepers for the current room object. */
    public get resizeHandles(): Tools.ResizeHandle[] {

      let box = this.boundingBox;
      let size = box.getSize();
      let origin = this.getWorldPosition();

      function applyDeltaGenerator(locationFactor: Vector3, sizeFactor: Vector3) {
        return (delta: Vector3) => {
          return {
            location: new Vector3(
              delta.x * locationFactor.x,
              delta.y * locationFactor.y,
              delta.z * locationFactor.z              
            ),
            size: new Vector3(
              delta.x * sizeFactor.x,
              delta.y * sizeFactor.y,
              delta.z * sizeFactor.z              
            )
          };          
        };
      }

      let handles = [

        // X-axis handles
        // from x max (adjusting size).
        new Tools.PlaneResizeHandle({
          label: 'X max',
          width: 1,
          height: size.z - 1,
          axes: M.Vector3.PositiveX,
          minDelta: new Vector3(-(size.x - 1), 0, 0),
          maxDelta: new Vector3(Model.Constants.MaximumAreaSize - size.x, 0, 0),
          location: new Vector3(
            origin.x + box.max.x, 
            origin.y + box.min.y,
            origin.z + box.max.z * .5),
          applyDelta: applyDeltaGenerator(M.Vector3.Zero, M.Vector3.OneOneOne)
        }),
        // form x min (adjusting location and size).
        new Tools.PlaneResizeHandle({
          label: 'X min',
          width: 1,
          height: size.z - 1,
          axes: M.Vector3.PositiveX,
          minDelta: new Vector3(-(Model.Constants.MaximumAreaSize - size.x), 0, 0),
          maxDelta: new Vector3(size.x - 1, 0 , 0),
          location: new Vector3(
            origin.x + box.min.x,
            origin.y + box.min.y,
            origin.z + box.max.z * .5
          ),
          applyDelta: applyDeltaGenerator(M.Vector3.OneOneOne, M.Vector3.MinusOneOneOne)
        }),

        // from z max (adjusting size)
        new Tools.PlaneResizeHandle({
          label: 'Z max',
          width: size.x - 1,
          height: 1,
          axes: M.Vector3.PositiveZ,
          minDelta: new Vector3(0, 0, -(size.z - 1)),
          maxDelta: new Vector3(0, 0, Model.Constants.MaximumAreaSize - size.z),
          location: new Vector3(
            origin.x + box.max.x * .5, 
            origin.y + box.min.y,
            origin.z + box.max.z
          ),
          applyDelta: applyDeltaGenerator(M.Vector3.Zero, M.Vector3.OneOneOne)
        }),

        // from z min (adjusting location and size)
        new Tools.PlaneResizeHandle({
          label: 'Z min',
          width: size.x - 1,
          height: 1,
          axes: M.Vector3.PositiveZ,
          minDelta: new Vector3(0, 0, -(Model.Constants.MaximumAreaSize - size.z)),
          maxDelta: new Vector3(0, 0, size.z - 1),
          location: new Vector3(
            origin.x + box.max.x * .5, 
            origin.y + box.min.y,
            origin.z + box.min.z
          ),
          applyDelta: applyDeltaGenerator(M.Vector3.OneOneOne, M.Vector3.MinusOneOneOne)
        }),

        // from xz max (adjusting size).
        new Tools.PlaneResizeHandle({
          label: 'XZ max',
          width: 1, 
          height: 1,
          axes: new Vector3(1, 0, 1),
          minDelta: new Vector3(-(size.x - 1), 0, -(size.z - 1)),
          maxDelta: new Vector3(
            Model.Constants.MaximumAreaSize - size.x,
            0,
            Model.Constants.MaximumAreaSize - size.z
          ),
          location: new Vector3(
            origin.x + box.max.x, 
            origin.y + box.min.y,
            origin.z + box.max.z
          ),
          applyDelta: applyDeltaGenerator(M.Vector3.Zero, M.Vector3.OneOneOne)
        }),

        // xz min (adjust location and size)
        new Tools.PlaneResizeHandle({
          label: 'XZ min',
          width: 1, 
          height: 1,
          axes: new Vector3(1, 0, 1),
          minDelta: new Vector3(
            -(Model.Constants.MaximumAreaSize - size.x),
            0,
            -(Model.Constants.MaximumAreaSize - size.z)
          ),
          maxDelta: new Vector3(size.x - 1, 0, size.z - 1),
          location: new Vector3(
            origin.x + box.min.x, 
            origin.y + box.min.y,
            origin.z + box.min.z
          ),
          applyDelta: applyDeltaGenerator(M.Vector3.OneOneOne, M.Vector3.MinusOneOneOne)
        }),

        // from x max (adjusting size) z min (adjusting location and size)
        new Tools.PlaneResizeHandle({
          label: 'X max',
          width: 1, 
          height: 1,
          axes: new Vector3(1, 0, 1),
          minDelta: new Vector3(-(size.x - 1), 0, -(Model.Constants.MaximumAreaSize - size.z)),
          maxDelta: new Vector3(
            Model.Constants.MaximumAreaSize - size.x,
            0,
            size.z - 1
          ),
          location: new Vector3(
            origin.x + box.max.x, 
            origin.y + box.min.y,
            origin.z + box.min.z
          ),
          applyDelta: applyDeltaGenerator(
            new Vector3(0, 0, 1),
            new Vector3(1, 0, -1)
          )
        }),

        // x min z max
        new Tools.PlaneResizeHandle({
          label: 'X min Z max',
          width: 1, 
          height: 1,
          axes: new Vector3(1, 0, 1),
          minDelta: new Vector3(-(Model.Constants.MaximumAreaSize - size.x), 0, -(size.z - 1)),
          maxDelta: new Vector3(
            size.x - 1,
            0,
            Model.Constants.MaximumAreaSize - size.z
          ),
          location: new Vector3(
            origin.x + box.min.x, 
            origin.y + box.min.y,
            origin.z + box.max.z
          ),
          applyDelta: applyDeltaGenerator(
            new Vector3(1, 0, 0),
            new Vector3(-1, 0, 1)
          )
        }),

        // from top of x max wall.
        new Tools.PlaneResizeHandle({
          label: 'X max top',
          width: size.z,
          height: 1,
          axes: new Vector3(0, 1, 0),
          minDelta: new Vector3(0, -(size.y - Model.Constants.MinimumAreaHeight), 0),
          maxDelta: new Vector3(0, Model.Constants.MaximumAreaSize - size.y, 0),
          location: new Vector3(
            origin.x + box.max.x,
            origin.y + box.max.y,
            origin.z + box.max.z * .5
          ),
          plane: Helpers.OrthoPlane.YZ,

          applyDelta: applyDeltaGenerator(
            M.Vector3.Zero,
            M.Vector3.OneOneOne
          )
        }),

        // from top of x min wall.
        new Tools.PlaneResizeHandle({
          label: 'X min top',
          width: size.z,
          height: 1,
          axes: new Vector3(0, 1, 0),
          minDelta: new Vector3(0, -(size.y - Model.Constants.MinimumAreaHeight), 0),
          maxDelta: new Vector3(0, Model.Constants.MaximumAreaSize - size.y, 0),
          location: new Vector3(
            origin.x + box.min.x,
            origin.y + box.max.y,
            origin.z + box.max.z * .5
          ),
          plane: Helpers.OrthoPlane.YZ,
          normal: M.Vector3.PositiveX,
          applyDelta: applyDeltaGenerator(
            M.Vector3.Zero,
            M.Vector3.OneOneOne
          )
        }),

        // from top of z max wall.
        new Tools.PlaneResizeHandle({
          label: 'Z max top',
          width: size.x,
          height: 1,
          axes: new Vector3(0, 1, 0),
          minDelta: new Vector3(0, -(size.y - Model.Constants.MinimumAreaHeight), 0),
          maxDelta: new Vector3(0, Model.Constants.MaximumAreaSize - size.y, 0),
          location: new Vector3(
            origin.x + box.max.x * .5,
            origin.y + box.max.y,
            origin.z + box.max.z
          ),
          plane: Helpers.OrthoPlane.XY,
          applyDelta: applyDeltaGenerator(
            M.Vector3.Zero,
            M.Vector3.OneOneOne
          )
        }),

        // from top of z min wall.
        new Tools.PlaneResizeHandle({
          label: 'Z min top',
          width: size.x,
          height: 1,
          axes: new Vector3(0, 1, 0),
          minDelta: new Vector3(0, -(size.y - Model.Constants.MinimumAreaHeight), 0),
          maxDelta: new Vector3(0, Model.Constants.MaximumAreaSize - size.y, 0),
          location: new Vector3(
            origin.x + box.max.x * .5,
            origin.y + box.max.y,
            origin.z + box.min.z
          ),
          plane: Helpers.OrthoPlane.XY,
          normal: M.Vector3.PositiveZ,
          applyDelta: applyDeltaGenerator(
            M.Vector3.Zero,
            M.Vector3.OneOneOne
          )
        })

      ];
      return handles;

    }

    public update() {
      this._updateSceneObject();
      super.invalidateAll();
      super.update();
    }

    protected _updateSceneObject() {
      if (this._roomMesh) {
        this.sceneObject.remove(this._roomMesh);
      }
      let g = new PRKR.Builders.RoomGeometryBuilder(
        <RoomArea>this.model, this.parcour).getGeometry();

      let light = this.roomArea.light;
      const hue = light.hue != null ? light.hue * 2 * Math.PI : 0;
      const saturation = light.color != null ? light.color : 0;
      const value = light.intensity != null ? light.intensity : 1;

      let m = new THREE.MeshLambertMaterial({
        color: Utils.colorFromHsv(hue, saturation, value)
      });      
      this._roomMesh = new THREE.Mesh(g, m);
      this.sceneObject.add(this._roomMesh);
      this.getWorldPosition(this.sceneObject.position);
      return this._roomMesh;
    }
    
    /** Override */
    protected _buildSelectionHotSpot() {
      return this._roomMesh;
    }

    /**
     * Gets the world position for the current object.
     * @param target Optional target for the world position.
     * @returns the world position for the current object.
     */
    public getWorldPosition(target?: Vector3): Vector3 {
      if (!target) { target = new Vector3(); }
      target.copy(this.roomArea.location);
      return target;
    }

    /**
     * Gets the pivot which is at the center of the current area.
     * 
     * @param target Optional target for the pivot point's world location.
     * @returns the world position of the center of the area.
     */
    public getWorldPivot(target?: Vector3): Vector3 {
      return this.roomArea.getBoundingBox().getCenter(target);

    }
    
    /** Override */
    protected _computeBoundingBox(): Box3 {
      let size = (<RoomArea>this.model).size;
      let box = new THREE.Box3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(size.x, size.y, size.z)
      );
      return box;
    }
  }
}