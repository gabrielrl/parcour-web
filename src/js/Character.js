(function(window, THREE) {

  /**
   * Character object constructor.
   */
  function Character(data) {
    this.mesh = null;
    this.mixer = null;
    this.actions = null;
    this.actionsByName = {};

    if (data) {
      if (data.mesh) this.mesh = data.mesh;
      if (data.mixer) this.mixer = data.mixer;
      if (data.actions) {
         this.actions = data.actions;
         this.actionsByName = buildActionsByName(this.actions);
      }
    }
  }

  Character.prototype.constructor = Character;

  /**
   * Updates character animations (and probably more)
   */
  Character.prototype.update = function update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  };

  /**
   * Stop all actions (playing and scheduled animations).
   */
  Character.prototype.stopAll = function stopAll() {
    this.mixer.stopAllAction();
  };

  /**
   * Play desired animation/action (and only desired action) by its name.
   * @returns {THREE.AnimationAction} The action.
   */
  Character.prototype.play = function( animName ) {
    this.stopAll();
    var action = this.actionsByName[animName];
    if (!action) {
      throw new Error('Unknown action/animation name, "' + animName + '"');
    }
    return action.setEffectiveWeight(1.0).play();
	};

  /**
   * Builds a map of (name -> action) from an action array.
   */
  function buildActionsByName(actionArray) {
    var actionMap = {};

    for (var action of actionArray) {
      actionMap[action._clip.name] = action;
    }
    
    return actionMap;
  }

  // Expose ourselves.
  var PRKR = window.PRKR || {};
  PRKR.Character = Character;

})(window, THREE);