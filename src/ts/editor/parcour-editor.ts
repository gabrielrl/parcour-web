/// <reference path="../defs/prkr.bundle.d.ts" />

/// <reference path="./editor-api.ts" />

/// <reference path="./objects/editor-object.ts" />
/// <reference path="./objects/unknown-object.ts" />
/// <reference path="./objects/room-object.ts" />
/// <reference path="./objects/location-object.ts" />

/// <reference path="./components/ribbon.ts" />
/// <reference path="./components/asset-palette.ts" />
/// <reference path="./components/palette-item.ts" />

/// <reference path="./edit-steps/set-property-step.ts" />

/// <reference path="./tools/tool.ts" />
/// <reference path="./tools/select-tool.ts" />
/// <reference path="./tools/move-tool.ts" />
/// <reference path="./tools/resize-tool.ts" />
/// <reference path="./tools/camera-pan-tool.ts" />
/// <reference path="./tools/camera-rotate-tool.ts" />
/// <reference path="./tools/doorway-placement-tool.ts" />
/// <reference path="./tools/add-static-object-tool.ts" />
/// <reference path="./tools/delegation.ts" />

namespace PRKR.Editor {
  // Convinience imports.
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;

  import CameraRig = PRKR.CameraRig;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Property = PRKR.Model.Property;
  import Area = PRKR.Model.Area;
  import AreaElement = PRKR.Model.AreaElement;
  import RoomArea = PRKR.Model.RoomArea;
  import EditorObject = PRKR.Editor.Objects.EditorObject;
  import RoomObject = PRKR.Editor.Objects.RoomObject;
  import Tool = PRKR.Editor.Tools.Tool;
  import EditStep = PRKR.Editor.EditSteps.EditStep;
  import StepResult = PRKR.Editor.EditSteps.StepResult;
  import SetPropertyStep = PRKR.Editor.EditSteps.SetPropertyStep;

  export class ParcourEditor {

    constructor(configuration: PRKR.Configuration, model?: Parcour, viewport?: HTMLElement) {
      if (!configuration) {
        throw new Error('"configuration" is mandatory.');
      }
      if (viewport == null) {
        viewport = this._getDefaultViewport();
      }
      this._configuration = configuration;
      this._model = model;
      this._viewport = viewport;
    }

    /** Global configuration. */
    private _configuration: PRKR.Configuration;

    /** The editor's top-level viewport. Includes the HTML and WebGL. */
    private _viewport: HTMLElement;

    /** The model being edited. */
    private _model: Parcour;

    private _modelIsNew: boolean;
    private _modelIsDirty: boolean;

    private _editSteps
      : { step: PRKR.Editor.EditSteps.EditStep, data?: Object }[]
      = [];

    private _redoStack: EditStep[] = [];

    /**
     * The Editor objects that corresponds to the model. It's the editor's
     * model.
     */
    private _objects: EditorObject[] = [];

    /** The collection of known commands. */
    private _commands: Commands.Command[];

    /** A map of command by name. */
    private _commandMap: { [key: string]: Commands.Command };

    /** The collection of known tools. */
    private _tools: PRKR.Editor.Tools.Tool[];

    /** A map of tools by name. */
    private _toolMap: { [key: string]: Tool } = {};

    /** The currently selected objects. */
    private _selectedObjects: EditorObject[] = [];

    // *** HELPERS *** //
    private _floor: THREE.Mesh = null;
    private _intersectHelper: THREE.Object3D = null;

    /** The active tool. Selected by the user. */
    private _activeTool: PRKR.Editor.Tools.Tool = null; // this._tools[0];

    /** Last occurred mouse event. */
    private _lastMouseEvent: JQueryMouseEventObject = null;

    /** The currently delegated tool. (e.g. overrides through keyboard/mouse "shortcuts") */
    private _mouseDelegation: PRKR.Editor.Tools.Delegation = null;

    /** The AssetPalette instance. */
    private _palette: Components.AssetPalette = null;

    /** The various top level containers that makes the editor's DOM layout */
    private _domLayout : {
      top: HTMLDivElement,
      left: HTMLDivElement,
      right: HTMLDivElement,
      main: HTMLDivElement,
      bottom: HTMLDivElement
    } = null;

    /** The ribbon menu. */
    private _ribbon: Components.Ribbon;

    /** The properties panel. */
    private _propertiesPanel: Components.PropertiesPanel;

    /** jQuery wrapper around the status bar DIV.  */
    private _$statusBar: JQuery;

    /** The three.js WebGL scene. */
    private _scene: THREE.Scene;

    /** The three.js WebGL renderer. */
    private _renderer: THREE.WebGLRenderer;

    /** Dual camera rig orbit rig. */
    private _cameras: CameraRig;

    /** The currently active camera. */
    private _activeCamera: THREE.Camera;

    /** Previously created player window, if any. */
    private _player: Window;

    /** Author defined temporary start location. */
    private _startLocation: THREE.Vector3;

