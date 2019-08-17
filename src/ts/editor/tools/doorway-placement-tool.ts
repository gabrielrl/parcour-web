/// <reference path="./doorway-helper.ts" />
/// <reference path="../edit-steps/edit-step.ts" />
/// <reference path="../behaviors/doorway-placer.ts" />

namespace PRKR.Editor.Tools {

  import Vector2 = THREE.Vector2;
  import EditStep = PRKR.Editor.EditSteps.EditStep;
  import AddObjecStep = EditSteps.AddObjectStep;
  import DoorwayCandidate = Behaviors.DoorwayCandidate;

  export class DoorwayPlacementTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super();
    }

    get name(): string { return 'doorway-placement'; }

    get displayName(): string { return 'Doorways'; }

    get enabled(): boolean { return true; }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({ keyCode: 68 /* D */ });
    }

    /** Currently active dooway candidate (under pointer). */
    private _activeCandidate: DoorwayCandidate = null;

    /** Indicates if currently placing a door. */
    private _placing: boolean = false;

    private _helper: DoorwayHelper = new DoorwayHelper();

    activate(): void {
      this._activeCandidate = null;
      this._placing = false;
      this._editor.addToScene(this._helper);
      this._helper.visible = false;
      this._editor.setPointer('crosshair');
      this._editor.setStatus('Click on the floor near a wall to add a doorway');
    }

    deactivate(): void {
      this._editor.removeFromScene(this._helper);
      this._editor.setPointer(null);
    }

    notifyMouseMove(event: JQuery.MouseEventBase): void {

      // See if the mouse position gets us any doorway candidate.
      let intersection = this._editor.projectMouseOnFloor(
        new Vector2(event.clientX, event.clientY)
      );
      let placer = this._editor.getDoorwayPlacer();
      let c = placer.getCandidate(intersection.point);
      if (!c) {

        this._activeCandidate = null;
        this._hideHelper();

      } else {

       // If we found a valid candidate, give feedback by placing the helper.
        this._activeCandidate = c;

        this._helper.position.copy(c.worldPosition);
        let rot = new THREE.Quaternion();
        rot.setFromUnitVectors(M.Vector3.PositiveZ, c.normal);
        this._helper.setRotationFromQuaternion(rot);
        this._helper.visible = true;
        this._editor.requestRender();
      }       
    }

    notifyMouseDown(event: JQuery.MouseEventBase): void {
      // Enter "placing" mode.
      this._placing = true;
    }

    notifyMouseUp(event: JQuery.MouseEventBase): void {
      
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

    notifyClick(event: JQuery.MouseEventBase): void {
      // throw new Error('Method not implemented.');
    }

    private _buildEditStep(): EditStep {
      if (this._activeCandidate) {
        let step = new AddObjecStep({
          $type: 'Doorway',
          areaId: this._activeCandidate.area.id,
          location: this._activeCandidate.localPosition,
          size: Model.Constants.DoorwaySize
        });
        return step;
      }
      return undefined;
    }


    private _hideHelper() {
      this._helper.visible = false;
      this._editor.requestRender();
    }
  }
}