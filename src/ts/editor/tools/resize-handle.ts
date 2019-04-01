namespace PRKR.Editor.Tools {

  export interface ResizeHandle {

    // ...

    /** The Object3D to add to the scene. */
    sceneObject: THREE.Object3D;

    /** Gets or sets if the handle is currently hovered by the mouse. */
    hovered: boolean;

    /** Gets or sets if the handle is currently visible. */
    visible: boolean;

    // update() ??


    resizeStart(hit: ResizeHelperHit);

    resizeMove(mouseEvent: JQueryMouseEventObject, editor: ParcourEditor): THREE.Vector3;

    resizeEnd(mouseEvent: JQueryMouseEventObject): THREE.Vector3;

    applyDelta(handleDelta: THREE.Vector3): ResizeDelta;

  }
}
