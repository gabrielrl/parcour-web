var PRKR;
(function (PRKR) {
    var Tests;
    (function (Tests) {
        var expect = chai.expect;
        var Parcour = PRKR.Model.Parcour;
        var RoomArea = PRKR.Model.RoomArea;
        var Doorway = PRKR.Model.Doorway;
        var ParcourValidator = PRKR.Validators.ParcourValidator;
        var ResultLevel = PRKR.Validators.ResultLevel;
        var Vector3 = THREE.Vector3;
        describe('ParcourValidator', function () {
            it('is defined', function () {
                expect(ParcourValidator).to.exist;
            });
            it('can be instanciated', function () {
                expect(new ParcourValidator()).to.exist
                    .and.to.be.instanceof(ParcourValidator);
            });
            describe('.validate()', function () {
                it('is defined', function () {
                    expect(new ParcourValidator()).to.have.property('validate').a('function');
                });
                it('has nothing to report on an empty parcour', function () {
                    var results = new ParcourValidator().validate(new Parcour());
                    expect(results).to.exist.and.be.empty;
                });
                describe('area validation', function () {
                    describe('collision detection', function () {
                        it('ignores contiguous areas', function () {
                            var parcour = new Parcour();
                            var size = new Vector3(2, 2, 2);
                            var objects = parcour.objects;
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
                            var validator = new ParcourValidator();
                            var results = validator.validate(parcour);
                            expect(results).to.exist.and.be.empty;
                        });
                        it('reports area collisions', function () {
                            var parcour = new Parcour();
                            var objects = parcour.objects;
                            objects.push(new RoomArea({
                                size: new Vector3(2, 2, 2),
                                location: new Vector3()
                            }));
                            objects.push(new RoomArea({
                                size: new Vector3(2, 2, 2),
                                location: new Vector3(1, 1, 1)
                            }));
                            var validator = new ParcourValidator();
                            var results = validator.validate(parcour);
                            expect(results).to.not.be.empty;
                            expect(results.length).to.equal(1);
                            var result = results[0];
                            expect(result.level).to.equal(ResultLevel.Error);
                            expect(result.code).to.equal('area-collision'); // TODO extract
                            expect(result).to.be.instanceof(PRKR.Validators.AreaCollisionResult);
                            var collisionResult = result;
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
                describe('doorway validation', function () {
                    it('report doorways that are not placed on walls', function () {
                        var parcour = new Parcour();
                        var objects = parcour.objects;
                        var area = new RoomArea({
                            size: new Vector3(2, 2, 2),
                            location: PRKR.M.Vector3.Zero
                        });
                        var doorway = new Doorway({
                            areaId: area.id,
                            location: new Vector3(1, 0, 1)
                        });
                        objects.push(area, doorway);
                        var validator = new ParcourValidator();
                        var result = validator.validate(parcour);
                        expect(result.length).to.be.greaterThan(0);
                        // TODO MORE VALIDATIONS
                        // TODO NEEDS A CUSTOM VALIDATION ERROR TYPE.
                        // ...
                    });
                    it('doesn\'t complain if a doorway is on a wall', function () {
                        var parcour = new Parcour();
                        var objects = parcour.objects;
                        var area = new RoomArea({
                            size: new Vector3(2, 2, 2),
                            location: PRKR.M.Vector3.Zero
                        });
                        var doorway = new Doorway({
                            areaId: area.id,
                            location: new Vector3(0.5, 0, 0)
                        });
                        objects.push(area, doorway);
                        var validator = new ParcourValidator();
                        var result = validator.validate(parcour);
                        expect(result).to.have.lengthOf(0);
                    });
                });
            });
        });
    })(Tests = PRKR.Tests || (PRKR.Tests = {}));
})(PRKR || (PRKR = {}));

//# sourceMappingURL=parcour-validator.spec.js.map
