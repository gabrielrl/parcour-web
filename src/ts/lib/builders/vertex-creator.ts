namespace PRKR.Builders {

  import Vector3 = THREE.Vector3;

  /**
   * Takes care of creating vertices only once in an array.
   */
  export class VertexCreator {

    private _array: Vector3[];
    private _map: { [key: string]: number } = {};

    /** 
     * @param array Backing array in which vertex will be created when needed.
     */
    constructor(array: Vector3[]) {
      if (!array) throw new Error('"array" must be defined');

      this._array = array;
    }

    /** Gets the index of the required vertice. Creates it if necessary. */
    getVertexIndex(x: number, y: number, z: number) {
      let key = this.buildVertexKey(x, y, z);
      if (!(key in this._map)) {
        
        // Create
        this._map[key] = this._array.length;
        this._array.push(new Vector3(x, y, z));

      }

      return this._map[key];
    }

    buildVertexKey(x: number, y: number, z: number) {
      let key = x.toString() + ';' + y.toString() + ';' + z.toString();
      return key;
    }

  }
}