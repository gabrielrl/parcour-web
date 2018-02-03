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
      this._roomMesh = new THREE.Mesh(g, RoomObject.DEFAULT_MATERIAL);
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