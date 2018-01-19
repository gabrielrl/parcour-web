namespace PRKR.Tests {
  import Parcour = PRKR.Model.Parcour;

  let expect = chai.expect;

  describe('Parcour', function() {

    let parcour;

    beforeEach(function() {
      parcour = new Parcour();
    });

    describe('constructor (with data)', function() {

      it('allows to set the name', function() {
        let name = "new parcour";
        let p = new Parcour({ name: name });
        expect(p.name).to.equal(name);
      });

      it('allow to specify a doorway object', function() {
        let doorway = new PRKR.Model.Doorway();
        let p = new Parcour({ objects: [ doorway ] });
        expect(p.objects).to.contain(doorway);
      });

      it('allows to specify a doorway object (using a data object)', function() {
        let doorway = new PRKR.Model.Doorway();
        let data = doorway.toObject();
        let p = new Parcour({ objects: [ data ]});
        let result = _.find(p.objects, o => o.id === doorway.id);
        expect(result).to.be.ok;
        expect(result.name).to.equal(doorway.name);
      });


      it('allow to specify a room area object', function() {
        let room = new PRKR.Model.RoomArea();
        let p = new Parcour({ objects: [ room ] });
        expect(p.objects).to.contain(room);
      });

      it('allows to specify a room area object (using a data object)', function() {
        let room = new PRKR.Model.RoomArea();
        let data = room.toObject();
        let p = new Parcour({ objects: [ data ]});
        let result = _.find(p.objects, o => o.id === room.id);
        expect(result).to.be.ok;
        expect(result.name).to.equal(room.name);
      });



      
    });

    describe('.toObject()', function() {
      it('is defined', function() {
        expect(new Parcour())
          .to.have.property('toObject').a('Function');
      });

      describe('used on an empty object, it', function() {
        let parcourObject: any;

        beforeEach(function() {
          parcourObject = parcour.toObject();
        });

        it('declares the `name`', function() {
          expect(parcourObject)
            .to.have.property('name').which.equals(parcour.name);
        });

        it('declares an empty object array', function() {
          expect(parcourObject)
            .to.have.property('objects')
            .members([]);
        });
      });

      describe('used on a filled object, it', function() {
        let parcourObject: any;
        beforeEach(function() {
          parcour = new Parcour();
          parcour.name = 'A test parcour';
          parcour.objects.push(new PRKR.Model.RoomArea());
          parcour.objects.push(new PRKR.Model.Doorway());
          parcourObject = parcour.toObject();
        });

        it('declares the `name`', function() {
          expect(parcourObject)
            .to.have.property('name').which.equals(parcour.name);
        });

        it('declares an object array', function() {
          expect(parcourObject).to.have.property('objects');
          expect(_.isArray(parcourObject.objects)).to.be.true;
          expect(parcourObject.objects.length).to.equal(parcour.objects.length);
          parcourObject.objects.forEach(o => {
            expect(o).to.have.property('$type');
            expect(o).to.have.property('id');
          });
        });
      });
    });

  });
}