    public init() {
      console.debug('ParcourEditor#init');

      // if we have a parcour id, fetch it!
      let idMatch = window.location.search.match(/id=(.*)/);
      if (idMatch && idMatch[1]) {
        let id = idMatch[1];
        let url = this._configuration.backend + this._configuration.parcours + '/' + id;
        $.getJSON(url).then(
          (data, status, xhr) => {
            try {
              let parcour = new Parcour(data);
              this._model = parcour;
              this._initObjects();
              this._modelIsNew = false;
              this._modelIsDirty = false;
              this.requestRender();
            } catch (err) {
              let error = 'Unable to process parcour data.';
              console.error(error);
              alert(error);
            }
          },
          (data, status, xhr) => {
            let error = 'Unable to fetch parcour "' + id + '".';
            console.error(error);
            alert(error);
          }
        );
      } else {
        this._model = this._buildStartupScene();
        this._modelIsNew = true;
        this._modelIsDirty = false;
      }

      // Build command list.
      this._commands = [
        new Commands.RenameCommand(this),
        new Commands.SaveCommand(this),
        new Commands.PlayCommand(this),
        new Commands.CopyCommand(this),
        new Commands.DeleteCommand(this),
        new Commands.UndoCommand(this),
        new Commands.RedoCommand(this)
      ];

      // Build command map.
      let commandMap: { [key:string]: Commands.Command } = {};
      this._commands.forEach(command => { commandMap[command.name] = command; });
      this._commandMap = commandMap;

      // Build tool list.
      this._tools = [
        new Tools.SelectTool(this),
        new Tools.PlayFromTool(this),
        new Tools.MoveTool(this),
        new Tools.RotateTool(this),
        new Tools.ResizeTool(this),
        new Tools.PasteTool(this),
        new Tools.RoomDrawingTool(this),
        new Tools.CameraPanTool(this),
        new Tools.CameraRotateTool(this),
        new Tools.DoorwayPlacementTool(this),
        new Tools.AddHolesTool(this),
        new Tools.AddStaticObjectTool(this),
        new Tools.AddDynamicObjectTool(this)
      ];

      // Build tool map.
      let toolMap: { [key: string]: Tool } = {};
      this._tools.forEach((tool) => { toolMap[tool.name] = tool; });
      this._toolMap = toolMap;

      this._initDomLayout();
      
      this._initRibbon();
      this._initPropertiesPanel();
      this._initStatusBar();

      this._initThreeJs();
      this._initGrid();
      this._initHelpers();
      this._initObjects();

      this.resetCamera();

      window.addEventListener('message', e => this._onMessage(e));

      this._setActiveTool(this._tools[0]);
    }

    public run() {

      this._ribbon.update();
      this._updatePropertiesPanel();

      // Set-up listeners on viewport element.
      let $main = $(this._domLayout.main);
      // this._domLayout.main.addEventListener('keydown', (e) => this._onKeyDown(e), false);
      $main.on('mousemove', e => this._onMouseMove(e));
      $main.on('mousedown', e => this._onMouseDown(e));
      $main.on('mouseup', e => this._onMouseUp(e));
      $main.on('click', e => this._onClick(e));
      
      // Set-up other listeners.
      window.addEventListener('beforeunload', e => this._onBeforeUnload(e), false);
      window.addEventListener('resize', (e) => this._onWindowResize(e), false);
      // window.addEventListener('keydown', e => this._onKeyDown(e), false);

      let $window = $(window);
      $window.on('keydown', e => this._onKeyDown(e));

      this._render();
    }

    public resetCamera() {

      let target = this._computeModelCenter();
      target.y = 0;

      this._cameras.orientation = Math.PI / -4;
      this._cameras.elevation = Math.PI / 4;
      this._cameras.position.copy(target);
      this._cameras.fieldOfView = 10; // todo COMPUTE
      
    }

    get modelIsDirty() { return this._modelIsDirty; }

    /** Gets (a clone of) the current model. */
    get model() {
      return this._model.clone();
    }

    get modelName() {
      if (this._model) return this._model.name;
      return null;
    }

    set modelName(value) {
      this._model.name = value;
      this._modelIsDirty = true;
    }

    public selectTool(tool: Tool): void {
      this._setActiveTool(tool);
    }

    public selectToolByName(name: string): void {
      this._setActiveTool(this._toolMap[name]);
    }

    public get canUndo(): boolean {
      return this._editSteps.length > 0;
    }

    public get canRedo(): boolean {
      return this._redoStack.length > 0;
    }

    public get selectedObjects(): EditorObject[] {
      if (!this._selectedObjects) {
        return [];
      }

      return [].concat(this._selectedObjects);
    }

    private _renderRequested = false;
    public requestRender() {
      if (!this._renderRequested) {
        setTimeout(() => this._render());
        this._renderRequested = true;
      }
    }

    /** Returns an array (copy) of the current editor objects. */
    get objects(): EditorObject[] { 
      return [].concat(this._objects);
    }

    /**
     * Finds and return an editor object by its ID. Returns null of no object matching the specified ID could be
     * found.
     */
    public getObjectById(id: string): EditorObject {
      let objects = this._objects;
      for(let i = 0; i < objects.length; i++) {
        if (id === objects[i].id) {
          return objects[i];
        }
      }
      return null;
    }

    /**
     * Gets all the area elements related to an area.
     * @param areaId The ID of the area for which we want the objects.
     * @returns An array of all the objects related to the area.
     */
    public getObjectsByAreaId(areaId: string): EditorObject[] {

      let objects = <AreaElement[]>_.filter(this._model.objects,
        o => o instanceof PRKR.Model.AreaElement && o.areaId === areaId);
      let editorObjects = objects.map(o => this.getObjectById(o.id));
      return editorObjects;
    }

    public getAreas(): RoomObject[] {
      let areas: RoomObject[];

      // throw new Error('Not Implementd');
      areas = <RoomObject[]>_.filter(this._objects, o => o instanceof RoomObject);
      // let areas: RoomObject[] = <RoomObject[]>
      //   // _.filter(this._objects, o => o instanceof RoomObject);

      return areas;
    }

    public getAreaAtLocation(worldLocation: Vector3): Area {
      if (!worldLocation) { throw new Error('"worldLocation" must be defined'); }
      return this._model.getAreaAtLocation(worldLocation);
    }
    

