namespace PRKR.Validators {

  /**
   * Gets whether `validation` is an error (or not).
   * @param validation A validation result
   * @returns true if `validation` is an error.
   */
  export function isError(validation: IValidationResult): boolean {
    return validation.level === ResultLevel.Error;
  }
}
