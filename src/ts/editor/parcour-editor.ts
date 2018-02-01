/// <reference path="../defs/prkr.bundle.d.ts" />

/// <reference path="./editor-api.ts" />

/// <reference path="./objects/editor-object.ts" />
/// <reference path="./objects/unknown-object.ts" />
/// <reference path="./objects/room-object.ts" />
/// <reference path="./objects/location-object.ts" />

/// <reference path="./components/ribbon.ts" />
/// <reference path="./components/asset-palette.ts" />
/// <reference path="./components/palette-item.ts" />

/// <reference path="./tools/tool.ts" />
/// <reference path="./tools/select-tool.ts" />
/// <reference path="./tools/move-tool.ts" />
/// <reference path="./tools/resize-tool.ts" />
/// <reference path="./tools/camera-pan-tool.ts" />
/// <reference path="./tools/camera-rotate-tool.ts" />
/// <reference path="./tools/doorway-placement-tool.ts" />
/// <reference path="./tools/delegation.ts" />

namespace PRKR.Editor {
  // Convinience imports.
  import Vector2 = THREE.Vector2;
  import Vector3 = THREE.Vector3;

  import CameraRig = PRKR.CameraRig;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Area = PRKR.Model.Area;
  import AreaElement = PRKR.Model.AreaElement;
  import RoomArea = PRKR.Model.RoomArea;
  import EditorObject = PRKR.Editor.Objects.EditorObject;
  import RoomObject = PRKR.Editor.Objects.RoomObject;
  import Tool = PRKR.Editor.Tools.Tool;
  import EditStep = PRKR.Editor.EditSteps.EditStep;
  import StepResult = PRKR.Editor.EditSteps.StepResult;

  export class ParcourEditor implements ParcourEditor /*, EditorApi */ {

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
    private _activeTool: PRKR.Editor.Tools.Tool = null // this._tools[0];

    /** The currently delegated tool. (e.g. overrides through keyboard/mouse "shortcuts") */
    private _mouseDelegation: PRKR.Editor.Tools.Delegation = null;

    /** The AssetPalette instance. */
    private _palette: Components.AssetPalette = null;

    /** The various top level containers that makes the editor's DOM layout */
    private _domLayout
      : { top: HTMLDivElement, left: HTMLDivElement, right: HTMLDivElement, main: HTMLDivElement }
      = null;

    /** The ribbon menu. */
    private _ribbon: Components.Ribbon;

    /** The properties panel. */
    private _propertiesPanel: Components.PropertiesPanel;

    /** The three.js WebGL scene. */
    private _scene: THREE.Scene;

    /** Three three.js WebGL renderer. */
    private _renderer: THREE.WebGLRenderer;

    /** Dual camera rig orbit rig. */
    private _cameras: CameraRig;

    /** The currently active camera. */
    private _activeCamera: THREE.Camera;

    /** Previously created player window, if any. */
    private _player: Window;
    
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
        this._model = this._buildDefaultModel();
        this._modelIsNew = true;
        this._modelIsDirty = false;
      }

      // Build tool list.
      this._tools = [
        new PRKR.Editor.Tools.SelectTool(this),
        new PRKR.Editor.Tools.MoveTool(this),
        new PRKR.Editor.Tools.ResizeTool(this),
        new PRKR.Editor.Tools.RoomDrawingTool(this),
        new PRKR.Editor.Tools.CameraPanTool(this),
        new PRKR.Editor.Tools.CameraRotateTool(this),
        new PRKR.Editor.Tools.DoorwayPlacementTool(this)
      ];

      // Build tool map.
      let toolMap: { [key: string]: Tool } = {};
      this._tools.forEach((tool) => { toolMap[tool.name] = tool; });
      this._toolMap = toolMap;

      this._initDomLayout();
      
      this._initRibbon();
      this._initPropertiesPanel();
      // this._initToolBar();
      // this._initAssetPalette();

      this._setActiveTool(this._tools[0]);

      this._initThreeJs();
      this._initGrid();
      this._initHelpers();
      this._initObjects();

      this.resetCamera();

