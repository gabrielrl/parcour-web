/// <reference path="./doorway-helper.ts" />
/// <reference path="../edit-steps/edit-step.ts" />
/// <reference path="../edit-steps/add-doorway-step.ts" />

namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import EditStep = PRKR.Editor.EditSteps.EditStep;
  import AddObjecStep = EditSteps.AddObjectStep;
  import WallDefinition = PRKR.Model.WallDefinition;
  import Area = PRKR.Model.Area;

  export class DoorwayPlacementTool implements Tool {

    constructor(private _editor: ParcourEditor) { }

    get name(): string { return 'doorway-placement'; }

    get displayName(): string { return 'Doorways'; }

    get enabled(): boolean { return true; } 

    /** Map of room id to array of doorway candidates. */
    private _candidates: { [roomId: string]: DoorwayCandidate[] } = {};

    /** Currently active dooway candidate (under pointer). */
    private _activeCandidate: DoorwayCandidate = null;

    /** Indicates if currently placing a door. */
    private _placing: boolean = false;

    private _helper: DoorwayHelper = new DoorwayHelper();

    activate(): void {
      this._candidates = {};
      this._activeCandidate = null;
      this._placing = false;
      this._editor.addToScene(this._helper);
      this._helper.visible = false;
      this._editor.setPointer('crosshair');
    }

    deactivate(): void {
      this._editor.removeFromScene(this._helper);
      this._editor.setPointer(null);
    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      // See if the mouse is over any room.
      let intersection = this._editor.projectMouseOnFloor(
        new Vector2(event.clientX, event.clientY)
      );
      
      let room = this._editor.getAreaAtLocation(intersection.point);
      if (room) {
        // Get candidates for this room
        let candidates = this._getCandidates(room);

        // Find the closest.
        let c: DoorwayCandidate = null;
        let dist: number = Infinity;
        for (let i = 0; i < candidates.length; i++) {
          let sqDist = intersection.point.distanceToSquared(candidates[i].worldPosition);
          if (sqDist < dist && sqDist < 4) {
            c = candidates[i];
            dist = sqDist;
          }
        }

        // If we found a valid candidate, give feedback by placing the helper.
        if (c) {

          this._activeCandidate = c;

          this._helper.position.copy(c.worldPosition);
          let rot = new THREE.Quaternion();
          rot.setFromUnitVectors(M.Vector3.PositiveZ, c.normal);
          this._helper.setRotationFromQuaternion(rot);
          this._helper.visible = true;
          this._editor.requestRender();
        } else {
          this._activeCandidate = null;
          this._hideHelper();
        }
      } else {
        this._activeCandidate = null;
        this._hideHelper();
      }
    }

    notifyMouseDown(event: JQueryMouseEventObject): void {
      // Enter "placing" mode.
      this._placing = true;
    }

    notifyMouseUp(event: JQueryMouseEventObject): void {
      
      if (this._placing && this._activeCandidate) {
        let step = this._buildEditStep();
        let validation = this._editor.validateEditStep(step);

        console.debug('Validation result:', validation);
        // TODO Validate?

        this._editor.addEditStep(step);
        this._editor.requestRender();
        this._placing = false;
      }
    }

    notifyClick(event: JQueryMouseEventObject): void {
      // throw new Error('Method not implemented.');
    }

    private _getCandidates(room: Model.Area): DoorwayCandidate[] {
      if (!room) {
        return [];
      }

      if (!this._candidates[room.id]) {
        this._candidates[room.id] = this._buildCandidates(room);
      }

      return this._candidates[room.id];
    }

    private _buildEditStep(): EditStep {
      if (this._activeCandidate) {
        let step = new AddObjecStep({
          $type: 'Doorway',
          areaId: this._activeCandidate.area.id,
          location: this._activeCandidate.localPosition,
          size: Model.Constants.DoorwaySize
        });
        // let step = new AddDoorwayStep({
        //   areaId: this._activeCandidate.area.id,
        //   location: this._activeCandidate.localPosition,
        //   size: Model.Constants.DoorwaySize
        // });
        return step;
      }
      return undefined;
    }

    private _buildCandidates(room: Model.Area): DoorwayCandidate[] {

      let candidates: DoorwayCandidate[] = [];
      let walls = room.getWallDefinitions();

      walls.forEach(w => {
        let worldPosition = new Vector3();
        let localPosition = new Vector3();
        let orientation = w.orientation;

        // For each edge center in the current wall.
        for (let i = 0; i < w.length; i++) {
          localPosition.copy(w.origin)
            .addScaledVector(orientation.direction, i + 0.5);
          worldPosition.copy(localPosition).add(room.location);

          let c = new DoorwayCandidate(
            worldPosition,
            localPosition,
            orientation.normal,
            w,
            room
          );
          candidates.push(c);
        }
      });
      
      return candidates;
    }

    private _hideHelper() {
      this._helper.visible = false;
      this._editor.requestRender();
    }
  }

  class DoorwayCandidate {

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