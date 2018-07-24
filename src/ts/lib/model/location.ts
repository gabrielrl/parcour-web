/// <reference path="./parcour-object.ts" />
/// <reference path="./area-element.ts" />

namespace PRKR.Model {

  import Vector3 = THREE.Vector3;

  export enum LocationKind {
    Start = 1,
    End = 2
  }

  export function locationKindToString(kind: LocationKind) {
    switch (kind) {
      case LocationKind.Start:
        return 'Start';

      case LocationKind.End:
        return 'End';

      default:
        return '';
    }
  }

  export interface LocationOptions extends AreaElementData {
    kind?: LocationKind;
  }

  /**
   * A parcour object that defines a special location in an area (in the
   * parcour), e.g. the _start_ and _stop_ locations.
   */
  export class Location extends AreaElement {

    /** The kind of the current location. */
    private _kind: LocationKind = LocationKind.Start;

    constructor(data?: LocationOptions) {
      super(data);

      if (data) {
        if (data.kind) this._kind = data.kind;
      }
    }

    /** Gets the kind of the current location. */
    get kind(): LocationKind { return this._kind; }

    /** Sets the kind of the current location. */
    set kind(value: LocationKind) { this._kind = value; }

    // Override.
    public clone() {
      let clone = new Location();
      clone._copy(this);
      return clone;
    }

    // Override.
    public toObject() {
      let o: any = { $type: 'Location' };
      _.extend(o, {
        id: this.id,
        areaId: this.areaId,
        location: this.location.toArray(),
        kind: this.kind,
      });
      return o;
    }

    // Override.
    protected _copy(source: Location) {
      super._copy(source);
      this._kind = source.kind;
    }
  }
}