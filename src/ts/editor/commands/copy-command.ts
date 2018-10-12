namespace PRKR.Editor.Commands {

  import EditorObject = Objects.EditorObject;

  /** Checks whether an EditorObject is an area. */
  let isArea = (x: EditorObject) => x.model instanceof Model.Area;

  export class CopyCommand implements Command {

    constructor(private _editor: ParcourEditor) { }

    get name() { return 'copy'; }

    get displayName() { return 'Copy'; }

    /** Enabled if objects are selected. */
    get enabled() { return this._editor.selectedObjects.length > 0; }

    get keyboardShortcut() {
      return KeyboardMatcher.for({
        ctrl: true,
        keyCode: 67, /* C */
      });
    }

    get highlighted() { return false; }

    run() {

      let sel = this._editor.selectedObjects;
      if (sel.length !== 0) {

        sel = this._normalizeSelection(sel);

        console.log('Attempting to put the following in the clipboard', sel);
        
        console.log(
          `It is a collection of ${ sel.length } object${ sel.length > 1 ? 's' : '' }`);

        let objs = sel.map(o => o.model.toObject());

        let areaMode = isArea(sel[0]);
        if (!areaMode) {

          // Converts all object locations to world-relative, so that they make sense relative to one another and
          // clear area IDs.
          objs.forEach(obj => {

            let area = (<Objects.RoomObject>this._editor.getObjectById(obj.areaId)).roomArea;
            let world = [
              area.location.x + obj.location[0],
              area.location.y + obj.location[1],
              area.location.z + obj.location[2],
            ];

            obj.location = world;
            delete obj.areaId;
            
          });

        }

        let json = JSON.stringify(objs);

        console.log('...JSON=', json);

        Clipboard.set(json);

      }

    }

    /** Gets a new array which represents a "normalized" selection... TODO explain... */
    private _normalizeSelection(selection: EditorObject[]) {
  
      // is there an area in the selection.
      let areaCheck = _.find(selection, isArea);
      if (areaCheck) {
  
        // Work in "area mode".
        // Collect areas
        let areas = _.filter(selection, isArea);
        let augmented = this._extendSelection(areas);
  
        return augmented;
        
      } else {
  
        // Work in "area element mode".
        return [].concat(selection);
  
      }
    }
  
    /** Gets a new array that contains all the objects in `areas` **plus** all the objects inside those areas. */
    private _extendSelection(areas: EditorObject[]) {
  
      let augmented: EditorObject[] = [].concat(areas);

      areas.forEach(area => {
        augmented = augmented.concat(this._editor.getObjectsByAreaId(area.id));
      });
  
      return augmented;
  
    }
  
    
  }
}