namespace PRKR.Validators {

  import Location = PRKR.Model.Location;

  export class LocationMisplacementResult extends ValidationResult {
    private _location: Location;

    constructor(location: Location) {
      super(ResultLevel.Error, 'location-misplacement', 'Misplaced location found');
      this._location = location;
    }

    get location() { return this._location; }
  }
}