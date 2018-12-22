namespace PRKR.Editor.Tools {

  // Interface that supports pasting some objects in a parcour.
  export interface Paster {

    /** A collection of helpers that will be added to the scene. */
    helpers: Helpers.BoundingBoxHelper[];

    /** Builds the edit step to actually apply the paste operation. */
    buildEditStep(location: THREE.Vector3): EditSteps.EditStep;

    /** Update the helpers state. */
    updateHelpers(location: THREE.Vector3, editStep: EditSteps.EditStep,
      validation: Validators.IValidationResult[]): void;

  }
}