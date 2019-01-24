/// <reference path="../../defs/prkr.bundle.d.ts" />

namespace PRKR.Editor.Objects {

  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Property = PRKR.Model.Property;

  /**
   * Base abstract class for every object the user can manipulate through
   * the editor.
   */
  export abstract class EditorObject {

    /**
     * Model object behind the current editor object.
     */
    private _model: ParcourObject;

    /**
     * Parcour to which the backing model object belongs.
     */
    private _parcour: Parcour;

    /** The root three.js object. */
    private _sceneObject: THREE.Object3D = new THREE.Object3D();

    /** The object shown when the current object is selected. */
    private _selectedOverlay: THREE.Object3D = null;

    constructor(model: ParcourObject, parcour: Parcour) {

      if (!model) { throw new Error('"model" must be defined'); }
      if (!parcour) { throw new Error('"parcour" must be defined'); }

      this._model = model;
      this._parcour = parcour;
      // this._position.copy(model.location);

      this._buildSelectedOverlay();
    }

    /**
     * Builds an editor object from a parcour object.
     */
    public static fromModel(model: ParcourObject, parcour: Parcour) {
      let eo: Objects.EditorObject = null;
      if (model instanceof PRKR.Model.RoomArea) {
        eo = new Objects.RoomObject(model, parcour);
      } else if (model instanceof PRKR.Model.Location) {
        eo = new Objects.LocationObject(model, parcour);
      } else if (model instanceof PRKR.Model.Doorway) {
        eo = new Objects.DoorwayObject(model, parcour);      
      } else if (model instanceof PRKR.Model.StaticObject) {
        eo = new Objects.StaticObject(model, parcour);
      } else if (model instanceof PRKR.Model.DynamicObject) {
        eo = new Objects.DynamicObject(model, parcour);
      } else {
        throw new Error(`Can not build an EditorObject for ${ model }`);
      }
      return eo;
    }

    /** Gets the id of the model backing the current editor object. */
    get id() { return this._model.id }

    /** Gets the name of the model backing the current editor object. */
    get name() { return this._model.name; }

    /** Gets the model object behind the current editor object. */
    get model() { return this._model; }

    /** Gets the parcour to which the backing model object belongs. */
    get parcour() { return this._parcour; }
    
    private _selected: boolean = false;
    get selected() {
      return this._selected;
    }
    set selected(value) {
      if (value != this._selected) {
        this._selected = value;
        this._onSelectedChanged(value);
      }
    }

    /**
     * Gets if the current object can be moved.
     * Override. Defaults to false.
     */
    get movable(): boolean { return false; }

    /**
     * Gets the current object's move constraints.
     * No need to override.
     */
    get moveConstraints(): MoveConstraints { 
      return getMoveConstraints(this.model);
    }

    /**
     * Gets the current object's location constraints.
     * No need to override.
     */
    get locationContstraints(): LocationConstraints {
      return getLocationConstraints(this.model);
    }

    /**
     * Gets if the object can be rotated.
     * Override. Defaults to false.
     */
    get rotatable(): boolean { return false; }

    /**
     * Gets the current object's rotation constraint.
     * No need to override.
     */
    get rotateConstraints(): RotateConstraints {
      return getRotationConstratins(this.model);
    }

    /**
     * Gets if the current object can be resized.
     * Override.
     */
    get resizable(): boolean { return false; }

    private _bbox: THREE.Box3;

    /**
     * Gets the object's bounding box (using the object's origin as
     * referencial)
     */
    get boundingBox() { 
      if (!this._bbox) {
        this._bbox = this._computeBoundingBox();
      }
      return this._bbox;
    }

    /**
     * Gets a geometry for the object. May return null since not all object will implement this.
     * Override, don't call super.
     */
    get geometry(): THREE.Geometry {
      return null;
    }

    protected _invalidateBoundingBox() {
      this._bbox = null;
    }

    get sceneObject(): THREE.Object3D {
      return this._sceneObject;
    }

    private _selectionHotSpot: THREE.Object3D = null;
    get selectionHotSpot(): THREE.Object3D {

      if (!this._selectionHotSpot) {
        this._selectionHotSpot = this._buildSelectionHotSpot();
        this._selectionHotSpot.userData = this;
      }
      return this._selectionHotSpot;
    }

    protected _invalidateSelectionHotSpot() {
      this._selectionHotSpot = null;
    }

    protected invalidateAll() {
      this._invalidateBoundingBox();
      this._updateSelectedOverlay();
      this._invalidateSelectionHotSpot();
    }

    /**
     * Updates the current object to reflect the backing model's current state.
     * Override, call super.
     */
    public update() {
      console.debug(`I'm editor object "${this.name}" and I've been asked to update myself.`);
    }

    // Override this one.
    protected _buildSelectionHotSpot(): THREE.Object3D {
      let hotSpot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 2, 2), null);
      return hotSpot;
    }

    protected _onSelectedChanged(selected: boolean): void {
      this._selectedOverlay.visible = selected;
    }

    // Override. Call only once.
    protected _buildSelectedOverlay(): void {

      this._selectedOverlay = new PRKR.Helpers.BoundingBoxHelper(new THREE.Box3(
        M.Vector3.Zero,
        M.Vector3.OneOneOne
      ), {
        useLines: true,
        useFaces: false
      });
      this.sceneObject.add(this._selectedOverlay);
      this._updateSelectedOverlay();
    }

    /** Override if you overrode `_buildSelectedOverlay`. */
    protected _updateSelectedOverlay() {
      let bbox = this.boundingBox;
      this._selectedOverlay.scale.copy(bbox.getSize());
      this._selectedOverlay.position.copy(bbox.min);
      this._selectedOverlay.visible = this._selected;
    }

    /**
     * Gets the world position for the current object.
     * @param target Optional target for the world position.
     * @returns the world position for the current object.
     */
    public abstract getWorldPosition(target?: Vector3): Vector3;

    /**
     * Gets the properties of the current object.
     * @returns the properties of the current object.
     */
    public getProperties(): Property[] {
      return this._model.getProperties();
    }

    /** Compute the current object's bounding box. */
    protected abstract _computeBoundingBox(): Box3;
  }
}