      window.addEventListener('message', e => this._onMessage(e));
    }

    public run() {

      this._ribbon.update();
      // TODO this._propertiesPanel.update();

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
      window.addEventListener('keydown', e => this._onKeyDown(e), false);

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

    public selectTool(tool: Tool): void {
      this._setActiveTool(tool);
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
     * Finds and return an editor object by its ID.
     */
    public getObjectById(id: string): EditorObject {
      let objects = this._objects;
      for(let i = 0; i < objects.length; i++) {
        if (id === objects[i].id) {
          return objects[i];
        }
      }
      // Nope...
      // throw new Error('Id not found. ' + id);
      return null;
    }

    public getObjectsByAreaId(areaId: string): EditorObject[] {
      //let area = this._model.getAreaById(areaId);
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
      this._propertiesPanel.set(selected);
      //this._updateToolBar();

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
      this._propertiesPanel.set(selected);

      // this._updateToolBar();
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
      this._propertiesPanel.set(selected);

      //this._updateToolBar();
      this.requestRender();

      return selected;    
    }

    /**
     * Gets the current value of the specified property from 
     * the active object.
     * @param prop 
     */
    public getPropertyValue(prop: Objects.Property) {
      // Which is the active object? the first or the last one?
      if (this._selectedObjects.length !== 0) {
        return prop.getValue(this._selectedObjects[0].model);
      }
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
        if (obj.selectionHotSpot)
          candidates.push(obj.selectionHotSpot);
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

      console.debug('adding edit step', step);

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

      this.requestRender();
      this._ribbon.update();

      return result;
    }

    /**
     * Undo the last added edit step.
     * @returns The edit step result.
     */
    public undo(): StepResult {

      console.debug('undo()');

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

      this.requestRender();
      this._ribbon.update();

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

      this.requestRender();
      this._ribbon.update();

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

    public save() {
      console.debug('save called');

      if (this._model) {
        let data = JSON.stringify(this._model.toObject());        
        let settings: JQueryAjaxSettings;
        if (this._modelIsNew) {
          settings = {
            method: 'POST',
            url: this._configuration.backend + this._configuration.parcours,
            contentType: 'application/json',
            data: data
          };
        } else {
          settings = {
            method: 'PUT',
            url: this._configuration.backend + this._configuration.parcours + '/' + this._model.id,
            contentType: 'application/json',
            data: data
          };
        }
        $.ajax(settings).then(
          (data, status, xhr) => {
            console.log('Parcour saved', data);
            // Reset model? TODO.
            this._modelIsDirty = false;
            this._modelIsNew = false;
            this._ribbon.update();
          },
          (xhr, status, err) => {
            console.error('Error saving parcour', err);
          }
        );
      }
    }

    private _play() {
      console.debug("_play called");

      if (!this._player || this._player.closed) {
        this._player = window.open('./player.html?el=1');
        window.addEventListener('message', e => {
        });
      } else {
        this._player.location.reload();
      }
    }

    private _onMessage(e: MessageEvent) {
      if (this._player && !this._player.closed && e.data === 'ready') {
        console.log('Received "ready" message from the player.');
        let payload = this._model.toObject();
        console.debug('sending the following payload to the player window', payload);
        this._player.postMessage({
          command: 'load',
          payload: payload
        }, '*');
      }
    }

    private _render() {
      this._renderer.render(this._scene, this._activeCamera);
      this._renderRequested = false;
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
      // this._updateToolBar();
      // this._updateAssetPalette();
    }

    private _onKeyDown(e: KeyboardEvent) {
      console.log('keydown', e);
      // TODO.
    }

    private _checkDelegationQuit(e: JQueryMouseEventObject) {
      if (this._mouseDelegation && this._mouseDelegation.quitCondition(e)) {
          this._mouseDelegation = null;
      }
    }

    private _onMouseMove(e: JQueryMouseEventObject) {
      // console.log('mousemove', e);

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

      if (this._mouseDelegation) {
        this._mouseDelegation.tool.notifyMouseUp(e);
        this._checkDelegationQuit(e);
      } else if (this._activeTool) {
        this._activeTool.notifyMouseUp(e);
      }
    }

    private _onClick(e: JQueryMouseEventObject) {
      // console.log('click', e);
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

      let layout = {
        top: top,
        left: left,
        right: right,
        main: main
      };
      
      this._domLayout = layout;

      this._viewport.appendChild(top);
      this._viewport.appendChild(left);
      this._viewport.appendChild(main);
      this._viewport.appendChild(right);

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
            command: {
              name: 'rename',
              displayName: 'Rename',
              enabled: true,
              highlighted: false,
              run: () => { 
                let newName = prompt('Enter new name', this._model.name);
                if (newName && newName !== this._model.name) {
                  this._model.name = newName;
                  this._modelIsDirty = true;
                }
              }
            }
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
            command: new Commands.SaveCommand(this)
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
            command: {
              name: 'play',
              displayName: 'Play',
              enabled: true,
              highlighted: false,
              run: () => { this._play(); }
            }
            // command: () => { this._play(); }
          }]
        }, {
          name: 'edit',
          display: 'Edit',
          items: [ pointer, {
            name: 'undo',
            display: 'Undo',
            image: 'fa-undo',
            command: new Commands.UndoCommand(this)
          }, {
            name: 'redo',
            display: 'Redo',
            image: 'fa-repeat',
            command: new Commands.RedoCommand(this)
          }, {
            name: 'delete',
            display: 'Delete',
            image: 'fa-remove',
            command: new Commands.DeleteCommand(this)
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
            name: 'addRectangularRoom',
            display: 'Add rect.',
            image: 'fa-cube',
            tool: this._toolMap['room-drawing']
          }, {
            name: 'doorwayPlacement',
            display: 'Doorways',
            image: 'fa-external-link-square',
            tool: this._toolMap['doorway-placement']
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
      // TODO.

      let props = new Components.PropertiesPanel(this, {});

      this._domLayout.right.appendChild(props.dom);

      this._propertiesPanel = props;
    }

    private _initThreeJs() {
      let renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor(0xFFFFFF);
      renderer.setPixelRatio(window.devicePixelRatio);

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
      let o: Objects.EditorObject = null;
      if (parcourObject instanceof PRKR.Model.RoomArea) {
        o = new Objects.RoomObject(parcourObject, this._model);
      } else if (parcourObject instanceof PRKR.Model.Location) {
        o = new Objects.LocationObject(parcourObject, this._model);
      } else if (parcourObject instanceof PRKR.Model.Doorway) {
        o = new Objects.DoorwayObject(parcourObject, this._model);      
      } else {
        // throw new Error(`Can not build an EditorObject for ${parcourObject}`);
        console.warn(`Can not build an EditorObject for ${parcourObject}`);
        o = new Objects.UnknownObject(parcourObject, this._model);
      }
      return o;
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

    private _buildDefaultModel() {
      let m = new Parcour();
      m.name = 'New parcour';
      let a = new RoomArea({
        location: M.Vector3.Zero,
        size: new THREE.Vector3(3, 2.54, 3)
      });
      a.name = 'Room 1';
      m.objects.push(a);
      a = new RoomArea({
        location: new Vector3(0, 0, -2),
        size: new Vector3(4, 2.54, 2)
      });
      a.name = 'Room 2';
      m.objects.push(a);
      return m;
    }

    private _getDefaultViewport() {
      return document.body;
    }
  }
}