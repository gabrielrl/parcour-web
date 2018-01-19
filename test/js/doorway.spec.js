/// <reference path="../src/ts/defs/prkr-editor.bundle.d.ts" />
var PRKR;
(function (PRKR) {
    var Tests;
    (function (Tests) {
        var Doorway = PRKR.Model.Doorway;
        var expect = chai.expect;
        describe('Doorway', function () {
            it('has a default constructor', function () {
                var d = new Doorway();
                expect(d).not.to.be.null;
                expect(d.id).not.to.be.null;
                expect(d.id).not.to.be.empty;
            });
            describe('constructor (with data)', function () {
                var id;
                var areaId;
                var location;
                var doorway;
                beforeEach(function () {
                    id = PRKR.Utils.uuid();
                    areaId = PRKR.Utils.uuid();
                    location = new THREE.Vector3(1, 2, 3);
                    doorway = new Doorway({
                        id: id,
                        areaId: areaId,
                        location: location
                    });
                });
                it('allows to set `id`', function () {
                    expect(doorway.id).to.equal(id);
                });
                it('allows to set `areaId`', function () {
                    expect(doorway.areaId).to.equal(areaId);
                });
                it('allows to set `location`', function () {
                    expect(doorway.location.equals(location)).to.be.true;
                });
            });
            describe('.toObject()', function () {
                it('is defined', function () {
                    expect(new Doorway().toObject).to.be.a('Function');
                });
                describe('used on an empty object, it', function () {
                    var doorway;
                    var doorwayObject;
                    beforeEach(function () {
                        doorway = new Doorway();
                        doorwayObject = doorway.toObject();
                    });
                    it('declares the type', function () {
                        expect(doorwayObject)
                            .to.have.property('$type').equal('Doorway');
                    });
                    it('declares the size', function () {
                        expect(doorwayObject.size)
                            .to.have.ordered.members([0, 0]);
                    });
                    it('declares the `areaId`', function () {
                        expect(doorwayObject)
                            .to.have.property('id')
                            .equal(doorway.id);
                    });
                    it('declares the `location`', function () {
                        expect(doorwayObject)
                            .to.have.property('location')
                            .which.has.ordered.members([0, 0, 0]);
                    });
                    it('declares the `id`', function () {
                        expect(doorwayObject)
                            .to.have.property('id')
                            .which.equals(doorwayObject.id);
                    });
                });
            });
            describe('.toJson()', function () {
                it('is defined', function () {
                    expect(new Doorway())
                        .to.have.property('toJson')
                        .a('Function');
                });
                it('works as expected', function () {
                    var doorway = new Doorway({
                        areaId: PRKR.Utils.uuid(),
                        location: new THREE.Vector3(1, 2, 3),
                        size: new THREE.Vector2(2, 4)
                    });
                    expect(doorway.toJson())
                        .to.equal(JSON.stringify(doorway.toObject()));
                });
            });
        });
    })(Tests = PRKR.Tests || (PRKR.Tests = {}));
})(PRKR || (PRKR = {}));

//# sourceMappingURL=doorway.spec.js.map
