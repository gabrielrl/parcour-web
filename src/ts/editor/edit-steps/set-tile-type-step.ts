namespace PRKR.Editor.EditSteps {

  import Parcour = Model.Parcour;
  import EditStep = Editor.EditSteps.EditStep;
  import StepResult = Editor.EditSteps.StepResult;

  import TileType = Model.TileType;

  class SetTileTypeMemento {
    public originalTypes: TileType[] = [];
  }

  /** Edit step that sets various room tile types. */
  export class SetTileTypeStep extends EditStep {

    /** Target room area ID. */
    private _areaId: string;

    /** An array of tiles. Each entry is an [x, y] array. */
    private _tiles: number[][];

    /** The target tile type. */
    private _type: TileType;

    /**
     * Creates an edit step that sets various room tile types.
     * @param areaId Target room area ID.
     * @param tiles An array of tiles. Each entry is an [x, y] array.
     * @param type The target tile type.
     */
    constructor(
      areaId: string,
      tiles: number[][],
      type: TileType
    ) {
      super();

      if (!areaId) throw new Error('"areaId" must be defined');
      if (!tiles) throw new Error('"tiles" must be defined');
      if (!_.isArray(tiles)) new Error('"tiles" must be an array of arrays of number');
      if (type == null) throw new Error('"type" must be defined');

      this._areaId = areaId;
      this._tiles = tiles;
      this._type = type;

    }

    public do(parcour: Parcour): StepResult {
      let memento: SetTileTypeMemento = new SetTileTypeMemento();
      let target = <Model.RoomArea>parcour.getAreaById(this._areaId);
      this._tiles.forEach(tile => {
        memento.originalTypes.push(target.getTile(tile[0], tile[1]));
        target.setTile(tile[0], tile[1], this._type);
      });
      return {
        dirtyIds: [ target.id ],
        data: memento
      };
    }

    public undo(parcour: Parcour, data?: Object): StepResult {
      if (data instanceof SetTileTypeMemento) {
        let target = <Model.RoomArea>parcour.getAreaById(this._areaId);
        this._tiles.forEach((tile, i) => {
          target.setTile(tile[0], tile[1], data.originalTypes[i]);
        });
        return { dirtyIds: [ target.id ] };
      } else {
        throw new Error('"data" must be a "SetTileTypeMemento" instance');
      }
    }
  }
}
