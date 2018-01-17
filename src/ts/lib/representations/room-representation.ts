/// <reference path="./area-representation.ts" />
/// <reference path="../Model/room-area.ts" />

namespace PRKR.Representations {
  export class RoomRepresentation implements IAreaRepresentation {

    // public name: string = '';
    get name() { return this._room.name; }

    constructor(private _room: Model.RoomArea) {
      // this.name = 'Room ' + this._room.name + ' representation';
    }

    private _sceneObject: THREE.Object3D;
    public getSceneObject(): THREE.Object3D {
      if (this._sceneObject == null) {
        this._sceneObject = this._buildSceneObject();
      }
      return this._sceneObject;
    }

    public getGeometry(): THREE.Geometry {
      // TODO Compute only once and cache.
      let size = this._room.size;
      let g = new THREE.Geometry();
      let w = size.x;
      let h = size.y;
      let d = size.z;

      // FLOOR LEVEL
      let V = THREE.Vector3;
      let vertices = g.vertices;
      vertices.push(new V(0, 0, 0));
      vertices.push(new V(w, 0, 0));
      vertices.push(new V(w, 0, d));
      vertices.push(new V(0, 0, d));

      // ROOF LEVEL
      vertices.push(new V(0, h, 0));
      vertices.push(new V(w, h, 0));
      vertices.push(new V(w, h, d));
      vertices.push(new V(0, h, d));

      // FLOOR FACE
      let F = THREE.Face3;
      let faces = g.faces;
      faces.push(new F(0, 2, 1));
      faces.push(new F(2, 0, 3));

      // WALL FACES
      // first wall (along 0-1).
      faces.push(new F(0, 5, 4));
      faces.push(new F(5, 0, 1));

      // second wall (along 1-2).
      faces.push(new F(1, 6, 5));
      faces.push(new F(6, 1, 2));

      // third wall (along 2-3).
      faces.push(new F(2, 7, 6));
      faces.push(new F(7, 2, 3));

      // fourth wall (along 3-0).
      faces.push(new F(3, 4, 7));
      faces.push(new F(4, 3, 0));

      g.computeFaceNormals();
      g.computeBoundingBox();

      return g;
    }

    public getMaterial(): THREE.Material {
      // TODO Build only one and cache.
      // Build default material.
      let roomMat = new THREE.MeshLambertMaterial({
        color: 0xffffff
      });	
      return roomMat;
    }

    public getSelectionHotSpot(): THREE.Object3D {
      return this.getSceneObject();
    }

    /// privates

    private _buildSceneObject() {
      let mesh = new THREE.Mesh(this.getGeometry(), this.getMaterial());
      return mesh;
    }
  }
}