/// <reference path="./area.ts" />
/// <reference path="./wall-definition.ts" />

namespace PRKR.Model {

  import Vector3 = THREE.Vector3;

  export interface RoomAreaOptions extends AreaData {
    location: Vector3;
    size: THREE.Vector3;
  }

  /**
   * A room parcour area.
   */
  export class RoomArea extends Area {

    constructor(data?: RoomAreaOptions) {
      super(data);
    }
    
    /**
     * Gets wall definitions for the current room.
     * Locations are relative to the room's origin.
     */
    public getWallDefinitions(): WallDefinition[] {
      let walls: WallDefinition[] = [];

      // For each wall in the room.
      // 1st (x0 z0) -> (x1 z0)
      let origin = new Vector3();
      walls.push(new WallDefinition(
        origin,
        WallOrientation.PositiveX,
        this.size.x,
        this.size.y
      ));

      // 2nd (x1 z0) -> (x1 z1)
      origin.set(this.size.x, 0, 0);
      walls.push(new WallDefinition(
        origin,
        WallOrientation.PositiveZ,
        this.size.z,
        this.size.y
      ));

      // 3rd (x1 z1) -> (x0 z1)
      origin.set(this.size.x, 0, this.size.z);
      walls.push(new WallDefinition(
        origin,
        WallOrientation.NegativeX,
        this.size.x,
        this.size.y
      ));

      // 4th (x0 z1) -> (x0 z0)
      origin.set(0, 0, this.size.z);
      walls.push(new WallDefinition(
        origin,
        WallOrientation.NegativeZ,
        this.size.z,
        this.size.y
      ));

      return walls;
    }

    // Override
    public clone() {
      let clone = new RoomArea();
      clone._copy(this);
      return clone;
    }

    // Override
    public _copy(source: RoomArea) {
      super._copy(source);
    }

    public toObject(): any {
      let o: any = { $type: 'RoomArea' };
      _.extend(o, {
        id: this.id,
        name: this.name,
        location: this.location.toArray(),
        size: this.size.toArray()
      });
      return o;
    }
  }
}