/// <reference path="./area.ts" />
/// <reference path="./wall-definition.ts" />

namespace PRKR.Model {

  import Vector3 = THREE.Vector3;

  export interface RoomAreaOptions extends AreaData {
    location: Vector3;
    size: THREE.Vector3;
    light?: RoomLight;
    tiles?: TileType[][];
  }

  export interface RoomLight {
    /** Light color component. */
    color?: number;

    /** Light color hue. */
    hue?: number;

    /** Light intensity. */
    intensity?: number;
  }

  /**
   * A room parcour area.
   */
  export class RoomArea extends Area {

    private _light: RoomLight;

    private _tiles: TileType[][];

    constructor(data?: RoomAreaOptions) {
      super(data);

      if (data) {

        if (data.light) {
          this._light = data.light;
        } else {
          this._light = {};
        }

        if (data.tiles) {
          this._tiles = data.tiles;
        } else {
          this._tiles = [];
        }
      }
    }

    get light() {
      return this._light;
    }

    getTile(x: number, z: number) {
      if (!this._tiles) return TileType.Floor;

      let row = this._tiles[x];
      if (!row) return TileType.Floor;

      let tile = row[z];
      if (!tile) return TileType.Floor;

      return tile;
    }

    setTile(x: number, z: number, tile: TileType) {
      if (!this._tiles) this._tiles = [];
      if (!this._tiles[x]) this._tiles[x] = [];
      this._tiles[x][z] = tile;      
    }

    private static PROPERTIES: Property[] = [{
      name: 'light.color',
      display: 'Light Color',
      info: 'Amount of color in the light. 1 means a saturated color and 0 means white.',
      editor: 'range',
      type: 'number',
      getValue: o => {
        if (o instanceof RoomArea && o.light && o.light.color != null) {
          return o.light.color;
        } else {
          return 0;
        }
      },
      setValue: (o, v) => {
        if (o instanceof RoomArea) {
          if (v != null) {
            if (v < 0) v = 0;
            if (v > 1) v = 1;
            o.light.color = v;
          } else {
            delete o.light.color;
          }
        }
      }
    }, {
      name: 'light.hue',
      display: 'Light Hue',
      info: 'Hue of light color. Has no effect if "Color" is 0.',
      editor: 'range',
      type: 'number',
      getValue: o => {
        if (o instanceof RoomArea && o.light && o.light.hue != null) {
          return o.light.hue;
        } else {
          return 0;
        }
      },
      setValue: (o, v) => {
        if (o instanceof RoomArea) {
          if (v != null) {
            if (v < 0) v = 0;
            if (v > 1) v = 1;
            o.light.hue = v;
          } else {
            delete o.light.hue;
          }
        }
      }
      
    }, {
      name: 'light.intensity',
      display: 'Light Intensity',
      info: 'Intensity of the light. 0 means no light and 1 means full light.',
      editor: 'range',
      type: 'number',
      getValue: o => {        
        if (o instanceof RoomArea && o.light && o.light.intensity != null) {
          return o.light.intensity;
        } else {
          return 1;
        }
      },
      setValue: (o, v) => {
        if (o instanceof RoomArea) {
          if (v != null) {
            if (v < 0) v = 0;
            if (v > 1) v = 1;
            o.light.intensity = v;
          } else {
            delete o.light.intensity;
          }
        }
      }
      
      
    }];

    /** Override. */
    public getProperties() {
      return super.getProperties().concat(RoomArea.PROPERTIES);
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
      this._light = _.cloneDeep(source.light);
      this._tiles = _.cloneDeep(source._tiles);
    }

    public toObject(): any {
      let o: any = { $type: 'RoomArea' };
      _.extend(o, {
        id: this.id,
        name: this.name,
        location: this.location.toArray(),
        size: this.size.toArray(),
        light: _.cloneDeep(this._light),
        tiles: _.cloneDeep(this._tiles)
      });
      return o;
    }
  }
}