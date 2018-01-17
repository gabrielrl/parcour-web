/// <reference path="../../defs/prkr.bundle.d.ts" />

/// <reference path="./resize-handle.ts" />
/// <reference path="./resize-tool.ts" />
/// <reference path="../objects/editor-object.ts" />

namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;

  import EditorObject = PRKR.Editor.Objects.EditorObject;
  
  export class ResizeHelper extends THREE.Object3D {

    private _handles: ResizeHandle[] = [];

    private _resizingHelper: PRKR.Helpers.BoundingBoxHelper;
    private _resizingAdjustedHelper: PRKR.Helpers.BoundingBoxHelper;

    private _hovered: boolean = false;

    /** Hit info provided with the last call to `resizeStart`. */
    private _resizeStartHit: ResizeHelperHit = null;

    /** Indicates the validity of the current resizing operation (if 
     * resizing). */
    private _resizeValid: boolean = true;

    constructor(
      private _editorObject: EditorObject,
      private _editor: ParcourEditor
    ) {
      super();
      this.name = 'ResizeHelper for ' + this._editorObject.name;

      // Build the handles and add them.
      this._handles = this._buildHandles();
      for (let i = 0; i < this._handles.length; i++) {
        this.add(this._handles[i]);
      }

      // Build the resizing helpers.
      var unitBox = new THREE.Box3(M.Vector3.Zero, M.Vector3.OneOneOne)
      this._resizingHelper = new PRKR.Helpers.BoundingBoxHelper(
        unitBox, {
          useFaces: false,
          useLines: true,
          lineMaterial: new THREE.LineDashedMaterial({
            color: Colors.TOOL_SUCCESS_COLOR,
            dashSize: 0.25,
            gapSize: 0.125
          })
        });
      this._resizingHelper.visible = false;
      this._resizingAdjustedHelper = new PRKR.Helpers.BoundingBoxHelper(
        unitBox, {
          useFaces: true,
          useLines: false,
        faceMaterial: new THREE.MeshBasicMaterial({
            color: Colors.TOOL_SUCCESS_COLOR,
            transparent: true,
            opacity: 0.333
          })
        });
      this._resizingAdjustedHelper.visible = false;

      this.add(this._resizingHelper);
      this.add(this._resizingAdjustedHelper);
    }

    public get editorObject() { return this._editorObject; }

    public test(event: JQueryMouseEventObject): ResizeHelperHit {

      // hit test all the handles.
      let intersections = this._editor.projectMouseOnObjects(
        new THREE.Vector2(event.clientX, event.clientY),
        this._handles);

      if (intersections.length > 0) {
        let intersection = intersections[0];

        // Find out which handle was hit.
        let handle: ResizeHandle = null;
        for (var i = 0; i < this._handles.length; i++) {
          // FRAGILE. Assusmes the hit was with a child object of the handle
          // itself... TODO better
          if (this._handles[i] === intersection.object.parent ) {
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
    public setHovered(mouseEvent: JQueryMouseEventObject, hit: ResizeHelperHit) {

      if (!mouseEvent) throw new Error('"mouseEvent" parameter can not be null of undefined');

      if (hit && hit.helper === this) {

        this._hovered = true;

        let handle = hit.handle;
        handle.hovered = true;
        handle.update();

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
          h.update();
        }
      });
    }

    public resizeStart(mouseEvent: JQueryMouseEventObject, hit: ResizeHelperHit) {

      if (!mouseEvent) throw new Error('"mouseEvent" parameter can not be null of undefined');
      if (!hit) throw new Error('"hit" parameter can not be null or undefined');

      hit.handle.resizeStart(hit); // ??

      this._resizeStartHit = hit;
      this._resizeValid = true;

      this._resizingHelper.visible = true;
      this._resizingAdjustedHelper.visible = true;
      this._updateResizingHelpers(M.Vector3.Zero, M.Vector3.Zero);
      this._updateResizingHelpersColor();
      
    }

    public resizeMove(mouseEvent: JQueryMouseEventObject) {
      if (this._resizeStartHit) {
        
        let delta = this._resizeStartHit.handle.resizeMove(mouseEvent);        
        let adjustedDelta = this._computeAdjustedDelta(delta);
        this._updateResizingHelpers(delta, adjustedDelta);
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
  

    public resizeEnd(mouseEvent: JQueryMouseEventObject) {
      let resizeDelta: Vector3 = null;
      if (this._resizeStartHit) {
        resizeDelta = this._resizeStartHit.handle.resizeEnd(mouseEvent);
      }
      let adjustedDelta = this._computeAdjustedDelta(resizeDelta);

      this._resizeStartHit = null;
      this._resizeValid = true;

      this._resizingHelper.visible = false;
      this._resizingAdjustedHelper.visible = false;

      return adjustedDelta;
    }

    private _computeAdjustedDelta(sizeDelta: Vector3): Vector3 {
       return new Vector3().copy(sizeDelta).round();
    }

    private _updateResizingHelpers(sizeDelta: Vector3, adjustedDelta: Vector3) {

      let bbox = this._editorObject.boundingBox;
      let size = bbox.getSize();
      
      this._resizingHelper.scale.set(
        size.x + sizeDelta.x,
        size.y + sizeDelta.y,
        size.z + sizeDelta.z
      );
      this._resizingHelper.position.addVectors(
        bbox.min, this._editorObject.getWorldPosition());

      this._resizingAdjustedHelper.scale.set(
        size.x + adjustedDelta.x,
        size.y + adjustedDelta.y,
        size.z + adjustedDelta.z
      );
      this._resizingAdjustedHelper.position.addVectors(
        bbox.min, this._editorObject.getWorldPosition());
    }

    private _updateResizingHelpersColor() {
      if (this._resizeValid) {
        this._resizingHelper.setColor(Colors.TOOL_SUCCESS_COLOR);
        this._resizingAdjustedHelper.setColor(Colors.TOOL_SUCCESS_COLOR);
      } else {
        this._resizingHelper.setColor(Colors.TOOL_ERROR_COLOR);
        this._resizingAdjustedHelper.setColor(Colors.TOOL_ERROR_COLOR);
      }
    }

    private _buildHandles(): ResizeHandle[] {
      let box = this._editorObject.boundingBox;
      let size = box.getSize();
      let origin = this._editorObject.getWorldPosition();

      let minDelta = new Vector3(
        -(size.x - 1),
        0,
        -(size.z - 1)
      );

      // X-axis handle
      let x = new ResizeHandle(this._editor, {
        width: 1,
        height: size.z - .5,
        direction: M.Vector3.PositiveX,
        minDelta: minDelta,
        location: new Vector3(
          origin.x + box.max.x - .5, 
          origin.y + box.min.y,
          origin.z + box.min.z)
      });

      // Z-axis handle
      let z = new ResizeHandle(this._editor, {
        width: size.x - .5,
        height: 1,
        direction: M.Vector3.PositiveZ,
        minDelta: minDelta,
        location: new Vector3(
          origin.x + box.min.x, 
          origin.y + box.min.y,
          origin.z + box.max.z - .5
        )
      })

      // XZ-axis handle
      let xz = new ResizeHandle(this._editor, {
        width: 1, 
        height: 1,
        direction: new Vector3(1, 0, 1),
        minDelta: minDelta,
        location: new Vector3(
          origin.x + box.max.x - .5, 
          origin.y + box.min.y,
          origin.z + box.max.z - .5
        )
      });

      // TODO build more handles.
      
      return [ x, z, xz ];
    }
  }

  export interface ResizeHelperHit {
    helper: ResizeHelper;
    handle: ResizeHandle;
    point: Vector3;
    distance: number;
  }

}