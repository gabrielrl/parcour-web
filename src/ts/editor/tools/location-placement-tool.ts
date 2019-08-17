/// <reference path="../../defs/prkr.bundle.d.ts" />

/// <reference path="../edit-steps/edit-step.ts" />
/// <reference path="../edit-steps/move-to-step.ts" />

/// <reference path="./tool.ts" />
/// <reference path="./constants.ts" />

namespace PRKR.Editor.Tools {

  import Object3D = THREE.Object3D;
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;
  import RectangleHelper = PRKR.Helpers.RectangleHelper;
  import C = Tools.Constants;
  import ParcourObject = PRKR.Model.ParcourObject;
  import LocationKind = PRKR.Model.LocationKind;
  import ResultLevel = PRKR.Validators.ResultLevel;
  import Location = PRKR.Model.Location;
  import EditStep = PRKR.Editor.EditSteps.EditStep;
  import MoveToStep = PRKR.Editor.EditSteps.MoveToStep;
  import AddObjectStep = EditSteps.AddObjectStep;

  /**
   * A tool to insert (or move) a parcour location (e.g. _start_).
   */
  export class LocationPlacementTool extends Tool {

    /**
     * The kind of location that the current instance places.
     */
    private _kind: LocationKind;

    /**
     * Indicates if the user is currently placing (holding the mouse
     * button). 
     */
    private _placing: boolean = false;

    /**
     * Current adjusted location in world coordinate.
     */
    private _worldLocation: Vector3 = new Vector3();

    /**
     * Indicates if the current location is valid.
     */
    private _worldLocationValid: boolean = false;

    private _targetAreaId: string;
    private _targetAreaLocation: Vector3 = new Vector3();

    private _helper: Object3D = null;
    private _tileHelper: RectangleHelper = null;

    constructor(private _editor: ParcourEditor, kind: LocationKind) {
      super();

      if (!kind) throw new Error('"kind" must be defined');

      this._kind = kind;

      // TEMPORARY.
      this._helper = this._buildHelper();
      this._helper.position.set(0, 0.5, 0);

      this._tileHelper = new RectangleHelper(
        new THREE.Box2(
          new THREE.Vector2(-.5, -.5),
          new THREE.Vector2(.5, .5)
        ), {
          useLines: true,
          useFaces: true,
          lineMaterial: C.Materials.TileHelper.Valid.Lines,
          faceMaterial: C.Materials.TileHelper.Valid.Faces
        });
    }

    /** Gets if the location placement tool is enabled. */
    get enabled() { return true; }

    get name() { return 'location-placement'; }

    public activate() {
      this._placing = false;
      this._worldLocationValid = false;

      this._helper.visible = false;
      this._tileHelper.visible = false;

      this._editor.addToScene(this._helper);
      this._editor.addToScene(this._tileHelper);

      this._editor.setPointer('crosshair');
      this._editor.setStatus(`Click on the floor to set ${ LocationPlacementTool.kindToString(this._kind) } location`);
    }

    public deactivate() {
      this._placing = false;
      this._worldLocationValid = false;

      this._editor.removeFromScene(this._helper);
      this._editor.removeFromScene(this._tileHelper);
    }

    public notifyMouseDown(event: JQuery.MouseEventBase): void {

      let rawPosition = this._getPosition(event);
      if (rawPosition) {
        this._placing = true;

        this._updateHelpers();

        this._editor.requestRender();
      }
    }

    public notifyMouseMove(event: JQuery.MouseEventBase): void {

      let rawPosition = this._getPosition(event);
      if (rawPosition) {

        LocationPlacementTool._computeLocation(rawPosition, this._worldLocation);
        this._validateLocation();
        this._updateHelpers();

        this._editor.requestRender();
      }
    }

    public notifyMouseUp(event: JQuery.MouseEventBase): void {

      if (this._placing && this._worldLocationValid) {

        let editStep = this._buildEditStep();        
        let result = this._editor.addEditStep(editStep);
        if (result.dirtyIds.length > 0) {
          this._editor.selectByIds(result.dirtyIds);
        }
      }

      this._helper.visible = false;
      this._placing = false;

      this._editor.requestRender();
    }

    /**
     * Gets a string from a LocationKind
     * @param kind a LocationKind enum instance
     */
    public static kindToString(kind: LocationKind) {
      if (kind === LocationKind.Start) {
        return 'Start';
      } else {
        return 'End';
      }
    }

