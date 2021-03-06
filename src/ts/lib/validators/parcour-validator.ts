/// <reference path="../model/parcour.ts" />
/// <reference path="../model/wall-element.ts" />
/// <reference path="../model/wall-definition.ts" />

/// <reference path="./validation-result.ts" />
/// <reference path="./area-collision-result.ts" />
/// <reference path="./location-misplacement-result.ts" />


namespace PRKR.Validators {
  import Parcour = Model.Parcour;
  import Area = Model.Area;
  import RoomArea = Model.RoomArea
  import Location = Model.Location;
  import WallElement = Model.WallElement;
  import WallDefinition = Model.WallDefinition;
  import Vector3 = THREE.Vector3;
  import Box3 = THREE.Box3;

  export class ParcourValidator {

    public validate(parcour: Parcour): IValidationResult[] {

      if (!parcour) throw new Error('"parcour" can not be null or undefined');

      let results: IValidationResult[] = [];

      this._validateAreas(parcour, results);
      this._validateAreaElements(parcour, results);
      this._validateWallElements(parcour, results);

      this._validateShapedObjects(parcour, results);

      return results;
    }

    /**
     * 
     * @param results Array of validation results to push to.
     */
    private _validateAreas(parcour: Parcour, results: IValidationResult[]) {

      // Look for collisions.
      let areas = parcour.getAreas();
      let collisions: IAreaCollision[] = [];
      for (var i = 0; i < areas.length; i++) {
        for (var j = i + 1; j < areas.length; j++) {
          let areaA = areas[i];
          let boxA = areaA.getBoundingBox();
          let areaB = areas[j];
          let boxB = areaB.getBoundingBox();

          if (boxA.intersectsBox(boxB)) {
            let inter = new Box3();
            inter.copy(boxA).intersect(boxB);

            // Exclude wall "collisions".
            let size = inter.getSize();
            if (size.x > 0 && size.y > 0 && size.z) {

              collisions.push({
                areas: [ areaA, areaB ],
                box: inter
              });

            }
          }

        }
      }

      // Push validation results for each collisions.
      collisions.forEach((collision: IAreaCollision, index: number) => {
        results.push(new AreaCollisionResult(collision));
      });

      // TODO Additional validation.

    }

    private _validateAreaElements(parcour: Parcour, results: IValidationResult[]) {
      let elements = parcour.getAreaElements();
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];

        // Element must have a valid area ID.
        if (element.areaId == null) {
          results.push(
            new ValidationResult(ResultLevel.Error,
            "missing-area-id",
            `AreaElement ${element.id} misses an area ID`));
          break;
        }
        let area = parcour.getObjectById(element.areaId);
        if (!area) {
          results.push(
            new ValidationResult(ResultLevel.Error,
            "invalid-area-id",
            `AreaElement ${element.id} has an invalid area ID, ${element.areaId}`));
          break;
        }
        if (!(area instanceof Area)) {
          results.push(
            new ValidationResult(ResultLevel.Error,
            "not-an-area",
            `AreaElement ${element.id} has an area ID, ${element.areaId}, that refers to a non-area object`));
          break;
        }

        // Element box must be inside its containing area. (not all elements impelement the bounding box).
        let elementBox = parcour.getAreaElementBoundingBox(element); // element.getBoundingBox();
        if (elementBox) {
          let areaBox = area.getBoundingBox();
          if (!areaBox.containsBox(elementBox)) {
            results.push(
              new ValidationResult(ResultLevel.Error,
              'element-box-outside-of-area-box',
              `AreaElement ${ element.id }'s bounding box is not enclosed in its containing area's box`
            ));
          }
        }

        // Element location must be within its containing area's size.
        let areaSize = area.size;
        let location = element.location;
        if (location.x < 0 || location.y < 0 || location.z < 0 ||
            location.x > areaSize.x || location.y > areaSize.y ||
            location.z > areaSize.z) {
          results.push(
            new ValidationResult(ResultLevel.Error,
            "not-an-area",
            `AreaElement ${element.id} has a bounding box that goes outside its containing area`));
        }

        // Location objects can not be on hole tiles.
        if (element instanceof Location && area instanceof RoomArea) {
          let tile = area.getTile(Math.floor(element.location.x), Math.floor(element.location.z));
          if (tile === Model.TileType.Hole) {
            results.push(
              new ValidationResult(ResultLevel.Error,
              'location-on-hole',
            `Location ${ element.id } stands on a tile of type ${ tile }`)
            )
          }
        }
      }
    }

    private _validateWallElements(parcour: Parcour, results: IValidationResult[]) {

      let wallElements = <WallElement[]>_.filter(parcour.objects, o => o instanceof WallElement);

      if (wallElements.length > 0) {

        // Prepare wall definitions.
        let wallsByArea: { [areaId: string]: WallDefinition[] } = {};
        parcour.getAreas().forEach(area => {
          wallsByArea[area.id] = area.getWallDefinitions();
        });

        wallElements.forEach(we => {

          let walls = wallsByArea[we.areaId];
          if (walls.length) {
            let hits = _.filter(walls, w => w.contains(we.location));
            if (hits.length === 0) {
              results.push(
                new ValidationResult(
                  ResultLevel.Error,
                  'doorway-misplacement',
                  'Doorway is not on a wall'
                )
              );
            }
          }

        });
      }
    }

    private _validateShapedObjects(parcour: Parcour, results: IValidationResult[]) {

      let shapedObjects: (Model.StaticObject | Model.DynamicObject)[] =
        <any>parcour.objects.filter(
          o => o instanceof Model.StaticObject || o instanceof Model.DynamicObject);

      shapedObjects.forEach(o => {
        
        if (o.size.x <= 0 || o.size.y <= 0 || o.size.z <= 0) {
          results.push(new ValidationResult(
            ResultLevel.Error,
            'invalid-shaped-object-size',
            `${ o.type } ${ o.id } has an invalid size of [${ o.size.x }, ${ o.size.y },` +
            ` ${ o.size.z }]. One or more of its components is/are negative or zero.`
          ));
        }

      });

    }

    // private _validateLocations(parcour: Parcour, results: IValidationResult[]) {
    //   let objects = parcour.objects;
    //   let locations: Location[] = [];
    //   // Find all the locations.
    //   for (let i = 0; i < objects.length; i++) {
    //     let po = objects[i];
    //     if (po instanceof Location) {
    //       locations.push(po);
    //     }
    //   }

    //   // For each location.
    //   for (let i = 0; i < locations.length; i++) {

    //     let location = locations[i];

    //     // Validate it is in an area.
    //     if (!this._isPointInArea(parcour, location.location)) {
    //       results.push(new LocationMisplacementResult(location));
    //     }

    //     // TODO Additional validations.

    //   }
      
    // }

    // private _isPointInArea(parcour: Parcour, location: Vector3): Model.Area {
    //   let areas = parcour.getAreas();
    //   for(let i = 0; i < areas.length; i++) {
    //     let area = areas[i];
    //     let bbox = area.getBoundingBox();
    //     if (bbox.containsPoint(location)) {
    //       return area;
    //     }
    //   }
    //   return null;
    // }

  }
}