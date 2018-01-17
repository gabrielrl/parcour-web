/// <reference path="../model/room-area.ts" />

namespace PRKR.Builders {

  import Face3 = THREE.Face3;
  import Vector3 = THREE.Vector3;
  import WallDefinition = PRKR.Model.WallDefinition;
  import WallElement = PRKR.Model.WallElement;

  export class RoomGeometryBuilder {
    constructor(
      private _model: PRKR.Model.RoomArea,
      private _parcour: PRKR.Model.Parcour) { }

    public getGeometry(): THREE.Geometry {

      let g = new THREE.Geometry();
      let size = this._model.size;
      let w = size.x;
      let h = size.y;
      let d = size.z;
      let t = Model.Constants.WallThickness / 2;

      // FLOOR LEVEL
      let V = THREE.Vector3;
      let vertices = g.vertices;
      vertices.push(new V(t, 0, t));
      vertices.push(new V(w - t, 0, t));
      vertices.push(new V(w - t, 0, d - t));
      vertices.push(new V(t, 0, d - t));

      // ROOF LEVEL
      vertices.push(new V(t, h, t));
      vertices.push(new V(w - t, h, t));
      vertices.push(new V(w - t, h, d - t));
      vertices.push(new V(t, h, d - t));

      let faces = g.faces;      

      // The walls...
      let walls = this._model.getWallDefinitions();
      walls.forEach(wall => {

        let line = wall.getLine();
        let lineSizeRatio = 1 / wall.length;
        // restrict min and max in the wall's direction.
        // to account for neighour walls thickness.
        let minPp = t * lineSizeRatio;
        let maxPp = (wall.length - t) * lineSizeRatio;

        // Build an array of wall segments.
        // TODO refactor to use _getWallSegments(wall)
        let segments: WallSegment[] = [];

        // Find wall elements related to that wall...
        let elements = this._parcour.getWallElements(this._model, wall);
        if (elements.length === 0) {
          // If there are none, push a single wall segment that covers the
          // whole wall.
          segments.push({ begin: 0, end: 1, low: 0});          
        } else {
          // If there are some wall elements.          
          let metaElements: MetaWallElement[];
          let buildMetaElement = (element: PRKR.Model.WallElement) => {
            // Compute local location
            let localLocation: THREE.Vector3;
            if (element.areaId === this._model.id) {
              localLocation = element.location;
            } else {
              // Convert to local coordinates.
              let otherArea = <PRKR.Model.Area>this._parcour.getObjectById(element.areaId);
              localLocation = new V();
              localLocation.copy(element.location)
                .add(otherArea.location)
                .sub(this._model.location);
            }

            // Compute wall line location.
            let lineLocation: number = line.closestPointToPointParameter(localLocation);

            return {
              element: element,
              localLocation: localLocation,
              lineLocation: lineLocation
            }
          };
          metaElements = elements.map(buildMetaElement);

          let orderedElements = _.orderBy(metaElements, me => me.lineLocation);

          if (orderedElements.length > 0) {
            let currentBegin = 0;
            orderedElements.forEach(metaElement => {
              let element = metaElement.element;
              let lineLocation = metaElement.lineLocation;

              let halfWidth = element.width * lineSizeRatio / 2;
              let elementBegin = Math.max(lineLocation - halfWidth, minPp);
              let elementEnd = Math.min(lineLocation + halfWidth, maxPp);

              if (elementBegin <= currentBegin) {
                console.debug('Skipping a wall elements because it overlaps the previous one');
              } else {
                segments.push({
                  begin: currentBegin,
                  end: elementBegin,
                  low: 0
                });
                segments.push({
                  begin: elementBegin,
                  end: elementEnd,
                  low: element.height
                });
                currentBegin = elementEnd;
              }
            });          
            segments.push({
              begin: currentBegin,
              end: 1,
              low: 0
            })
          }
        }

        // console.debug('segments:', segments);

        segments.forEach(segment => {
          
            // Get start position.
            function getPointLocation(
              pointParameter: number, height: number
            ) {
              // restrict min and max in the wall's direction.
              // to account for neighour walls thickness.
              if (pointParameter <= minPp) {
                pointParameter = minPp;
              } else if (pointParameter >= maxPp) {
                pointParameter = maxPp;
              }              
              let p = line.at(pointParameter);
              // offset away from wall in the normal's direction.
              p.addScaledVector(wall.orientation.normal, t);
              p.y = height;
              return p;
            }

            let beginLow = getPointLocation(segment.begin, segment.low)
            let beginHigh = getPointLocation(segment.begin, wall.height);

            let endLow = getPointLocation(segment.end, segment.low);
            let endHigh = getPointLocation(segment.end, wall.height);

            let v0 = g.vertices.length;
            // TODO Enhance... lots of duplicate vertices.
            g.vertices.push(beginLow, beginHigh, endHigh, endLow);

            g.faces.push(new Face3(v0 + 1, v0 + 3, v0 + 2));
            g.faces.push(new Face3(v0 + 3, v0 + 1, v0));

        });

      });

      // FLOOR FACES
      faces.push(new Face3(0, 2, 1));
      faces.push(new Face3(2, 0, 3));

      g.computeFaceNormals();
      g.computeBoundingBox(); 

      return g;
    }