    /**
     * Validates the current location against the parcour and sets
     * `_worldLocationValid`, `_targetAreaId` and `_targetAreaLocation`.
     * `_worldLocation` must be up to date.
     */
    private _validateLocation(): boolean {
      
      let area = this._editor.getAreaAtLocation(this._worldLocation);
      if (!area) {
        this._worldLocationValid = false;
      } else {

        this._targetAreaId = area.id;
        this._targetAreaLocation.subVectors(this._worldLocation, area.location);

        let editStep = this._buildEditStep();
        let validation = this._editor.validateEditStep(editStep);

        // Are there errors?
        let errorCount = 0;
        for (let i = 0; i < validation.length; i++) {
          if (validation[i].level === ResultLevel.Error) errorCount++;
        }
        this._worldLocationValid = errorCount === 0;
      }
      return this._worldLocationValid;
    }

    /**
     * Builds the edit step that correspond to the current position.
     * `_worldLocation` must be up to date.
     */
    private _buildEditStep(): EditStep {
      // Is there already a start location?
      let existing = this._findExistingLocation();
      if (existing) {
        // If there is already a start location, we move it.
        return new MoveToStep(
          existing.id, this._targetAreaId, this._targetAreaLocation);
      } else {
        // If there is no start location, we add it.
        return new AddObjectStep({
          $type: 'Location',
          areaId: this._targetAreaId,
          location: this._targetAreaLocation,
          kind: this._kind
        });
      }
    }

    /**
     * Tries to find and return an existing location in the current parcour for
     * the current _kind_.
     */
    private _findExistingLocation(): ParcourObject {
      let objects = this._editor.objects;
      for (let i = 0; i < objects.length; i++) {
        let po = objects[i].model;
        if (po instanceof Location && po.kind === this._kind) {
          return po;
        }
      }
      return null;
    }

    /**
     * Gets the current world position from mouse event.
     */
    private _getPosition(mouseEvent: JQuery.MouseEventBase): THREE.Vector3 {
      let intersect = this._editor.projectMouseOnFloor(
        new Vector2(mouseEvent.clientX, mouseEvent.clientY));
      
      return intersect ? intersect.point : null;
    }

    /**
     * Computes the final location from the rawLocation.
     */
    private static _computeLocation(rawLocation: Vector3, targetLocation?: Vector3): Vector3 {
      if (!targetLocation) targetLocation = new Vector3();

      targetLocation.copy(rawLocation)
        .addScaledVector(M.Vector3.OneZeroOne, -0.5)
        .round()
        .addScaledVector(M.Vector3.OneZeroOne, 0.5);

      return targetLocation;
    }

    /**
     * Updates `_helper` and `_tileHelper`'s visibility, location and materials.
     * `_placing`, `_worldLocation` and `_worldLocationValid` must be up to date.
     */
    private _updateHelpers() {
      if (this._worldLocationValid) {
        this._tileHelper.setLineMaterial(C.Materials.TileHelper.Valid.Lines);
        this._tileHelper.setFaceMaterial(C.Materials.TileHelper.Valid.Faces);
        if (this._placing) {
          this._helper.visible = true;
          this._helper.position.copy(this._worldLocation);
          this._helper.position.y = 0.75;
        } else {
          this._helper.visible = false;
        }
      } else {
        this._tileHelper.setLineMaterial(C.Materials.TileHelper.Invalid.Lines);
        this._tileHelper.setFaceMaterial(C.Materials.TileHelper.Invalid.Faces);
        this._helper.visible = false;
      }

      this._tileHelper.visible = true;
      this._tileHelper.position.copy(this._worldLocation);
    }

    private _buildHelper(): THREE.Object3D {
      let g = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 12);
      let foreMaterial = new THREE.MeshBasicMaterial({
        color: 0xe3ff32,
        transparent: true,
        opacity: 0.75
      });
      let backMaterial = new THREE.MeshBasicMaterial({
        color: 0xeeff89,
        transparent: true,
        opacity: 0.5,
        depthTest: true,
        depthFunc: THREE.GreaterDepth
      });

      let fore = new THREE.Mesh(g, foreMaterial);
      let back = new THREE.Mesh(g, backMaterial);

      let helper = new THREE.Object3D();
      helper.add(fore);
      helper.add(back);
      return helper;
    }
  }
}