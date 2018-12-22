/// <reference path="./wall-element.ts" />

namespace PRKR.Model {
  export interface DoorwayData extends WallElementData { }

  export class Doorway extends WallElement {

    static readonly FRAME_WIDTH = 0.1;
    static readonly FRAME_OUTSET = 0.01;

    constructor(data?: DoorwayData) {
      super(data);
    }

    get type() { return 'Doorway'; }

    public toObject() {
      return {
        $type: this.type,
        id: this.id,
        areaId: this.areaId,
        location: this.location.toArray(),
        size: this.size.toArray()
      };
    }
  }
}