    /**
     * Select the specified editor object(s).
     * @param objects An editor object, an array of editor objects or null.
     * @returns Selected objects.
     */
    public select(objects: EditorObject[] | EditorObject): EditorObject[] {
      // Build the "objects to select" array.
      let objectArray: EditorObject[];
      if (objects == null) {
        objectArray = [];
      } else if (objects instanceof EditorObject) {
        objectArray = [objects];
      } else {
        objectArray = objects;
      }

      // Build a selected object array.
      let selected: EditorObject[] = [];

      // Iterate through all the objects and update the "selected" property.
      this._objects.forEach((a) => {
        if (objectArray.indexOf(a) !== -1) {
          a.selected = true;
          selected.push(a);
        } else {
          a.selected = false;
        }
      });

      this._selectedObjects = selected;

      this._ribbon.update();
      this._updatePropertiesPanel();

      this.requestRender();

      return selected;
    }

    /**
     * Select the specified editor object(s) by his/their ID(s).
     * @returns Selected objects.
     */
    public selectByIds(ids: string[] | string): EditorObject[] {
      // Build an ID array from the `ids` (union) parameter.
      let idArray: string[];
      if (typeof ids === 'string') {
        idArray = [ids];
      } else {
        idArray = ids;
      }
      
      // Find the target object(s).
      let objects: EditorObject[] = [];
      idArray.forEach(id => {
        let object = this.getObjectById(id);
        if (object) objects.push(object);
      });

      return this.select(objects);
    }

    /**
     * Adds an object to the selection.
     * @returns The new selected object list.
     */
    addToSelection(object: Objects.EditorObject): Objects.EditorObject[] {
      let selected: EditorObject[] = [];

      this._objects.forEach(o => {
        if (o === object) {
          o.selected = true;
          selected.push(o);
        } else if (o.selected) {
          selected.push(o);
        }

      });

      this._selectedObjects = selected;

      this._ribbon.update();
      this._updatePropertiesPanel();

      this.requestRender();

      return selected;
    }

    /**
     * Removes an object from the selection.
     * @returns The new selected object list.
     */
    removeFromSelection(object: Objects.EditorObject): Objects.EditorObject[] {
      let selected: EditorObject[] = [];

      this._objects.forEach(o => {
        if (o === object) {
          o.selected = false;
        } else if (o.selected) {
          selected.push(o);
        }

      });

      this._selectedObjects = selected;

      this._ribbon.update();
      this._updatePropertiesPanel();

      this.requestRender();

      return selected;    
    }

    /**
     * Gets the current value of the specified property from 
     * the active object.
     * @param prop 
     */
    public getPropertyValue(prop: Model.Property) {
      // Which is the active object? the first or the last one?
      if (this._selectedObjects.length !== 0) {
        return prop.getValue(this._selectedObjects[0].model);
      }
    }

    /**
     * Sets the current value of the specified property for 
     * all selected objects.
     * @param prop 
     */
    private _setPropertyValue(prop: Model.Property, value: any) {

      let ids = this._selectedObjects.map(o => o.id);
      let step = new SetPropertyStep(ids, prop.name, value);

      // TODO There should be some validation here!!

      this.addEditStep(step);

    }


    private _raycaster: THREE.Raycaster = new THREE.Raycaster();

    /**
     * @param x Optional target for screen-x-to-world vector.
     * @param y Optional target for screen-y-to-world vector. 
     * @returns The x and y screen-to-world vectors (in an array).
     */
    public computeScreenToWorldVectors(x?: Vector3, y?: Vector3): Vector3[] {

      if (!x) { x = new Vector3(); }
      if (!y) { y = new Vector3(); }

      let viewport = this._renderer.domElement;
      let halfWidth = viewport.clientWidth / 2;
      let halfHeight = viewport.clientHeight / 2;
      let v = new Vector2(halfWidth, halfHeight);
      let center = this.projectMouseOnFloor(v).point;
      v.set(halfWidth + 10, halfHeight);
      let xTarget = this.projectMouseOnFloor(v).point;
      v.set(halfWidth, halfHeight + 10);
      let yTarget = this.projectMouseOnFloor(v).point;

      x.subVectors(xTarget, center).multiplyScalar(0.1);
      y.subVectors(yTarget, center).multiplyScalar(0.1);

      return [x, y];
    }

    /** Gets the last mouse event that occurred in the context of the editor. */
    get lastMouseEvent() { return this._lastMouseEvent; }

    public projectMouseOnFloor(mouse: THREE.Vector2): THREE.Intersection {
      let candidates: THREE.Object3D[] = [ this._floor ];
      
      // Adjust (x, y) to take account of the renderer's position relative to
      // the windows' client area
      // TODO ... better, this way doesn't take hierarchy into account. ;)
      let domElement = this._domLayout.main;
      let x = mouse.x - domElement.offsetLeft;
      let y = mouse.y - domElement.offsetTop;

      // Raycast.
      this._raycaster.setFromCamera({
        x: (x / domElement.clientWidth) * 2 - 1,
        y: -((y / domElement.clientHeight) * 2 - 1)
      }, this._activeCamera);
      let intersections = this._raycaster.intersectObjects(candidates);

      return intersections[0] || null;
    }

    /**
     * Projects the mouse on the floor plane and return an `AreaLocation`.
     * @param mouseEvent jQuery mouse event from which the mouse location is taken.
     * @returns An area location or null.
     */
    public projectMouseOnAreas(mouseEvent: JQueryMouseEventObject): AreaLocation {
      let intersect = this.projectMouseOnFloor(
        new Vector2(mouseEvent.clientX, mouseEvent.clientY));

      if (!intersect) return null;

      let area = this.getAreaAtLocation(intersect.point);
      if (!area) {
        return {
          worldLocation: intersect.point,
          area: null,
          relativeLocation: null
        };
      }

      let relativeLocation = new Vector3().subVectors(intersect.point, area.location);
      return {
        worldLocation: intersect.point,
        area: area,
        relativeLocation: relativeLocation
      };

    }

