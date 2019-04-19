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

    private _resizingHelper: Tools.EditorObjectHelper;
    private _resizingAdjustedHelper: Tools.EditorObjectHelper;

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

      // Build the resizing helpers.
      this._resizingHelper = new Tools.EditorObjectHelper(this._editorObject);
      this._resizingHelper.position.copy(this._editorObject.getWorldPosition());
      this._resizingHelper.setRestRotation(this._editorObject.getRotation());

      this._resizingHelper.visible = false;
      this._resizingAdjustedHelper = new Tools.EditorObjectHelper(this._editorObject);
      this._resizingAdjustedHelper.position.copy(this._editorObject.getWorldPosition());
      this._resizingAdjustedHelper.setRestRotation(this._editorObject.getRotation());
      this._resizingAdjustedHelper.visible = false;

      this.add(this._resizingHelper);
      this.add(this._resizingAdjustedHelper);
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

      if (hit && hit.helper === this) {

        this._hovered = true;

        let handle = hit.handle;
        handle.hovered = true;
        // handle.update();

      } else {

        this.unsetHovered();

      }
    }

    /** Unsets hovered state. */
    public unsetHovered() {
      this._hovered = false;
      this._handles.forEach(h => {
        if (h.hovered) {
          h.hovered = false;
          // h.update();
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
      this._resizingHelper.visible = true;
      this._resizingAdjustedHelper.visible = true;
      this._updateResizingHelpers(ResizeDelta.Empty, ResizeDelta.Empty);
      this._updateResizingHelpersColor();
      
    }

    public resizeMove(mouseEvent: JQueryMouseEventObject): ResizeDelta {
      if (this._resizeStartHit) {
        let handle = this._resizeStartHit.handle;
        let delta = handle.resizeMove(mouseEvent, this._editor);
        let resizeDelta = handle.applyDelta(delta);
        let adjustedDelta = this._computeAdjustedDelta(resizeDelta);
        this._updateResizingHelpers(resizeDelta, adjustedDelta);
        return adjustedDelta;
      } else {
        return null;
      }
    }

    public setError() {
      this._resizeValid = false;
      this._updateResizingHelpersColor();
    } 

    public unsetError() {
      this._resizeValid = true;
      this._updateResizingHelpersColor();
    } 
  

    public resizeEnd(mouseEvent: JQueryMouseEventObject): ResizeDelta {
      let adjustedDelta: ResizeDelta = null;
      if (this._resizeStartHit) {
        let handle = this._resizeStartHit.handle;
        let delta = handle.resizeEnd(mouseEvent);
        let resizeDelta = handle.applyDelta(delta);
        adjustedDelta = this._computeAdjustedDelta(resizeDelta);
      }

      this._resizeStartHit = null;
      this._resizeValid = true;

      this._handles.forEach(h => { h.visible = true; });
      this._resizingHelper.visible = false;
      this._resizingAdjustedHelper.visible = false;

      return adjustedDelta;
    }

    private _computeAdjustedDelta(delta: ResizeDelta): ResizeDelta {
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

    private _updateResizingHelpers(resizeDelta: ResizeDelta, adjustedDelta: ResizeDelta) {

      if (resizeDelta) {
      
        this._resizingHelper.setMoveBy(resizeDelta.location);
        this._resizingHelper.setResizeBy(resizeDelta.size);

      }
      
      if (adjustedDelta) {

        this._resizingAdjustedHelper.setMoveBy(adjustedDelta.location);
        this._resizingAdjustedHelper.setResizeBy(adjustedDelta.size);

      }
    }

    private _updateResizingHelpersColor() {
      this._resizingHelper.setValidState(this._resizeValid);
      this._resizingAdjustedHelper.setValidState(this._resizeValid);
    }

  }

  export interface ResizeHelperHit {
    helper: ResizeHelper;
    handle: ResizeHandle;
    point: Vector3;
    distance: number;
  }

}