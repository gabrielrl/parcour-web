/// <reference path="../../defs/prkr.bundle.d.ts" />
/// <reference path="./plane-resize-handle.ts" />
/// <reference path="./resize-tool.ts" />
/// <reference path="../objects/editor-object.ts" />

namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;

  import EditorObject = PRKR.Editor.Objects.EditorObject;

  export class ResizeDelta {
    location: Vector3;
    size: Vector3;

    static Empty = {
      location: M.Vector3.Zero,
      size: M.Vector3.Zero
    };
  }
  
  export class ResizeHelper extends THREE.Object3D {

    private _handles: ResizeHandle[] = [];

    private _helper: Tools.EditorObjectHelper;

    private _hovered: boolean = false;

    /** Hit info provided with the last call to `resizeStart`. */
    private _resizeStartHit: ResizeHelperHit = null;

    /** Indicates the validity of the current resizing operation (if resizing). */
    private _resizeValid: boolean = true;

    constructor(
      private _editorObject: EditorObject,
      private _editor: ParcourEditor
    ) {
      super();
      this.name = 'ResizeHelper for ' + this._editorObject.name;

      // Fetch the handles and add them.
      this._handles = this._editorObject.resizeHandles;

      for (let i = 0; i < this._handles.length; i++) {
        this.add(this._handles[i].sceneObject);
      }

      this._helper = new Tools.EditorObjectHelper(this._editorObject);
      this._helper.position.copy(this._editorObject.getWorldPosition());
      this._helper.setRestRotation(this._editorObject.getRotation());
      this._helper.visible = false;

      this.add(this._helper);
    }

    public get editorObject() { return this._editorObject; }

    public test(event: JQueryMouseEventObject): ResizeHelperHit {

      // hit test all the handles.
      let intersections = this._editor.projectMouseOnObjects(
        new THREE.Vector2(event.clientX, event.clientY),
        this._handles.map(h => h.hitObject));

      if (intersections.length > 0) {

        // Using the closest intersection.
        let intersection = intersections[0];

        // Find out which handle was hit.
        let handle: ResizeHandle = null;
        for (var i = 0; i < this._handles.length; i++) {
          
          // FRAGILE. Assumes too much... TODO better
          if (
            this._handles[i].sceneObject === intersection.object
              ||
            this._handles[i].sceneObject === intersection.object.parent
          ) {
            handle = this._handles[i];
            break;
          }
        }

        if (handle) {
          return {
            helper: this,
            handle: handle,
            point: intersection.point,
            distance: intersection.distance
          };
        }
      }
    }

    /** Sets hovered state. */
    public setHovered(hit: ResizeHelperHit) {

      if (!hit) {
        this.unsetHovered();
      } else {
        this._hovered = hit.helper === this;

        this._handles.forEach(handle => {
          handle.hovered = handle.isCompatible(hit.handle);
        });
      }

    }

    /** Unsets hovered state. */
    public unsetHovered() {
      this._hovered = false;
      this._handles.forEach(h => {
        if (h.hovered) {
          h.hovered = false;
        }
      });
    }

    public resizeStart(mouseEvent: JQueryMouseEventObject, hit: ResizeHelperHit) {

      if (!mouseEvent) throw new Error('"mouseEvent" parameter can not be null of undefined');
      if (!hit) throw new Error('"hit" parameter can not be null or undefined');

      hit.handle.resizeStart(hit); // ??

      this._resizeStartHit = hit;
      this._resizeValid = true;

      this._handles.forEach(h => {
        if (hit.handle !== h) h.visible = false;
      });
      // !! This is dangerous...
      this._editorObject.sceneObject.visible = false;
      this._helper.visible = true;
      this._updateHelper(ResizeDelta.Empty);
      this._updateHelperColor();
      
    }

    public resizeMove(mouseEvent: JQueryMouseEventObject): ResizeDelta {
      if (this._resizeStartHit) {
        let handle = this._resizeStartHit.handle;
        let handleDelta = handle.resizeMove(mouseEvent, this._editor);
        let delta = handle.applyDelta(handleDelta);
        let adjustedDelta = this.computeAdjustedDelta(delta);
        this._updateHelper(adjustedDelta);
        return adjustedDelta;
      } else {
        return null;
      }
    }

    /**
     * Sets the current state (copy) from an other `handle` in another `ResizeHelper`.
     * 
     * Only does something if the current resize helper has a matching "compatible" handle.
     */
    public setResizeDelta(handle: ResizeHandle, delta: ResizeDelta) {

      this._handles.forEach(h => h.visible = false);

      if (this.isCompatible(handle)) {
        let adjustedDelta = this.computeAdjustedDelta(delta);
        this._helper.visible = true;
        this._updateHelper(adjustedDelta);
        return adjustedDelta;
      } else {
        this._helper.visible = false;
        return null;
      }
  
    }


    public setError() {
      this._resizeValid = false;
      this._updateHelperColor();
    } 

    public unsetError() {
      this._resizeValid = true;
      this._updateHelperColor();
    } 
  

    public resizeEnd(mouseEvent: JQueryMouseEventObject): ResizeDelta {
      let adjustedDelta: ResizeDelta = null;
      if (this._resizeStartHit) {
        let handle = this._resizeStartHit.handle;
        let delta = handle.resizeEnd(mouseEvent);
        let resizeDelta = handle.applyDelta(delta);
        adjustedDelta = this.computeAdjustedDelta(resizeDelta);
      }

      this._resizeStartHit = null;
      this._resizeValid = true;

      this._handles.forEach(h => { h.visible = true; });
      // !! This is dangerous...
      this._editorObject.sceneObject.visible = true;
      this._helper.visible = false;

      return adjustedDelta;
    }

    /**
     * Checks whether the current helper is compatible with the specified handle.
     * 
     * If it **is** compatible, it means a resize delta originating from that `handle` could be adjusted using
     * `computeAdjustedDelta` and applied to the object for which this helper was created.
     * 
     * @param handle A resize handle to test.
     */
    public isCompatible(handle: ResizeHandle) {
      return _.some(this._handles, h => h.isCompatible(handle));
    }

    public computeAdjustedDelta(delta: ResizeDelta): ResizeDelta {
      if (!delta) return null;

      let location = delta.location.clone();
      if (this._editorObject.moveConstraints) {
        this._editorObject.moveConstraints.apply(location);
      }

      let size = delta.size.clone();
      if (this._editorObject.sizeConstraints) {
        this._editorObject.sizeConstraints.apply(size);
      }

      return { location, size };
    }

    private _updateHelper(delta: ResizeDelta) {
      
      if (delta) {

        this._helper.setMoveBy(delta.location);
        this._helper.setResizeBy(delta.size);

      }
    }

    private _updateHelperColor() {
      this._helper.setValidState(this._resizeValid);
    }

  }

  export interface ResizeHelperHit {
    helper: ResizeHelper;
    handle: ResizeHandle;
    point: Vector3;
    distance: number;
  }

}