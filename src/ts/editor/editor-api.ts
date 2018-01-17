// /// <reference path="./objects/editor-object.ts" />
// /// <reference path="../defs/prkr.bundle.d.ts" />

// namespace PRKR.Editor {

//   import Vector3 = THREE.Vector3;
//   import EditorObject = Objects.EditorObject;

//   export interface ParcourEditor {

//     modelIsDirty: boolean;

//     save();
    
//     /**
//      * Gets the currently selected objects.
//      * @returns Array of selected objects.
//      */
//     selectedObjects: EditorObject[];

//     requestRender(): void;

//     objects: EditorObject[];
//     getObjectById(id: string): EditorObject;
//     getObjectsByAreaId(areaId: string): EditorObject[];
//     getAreas(): Objects.RoomObject[];

//     getAreaAtLocation(worldLocation: Vector3): PRKR.Model.Area;
    
//     select(object: EditorObject[] | EditorObject): EditorObject[];
//     selectByIds(ids: string[] | string): EditorObject[];

//     /**
//      * Adds an object to the selection.
//      * @returns The new selected object list.
//      */
//     addToSelection(object: Objects.EditorObject): EditorObject[];

//     /**
//      * Removes an object from the selection.
//      * @returns The new selected object list.
//      */
//     removeFromSelection(object: EditorObject): EditorObject[];

//     /**
//      * @param x Optional target for screen-x-to-world vector.
//      * @param y Optional target for screen-y-to-world vector. 
//      * @returns The x and y screen-to-world vectors (in an array).
//      */
//     computeScreenToWorldVectors(x?: Vector3, y?: Vector3): Vector3[];    

//     projectMouseOnFloor(mouse: THREE.Vector2): THREE.Intersection;
//     projectMouseOnObjects(mouse: THREE.Vector2, objects: THREE.Object3D[]): THREE.Intersection[];
//     getSelectableObjectsAt(x: number, y: number): EditorObject[];

//     addToScene(object: THREE.Object3D): void;
//     removeFromScene(object: THREE.Object3D): void;

//     addEditStep(step: PRKR.Editor.EditSteps.EditStep): PRKR.Editor.EditSteps.StepResult;
//     validateEditStep(step: PRKR.Editor.EditSteps.EditStep): PRKR.Validators.IValidationResult[]; 

//     /** Gets the currently active tool. */
//     activeTool: PRKR.Editor.Tools.Tool;

//     selectTool(tool: Tools.Tool): void;

//     /** Gets an editor tool by its `name` or null.  */
//     getToolByName(name: string): PRKR.Editor.Tools.Tool;

//     setPointer(pointerName: string): void;

//     getCameraRig(): CameraRig;
//     getCameraPosition(target: Vector3): Vector3;
//     setCameraPosition(position: Vector3): void;

//   }
// }
