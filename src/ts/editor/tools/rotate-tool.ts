namespace PRKR.Editor.Tools {

  import Vector3 = THREE.Vector3;
  import Quaternion = THREE.Quaternion;
  import EditorObject = Objects.EditorObject;

  let isArea = (editorObject: EditorObject) => editorObject.model instanceof Model.Area;

  export class RotateTool extends Tool {

    constructor(private _editor: ParcourEditor) {
      super();
    }

    /** Objects that could be rotated with the tool as per the last setup. */
    private _targets: EditorObject[] = [];

    /** Active state of each axis as per the last setup. */
    private _axes: boolean[] = [];

    /** True if `_targets` contains areas, else it contains area elements. */
    private _areaMode: boolean;

    /** Pivot point, rotation origin. */
    private _pivot: Vector3 = new Vector3();

    /** Rotation widgets. */
    private _widgets: RotationWidget[] = [];

    /** True if the author is rotating right now. */
    private _rotating: boolean = false;

    /** Current rotation as per the last mouse move (if rotating). */
    private _rotation: Quaternion;

    /**
     * One adjusted translation per target.
     */
    private _adjustedTranslations: Vector3[];

    /**
     * One adjusted rotation per target.
     */
    private _adjustedRotations: Quaternion[];

    private _rotationValid: boolean = false;

    private _activeWidgetIndex: number;

    private _from: Vector3 = new Vector3();

    private _to: Vector3 = new Vector3();

    private _helpers: EditorObjectHelper[] = [];

    /** Gets the current tool's name. Used as a unique key. */
    get name(): string { return 'rotate'; }

    /** Gets the current tool's displayable name. */
    get displayName(): string { return 'Rotate' }

    /** Gets if the current tool is enabled. Computed from the editor's state. */
    get enabled(): boolean {
      let sel = this._editor.selectedObjects;
      return _.some(sel, x => x.rotatable) || _.filter(sel, x => x.movable).length > 1;
    }

    /** Gets the current tool's keyboard shortcut. */
    get keyboardShortcut(): KeyboardMatcher {
      return KeyboardMatcher.for({ keyCode: 82, /* R */ });
    }

    /** Informs the Tool that it's being activated. */
    activate() {

      this._reset();
      this._setUp();

      // Simulate mouse move to update.
      if (this._editor.lastMouseEvent) {
        this.notifyMouseMove(this._editor.lastMouseEvent);
      }
      this._editor.setPointer('crosshair');
      this._editor.requestRender();

    }

    /** Informs the Tool that it's being deactivated. */
    deactivate() {

      this._reset();

      this._editor.requestRender();

    }

    notifyMouseMove(event: JQueryMouseEventObject): void {

      if (!this._rotating) {

        let intersection = this._getNearestWidgetIntersection(event);
        if (intersection) {

          this._editor.setStatus('Click and drag to rotate object around ' + intersection.widget.name);

          this._widgets.forEach((w, i) => {
            if (this._axes[i]) {
              if (w === intersection.widget) {
                w.setState(WidgetState.Hovered);
              } else {
                w.setState(WidgetState.Normal);
              }
            }
          });

        }
      } else {

        // Rotating
        let activeWidget = this._widgets[this._activeWidgetIndex];
        let intersection = activeWidget.test(event, this._editor);
        if (intersection) {

          this._to.copy(intersection.point);

          let v1 = new Vector3().subVectors(this._from, this._pivot);
          let v2 = new Vector3().subVectors(this._to, this._pivot);

          let angle = v1.angleTo(v2);
          let degrees = angle / M.TWO_PI * 360;

          let cross = v1.clone().cross(v2);
          let axis = Helpers.getNormalFromOrthoPlane(activeWidget.plane);
          let dot = cross.dot(axis);
          let sign = dot > 0 ? 1 : -1;
          this._rotation.setFromAxisAngle(axis, angle * sign);

          // Compute rotation and position for each target.
          this._adjustedTranslations = [];
          this._adjustedRotations = [];
          this._targets.forEach((t, i) => {

            let origin = t.getWorldPivot();
            let p = new Vector3().subVectors(origin, this._pivot);
            if (p.length() > 0.001 && t.movable) {
              p.applyQuaternion(this._rotation)
              p.add(this._pivot);
              let m = new Vector3().subVectors(p, origin);
              if (t.moveConstraints) {
                t.moveConstraints.apply(m);
              }
              this._adjustedTranslations.push(m);
            } else {
              this._adjustedTranslations.push(null);
            }

            let adjustedRotation = null;
            if (t.rotatable) {
              let rotateConstraints = t.rotateConstraints;
              if (!rotateConstraints) {
                adjustedRotation = this._rotation.clone();
              } else {
                if (rotateConstraints.supportsAxis(this._activeWidgetIndex)) {
                  let rounded = angle;
                  let s = rotateConstraints.step;
                  if (s === 0) { rounded = 0; }
                  else { rounded = Math.round(angle / s) * s; }

                  adjustedRotation = new Quaternion().setFromAxisAngle(axis, rounded * sign);
                }
              }
            }
            this._adjustedRotations.push(adjustedRotation);      
          });

          let planes: THREE.Plane[] = [];
          let n = new Vector3().subVectors(v2, v1);
          let projection = n.clone().projectOnVector(v1);
          n.sub(projection).normalize();
          planes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(n, this._pivot));

          n.subVectors(v1, v2);
          projection = n.clone().projectOnVector(v2);
          n.sub(projection).normalize();
          planes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(n, this._pivot));
          activeWidget.setClippingPlanes(planes);

          // Rotate all the helpers
          this._helpers.forEach((h, i) => {
            if (this._adjustedRotations[i]) {
              h.setRotateBy(this._adjustedRotations[i]);
            } else {
              h.setRotateBy(new Quaternion());
            }
            if (this._adjustedTranslations[i]) {
              h.setMoveBy(this._adjustedTranslations[i]);
            } else {
              h.setMoveBy(M.Vector3.Zero);
            }
          });

          let step = this._buildEditStep();
          if (step) {
            let validation = this._editor.validateEditStep(step);
            let someErrors = _.some(validation, Validators.isError);
            this._rotationValid = !someErrors;
          } else {
            this._rotationValid = false;
          }
    
          this._helpers.forEach(h => h.setValidState(this._rotationValid));
          this._editor.setStatus('Release to rotate object around ' + activeWidget.name + ' by ' + degrees.toFixed(0) + '°');

        }
      }

      this._editor.requestRender();

    }

    notifyMouseDown(event: JQueryMouseEventObject): void {

      let intersection = this._getNearestWidgetIntersection(event);
      if (intersection) {
        this._rotating = true;
        this._rotation = new Quaternion();
        this._activeWidgetIndex = this._widgets.indexOf(intersection.widget);
        this._from.copy(intersection.point);
        this._to.copy(intersection.point);

        this._widgets.forEach((w, i) => {
          if (i !== this._activeWidgetIndex) {
            w.setState(WidgetState.Hidden);
          }
        });

        this._helpers.forEach(h => h.visible = true);
        this._editor.hideSelectionOverlays();
        this._editor.requestRender();

      }

    }

    notifyMouseUp(event: JQueryMouseEventObject): void {

      let step = this._buildEditStep();
      let finalStatus: string = null;
      if (step) {
        let validation = this._editor.validateEditStep(step);
        let errors = _.filter(validation, Validators.isError);
        if (errors.length === 0) {
          this._editor.addEditStep(step);
        } else {
          finalStatus = `Could not rotate because of ${ errors.length  } validation error(s)`;
          console.log('Validation errors:', errors);
        }
      }

      this._rotating = false;
      this._activeWidgetIndex = null;

      this._reset();
      this._setUp();

      // Simulate mouse move to update state.
      this.notifyMouseMove(event);

      if (finalStatus) {
        this._editor.restoreSelectionOverlays();
        this._editor.setStatus(finalStatus);
      }

    }
    
    notifyKeyDown(event: JQueryKeyEventObject): void {

    }

    /**
     * Reverts to neutral state.
     */
    private _reset() {

      if (this._widgets) {
        this._widgets.forEach(w => this._editor.removeFromScene(w.threeObject));
      }
      if (this._helpers) {
        this._helpers.forEach(h => this._editor.removeFromScene(h));
      }

      this._rotating = false;
      this._rotation = null;
      this._areaMode = false;
      this._targets = [];
      this._widgets = [];
      this._helpers = [];

    }

    private _setUp() {

      let sel = this._editor.selectedObjects;

      this._targets = _.filter(sel, o => o.rotatable || sel.length > 1 && o.movable);
      
      if (this._targets.length === 0) return;

      this._areaMode = _.some(this._targets, isArea);
      if (this._areaMode) {
        // Sanitize the target list. We only keep the areas.
        this._targets = _.filter(this._targets, isArea);
      }

      this._pivot.set(0, 0, 0);      
      this._targets.forEach(t => this._pivot.add(t.getWorldPivot()));
      this._pivot.divideScalar(this._targets.length);

      // Build visual helper for all the targets.
      this._helpers = this._targets.map(t => {
        let h = new EditorObjectHelper(t);
        t.getWorldPosition(h.position);
        h.setRestRotation(t.getRotation());
        h.setMoveBy(M.Vector3.Zero);
        h.visible = false;
        this._editor.addToScene(h);
        return h;
      });

      // Determines enabled axes.
      this._axes = this._computeEnabledAxes();

      // Build rotation widgets

      // rotate around X
      var wx = new RotationWidget('X', Helpers.OrthoPlane.YZ, 0xff0000);

      // rotate around Y
      var wy = new RotationWidget('Y', Helpers.OrthoPlane.XZ, 0x00ff00);

      // rotate around Z
      var wz = new RotationWidget('Z', Helpers.OrthoPlane.XY, 0x0000ff);

      this._widgets = [ wx, wy, wz ];

      let cameraOrientation = this._editor.getCameraRig().getWorldDirection();
      let clippingPlanes: THREE.Plane[] = [];
      this._widgets.forEach((w, i) => {

        if (!this._axes[i]) {
          w.setState(WidgetState.Hidden);
          return;
        }

        let n = Helpers.getNormalFromOrthoPlane(w.plane);
        let dot = n.dot(cameraOrientation);
        if (dot > 0) {
          n.negate(); 
        }
        let p = this._pivot.clone();
        p.addScaledVector(n, -0.001);

        clippingPlanes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(n, p));
      });

      this._widgets.forEach(w => {
        w.setClippingPlanes(clippingPlanes);
        w.setPosition(this._pivot);
        this._editor.addToScene(w.threeObject);
      });
    }

    private _getNearestWidgetIntersection(mouse: JQueryMouseEventObject): WidgetHitTestResult {
      let w = this._widgets.filter((w, i) => this._axes[i]);
      let intersections = w.map(w => w.test(mouse, this._editor));
      return _.minBy(intersections, i => i ? i.distance : Infinity);
    }

    private _buildEditStep() {

      if (!this._targets || this._targets.length === 0 || !this._rotation) return null;

      let steps: EditSteps.EditStep[] = [];

      if (this._areaMode) {

        // Working in area mode.

        // Rotate the area themselves with resize edit steps.
        this._targets.forEach((target, i) => {

          let adjustedRotation = this._adjustedRotations[i];
          let adjustedTranslation = this._adjustedTranslations[i];

          // Apply adjusted rotation to the area's box.
          let area = <Model.Area>target.model;
          let box = target.boundingBox.clone();
          let originalSize = box.getSize();
          if (adjustedRotation) {
            M.rotateBox3(box, adjustedRotation);
          }
          box.min.round();
          box.max.round();

          let newSize = box.getSize();
          let location = new Vector3().copy(area.location).addScaledVector(originalSize, 0.5);
          if (adjustedTranslation) {
            location.add(adjustedTranslation);
          }
          location.addScaledVector(newSize, -0.5).round();

          if (target.locationContstraints) {
            target.locationContstraints.apply(location, this._editor.model);
          }

          let locationDelta = new Vector3().subVectors(location, area.location);
          let sizeDelta = new Vector3().subVectors(newSize, area.size).round();
          let resize = new EditSteps.ResizeStep(locationDelta, sizeDelta, [ target.id ]);
          steps.push(resize);

          // Then move (and rotate) all the objects inside the area.
          let elements = this._editor.getObjectsByAreaId(target.id);

          let originalPivot = originalSize.clone().multiplyScalar(0.5);
          let newPivot = newSize.clone().multiplyScalar(0.5);

          elements.forEach(element => {
            let areaElement = <Model.AreaElement>element.model;

            // Apply adjusted rotation.
            if (element.rotatable && adjustedRotation) {
              steps.push(new EditSteps.RotateStep(adjustedRotation, [ element.id ]));
            }

            // Then rotate the object around the area's rotation pivot.
            if (element.movable) {
              let delta = new Vector3().subVectors(areaElement.location, originalPivot);
              if (adjustedRotation) {
                delta.applyQuaternion(adjustedRotation);
                delta.add(originalPivot);
              }

              if (element.locationContstraints) {
                // Switch to world position
                delta.add(area.location);
                element.locationContstraints.apply(delta, this._editor.model);
                delta.sub(area.location);
              }
              delta.sub(areaElement.location);
              steps.push(new EditSteps.MoveStep(delta, [ element.id ]));
            }

          });

          // If the rotated area is a room, rotate its tile definitions.
          if (area instanceof Model.RoomArea && adjustedRotation) {

            // Setup.
            let tileMap: { [type: number]: number[][] }= {};
            let tileTypes = [];
            
            Object.keys(Model.TileType).filter(key => isNaN(Number(key))).forEach(typeName => {
              let type = Model.TileType[typeName];
              tileMap[type] = [];
              tileTypes.push(type);
            });
            
            for (let x = 0; x < area.size.x; x++) {
              for (let z = 0; z < area.size.z; z++) {
                let type = area.getTile(x, z);
                tileMap[type].push([x, z]);
              }
            }

            // Rotate
            let v = new Vector3();
            tileTypes.forEach(type => {
              let tiles = tileMap[type];
              tiles.forEach(tile => {
                v.set(tile[0], 0, tile[1])
                  .addScalar(0.5)
                  .sub(originalPivot)
                  .applyQuaternion(adjustedRotation)
                  .add(newPivot)
                  .subScalar(0.5)
                  .round();
                tile[0] = v.x;
                tile[1] = v.z;
              });
            });

            // Apply
            tileTypes.forEach(type => {
              let tiles = tileMap[type];
              if (tiles.length !== 0) {
                steps.push(new EditSteps.SetTileTypeStep(area.id, tiles, type));
              }
            });

          }


        });

      } else {

        // Working in element mode.

        this._targets.forEach((t, i) => {
          let element = <Model.AreaElement>t.model;

          // Apply adjusted rotation.
          if (this._adjustedRotations[i]) {
            steps.push(new EditSteps.RotateStep(this._adjustedRotations[i], [ t.id ]));
          }
          // Apply adjusted translation, 
          if (this._adjustedTranslations[i]) {
            let newWorldPos = t.getWorldPosition(new Vector3()).add(this._adjustedTranslations[i]);
            let newArea = this._editor.getAreaAtLocation(newWorldPos);
            if (newArea && newArea.id !== element.areaId) {
              let newAreaLocation = new Vector3().subVectors(newWorldPos, newArea.location);
              steps.push(new EditSteps.MoveToStep(t.id, newArea.id, newAreaLocation));                
            } else {
              steps.push(new EditSteps.MoveStep(this._adjustedTranslations[i], [ t.id ]));
            }
          }
        });

      }

      return new EditSteps.ComposedStep(steps);

    }

    /** from current `_targets`. */
    private _computeEnabledAxes(): boolean[] {

      let targets = this._targets;

      if (targets.length === 0) {

        // No target, no axes.
        return [ false, false, false ];

      } else if (targets.length === 1) {

        // Single target. Apply rotateConstraint if any.
        let t = targets[0];
        if (!t.rotatable) return [ false, false, false ];
        let c = t.rotateConstraints;
        if (!c) return [ true, true, true ];
        return  [
          c.supportsAxis(0),
          c.supportsAxis(1),
          c.supportsAxis(2)
        ];

      } else {

        // Multiple target. Take movability into account.
        let x = _.some(targets, t => {
          if (t.movable) {
            return true;
          } else if (t.rotatable) {
            let c = t.rotateConstraints;
            return c.supportsAxis(0);
          } else {
            return false;
          }
        });

        let y = _.some(targets, t => {
          if (t.movable) {
            return true;
          } else if (t.rotatable) {
            let c = t.rotateConstraints;
            return c.supportsAxis(1);
          } else {
            return false;
          }
        });

        let z = _.some(targets, t => {
          if (t.movable) {
            return true;
          } else if (t.rotatable) {
            let c = t.rotateConstraints;
            return c.supportsAxis(2);
          } else {
            return false;
          }
        });

        return [ x, y, z ];

      }
    }

  }
}
