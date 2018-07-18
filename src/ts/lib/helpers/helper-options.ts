namespace PRKR.Helpers {
  
  export interface HelperOptions {

    /** Indicates if lines should be used when rendering the helper. */
    useLines?: boolean;

    /** Indicates if faces should be used when rendering the helper. */
    useFaces?: boolean;

    /** Line material to use. */
    lineMaterial?: THREE.LineBasicMaterial | THREE.LineDashedMaterial;

    /** Face material to use. */
    faceMaterial?: THREE.Material;

    /** Render order value (see THREE.Object3D.renderOrder) */
    renderOrder?: number;
  }
  
}