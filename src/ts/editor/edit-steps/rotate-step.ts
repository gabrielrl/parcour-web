namespace PRKR.Editor.EditSteps {

  import Quaternion = THREE.Quaternion;
  import Parcour = PRKR.Model.Parcour;
  import AreaElement = PRKR.Model.AreaElement;

  /**
   * Parcour edition step that rotates an object(s) from its(their) current rotation state.
   * 
   * In mathematical terms, the rotation represented by the current edit step is premultiplied to each target's
   * quaternion.
   */
  export class RotateStep extends EditStep {

    private _rotation: Quaternion = new Quaternion();
    private _targetIds: string[];

    /**
     * 
     * @param rotation The rotation to apply to the targets.
     * @param targetIds The IDs of the object(s) to rotate.
     */
    constructor(rotation: Quaternion, targetIds: string[]) {
      super();

      if (!rotation) throw new Error('rotation must be defined');
      if (!targetIds || targetIds.length === 0) throw new Error('targets must be defined and non-empty');

      this._rotation.copy(rotation);
      this._targetIds = [].concat(targetIds);
    }

    public do(parcour: Parcour): StepResult {

      let memento: number[] = [];

      let targets = this._targetIds.map(id => parcour.getObjectById(id));
      let dirtyIds = [];
      targets.forEach(target => {
        if (target instanceof AreaElement) {
          dirtyIds.push(target.id);
          memento.push(...target.rotation.toArray());
          target.rotation.premultiply(this._rotation);
        }
      });

      return {
        dirtyIds: [].concat(this._targetIds),
        data: memento
      };
    }

    public undo(parcour: Parcour, data: Object): StepResult {

      if (_.isArray(data)) {
        let dataArray = <number[]>data;
        let delta = 0;
        this._targetIds.forEach(id => {
          let target = parcour.getObjectById(id);
          if (target instanceof AreaElement) {
            target.rotation.set(
              dataArray[delta * 4],
              dataArray[delta * 4 + 1],
              dataArray[delta * 4 + 2],
              dataArray[delta * 4 + 3]
            );
            delta++;
          }
        });
      }

      return { dirtyIds: [].concat(this._targetIds) };
    }
  }

}