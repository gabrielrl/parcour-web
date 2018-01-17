/// <reference path="./area.ts" />

namespace PRKR.Model {

  import Vector3 = THREE.Vector3;

  export interface ParcourData {
    id?: string;
    name?: string;
    objects?: any[];
  }

  /**
   * A parcour. Model's root object.
   */
  export class Parcour {

    /** Parcour ID (guid). */
    public id: string;

    /** The parcour's name. */
    public name: string;

    /** The parcour's content. */
    private _objects: ParcourObject[] = [];

    /** Gets the objects composing the parcour. */
    get objects() { return this._objects; }

    constructor(data?: ParcourData) {
      if (data) {
        if (data.id) this.id = data.id;
        if (data.name) this.name = data.name;

        if (data.objects) {
          data.objects.forEach(item => {
            if (item instanceof ParcourObject) {
              this._objects.push(item);
            } else {
              let p = ParcourObject.fromObject(item);
              if (!p) {
                throw new Error(`Don't know how to handle an item found in the "objects" array. The item is "${item}"`);
              } else {
                this._objects.push(p);
              }
            }
          });
        }
      }
    }

    /**
     * Creates a deep (independant) copy of the current parcour.
     */
    public clone(): Parcour {

      let copy = new Parcour();

      // Copy properties.
      copy.name = this.name;

      // Clone collections.
      copy._objects = this._objects.map(o => o.clone());

      return copy;
    }

    public toObject(): any {

      return {
        id: this.id,
        name: this.name,
        objects: this._objects.map(o => o.toObject())
      };
    }

    /** 
     * Finds and return a parcour object by its ID.
     * @returns The parcour object having the specified ID or `null` if none can
     * be found.
     */
    public getObjectById(id: string): ParcourObject {
      for (let i = 0; i < this._objects.length; i++) {
        if (id === this._objects[i].id) {
          return this._objects[i];
        }
      }
      return null;
    }

    /**
     * Builds and return an array of all the areas in the current parcour.
     */
    public getAreas(): Area[] {
      let areas: Area[] = [];
      for (let i = 0; i < this._objects.length; i++) {
        let o = this._objects[i];
        if (o instanceof Area) {
          areas.push(o);
        }
      }
      return areas;
    }

    /**
     * Finds the area having the spcified ID 
     * TODO optimize... (ParcourIndex?)
     * @param areaId The area ID.
     */
    public getAreaById(areaId: string): Area {
      return <Area>_.find(this.objects, o => o instanceof Area && o.id === areaId);
    }

    /**
     * Builds and return an array of all the area elements in the current
     * parcour.
     */
    public getAreaElements(): AreaElement[] {
      let elements: AreaElement[] = [];
      for (let i = 0; i < this._objects.length; i++) {
        let o = this._objects[i];
        if (o instanceof AreaElement) {
          elements.push(o);
        }
      }
      return elements;
    }

    /**
     * Builds and return an array of all the area elements composing the
     * specified area (by its ID) in the current parcour.
     */
    public getAreaElementsByAreaId(areaId: string) {
      let elements: AreaElement[] = [];
      for (let i = 0; i < this._objects.length; i++) {
        let o = this._objects[i];
        if (o instanceof AreaElement && o.areaId === areaId) {
          elements.push(o);
        }
      }
      return elements;
    }

    /**
     * Finds and return the area that contains the specified world location.
     * @returns The `Area` that contains the specified world location or `null`.
     */
    public getAreaAtLocation(worldLocation: Vector3): Area {
      let areas = this.getAreas();
      for (let i = 0; i < areas.length; i++) {
        let area = areas[i];
        let bbox = area.getBoundingBox();
        if (bbox.containsPoint(worldLocation)) {
          return area;
        }
      }
      return null;
    }

    public getNeighbourAreas(areaId: string): Area[] {
      let neighbours: Area[] = [];
      let area = this.getObjectById(areaId);
      if (!(area instanceof Area)) throw new Error('Invalid "areaId"');
      let hit = new Vector3();
      let delta = new Vector3();
      function push(n) {
        if (n && neighbours.indexOf(n) === -1) {
          neighbours.push(n);
        }
      }
      // for each border...
      // 1st x0 -> x1 when z = z0
      for (let x = 0; x < area.size.x; x++) {
        delta.set(x + 0.5, 0, -0.5);
        hit.copy(area.location).add(delta);
        push(this.getAreaAtLocation(hit));
      }

      // 2nd x0 -> x1 when z = z1
      for (let x = 0; x < area.size.x; x++) {
        delta.set(x + 0.5, 0, area.size.z + 0.5);
        hit.copy(area.location).add(delta);
        push(this.getAreaAtLocation(hit));
      }

      // 3rd z0 -> z1 when x = x0
      for (let z = 0; z < area.size.z; z++) {
        delta.set(-0.5, 0, z + 0.5);
        hit.copy(area.location).add(delta);
        push(this.getAreaAtLocation(hit));
      }

      // 4thd z0 -> z1 when x = x1
      for (let z = 0; z < area.size.z; z++) {
        delta.set(area.size.x + 0.5, 0, z + 0.5);
        hit.copy(area.location).add(delta);
        push(this.getAreaAtLocation(hit));
      }

      return neighbours;
    }

    /**
     * @param area An area containing a wall.
     * @param wall Wall definition (in area [local] coordinate).
     */
    public getWallElements(area: Area, wall: WallDefinition): WallElement[] {
      let result: WallElement[] = [];

      // TODO This part begs for optimization...

      let worldWall = new WallDefinition(
        wall.origin, wall.orientation, wall.length, wall.height);
      worldWall.origin.add(area.location);

      let wallElements = <WallElement[]> _.filter(this._objects,
        o => o instanceof WallElement);

      let position = new Vector3();
      wallElements.forEach(wallElement => {
        let area = <Area>this.getObjectById(wallElement.areaId);
        position.addVectors(area.location, wallElement.location);
        if (worldWall.contains(position)) {
          result.push(wallElement);
        }
      });

      return result;
    }

    public getAreasByDoorway(doorway: Doorway) {
      let source = this.getAreaById(doorway.areaId);
      let walls = source.getWallDefinitions();
      let wall = _.find(walls, w => w.contains(doorway.location));
      let hitTest = new Vector3();
      hitTest.copy(doorway.location)
        .add(source.location)
        .addScaledVector(wall.orientation.normal, -0.5);
      let destination = this.getAreaAtLocation(hitTest);
      if (destination) {
        return [source, destination];
      } else {
        return [source];
      }
    }

  }

}