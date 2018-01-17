/// <reference path="../../defs/prkr.bundle.d.ts" />
/// <reference path="./edit-step.ts" />

namespace PRKR.Editor.EditSteps {

  import Vector3 = THREE.Vector3;
  import Parcour = PRKR.Model.Parcour;
  import ParcourObject = PRKR.Model.ParcourObject;
  import Area = PRKR.Model.Area;

  /**
   * Edit step to move parcour objects by a certain delta.
   */
  export class MoveStep extends EditStep {

    private _movement: Vector3 = new Vector3();
    private _targetIds: string[];

    constructor(
      movement: Vector3,
      targetIds: string[]
    ) {
      super();

      if (!movement) throw new Error('movement must be defined');
      if (!targetIds || targetIds.length === 0) throw new Error('targets must be defined and non-empty');
      
      this._movement.copy(movement);
      this._targetIds = [].concat(targetIds);
    }

    public do(parcour: Parcour): StepResult {  
      let memento: number[] = [];

      let targets = this._targetIds.map(id => parcour.getObjectById(id));
      
      // Find dirty neighbours Before move
      let dirtyIds = [];
      targets.forEach(target => {
        if (target instanceof Area) {
          dirtyIds = dirtyIds.concat(
            parcour.getNeighbourAreas(target.id).map(a => a.id));
        } else if (target instanceof PRKR.Model.WallElement) {
          // TODO optimize, just look on the other side of the wall.
          dirtyIds = dirtyIds.concat(
            parcour.getNeighbourAreas(target.areaId).map(a => a.id));
        }
      });
      // this._targetIds.forEach(targetId => {
      //   dirtyIds = dirtyIds.concat(
      //     parcour.getNeighbourAreas(targetId).map(a => a.id));
      // });

      targets.forEach(target => {
        if (target instanceof Area || target instanceof PRKR.Model.AreaElement) {
          memento.push(...target.location.toArray());
          target.location.add(this._movement);
        }
        
      });

      // this._targetIds.forEach((targetId) => {
      //   let target = <Area>parcour.getObjectById(targetId);
      //   if (!(target instanceof Area)) {
      //     throw new Error('MoveStep does not (yet) handles non area objects.');
      //   }
      //   memento.push(new Vector3().copy(target.location));
      //   target.location.add(this._movement);
      // });

      // Find dirty neighbors after move.
      targets.forEach(target => {
        if (target instanceof Area) {
          dirtyIds = dirtyIds.concat(
            parcour.getNeighbourAreas(target.id).map(a => a.id));
        } else if (target instanceof PRKR.Model.WallElement) {
          // TODO optimize, just look on the other side of the wall.
          dirtyIds = dirtyIds.concat(
            parcour.getNeighbourAreas(target.areaId).map(a => a.id));
        }
      });
      // this._targetIds.forEach(targetId => {
      //   dirtyIds = dirtyIds.concat(
      //     parcour.getNeighbourAreas(targetId).map(a => a.id));
      // });      

      return {
        dirtyIds: _.uniq([].concat(this._targetIds, dirtyIds)),
        data: memento
      };
    }

    public undo(parcour: Parcour, data: Object): StepResult {
      if (_.isArray(data)) {
        let dataArray = <number[]>data;
        this._targetIds.forEach((targetId, index) => {
          let target = parcour.getObjectById(targetId);
          if (target instanceof Area
           || target instanceof Model.AreaElement) {
            target.location.set(
              dataArray[index * 3],
              dataArray[index * 3 + 1],
              dataArray[index * 3 + 2]
            );
          }
        });

        return { dirtyIds: [].concat(this._targetIds) };
      }
    }
  }

  // /**
  //  * An array of vector that holds every object's original position. Used by the
  //  * undo function.
  //  */
  // class MoveMemento extends Array<Vector3> { }
}