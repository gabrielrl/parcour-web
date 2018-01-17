/// <reference path="../defs/threex-keyboardstate.d.ts" />
/// <reference path="./m.ts" />
/// <reference path="./polar.ts" />
/// <reference path="./character.ts" />


namespace PRKR {

  ///// Constants. /////

  const yAxis = new THREE.Vector3(0, 1, 0);

  // TODO Extract to character / player definition.
  const ACCELERATION = 4; // m/s^2
  const MAX_VELOCITY = 2.4; // m/s
  const ANGULAR_VELOCITY = Math.PI * (5 / 3); // 3 * Math.PI / 2;

  ///// Player states /////

  export class PlayerState {
    private _name: String;

    constructor(name: String) {
      if (name.length === 0) {
        throw new Error('"name" can not be an empty string');
      }
      this._name = name;      
    }

    get name() {
      return this._name;
    }
  }

  var PlayerStates = {
    idle: new PlayerState('idle'),
    walking: new PlayerState('walking')
  };

  ///// Player Controls /////

  export class PlayerControlsOptions {
    character: Character;
    camera: THREE.Camera;
    keyboard: THREEx.KeyboardState;
    orbitControls: THREE.OrbitControls;
  };

  export class PlayerControls {
    public character: Character;
    public camera: THREE.Camera;
    public keyboard: THREEx.KeyboardState;
    public orbitControls: THREE.OrbitControls;
    public state: PlayerState = PlayerStates.idle;
    
    public velocity: Polar = new Polar();

    constructor(options?: PlayerControlsOptions) {

      if (options.character) this.character = options.character;
      if (options.camera) this.camera = options.camera;
      if (options.keyboard) this.keyboard = options.keyboard;
      if (options.orbitControls) this.orbitControls = options.orbitControls;
      if (options.camera) this.camera = options.camera;

      // Validations
      if (!this.character) {
        throw new Error('PlayerControls requires a "character" to act upon');
      }

      //if (!this.camera) throw new Error('PlayerControls requires a "camera" to act upon');

      // Fill
      if (!this.keyboard) {
        console.warn('No THREEx.KeyboardState instance specified, building my own');
        this.keyboard = new THREEx.KeyboardState(window.document);
      }
    }

    /**
     * Performs updates (from player input to character and camera)
     */
    public update(delta: number, shouldLog: boolean) {
      // Update character controls part.
      // Process input devices.
      let polarActuator = new Polar();
      let vectorActuator = new THREE.Vector3();
      this.computePlayerActuator(polarActuator, vectorActuator);

      let currentVelocity = this.velocity;
      let velocity = new Polar(); // implicit "next" polar velocity.
      let frameAcceleration = delta * ACCELERATION;

      if (polarActuator.length > .5) {

        if (currentVelocity.length < 1e-4) {
          // If the character is still
          // It starts accelerating instantly facing the actuator direction.
          velocity.theta = polarActuator.theta;
          velocity.length = frameAcceleration;
        } else {
          // the character is moving. 
          // Mix the actuator with the current velocity.
          // Accelerate toward actuator angle or "break"?
          let thetaDiff = M.wrappedDiff(
            polarActuator.theta, currentVelocity.theta,
            0, M.TWO_PI);
          let absoluteThetaDiff = Math.abs(thetaDiff);

          // TODO Extract magic number.
          if (absoluteThetaDiff > (Math.PI * 0.5)) {

            // Break if angle difference is too steep.
            velocity.theta = currentVelocity.theta;
            velocity.length = currentVelocity.length - (2 * frameAcceleration);

          } else {

            // Accelerate toward actuator.
            if (absoluteThetaDiff < 1e-3) {
              velocity.theta = currentVelocity.theta;
            } else {
              let frameAngularVelocity = ANGULAR_VELOCITY * delta;
              if (frameAngularVelocity >= absoluteThetaDiff) {
                velocity.theta = polarActuator.theta;
              } else {
                if (thetaDiff > 0) velocity.theta = currentVelocity.theta + frameAngularVelocity;
                else velocity.theta = currentVelocity.theta - frameAngularVelocity;
              }        
            }
            velocity.length = currentVelocity.length + frameAcceleration;
            
          }
        }
      } else {

        // Decelerate keeping the current orientation.
        velocity.theta = currentVelocity.theta;
        velocity.length = currentVelocity.length - frameAcceleration;

      }

      // Bound to max speed
      velocity.length = M.clamp(velocity.length, 0, MAX_VELOCITY);

      // Log, only when asked to
      if (shouldLog) {
        console.debug('PlayerControl # update');
        console.debug('polarActuator:', polarActuator);
        console.debug('velocity=', velocity);
      }

      let nextState: PlayerState;
      // If there is enough velocity.
      if (velocity.length > 1e-4) {
        // Enter (or stay in) walking state.
        nextState = PlayerStates.walking;

        let frameVelocity = new THREE.Vector3(
          Math.sin(velocity.theta) * velocity.length * delta,
          0,
          Math.cos(velocity.theta) * velocity.length * delta);

        this.character.mesh.position.add(frameVelocity);

        // Align character's mesh with its velocity.            
        this.character.mesh.quaternion.setFromAxisAngle(yAxis, velocity.theta);

        // Cam follows player.
        // TODO refactor to handle camera too.
        if (this.orbitControls) {
          this.orbitControls.target.copy(this.character.mesh.position);
        }
        if (this.camera) {
          this.camera.position.add(frameVelocity);
        }

      } else {
        // Without velocity
        nextState = PlayerStates.idle;
      }

      // Only on state switch
      if (nextState !== this.state) {
        switch(nextState) {
          case PlayerStates.idle:
            // Entering Idle.
            console.debug('Entering Idle state');
            this.character.play('Idle');
            break;

          case PlayerStates.walking:
            // Entering Walk.
            console.debug('Entering Walk state');
            this.character.play('Walk');
            break;
        }
        this.state = nextState;
      }

      // Update controls state.
      this.velocity.copy(velocity);

      // TODO... Update the camera controls part.
    }

    private computePlayerActuator(polar?: Polar, vector?: THREE.Vector3) {
      // Movement from the camera's perspective.
      let movementX = 0;
      if (this.keyboard.pressed('A')) movementX -= 1;
      if (this.keyboard.pressed('D')) movementX += 1;

      let movementY = 0;
      if (this.keyboard.pressed('W')) movementY += 1;
      if (this.keyboard.pressed('S')) movementY -= 1;

      let vectorMovement = vector || new THREE.Vector3();
      let polarMovement = polar || new Polar();      
      if (movementX != 0 || movementY != 0) {

        // TODO replace...
        let cameraOrientation = 0;
        if (this.orbitControls) {
          cameraOrientation = this.orbitControls.getAzimuthalAngle();
        }

        vectorMovement.set(movementX, 0, -movementY);
        vectorMovement.applyAxisAngle(yAxis, cameraOrientation);
        vectorMovement.normalize();
        polarMovement.set(Math.atan2(vectorMovement.x, vectorMovement.z), 1);
      } else {
        vectorMovement.set(0, 0, 0);
        polarMovement.set(0, 0);
      }

      return polarMovement;
    }
  }
}