    /**
     * 
     * @param mouse Mouse coordinates.
     * @param p A point in the plane.
     * @param n The plane normal.
     */
    public projectMouseOnPlane(mouse: THREE.Vector2, p: THREE.Vector3, n: THREE.Vector3): THREE.Intersection {

      // hijack the floor to use as any plane.
      let oldPosition = new THREE.Vector3();
      oldPosition.copy(this._floor.position);
      let oldRotation = new THREE.Quaternion();
      oldRotation.copy(this._floor.quaternion);

      this._floor.position.copy(p);
      this._floor.quaternion.setFromUnitVectors(M.Vector3.PositiveY, n);
      this._floor.updateMatrixWorld(true);

      let candidates: THREE.Object3D[] = [ this._floor ];
      
      // Adjust (x, y) to take account of the renderer's position relative to
      // the windows' client area
      // TODO ... better, this way doesn't take hierarchy into account. ;)
      let domElement = this._domLayout.main;
      let x = mouse.x - domElement.offsetLeft;
      let y = mouse.y - domElement.offsetTop;

      // Raycast.
      this._raycaster.setFromCamera({
        x: (x / domElement.clientWidth) * 2 - 1,
        y: -((y / domElement.clientHeight) * 2 - 1)
      }, this._activeCamera);
      let intersections = this._raycaster.intersectObjects(candidates);

      // Restore the floor.
      this._floor.position.copy(oldPosition);
      this._floor.quaternion.copy(oldRotation);
      this._floor.updateMatrixWorld(true);

      return intersections[0] || null;
    }

    public projectMouseOnObjects(
      mouse: THREE.Vector2, objects: THREE.Object3D[]
    ): THREE.Intersection[] {

      // Adjust (x, y) to take account of the renderer's position relative to
      // the windows' client area
      // TODO ... better, this way doesn't take hierarchy into account. ;)
      let domElement = this._domLayout.main;
      let x = mouse.x - domElement.offsetLeft;
      let y = mouse.y - domElement.offsetTop;

      // Raycast.
      this._raycaster.setFromCamera({
        x: (x / domElement.clientWidth) * 2 - 1,
        y: -((y / domElement.clientHeight) * 2 - 1)
      }, this._activeCamera);
      let intersections = this._raycaster.intersectObjects(objects, true);

      return intersections || [];      
    }

    
    public getSelectableObjectsAt(x: number, y: number): Objects.EditorObject[] {

      // Accumulates "selection" meshes (hot spot) for all of the objects.
      let candidates: THREE.Object3D[] = [];
      for (let obj of this._objects) {
        let hotSpot = obj.selectionHotSpot;
        if (hotSpot) {
          candidates.push(hotSpot);
        }
      }

      // Adjust (x, y) to take account of the renderer's position relative to
      // the windows' client area
      // TODO ... better, this way doesn't take hierarchy into account. ;)
      let domElement = this._domLayout.main;
      x -= domElement.offsetLeft;
      y -= domElement.offsetTop;

      // Raycast.
      this._raycaster.setFromCamera({
        x: (x / domElement.clientWidth) * 2 - 1,
        y: -((y / domElement.clientHeight) * 2 - 1)
      }, this._activeCamera);
      let intersections = this._raycaster.intersectObjects(candidates);

      // Replace the intersected objects with the original.
      return intersections.map((i) => {
        return i.object.userData || i.object;
      });
    }

    /** Adds an object to the scene. */
    public addToScene(object: THREE.Object3D): void {
      this._scene.add(object);
    }

    /** Removes an object from the scene. */
    public removeFromScene(object: THREE.Object3D): void {
      this._scene.remove(object);
    }

    /**
     * Adds (apply) an edit step to the current parcour.
     * @returns The edit step result.
     */
    public addEditStep(step: EditStep): StepResult {

      // Apply the edit step to the current parcour.
      let result = step.do(this._model);

      // Update dirty nodes.
      if (result.dirtyIds) {
        this._updateDirtyNodes(result.dirtyIds);
      }

      this._editSteps.push({
        step: step,
        data: result.data        
      });
      this._redoStack = [];

      this._modelIsDirty = true;
      this._sanitizeSelection();

      this._ribbon.update();
      this._updatePropertiesPanel();

      this.requestRender();

      return result;
    }

    /**
     * Undo the last added edit step.
     * @returns The edit step result.
     */
    public undo(): StepResult {

      // Un-apply the last edit step from the current parcour.
      let step = this._editSteps.pop();
      let result = step.step.undo(this._model, step.data);
      this._redoStack.push(step.step);

      // Update dirty nodes.
      if (result.dirtyIds) {
        this._updateDirtyNodes(result.dirtyIds);
      }

      this._modelIsDirty = true;
      this._sanitizeSelection();

      this._ribbon.update();
      this._updatePropertiesPanel();

      this.requestRender();

      return result;
    }

    public redo(): StepResult {

      console.debug('redo()');

      if (this._redoStack.length === 0) return;

      let step = this._redoStack.pop();
      
      //return this.addEditStep(step);
      // Apply the edit step to the current parcour.
      let result = step.do(this._model);

      // Update dirty nodes.
      if (result.dirtyIds) {
        this._updateDirtyNodes(result.dirtyIds);
      }

      this._editSteps.push({
        step: step,
        data: result.data        
      });

      this._modelIsDirty = true;
      this._sanitizeSelection();

      // Invalidates the doorway placer that was built with the previous parcour.
      this._doorwayPlacer = null;

      this._ribbon.update();
      this._updatePropertiesPanel();

      this.requestRender();

      return result;      
    }

