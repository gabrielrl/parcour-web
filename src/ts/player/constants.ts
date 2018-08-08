namespace PRKR.Player {

  /** Parcour player constants. */
  export var Constants = {

    /** All world related constants. */
    World: {

      /** World gravity (in m/s²). */
      Gravity: 10,

      /** Default friction coefficient for any rigid body. */
      DefaultFriction: .75
    },

    /** All character related constants. */
    Character: {

      /** Full character height (in meters) from top of head to heels. */
      Height: 1.5,

      /** 
       * Height (in meters) of the character capsule which goes down from the top of the head. Must be less than
       * `CharacterHeight`.
       */
      CapsuleHeight: 1, 

      /** Character capsule radius (in meters). */
      CapsuleRadius: 0.25,

      /** Character mass (in kilogram). */
      Mass: 70,

      /** Character friction coefficient. */
      Friction: 0.2,

      /**
       * Gets the basic (rest) "leg gap", which is the distance between the character's capsule and the ground
       * underneath it when standing still. *Computed*
       */
      get LegGap() {
        return this.Height - this.CapsuleHeight;
      },

      /**
       * Maximum leg (spring) force (in Newton). This is the force that is applied when the character capsule is touching the
       * ground. *Computed*
       */
      get MaxLegForce() {
        return 8 * this.Mass;
      },

      /**
       * Magnitude (in Newton) of the direction (walk) force. *Computed*
       */
      get DirectionMagnitude() {
        return 2 * this.Mass; 
      },

      /** Magnitude (in Newton) of the jump impulse. *Computed* */
      get JumpImpulse() {
        return 5 * this.Mass;
      }
      
    },

    StaticObjects: {

      /** Static objects' default friction coefficient. */
      DefaultFriction: 1.0

    },

    DynamicObjects: {

      /** Dynamic objects' default friction coefficient. */
      DefaultFriction: 0.8
    }


  }
}