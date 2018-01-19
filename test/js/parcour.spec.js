var PRKR;
(function (PRKR) {
    var Tests;
    (function (Tests) {
        var Parcour = PRKR.Model.Parcour;
        var expect = chai.expect;
        describe('Parcour', function () {
            var parcour;
            beforeEach(function () {
                parcour = new Parcour();
            });
            describe('constructor (with data)', function () {
                it('allows to set the name', function () {
                    var name = "new parcour";
                    var p = new Parcour({ name: name });
                    expect(p.name).to.equal(name);
                });
                it('allow to specify a doorway object', function () {
                    var doorway = new PRKR.Model.Doorway();
                    var p = new Parcour({ objects: [doorway] });
                    expect(p.objects).to.contain(doorway);
                });
                it('allows to specify a doorway object (using a data object)', function () {
                    var doorway = new PRKR.Model.Doorway();
                    var data = doorway.toObject();
                    var p = new Parcour({ objects: [data] });
                    var result = _.find(p.objects, function (o) { return o.id === doorway.id; });
                    expect(result).to.be.ok;
                    expect(result.name).to.equal(doorway.name);
                });
                it('allow to specify a room area object', function () {
                    var room = new PRKR.Model.RoomArea();
                    var p = new Parcour({ objects: [room] });
                    expect(p.objects).to.contain(room);
                });
                it('allows to specify a room area object (using a data object)', function () {
                    var room = new PRKR.Model.RoomArea();
                    var data = room.toObject();
                    var p = new Parcour({ objects: [data] });
                    var result = _.find(p.objects, function (o) { return o.id === room.id; });
                    expect(result).to.be.ok;
                    expect(result.name).to.equal(room.name);
                });
            });
            describe('.toObject()', function () {
                it('is defined', function () {
                    expect(new Parcour())
                        .to.have.property('toObject').a('Function');
                });
                describe('used on an empty object, it', function () {
                    var parcourObject;
                    beforeEach(function () {
                        parcourObject = parcour.toObject();
                    });
                    it('declares the `name`', function () {
                        expect(parcourObject)
                            .to.have.property('name').which.equals(parcour.name);
                    });
                    it('declares an empty object array', function () {
                        expect(parcourObject)
                            .to.have.property('objects')
                            .members([]);
                    });
                });
                describe('used on a filled object, it', function () {
                    var parcourObject;
                    beforeEach(function () {
                        parcour = new Parcour();
                        parcour.name = 'A test parcour';
                        parcour.objects.push(new PRKR.Model.RoomArea());
                        parcour.objects.push(new PRKR.Model.Doorway());
                        parcourObject = parcour.toObject();
                    });
                    it('declares the `name`', function () {
                        expect(parcourObject)
                            .to.have.property('name').which.equals(parcour.name);
                    });
                    it('declares an object array', function () {
                        expect(parcourObject).to.have.property('objects');
                        expect(_.isArray(parcourObject.objects)).to.be.true;
                        expect(parcourObject.objects.length).to.equal(parcour.objects.length);
                        parcourObject.objects.forEach(function (o) {
                            expect(o).to.have.property('$type');
                            expect(o).to.have.property('id');
                        });
                    });
                });
            });
        });
    })(Tests = PRKR.Tests || (PRKR.Tests = {}));
})(PRKR || (PRKR = {}));

//# sourceMappingURL=parcour.spec.js.map