    private _updateDirtyNodes(dirtyIds: string[]) {
      // Update dirty nodes.
      if (dirtyIds) {
        let expandedDirtyIds = this._expandDirtyIds(dirtyIds);
        expandedDirtyIds.forEach((dirtyId) => {
          let parcourObject = this._model.getObjectById(dirtyId);
          let editorObject = this.getObjectById(dirtyId);
          if (editorObject && parcourObject) {
            editorObject.update();
          } else if (editorObject) {
            let index = this._objects.indexOf(editorObject);

            this._objects.splice(index, 1);
            this._scene.remove(editorObject.sceneObject);
            // TODO editorObject.destroy() ?
          } else if (parcourObject) {
            editorObject = this._buildEditorObject(parcourObject);

            this._objects.push(editorObject)
            this._scene.add(editorObject.sceneObject);
          }
        });
      }
    }

    private _sanitizeSelection() {
      _.remove(this._selectedObjects, o => this._objects.indexOf(o) === -1);
    }

    public validateEditStep(step: PRKR.Editor.EditSteps.EditStep)
    : PRKR.Validators.IValidationResult[] {

      var clone = this._model.clone();

      step.do(clone);

      var validator = new Validators.ParcourValidator();
      return validator.validate(clone);
      
    }

    public get activeTool() {
      return this._activeTool;
    }

    /** Gets an editor tool by its `name` or null.  */
    public getToolByName(name: string): Tool {

      return this._toolMap[name];

    }

    public setPointer(pointerName: string): void {
      this._renderer.domElement.style.cursor = pointerName;
    }

    public setStatus(message: string) {
      this._$statusBar.html(message);
    }

    public getCameraRig(): CameraRig {
      return this._cameras;
    }

    public getCameraPosition(target: Vector3): Vector3 {
      if (!target) { target = new Vector3() }
      target.copy(this._cameras.position);
      return target;
    }

    public setCameraPosition(position: Vector3): void {

      this._cameras.position.copy(position);

      // this._perspectiveCamera.position.copy(position);
      // this._orthographicCamera.position.copy(position);

      this.requestRender();
    }

    /**
     * Currently valid doorway placer or null. Use `getDoorwayPlacer`.
     */
    private _doorwayPlacer: Behaviors.DoorwayPlacer;

    /**
     * Gets a doorway placer valid for the currnet parcour at its current state.
     */
    public getDoorwayPlacer() {
      if (!this._doorwayPlacer) {
        this._doorwayPlacer = new Behaviors.DoorwayPlacer(this._model);
      }
      return this._doorwayPlacer;
    }

    public save() {
      console.debug('save called');

      // TODO Externalize, create a service...
      let accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        alert('You must be logged in to save a parcour');
        return;
      }

      if (this._model) {
        let data = JSON.stringify(this._model.toObject());        
        let settings: JQueryAjaxSettings;
        if (this._modelIsNew) {
          settings = {
            headers: { Authorization: 'Bearer ' + accessToken },
            method: 'POST',
            url: this._configuration.backend + this._configuration.parcours,
            contentType: 'application/json',
            data: data
          };
        } else {
          settings = {
            headers: { Authorization: 'Bearer ' + accessToken },
            method: 'PUT',
            url: this._configuration.backend + this._configuration.parcours + '/' + this._model.id,
            contentType: 'application/json',
            data: data
          };
        }
        $.ajax(settings).then(
          (data, status, xhr) => {
            if (this._modelIsNew) {
              console.log('Parcour saved');
              let responseParcour = JSON.parse(data);
              this._model.id = responseParcour.id;
              history.replaceState(null, '', location.href + '?id=' + this._model.id);
              this._modelIsNew = false;
            } else {
              console.log('Parcour updated');
            }
            this._modelIsDirty = false;
            this._ribbon.update();
            this._updatePropertiesPanel();
          },
          (xhr, status, err) => {
            console.error('Error saving parcour', err);
          }
        );
      }
    }

    public play() {
      this._startLocation = null;
      this._play();
    }

    public playFrom(startLocation: Vector3) {
      this._startLocation = startLocation;
      this._play();
    }

    private _play() {
      console.debug("_play called");

      if (!this._player || this._player.closed) {
        this._player = window.open('./player.html?el=1');
      } else {
        this._player.location.reload();
        this._player.focus();
      }
    }

    private _onMessage(e: MessageEvent) {
      if (this._player && !this._player.closed && e.data === 'ready') {
        console.log('Received "ready" message from the player.');
        let payload = this._model.toObject();
        let options: any = {};
        if (this._startLocation) {
          options.startLocation = this._startLocation.toArray();
        }
        console.debug('sending the following payload to the player window', payload);
        this._player.postMessage({
          command: 'load',
          payload: payload,
          options: options
        }, '*');
      }
    }

    private _render() {
      this._renderer.render(this._scene, this._activeCamera);
      this._renderRequested = false;
    }

    private _updatePropertiesPanel() {

      let props: Property[] = [];

      let sel = this.selectedObjects;
      if (sel.length !== 0) {
        sel.forEach(object => {
          let objectProps = object.getProperties();
          objectProps.forEach(prop => {
            let p = props.find(p => p.name === prop.name);
            if (!p) {
              props.push(prop);
            }
          });
        });
      }

      let values = props.map(p => this.getPropertyValue(p));

      this._propertiesPanel.setProperties(props, values);

    }

    private _computeModelCenter() {
      // Computes the center of all the areas.
      let c = new Vector3();
      if (this._model) {
        let areas = this._model.getAreas();
        areas.forEach(a => c.add(a.getCenter()));
        c.divideScalar(areas.length);
      }
      return c;
    }

