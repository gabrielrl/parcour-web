namespace PRKR {
  export interface Track {
    id: string,
    type: string,
    bone: string,
    minTime: number,
    maxTime: number,
    times: number[],
    values: number[]
  }

  export interface Animation {
    name: string,
    trackCount: number,
    minTine: number,
    maxTime: number,
    tracks: Track[]
  }

  export interface AnimationsPrkrJson {
    animations: Animation[]
  }
}