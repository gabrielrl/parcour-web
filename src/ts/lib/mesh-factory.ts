/// <reference path="./character.ts" />
/// <reference path="./anims-prkr-json-def.ts" />

namespace PRKR {
  export interface MeshFactoryLoadedCallback { (factory: MeshFactory): void; };

  /**
   * A mesh and character factory.
   * Set URIs for geometry, materials, animations, etc. and get characters and
   * meshes.
   */
  export class MeshFactory {
    private _loaded: boolean = false;

    /**
     * Indicates if all defined sources are loaded.
     */
    public get loaded() { return this._loaded; }

    private _geometryLoaded: boolean = false;

    /**
     * Indicates if geometry data is available.
     */
    public get geometryLoaded() { return this._geometryLoaded; }

    private _geometryError: Error;

    /**
     * Gets the Error encountered while acquiring or processing geometry data.
     */
    public get geometryError() { return this._geometryError; }

    private _geometryUri: string;

    /**
     * Gets the geometry URI.
     */
    public get geometryUri() { return this._geometryUri; }

    private _geometry: THREE.Geometry;

    /**
     * Gets the geometry.
     */
    public get geometry(): THREE.Geometry { return this._geometry; }

    private _materials: THREE.Material[];

    /**
     * Material array. Available if `this.geometryLoaded`.
     */
    public get materials() { 
      return [].concat(this._materials);
    }

    private _animationsLoaded: boolean = false;

    /**
     * Indicates if animation data is available.
     */
    public get animationsLoaded() { return this._animationsLoaded; }

    private _animationsError: Error;

    /**
     * Gets the error ecountered while processing animation data.
     */
    public get animationsError() { return this._animationsError; }

    private _animations: THREE.AnimationClip[];

    /**
     * Gets the animation array.
     */
    public get animations(): THREE.AnimationClip[] { return this._animations; }

    private _animationsUri: string;

    /**
     * Gets the animation URI.
     */
    public get animationsUri() { return this._animationsUri; }

    /**
     * The callback function to invoke when everything is loaded.
     */
    private _loadedCallback: MeshFactoryLoadedCallback;

    /**
     * Sets the callback function to invoke when everything is loaded.
     */
    public set loadedCallback(value: MeshFactoryLoadedCallback) {
      this._loadedCallback = value;

      if (this._loaded) {
        this._loadedCallback(this);
      }
    }

    /**
     * Gets the callback function to invoke when everything is loaded.
     */
    public get loadedCallback() {
      return this._loadedCallback;
    }

    /**
     * Loads a geometry (and materials) using the JSONLoader.
     */
    public loadGeometryJson(uri: string) {
      if (!uri) throw new Error('"uri" can not be null or undefined');

      // Keep the URI for reference.
      this._geometryUri = uri;

      // Loads the geometry with JSONLoader.
      var jsonLoader = new THREE.JSONLoader();
      jsonLoader.load(uri, (g, m) => this.onJsonModelLoaded(g, m));		
    };

    /**
     * Loads animation in a 'anims.prkr.json' file.
     */
    public loadAnimations(uri: string) {
      if (!uri) throw new Error('"uri" can not be null or undefined');

      // Keep the URI for reference.
      this._animationsUri = uri;

      // Loads the animation with basic loader.
      var animLoader = new THREE.FileLoader();
      animLoader.load(uri, (d) => this.onAnimationsLoaded(d));
    }

    /**
     * Builds a character from loaded geometry, materials and animations.
     */
    public buildCharacter() {
      // TODO A little validation would be welcome.
      let multiMaterial = new THREE.MultiMaterial(this.materials);
      let skinnedMesh = new THREE.SkinnedMesh(this.geometry, multiMaterial);

      let mixer = new THREE.AnimationMixer(skinnedMesh);
      
      let actions: THREE.AnimationAction[] = [];

      for (let clip of this.animations) {
        actions.push(mixer.clipAction(clip, skinnedMesh));
      }

      var characterData = {
        mesh: skinnedMesh,
        mixer: mixer,
        actions: actions
      };

      var character = new PRKR.Character(characterData);

      return character;
    }

    /**
     * Handles geometry and materials. 
     */
    private onJsonModelLoaded(
      geometry: THREE.Geometry,
      materials: THREE.Material[]
    ) {
      try {
        // Correct geometry (compute normals) :(
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        // TODO check for mesh type (skinned or not?)
        // Adjust materials (for skinning).
        for (var mat of materials) {
          if (mat instanceof THREE.MeshBasicMaterial ||
              mat instanceof THREE.MeshLambertMaterial) {
            mat.skinning = true;
          }
        }

        // Keep references.
        this._geometry = geometry;
        this._materials = materials;
        this.setGeometryLoaded();
      } catch (err) {
        this.setGeometryError(err);
      }
    }

    /**
     * Handles loaded animations data.
     */
    private onAnimationsLoaded(dataString: string) {
			try {
        let data = <PRKR.AnimationsPrkrJson>JSON.parse(dataString);				
				let clips: THREE.AnimationClip[] = [];

				// Build a clip for each animation in the file.
				for (let loadedAnimation of data.animations) {

					// Build the track list.
					let tracks: THREE.KeyframeTrack[] = [];
					for (let loadedTrack of loadedAnimation.tracks) {
						let track: THREE.QuaternionKeyframeTrack | THREE.VectorKeyframeTrack
              = null;
						let trackName =
              '.bones[' + loadedTrack.bone + '].' + loadedTrack.type;
						if (loadedTrack.type === 'quaternion') {							
							track = new THREE.QuaternionKeyframeTrack(trackName, loadedTrack.times, loadedTrack.values, null);
						} else if (loadedTrack.type === 'position') {
							track = new THREE.VectorKeyframeTrack(trackName, loadedTrack.times, loadedTrack.values, null);
						}

						if (track) {
							// Adjust time to start at zero.
							track.shift(-loadedTrack.minTime);
							// Scale time to match fps (TODO load fps from file)
							track.scale(1/25);
							// Validate the result.
							var validation = track.validate();
							console.debug(`Track '${trackName}' validation result: ${validation}`);

							tracks.push(track);
						} else {
							console.warn(`Skipped track '${trackName}' unsupported type '${loadedTrack.type}', id: ${loadedTrack.id}`);
						}
					}
					
					let clip = new THREE.AnimationClip(loadedAnimation.name, undefined, tracks);
					clips.push(clip);
				}

				this._animations = clips;
				this.setAnimationsLoaded();
			} catch (err) {
				this.setAnimationsError(err);
			}
    }

    /**
     * Sets the "geometry loaded" flag and initiate follow-up actions.
     */
    private setGeometryLoaded() {
      this._geometryLoaded = true;

      if (this.animationsLoaded || !this.animationsUri) {
        this.setLoaded();
      }
    }

    /**
     * Sets the "animations loaded" flag and initiate follow-up actions.
     */
    private setAnimationsLoaded() {
      this._animationsLoaded = true;

      if (this.geometryLoaded || !this.geometryUri) {
        this.setLoaded();
      }
    }

    /**
     * Sets the "everything loaded" flag and initiate follow-up actions.
     */
    private setLoaded() {
      this._loaded = true;

      // Callback
      if (this._loadedCallback) {
        this._loadedCallback(this);
      }
    }

    private setGeometryError(err: Error) {
      this._geometryError = err;
      console.error('MeshFactory#setGeometryError:', err);
      // TODO
    }

    private setAnimationsError(err: Error) {
      this._animationsError = err;
      console.error('MeshFactory#setAnimationsError:', err);
      // TODO
    }
  }
}