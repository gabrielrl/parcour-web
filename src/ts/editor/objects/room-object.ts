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

    /** Override. */
    public get movable(): boolean { return true; }

    /** Override. */
    public get moveConstraints(): MoveConstraints {
      return {
        steps: new Vector3(1, 0, 1)
      };
    }

    /** Override. */
    public get resizable(): boolean { return true; }

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
      let c = new THREE.Color();
      let hue = this.roomArea.light.hue || 0;
      let saturation = this.roomArea.light.color != null
        ? this.roomArea.light.color
        : 0;
      let lightness = this.roomArea.light.intensity != null
        ? this.roomArea.light.intensity - saturation * 0.5
        : 1 - saturation * 0.5;
      c.setHSL(hue, saturation, lightness);
      let m = new THREE.MeshLambertMaterial({
        color: c
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