    private _setActiveTool(tool: Tools.Tool) {
      // Make sure the tool is enabled before activating it.
      if (!tool.enabled) return;

      if (this._activeTool) this._activeTool.deactivate();

      this._activeTool = tool;

      if (this._activeTool) this._activeTool.activate();

      this._ribbon.update();
    }

    private _onKeyDown(e: JQueryKeyEventObject) {

      if (!this._handleKeyboardShortcuts(e)) {

        this._activeTool.notifyKeyDown(e);
      }
    }

    /**
     * Searches through all known commands and tools for a keyboard shortcut match. If one is found, the command is
     * run (or the tool actiavted), the event's default is prevented and true is returned. Else it return false.
     * @param e Keyboard event
     */
    private _handleKeyboardShortcuts(e: JQueryKeyEventObject): boolean {
      // For all known commands
      for(let i = 0; i < this._commands.length; i++) {
        let command = this._commands[i];
        if (command.enabled && command.keyboardShortcut.match(e)) {
          console.log(
            'Invoking "' + command.displayName + '" command because the current key event matches its keyboard shortcut.',
            command.keyboardShortcut.toString()
          );
          command.run();
          e.preventDefault();
          return true;
        }
      }

      // TODO for all known tools
      for (let i = 0; i < this._tools.length; i++) {
        let tool = this._tools[i];
        if (tool.enabled && tool.keyboardShortcut != null && tool.keyboardShortcut.match(e)) {
          console.log(
            'Selecting "' + tool.displayName + '" tool because the current key event matches its keyboard shortcut.',
            tool.keyboardShortcut.toString()
          );
          this._setActiveTool(tool);
          this._ribbon.showTool(tool);
          e.preventDefault();
          return true;
        }
      }

      /* Digits from 1 to 9 cycle throw tabs */
      if (e.keyCode >= 49 /* Digit 1 */ && e.keyCode <= 57 /* Digit 9 */) {
        let tabIndex = e.keyCode - 49;
        if (tabIndex < this._ribbon.tabCount) {
          this._ribbon.selectTabIndex(tabIndex);
        }
      }

      return false;
    }

    private _checkDelegationQuit(e: JQueryMouseEventObject) {
      if (this._mouseDelegation && this._mouseDelegation.quitCondition(e)) {
          this._mouseDelegation = null;
      }
    }

    private _onMouseMove(e: JQueryMouseEventObject) {
      // console.log('mousemove', e);
      this._lastMouseEvent = e;

      if (this._mouseDelegation) {
        this._mouseDelegation.tool.notifyMouseMove(e);
        this._checkDelegationQuit(e);
      } else if (this._activeTool) {
        this._activeTool.notifyMouseMove(e);
      }
    }

    private _onMouseDown(e: JQueryMouseEventObject) {
      //console.log('mousedown', e);
      // console.debug('which=', e.which);
      this._lastMouseEvent = e;

      if (this._mouseDelegation) {
        this._mouseDelegation.tool.notifyMouseDown(e);
        this._checkDelegationQuit(e);
      } else {
        if (e.which === 2) {           
          // If it's the wheel that has been clicked.
          // delegate to pan tool.
          var pan = this._toolMap['camera-pan'];
          pan.notifyMouseDown(e);
          this._mouseDelegation = new Tools.Delegation(
            pan,
            function (e) { 
              return e.type === 'mouseup' && e.which === 2
            }
          );

        } else if (this._activeTool) {
          this._activeTool.notifyMouseDown(e);
        }
      }
    }

    private _onMouseUp(e: JQueryMouseEventObject) {
      // console.log('mouseup', e);
      this._lastMouseEvent = e;

      if (this._mouseDelegation) {
        this._mouseDelegation.tool.notifyMouseUp(e);
        this._checkDelegationQuit(e);
      } else if (this._activeTool) {
        this._activeTool.notifyMouseUp(e);
      }
    }

    private _onClick(e: JQueryMouseEventObject) {
      // console.log('click', e);
      this._lastMouseEvent = e;

      if (this._mouseDelegation) {
        this._mouseDelegation.tool.notifyClick(e);
        this._checkDelegationQuit(e);
      } else if (this._activeTool) {
        this._activeTool.notifyClick(e);
      }
    }      

