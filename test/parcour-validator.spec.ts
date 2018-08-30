namespace PRKR.Tests {

  var expect = chai.expect;

  import Parcour = Model.Parcour;
  import RoomArea = Model.RoomArea;
  import TileType = Model.TileType;
  import Doorway = Model.Doorway;
  import Location = Model.Location;
  import LocationKind = Model.LocationKind;
  import ParcourValidator = Validators.ParcourValidator;
  import ResultLevel = Validators.ResultLevel;
  import Vector3 = THREE.Vector3;

  describe('ParcourValidator', function() {
    it('is defined', function() {
      expect(ParcourValidator).to.exist;
    });

    it('can be instanciated', function() {
      expect(new ParcourValidator()).to.exist
        .and.to.be.instanceof(ParcourValidator);
    });

    describe('.validate()', function() {
      it('is defined', function() {
        expect(new ParcourValidator()).to.have.property('validate').a('function');
      });

      it('has nothing to report on an empty parcour', function() {
        var results = new ParcourValidator().validate(new Parcour());
        expect(results).to.exist.and.be.empty;
      });

      describe('area validation', function() {

        describe('collision detection', function() {

          it('ignores contiguous areas', function() {
            let parcour = new Parcour();
            let size = new Vector3(2, 2, 2);
            let objects = parcour.objects;
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(0, 0, 0)
            }));
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(2, 0, 0)
            }));
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(0, 0, 2)
            }));
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(2, 0, 2)
            }));
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(0, 2, 0)
            }));
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(2, 2, 0)
            }));
            objects.push(new RoomArea({
              size: size,
              location: new Vector3(0, 2, 2)
            }));
             objects.push(new RoomArea({
              size: size,
              location: new Vector3(2, 2, 2)
            }));

            let validator = new ParcourValidator();
            let results = validator.validate(parcour);

            expect(results).to.exist.and.be.empty;     
          });

          it('reports area collisions', function() {
            let parcour = new Parcour();
            let objects = parcour.objects;
            objects.push(new RoomArea({
              size: new Vector3(2, 2, 2),
              location: new Vector3()
            }));
            objects.push(new RoomArea({
              size: new Vector3(2, 2, 2),
              location: new Vector3(1, 1, 1)
            }));

            let validator = new ParcourValidator();
            let results = validator.validate(parcour);

            expect(results).to.not.be.empty;
            expect(results.length).to.equal(1);
            var result = results[0];
            expect(result.level).to.equal(ResultLevel.Error);
            expect(result.code).to.equal('area-collision'); // TODO extract
            expect(result).to.be.instanceof(PRKR.Validators.AreaCollisionResult);
            let collisionResult = <PRKR.Validators.AreaCollisionResult>result;
            var collision = collisionResult.collision;
            expect(collision).to.not.be.null;
            expect(collision.areas).to.not.be.empty;
            expect(collision.areas).to.contain(parcour.objects[0]);
            expect(collision.areas).to.contain(parcour.objects[1]);
            expect(collision.box).to.not.be.null;
            expect(collision.box.min.x).to.equal(1);
            expect(collision.box.min.y).to.equal(1);
            expect(collision.box.min.z).to.equal(1);
            expect(collision.box.max.x).to.equal(2);
            expect(collision.box.max.y).to.equal(2);
            expect(collision.box.max.z).to.equal(2);
          });

        });

      });

      // describe('room validation', function() {
      //   it('')
      // });

      describe('doorway validation', function() {
        it('report doorways that are not placed on walls', function() {
          let parcour = new Parcour();
          let objects = parcour.objects;
          let area = new RoomArea({
            size: new Vector3(2, 2, 2),
            location: M.Vector3.Zero
          });
          let doorway = new Doorway({
            areaId: area.id,
            location: new Vector3(1, 0, 1)
          });
          objects.push(area, doorway);

          let validator = new ParcourValidator();
          let result = validator.validate(parcour);

          expect(result.length).to.be.greaterThan(0);

          // TODO MORE VALIDATIONS
          // TODO NEEDS A CUSTOM VALIDATION ERROR TYPE.
          // ...

        });

        it('doesn\'t complain if a doorway is on a wall', function() {
          let parcour = new Parcour();
          let objects = parcour.objects;
          let area = new RoomArea({
            size: new Vector3(2, 2, 2),
            location: M.Vector3.Zero
          });
          let doorway = new Doorway({
            areaId: area.id,
            location: new Vector3(0.5, 0, 0)
          });
          objects.push(area, doorway);

          let validator = new ParcourValidator();
          let result = validator.validate(parcour);

          expect(result).to.have.lengthOf(0);
        });
      });

      describe('location validation', () => {
        it('reports locations that are on hole tiles', () => {

          let parcour = new Parcour();
          let objects = parcour.objects;
          let area = new RoomArea({
            size: new Vector3(3, 3, 3),
            location: M.Vector3.Zero,
            tiles: [
              [],
              [ TileType.Floor, TileType.Hole, TileType.Floor ],
              []
            ]
          });
          let location = new Location({
            areaId: area.id,
            location: new Vector3(1.5, 0, 1.5),
            kind: LocationKind.Start
          });
          objects.push(area, location);

          let validator = new ParcourValidator();
          let result = validator.validate(parcour);

          expect(result.length).to.be.greaterThan(0);

          // TODO MORE VALIDATIONS
          // TODO NEEDS A CUSTOM VALIDATION ERROR TYPE.
          // ...

        });

        it('reports nothing for a location on a floor tile', () => {

          let parcour = new Parcour();
          let objects = parcour.objects;
          let area = new RoomArea({
            size: new Vector3(3, 3, 3),
            location: M.Vector3.Zero,
            tiles: [
              [],
              [ TileType.Floor, TileType.Floor, TileType.Floor ],
              []
            ]
          });
          let location = new Location({
            areaId: area.id,
            location: new Vector3(1, 0, 1),
            kind: LocationKind.Start
          });
          objects.push(area, location);

          let validator = new ParcourValidator();
          let result = validator.validate(parcour);

          expect(result).to.have.lengthOf(0);

          // TODO MORE VALIDATIONS
          // TODO NEEDS A CUSTOM VALIDATION ERROR TYPE.
          // ...

        });


      });

    });

  });
}