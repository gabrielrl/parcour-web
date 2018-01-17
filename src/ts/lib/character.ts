namespace PRKR {
  export interface CharacterOptions {
    mesh: THREE.Mesh;
    mixer: THREE.AnimationMixer;
    actions: THREE.AnimationAction[];
  }

  /**
   * A character object.
   * Aggregates: a mesh, a mixer and actions.
   */
  export class Character {
    public mesh: THREE.Mesh;
    public mixer: THREE.AnimationMixer;
    public actions: THREE.AnimationAction[];
    public actionsByName: { [key: string]: THREE.AnimationAction };

    constructor(options?: CharacterOptions) {
      if (options) {
        if (options.mesh) this.mesh = options.mesh;
        if (options.mixer) this.mixer = options.mixer;
        if (options.actions) {
          this.actions = options.actions;
          this.actionsByName = Character.buildActionsByName(this.actions);
        }
      }
    }

    /**
     * Updates character animations (and probably more...)
     */
    public update(delta: number) {
      if (this.mixer) {
        this.mixer.update(delta);
      }
    }

    /**
     * Stop all actions (playing and scheduled animations).
     */
    public stopAll() {
      this.mixer.stopAllAction(null);
    };
    
    /**
     * Play desired animation/action (and only desired action) by its name.
     * @returns {THREE.AnimationAction} The action.
     */
    public play(animName: string): THREE.AnimationAction {
      this.stopAll();
      var action = this.actionsByName[animName];
      if (!action) {
        throw new Error('Unknown action/animation name, "' + animName + '"');
      }
      return action.setEffectiveWeight(1.0).play();
    };

    private static buildActionsByName(
      actions: any[]
    ): { [key: string]: THREE.AnimationAction } {

      var actionMap: { [key: string]: THREE.AnimationAction } = {};

      for (var action of actions) {
        actionMap[action._clip.name] = action;
      }
      
      return actionMap;
    }
  }
}