    private _onBeforeUnload(e: BeforeUnloadEvent) {
      if (this._modelIsDirty) {
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    }

    private _onWindowResize(e: Event) {
      let elem = this._domLayout.main;
      let w = elem.clientWidth;
      let h = elem.clientHeight;
      let aspectRatio = w / h;

      this._cameras.aspectRatio = aspectRatio;
      
      // this._perspectiveCamera.aspect = aspectRatio;
      // this._perspectiveCamera.updateProjectionMatrix();

      this._renderer.setSize(w, h);
      this._render();
    }

    private _initDomLayout() {
      let top = document.createElement('div');
      top.id = 'prkred-top';

      let left = document.createElement('div');
      left.id = 'prkred-left';

      let right = document.createElement('div');
      right.id = 'prkred-right';
      
      let main = document.createElement('div');
      main.id = 'prkred-main';

      let bottom = document.createElement('div');
      bottom.id = 'prkred-bottom';

      let layout = {
        top: top,
        left: left,
        right: right,
        main: main,
        bottom: bottom
      };
      
      this._domLayout = layout;

      this._viewport.appendChild(top);
      this._viewport.appendChild(left);
      this._viewport.appendChild(main);
      this._viewport.appendChild(right);
      this._viewport.appendChild(bottom);

      return;
    }

    ///// RIBBON /////
    
    private _initRibbon() {
      let pointer: Components.RibbonElementConfiguration = {
        name: 'pointer',
        display: 'Pointer',
        image: 'fa-mouse-pointer',
        tool: this._toolMap['select']
      };
      let ribbonConfig = {
        tabs: [{
          name: 'file', 
          display: 'File',
          items: [pointer, {
            name: 'rename',
            display: 'Rename',
            image: 'fa-font',
            command: this._commandMap['rename']
            // command: () => {
            //   let newName = prompt('Enter new name', this._model.name);
            //   if (newName && newName !== this._model.name) {
            //     this._model.name = newName;
            //   }
            // }
          }, {
            name: 'save',
            display: 'Save',
            image: 'fa-save',
            command: this._commandMap['save']
            // command: {
            //   name: 'save',
            //   displayName: 'Save',
            //   enabled: true,
            //   // get enabled() { return this._modelIsDirty; },
            //   run: () => { this._save(); }
            // }
            // command: () => { this._save(); }
          }, {
            name: 'play',
            display: 'Play',
            image: 'fa-play',
            command: this._commandMap['play']
          }, {
            name: 'play-from',
            display: 'Play From&hellip;',
            image: 'fa-play-circle-o',
            tool: this._toolMap['play-from']
          }]
        }, {
          name: 'edit',
          display: 'Edit',
          items: [ pointer, {
            name: 'undo',
            display: 'Undo',
            image: 'fa-undo',
            command: this._commandMap['undo']
          }, {
            name: 'redo',
            display: 'Redo',
            image: 'fa-repeat',
            command: this._commandMap['redo']
          }, {
            name: 'copy',
            display: 'Copy',
            image: 'fa-copy', // ?
            command: this._commandMap['copy']
          }, {
            name: 'paste',
            display: 'Paste',
            image: 'fa-paste', // ?
            tool: this._toolMap['paste']
          },{
            name: 'delete',
            display: 'Delete',
            image: 'fa-remove',
            command: this._commandMap['delete']
          }]
        }, {
          name: 'areas',
          display: 'Areas',
          items: [ pointer, {
            name: 'resize',
            display: 'Resize',
            image: 'fa-arrows-alt',
            tool: this._toolMap['resize']
          }, {
            name: 'rotate',
            display: 'Rotate',
            image: 'fa-circle-o',
            tool: this._toolMap['rotate']
          }, {
            name: 'addRectangularRoom',
            display: 'Add rect.',
            image: 'fa-cube',
            tool: this._toolMap['room-drawing']
          }, {
            name: 'doorwayPlacement',
            display: 'Doorways',
            image: 'fa-external-link-square',
            tool: this._toolMap['doorway-placement']
          }, {
            name: 'addHoles',
            display: 'Cut holes',
            image: 'fa-cut',
            tool: this._toolMap['add-holes']
          }, {
            name: 'addStaticObject',
            display: 'Static Object',
            image: 'fa-cubes',
            tool: this._toolMap['add-static-object']
          }, {
            name: 'addDynamicObject',
            display: 'Dynamic Object',
            image: 'fa-caret-square-o-down',
            tool: this._toolMap['add-dynamic-object']
          }]
        }, {
          name: 'locations',
          display: 'Locations',
          items: [pointer, {
            name: 'startLocation',
            display: 'Start',
            image: 'fa-male',
            tool: new Tools.LocationPlacementTool(this, Model.LocationKind.Start)
          }, {
            name: 'endLocation',
            display: 'End',
            image: 'fa-flag',
            tool: new Tools.LocationPlacementTool(this, Model.LocationKind.End)
          }]
        }, {
          name: 'view',
          display: 'View',
          items: [pointer, {
            name: 'cameraPan',
            display: 'Pan view',
            image: 'fa-arrows',
            tool: this._toolMap['camera-pan']
          }, {
            name: 'cameraRotate',
            display: 'Rotate view',
            image: 'fa-repeat',
            tool: this._toolMap['camera-rotate']
          }]
        }]
      };
      let ribbon = new Components.Ribbon(this, ribbonConfig);

      this._domLayout.top.appendChild(ribbon.dom);

      this._ribbon = ribbon;
    }

    ///// PROPERTIES PANEL /////

    private _initPropertiesPanel() {

      let props = new Components.PropertiesPanel();
      props.onChange((p, v) => this._setPropertyValue(p, v));

      this._domLayout.right.appendChild(props.dom);

      this._propertiesPanel = props;
    }

    private _initStatusBar() {

      let $statusBar = $('<div id="statusBar"></div>');
      this._$statusBar = $statusBar;

      this._domLayout.bottom.appendChild($statusBar[0]);
    }

    private _initThreeJs() {
      let renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor(0xFFFFFF);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.localClippingEnabled = true;

      let container = this._domLayout.main;
      renderer.setSize(container.clientWidth, container.clientHeight);
      this._renderer = renderer;

      container.appendChild(renderer.domElement);

      this._scene = new THREE.Scene();
      this._initCameras();
      this._initLights();
    }

    /**
     * Builds editor objects from the current model.
     */
    private _initObjects() {

      let objects: Objects.EditorObject[] = [];
      if (this._model) {
        this._model.objects.forEach(po => {
          let eo = this._buildEditorObject(po);
          objects.push(eo);
          this._scene.add(eo.sceneObject);
        });
      }
      // Save references.
      this._objects = objects;
    }

    /**
     * Returns an array of dirty IDs expanded with the sub object IDs.
     * For example, if there is a dirty area in the original array, the
     * expanded array will include the its composing elements.
     */
    private _expandDirtyIds(dirtyIds: string[]): string[] {
      let expanded: string[] = [];

      dirtyIds.forEach(dirtyId => {
        expanded.push(dirtyId);
        let po = this._model.getObjectById(dirtyId);

        if (po === null) {

          // We dont know what "it was", we might as well update
          // everything.
          expanded.push(...this._model.objects.map(o => o.id));

        } else if (po instanceof PRKR.Model.Area) {

          // If the object is an area, we add the area's elements
          // and all its neighours.
          expanded.push(...
            this._model.getAreaElementsByAreaId(po.id)
              .map(e => e.id)
          );
          expanded.push(...
            this._model.getNeighbourAreas(po.id)
              .map(a => a.id)
          );
        } else if (po instanceof Model.Doorway) {

          // If the object is a doorway, we add the containing
          // area and all its neighbours.
          expanded.push(po.areaId, ...
            this._model.getNeighbourAreas(po.areaId)
              .map(a => a.id)
          );
        } else if (po instanceof Model.AreaElement) {

          expanded.push(po.areaId);

        }
      });
      return _.uniq(expanded);
    }

    /**
     * Builds an editor object from a parcour object.
     */
    private _buildEditorObject(parcourObject: ParcourObject): EditorObject {
      try {
        return EditorObject.fromModel(parcourObject, this._model);
      } catch (err) {
        console.warn(err);
        return new Objects.UnknownObject(parcourObject, this._model);
      }
    }
 
    /**
     * Creates the camera instances.
     * Called by _initThreeJs
     */
    private _initCameras() {
      let domElement = this._renderer.domElement;
      let w = domElement.clientWidth;
      let h = domElement.clientHeight;
      let aspectRatio = w / h;

      this._cameras = new CameraRig(aspectRatio, 10);
      
      this._activeCamera = this._cameras.orthographicCamera;
      // this._activeCamera = this._cameras.perspectiveCamera;
      
      this._scene.add(this._cameras);

      /* OLD CAMERA CODE
      // Create a perpsective camera.
      this._perspectiveCamera = 
        new THREE.PerspectiveCamera(75, aspectRatio, 1, 500);

      // Create an orthographic camera.
      let fovX = 15;
      let fovY = fovX / aspectRatio;

      this._orthographicCamera =
        new THREE.OrthographicCamera(fovX / -2, fovX / 2, fovY / 2, fovY / -2, -1000, 1000);
      this._orthographicCamera.zoom = 1;

      this._activeCamera = this._perspectiveCamera;
      // this._activeCamera = this._orthographicCamera;
      /* END OLD CAMERA CODE **/
    }

    private _initLights() {
      let ambientLigth = new THREE.AmbientLight( 0x404040 ); // soft white light
      this._scene.add(ambientLigth);

      let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
      directionalLight.position.set(.25, 1, 0.25).normalize();
      this._scene.add(directionalLight);
    }

    private _initGrid() {
      let gh = new THREE.GridHelper(20, 20);
      this._scene.add(gh);      
    }

    private _initHelpers() {
      let g = new THREE.Geometry();
      g.vertices.push(new Vector3());
      let m: THREE.Material = new THREE.PointsMaterial({
        size: 0.5,
        side: 16,
        color: 0xff0000,
        depthTest: false
      });
      let ih = new THREE.Points(g, m);
      ih.visible = false;

      this._intersectHelper = ih;

      // Floor mesh for mouse projection.
      g = new THREE.Geometry();
      g.vertices.push(new Vector3(-1e6, 0, -1e6));
      g.vertices.push(new Vector3(1e6, 0, -1e6));
      g.vertices.push(new Vector3(1e6, 0, 1e6));
      g.vertices.push(new Vector3(-1e6, 0, 1e6));
      g.faces.push(new THREE.Face3(0, 2, 1));
      g.faces.push(new THREE.Face3(2, 3, 0));
      m = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
      });
      this._floor = new THREE.Mesh(g, m);

