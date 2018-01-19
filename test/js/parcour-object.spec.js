/// <reference path="../src/ts/defs/prkr.bundle.d.ts" />
var PRKR;
(function (PRKR) {
    var Tests;
    (function (Tests) {
        var ParcourObject = PRKR.Model.ParcourObject;
        var RoomArea = PRKR.Model.RoomArea;
        var Doorway = PRKR.Model.Doorway;
        var uuid = PRKR.Utils.uuid;
        var expect = chai.expect;
        describe('ParcourObject', function () {
            describe('.fromObject()', function () {
                it('is defined', function () {
                    expect(ParcourObject)
                        .to.have.property('fromObject').a('Function');
                });
                it('throws if data is null', function () {
                    expect(function () {
                        ParcourObject.fromObject(null);
                    }).to.throw();
                });
                it('throws if data is empty', function () {
                    expect(function () {
                        ParcourObject.fromObject({});
                    }).to.throw();
                });
                it('allow to instantiate a `RoomArea`', function () {
                    var data = {
                        $type: 'RoomArea',
                        id: uuid(),
                        location: [1, 2, 3],
                        size: [4, 5, 6]
                    };
                    var instance = ParcourObject.fromObject(data);
                    expect(instance).to.be.instanceof(RoomArea);
                    var room = instance;
                    expect(room.id).to.equal(data.id);
                    expect(room.location.toArray()).to.have.ordered.members(data.location);
                    expect(room.size.toArray()).to.have.ordered.members(data.size);
                });
                it('allow to instantiate a `Doorway`', function () {
                    var data = {
                        $type: 'Doorway',
                        id: uuid(),
                        areaId: uuid(),
                        location: [1, 2, 3],
                        size: [4, 5]
                    };
                    var instance = ParcourObject.fromObject(data);
                    expect(instance).to.be.instanceof(Doorway);
                    var doorway = instance;
                    expect(doorway.id).to.equal(data.id);
                    expect(doorway.areaId).to.equal(data.areaId);
                    expect(doorway.location.toArray()).to.have.ordered.members(data.location);
                    expect(doorway.size.toArray()).to.have.ordered.members(data.size);
                });
            });
        });
    })(Tests = PRKR.Tests || (PRKR.Tests = {}));
})(PRKR || (PRKR = {}));

//# sourceMappingURL=parcour-object.spec.js.map
