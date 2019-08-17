namespace PRKR.Editor.Tools {

  export interface ResizeHandle {

    /** A short string used to identify the handle in a set and to match it across helpers. */
    label: string;

    /** The Object3D to add to the scene to display. */
    sceneObject: THREE.Object3D;

    /** The Object3D to use for hit test. */
    hitObject: THREE.Object3D;

    /** Gets or sets if the handle is currently hovered by the mouse. */
    hovered: boolean;

    /** Gets or sets if the handle is currently visible. */
    visible: boolean;

    resizeStart(hit: ResizeHelperHit);

    // TODO ?? Shouldn't they all just return ResizeDelta instances ??

    /**
     * @returns the current "handle delta". Type depends on implementation.
     */ 
    // TODO comment better
    resizeMove(mouseEvent: JQuery.MouseEventBase, editor: ParcourEditor): any;

    /**
     * @returns the current "handle delta". Type depends on implementation.
     */ 
    // TODO comment better
    resizeEnd(mouseEvent: JQuery.MouseEventBase): any;

    /**
     * @param handleDelta The "handle delta" to apply/convert. Type depends on implementation.
     */ 
    // TODO comment better    
    applyDelta(handleDelta: any): ResizeDelta;

    /**
     * Checks if another resize handle is compatible with the current one.
     * 
     * @param handle Another resize handle to check for compatibility.
     */
    isCompatible(handle: ResizeHandle): boolean;

  }
}