      this._scene.add(ih);
    }

    private _buildStartupScene() {

      let data = {"name":"New parcour","objects":[
        {"$type":"RoomArea","id":"04299e4b-b307-45c5-b94d-d8f88af34eae","name":"Starting room","location":[-6,0,-1],"size":[3,2.54,3],"light":{"intensity":0.9,"color":0.1,"hue":0.1}},
        {"$type":"RoomArea","id":"915a69f6-6283-48e5-9f41-c4335fd043f9","name":"Middle room","location":[-3, 0,-2],"size":[5,2.54,5],"light": {"intensity": 0.9,"color":0.1,"hue":0.3}},
        {"$type":"RoomArea","id":"397ea615-6d71-49a9-bbc1-67b06d0c7f1b","name":"End room","location":[2,0,-1],"size":[3,2.54,3],"light":{"intensity":0.9,"color":0.1,"hue":0.65}},
        {"$type":"Doorway","id":"59a11f41-13cd-4696-be2e-eacbc18d67b4","areaId":"04299e4b-b307-45c5-b94d-d8f88af34eae","location":[3,0,1.5],"size":[0.7,1.6]},
        {"$type":"Doorway","id":"6b8838f6-eb71-4b16-b6e8-50ebf2202098","areaId":"397ea615-6d71-49a9-bbc1-67b06d0c7f1b","location":[0,0,1.5],"size":[0.7,1.6]},
        {"$type":"Location","id":"02c73a2e-da01-4d2f-897e-3a4ca54fcd11","areaId":"04299e4b-b307-45c5-b94d-d8f88af34eae","location":[1.5,0,1.5],"kind":1},
        {"$type":"Location","id":"7ef8ac6f-95ec-4237-bddc-861e5e3e5bef","areaId":"397ea615-6d71-49a9-bbc1-67b06d0c7f1b","location":[1.5,0,1.5],"kind":2}]
      };
      //let data = JSON.parse(json);
      let parcour = new Parcour(data);
      return parcour;
    }

    private _getDefaultViewport() {
      return document.body;
    }
  }
}