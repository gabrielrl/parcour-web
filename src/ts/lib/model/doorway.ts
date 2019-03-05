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

    /**
     * Gets a plain object representation of the current object.
     * Override, call super and extend its return value, don't forget to overwrite `$type`.
     */
    public toObject() {
      return _.assign(super.toObject(), {
        $type: this.type,
      });
    }
  }
}