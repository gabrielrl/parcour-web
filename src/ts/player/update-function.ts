namespace PRKR.Player {
  export interface UpdateFunction {
    (delta: number, ellapsed: number): void;
  }
}