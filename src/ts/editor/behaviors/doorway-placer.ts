namespace PRKR.Editor.Behaviors {

  import Vector3 = THREE.Vector3;
  import Parcour = Model.Parcour;
  import WallDefinition = PRKR.Model.WallDefinition;
  import Area = PRKR.Model.Area;

  export class DoorwayPlacer {

    /** Map of room id to array of doorway candidates. */
    private _candidates: { [roomId: string]: DoorwayCandidate[] } = {};

    constructor(private _parcour: Parcour) { }

    /**
     * Gets the closest doorway candidate for the specified world location.
     * @param worldLocation World location to test
     */
    getCandidate(worldLocation: Vector3) {

      // See if the location is inside any room.
      let area = this._parcour.getAreaAtLocation(worldLocation);

      // Not inside an area? no candidate.
      if (!area) return null;

      // Get candidates for this room
      let candidates = this._getCandidates(area);

      // Find the closest.
      let c: DoorwayCandidate = null;
      let dist: number = Infinity;
      for (let i = 0; i < candidates.length; i++) {
        let sqDist = worldLocation.distanceToSquared(candidates[i].worldPosition);
        if (sqDist < dist && sqDist < 4) {
          c = candidates[i];
          dist = sqDist;
        }
      }

      return c;
    }

    /**
     * Constrains a vector representing a world location to a valid doorway location. Returns true if a doorway
     * candidate was found and `worldLocation` has been adjusted, false otherwise.
     * @param worldLocation World location to constrain to a doorway candidate location.
     */
    constrain(worldLocation: Vector3): boolean {

      let c = this.getCandidate(worldLocation);

      // No candidates? bail out.
      if (!c) return false;

      // We found a valid candidate, constrain the vector and return true!
      worldLocation.copy(c.worldPosition);
      return true;
    }

    private _getCandidates(area: Area): DoorwayCandidate[] {
      if (!area) {
        return [];
      }

      if (!this._candidates[area.id]) {
        this._candidates[area.id] = this._buildCandidates(area);
      }

      return this._candidates[area.id];
    }

    private _buildCandidates(area: Area): DoorwayCandidate[] {

      let candidates: DoorwayCandidate[] = [];
      let walls = area.getWallDefinitions();

      walls.forEach(w => {
        let worldPosition = new Vector3();
        let localPosition = new Vector3();
        let orientation = w.orientation;

        // For each edge center in the current wall.
        for (let i = 0; i < w.length; i++) {
          localPosition.copy(w.origin)
            .addScaledVector(orientation.direction, i + 0.5);
          worldPosition.copy(localPosition).add(area.location);

          let c = new DoorwayCandidate(
            worldPosition,
            localPosition,
            orientation.normal,
            w,
            area
          );
          candidates.push(c);
        }
      });
      
      return candidates;
    }
  
  }

  export class DoorwayCandidate {

    private _worldPosition = new Vector3();
    private _localPosition = new Vector3();
    private _normal = new Vector3();
    private _wall: WallDefinition;
    private _area: Area;

    /**
     * @param position In world coordinate.
     */
    constructor(
      worldPosition: Vector3,
      localPosition: Vector3,
      normal: Vector3,
      wall: WallDefinition,
      area: Area
    ) {
      if (worldPosition) this._worldPosition.copy(worldPosition);
      if (localPosition) this._localPosition.copy(localPosition);
      if (normal) this._normal.copy(normal);
      if (wall) this._wall = wall;
      if (area) this._area = area;
    }

    get worldPosition() { return this._worldPosition; }
    get localPosition() { return this._localPosition; }
    get normal() { return this._normal; }
    get wall() { return this._wall; }
    get area() { return this._area; }

  }

}