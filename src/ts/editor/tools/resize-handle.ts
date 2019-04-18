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

    // TODO ?? Shouldn't they all just return ResizeDelta instances ??

    /**
     * @returns the current "handle delta". Type depends on implementation.
     */ 
    // TODO comment better
    resizeMove(mouseEvent: JQueryMouseEventObject, editor: ParcourEditor): any;

    /**
     * @returns the current "handle delta". Type depends on implementation.
     */ 
    // TODO comment better
    resizeEnd(mouseEvent: JQueryMouseEventObject): any;

    /**
     * @param handleDelta The "handle delta" to apply/convert. Type depends on implementation.
     */ 
    // TODO comment better    
    applyDelta(handleDelta: any): ResizeDelta;

  }
}
