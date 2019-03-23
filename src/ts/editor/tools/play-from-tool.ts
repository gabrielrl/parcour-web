namespace PRKR.Editor.Tools {

  /** A tool to let the author start playing from anywhere. */
  export class PlayFromTool extends Tool {

    //** Character representation. */
    private _helper: Helpers.CharacterHelper = null;

    private _location: THREE.Vector3 = null;

    constructor(private _editor: ParcourEditor) {
      super();
      
      if (_editor == null) throw new Error('editor can not be null or undefined');

      this._buildHelper();
    }

    /** Gets the current tool's name. Used as a unique key. */
    get name(): string { return 'play-from'; }

    /** Gets the current tool's displayable name. */
    get displayName(): string { return 'Play from...'; }

    /** Gets if the current tool is enabled. True if there are some areas inside the parcour. */
    get enabled(): boolean { return this._editor.getAreas().length > 0; }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({
        keyCode: 32, /* space */
        key: 'SPACE'
      });
    }

    /** Informs the Tool that it's being activated. */
    activate() {

      this._editor.addToScene(this._helper);

      // Fake the last mouse move to update the tool state with the current mouse position.
      let mouse = this._editor.lastMouseEvent;
      if (mouse) this.notifyMouseMove(mouse);

      this._editor.setStatus('Click on the ground to start playing');
      this._editor.setPointer('crosshair');
    }

    /** Informs the Tool that it's being deactivated. */
    deactivate() {

      this._editor.removeFromScene(this._helper);

    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      let intersect = this._editor.projectMouseOnFloor(new THREE.Vector2(event.clientX, event.clientY));
      if (intersect) {

        let target = intersect.point.floor().add(M.Vector3.Half).setY(0);

        this._helper.position.copy(target);

        let area = this._editor.getAreaAtLocation(intersect.point);
        if (area) {

          this._helper.material.setValues({ color: Constants.ValidColor })
          this._location = target;

          this._editor.setStatus('Click on the ground to start playing');

        } else {

          this._helper.material.setValues({ color: Constants.InvalidColor })
          this._location = null;

          this._editor.setStatus('You can only play from within an area');

        }

      }

      this._editor.requestRender();
    }

    notifyMouseDown(event: JQueryMouseEventObject): void { }

    notifyMouseUp(event: JQueryMouseEventObject): void {
      if (this._location) {
        this._editor.playFrom(this._location);
      }
      
    }
    
    notifyClick(event: JQueryMouseEventObject): void { }

    notifyKeyDown(event: JQueryKeyEventObject): void { }

    /** Builds a character helper to display where the author is pointing. */
    private _buildHelper(): THREE.Object3D {

      this._helper = new PRKR.Helpers.CharacterHelper();
      return this._helper;

    }
  }
}
