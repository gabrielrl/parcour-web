/// <reference path="../src/ts/defs/prkr.bundle.d.ts" />

namespace PRKR.Tests {
  import ParcourObject = PRKR.Model.ParcourObject;
  import ParcourObjectData = PRKR.Model.ParcourObjectData;
  import RoomArea = PRKR.Model.RoomArea;
  import Doorway = PRKR.Model.Doorway;
  import uuid = PRKR.Utils.uuid;

  let expect = chai.expect;

  describe('ParcourObject', function() {

    describe('.fromObject()', function() {
      it('is defined', function() {
        expect(ParcourObject)
          .to.have.property('fromObject').a('Function');
      });

      it('throws if data is null', function() {
        expect(function() {
          ParcourObject.fromObject(null);
        }).to.throw();
      });

      it('throws if data is empty', function() {
        expect(function() {
          ParcourObject.fromObject({});
        }).to.throw();
      });

      it('allow to instantiate a `RoomArea`', function() {
        let data = {
          $type: 'RoomArea',
          id: uuid(),
          location: [1, 2, 3],
          size: [4, 5, 6]
        };
        let instance = ParcourObject.fromObject(data);
        expect(instance).to.be.instanceof(RoomArea);
        let room = <RoomArea>instance;
        expect(room.id).to.equal(data.id);
        expect(room.location.toArray()).to.have.ordered.members(data.location);
        expect(room.size.toArray()).to.have.ordered.members(data.size);
      });

      it('allow to instantiate a `Doorway`', function() {
        let data = {
          $type: 'Doorway',
          id: uuid(),
          areaId: uuid(),
          location: [1, 2, 3],
          size: [4, 5]
        };
        let instance = ParcourObject.fromObject(data);
        expect(instance).to.be.instanceof(Doorway);
        let doorway = <Doorway>instance;
        expect(doorway.id).to.equal(data.id);
        expect(doorway.areaId).to.equal(data.areaId);
        expect(doorway.location.toArray()).to.have.ordered.members(data.location);
        expect(doorway.size.toArray()).to.have.ordered.members(data.size);
      });
      
    });

  });
}