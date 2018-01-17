(function(window, THREE) {

  /**
   * MeshFactory constructor.
   */
  function MeshFactory(/*data*/) {
		this.loaded = false;

		this.geometryLoaded = false;
		this.geometryError = null;
    this.geometryUri = null;
    this.geometry = null;
    this.materials = null;

		this.animationsLoaded = false;
		this.animationsError = null;
    this.animations = null;
    this.animationsUri = null;

		this.loadedCallback = null;

		/*if (data) {
			if (data.geometryUri && data.geometry) {
				this.geometryUri = data.geometryUri;
				this.geometry = data.geometry;
				this.materials = data.materials;
			}
			if (data.animationsUri && data.animations) {
				this.animationsUri = data.animationsUri;
				this.animations = data.animations;
			}
		}*/
		return this;
  }

	MeshFactory.prototype.constructor = MeshFactory;

	/**
	 * Loads a geometry (and materials) using the JSONLoader.
	 */
	MeshFactory.prototype.loadGeometryJson = function loadGeometryJson(uri) {
		if (!uri) throw new Error('"uri" can not be null or undefined');

		var self = this;

		// Keep the URI for reference.
		self.geometryUri = uri;

		// Loads the geometry with JSONLoader.
		var jsonLoader = new THREE.JSONLoader();
		jsonLoader.load(uri, onJsonModelLoaded);

		/**
		 * Handles geometry and materials. 
		 */
		function onJsonModelLoaded(geometry, materials) {
			try {
				// Correct geometry (compute normals) :(
				geometry.computeFaceNormals();
				geometry.computeVertexNormals();

				// TODO check for mesh type (skinned or not?)
				// Adjust materials (for skinning).
				for (var mat of materials) {
					mat.skinning = true;
				}

				// Keep references.
				self.geometry = geometry;
				self.materials = materials;
				setGeometryLoaded(self);
			} catch (err) {
				setGeometryError(self, err);
			}
		}
	};

	/**
	 * Loads animations (custom PRKR animations) using custom loader.
	 */
	MeshFactory.prototype.loadAnimations = function loadAnimations(uri) {
		if (!uri) throw new Error('"uri" can not be null or undefined');

		var self = this;

		// Keep the URI for reference.
		self.animationsUri = uri;

		// Loads the animation with basic loader.
		var animLoader = new THREE.XHRLoader();
		animLoader.load(uri, onAnimationsLoaded);

		/**
		 * Process loaded animations data.
		 */
		function onAnimationsLoaded(dataString) {
			try {
				data = JSON.parse(dataString);
				
				clips = [];

				// Build a clip for each animation in the file.
				for (var loadedAnimation of data.animations) {

					// Build the track list.
					var tracks = [];
					for (var loadedTrack of loadedAnimation.tracks) {
						var track = null;
						var trackName = '.bones[' + loadedTrack.bone + '].' + loadedTrack.type;
						if (loadedTrack.type === 'quaternion') {							
							track = new THREE.QuaternionKeyframeTrack(trackName, loadedTrack.times, loadedTrack.values);
						} else if (loadedTrack.type === 'position') {
							track = new THREE.VectorKeyframeTrack(trackName, loadedTrack.times, loadedTrack.values);
						}

						if (track) {
							// Adjust time to start at zero.
							track.shift(-loadedTrack.minTime);
							// Scale time to match fps (TODO load fps from file)
							track.scale(1/25);
							// Validate the result.
							var validation = track.validate();
							console.debug('Validation result = ', validation);

							tracks.push(track);
						} else {
							console.warn('Skipped track: ' + loadedTrack.id);
						}
					}
					
					var clip = new THREE.AnimationClip(loadedAnimation.name, undefined, tracks);
					clips.push(clip);
				}

				self.animations = clips;
				setAnimationsLoaded(self);
			} catch (err) {
				setAnimationsError(self, err);
			}
		}		
	};

	/**
	 * @private
	 * Sets the "geometry loaded" flag and initiate follow-up actions.
	 */
	function setGeometryLoaded(self) {
		self.geometryLoaded = true;

		if (self.animationsLoaded || !self.animationsUri) {
			setLoaded(self);
		}
	}

	/**
	 * @private
	 * Sets the "animations loaded" flag and initiate follow-up actions.
	 */
	function setAnimationsLoaded(self) {
		self.animationsLoaded = true;

		if (self.geometryLoaded || !self.geometryUri) {
			setLoaded(self);
		}
	}

	/**
	 * @private
	 * Sets the "everything loaded" flag and initiate follow-up actions.
	 */
	function setLoaded(self) {
		self.loaded = true;

		// Callback
		if (self.loadedCallback) {
			self.loadedCallback(self);
		}
	}

	function setGeometryError(self, err) {
		self.geometryError = err;
		console.error('MeshFactory#setGeometryError:', err);
		// TODO
	}

	function setAnimationsError(self, err) {
		self.animationsError = err;
		console.error('MeshFactory#setAnimationsError:', err);
		// TODO
	}

	/** 
	 * Sets the "on loaded" callback.
	 */
	MeshFactory.prototype.onLoaded = function onLoaded(callback) {
		if (!callback || typeof(callback) !== 'function') throw new Error('callback must be a function');
		this.loadedCallback = callback;

		if (this.loaded) {
			callback(this);
		}
	};

  /**
   * Builds a character from loaded geometry, materials and animations.
   */
  MeshFactory.prototype.buildCharacter = function buildCharacter() {
		// TODO Little validations would be welcome.
    var multiMaterial = new THREE.MultiMaterial(this.materials);
    skinnedMesh = new THREE.SkinnedMesh(this.geometry, multiMaterial);

		bindMeshAndAnimations(this, skinnedMesh);

		var characterData = {
			mesh: skinnedMesh,
			mixer: skinnedMesh.mixer,
			actions: skinnedMesh.actionArray
		};

		var character = new PRKR.Character(characterData);

    return character;
  }

	/**
	 * @private
	 * Binds a mesh and animations.
	 * @param self {MeshFactory} the current MeshFactory
	 * @param mesh {THREE.Mesh} a Mesh created by "self" to which
	 * animations should be bound.
	 */
	function bindMeshAndAnimations(self, mesh) {
		if (!self) throw new Error('self can not be undefined or null');
		if (!mesh) throw new Error('mesh can not be undefined or null');

		// If there is no animation, we're done.
		if (!self.animations) return;

		// We've got a skinned mesh and bunch of animation clips that
		// we need to tie up.

		// Set a reference to the clips from the mesh.
		mesh.animations = self.animations;

		// Create an animation mixer and build the actions.
		mixer = new THREE.AnimationMixer(mesh);
		mesh.mixer = mixer;

		actionMap = {};
		actionArray = [];

		for (var clip of mesh.animations) {
			var action = mixer.clipAction(clip, mesh);
			actionMap[clip.name] = action;
			actionArray.push(action);
		}

		// Set a reference to the actions from the mesh.
		mesh.actionMap = actionMap;
		mesh.actionArray = actionArray;		
	}

  // Export ourselves.
  window.PRKR = window.PRKR || {};
  window.PRKR.MeshFactory = MeshFactory;

})(window, THREE);