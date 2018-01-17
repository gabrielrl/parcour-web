namespace PRKR {
  export interface Configuration {
    /** Backend URL (includes protocol, hostname and port) */
    backend: string;
    /** Parcours root path (append to `backend`) */
    parcours: string;
  }
}