    public getPysicsWalls(): WallDefinition[] {
      let result: WallDefinition[] = [];

      let walls = this._model.getWallDefinitions();
      walls.forEach(wall => {
        let line = wall.getLine();
        let origin = new Vector3();
        this._getWallSegments(wall).forEach(segment => {

          // Get start position.
          function getPointLocation(
            pointParameter: number, height: number
          ) {
            let p = line.at(pointParameter);
            p.y = height;
            return p;
          }

          let beginLow = getPointLocation(segment.begin, segment.low)
          let beginHigh = getPointLocation(segment.begin, wall.height);

          let endLow = getPointLocation(segment.end, segment.low);
          let endHigh = getPointLocation(segment.end, wall.height);

          line.at(segment.begin, origin);
          origin.setY(segment.low);
          let def = new WallDefinition(
            origin,
            wall.orientation,
            (segment.end - segment.begin) * wall.length,
            wall.height - segment.low
          );
          result.push(def);
        });

      });

      return result;
    }

    private _getWallSegments(wall: WallDefinition): WallSegment[] {
      let segments: WallSegment[] = [];
      let line = wall.getLine();
      let lineSizeRatio = 1 / wall.length;

      // Find wall elements related to that wall...
      let elements = this._parcour.getWallElements(this._model, wall);
      if (elements.length === 0) {
        // If there are none, push a single wall segment that covers the
        // whole wall.
        segments.push({ begin: 0, end: 1, low: 0});          
      } else {
        let metaElements = elements.map((e) => this._buildMetaElement(e, line));
        let orderedElements = _.orderBy(metaElements, me => me.lineLocation);

        if (orderedElements.length > 0) {
          let currentBegin = 0;
          orderedElements.forEach(metaElement => {
            let element = metaElement.element;
            let lineLocation = metaElement.lineLocation;
            let halfWidth = element.width * lineSizeRatio / 2;              
            let elementBegin = Math.max(lineLocation - halfWidth, 0);
            let elementEnd = Math.min(lineLocation + halfWidth, 1);

            if (elementBegin <= currentBegin) {
              console.debug('Skipping a wall elements because it overlaps the previous one');
            } else {
              segments.push({
                begin: currentBegin,
                end: elementBegin,
                low: 0
              });
              segments.push({
                begin: elementBegin,
                end: elementEnd,
                low: element.height
              });
              currentBegin = elementEnd;
            }
          });
          segments.push({
            begin: currentBegin,
            end: 1,
            low: 0
          });
        }
      }
      return segments;
    }
    
    private _buildMetaElement(element: WallElement, line: THREE.Line3) {
      // Compute local location
      let localLocation: THREE.Vector3;
      if (element.areaId === this._model.id) {
        localLocation = element.location;
      } else {
        // Convert to local coordinates.
        let otherArea = <PRKR.Model.Area>this._parcour.getObjectById(element.areaId);
        localLocation = new Vector3();
        localLocation.copy(element.location)
          .add(otherArea.location)
          .sub(this._model.location);
      }

      // Compute wall line location.
      let lineLocation: number = line.closestPointToPointParameter(localLocation);

      return {
        element: element,
        localLocation: localLocation,
        lineLocation: lineLocation
      }
    }
  }

  interface WallSegment {
    begin: number;
    end: number;
    low: number;
  }

  interface MetaWallElement {
    element: PRKR.Model.WallElement,
    localLocation: THREE.Vector3,
    lineLocation: number
  }
}