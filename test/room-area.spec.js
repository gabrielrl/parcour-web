(function(){
var expect = chai.expect;

var Parcour = PRKR.Model.Parcour;
var RoomArea = PRKR.Model.RoomArea;

describe('RoomArea', function() {
  it('is defined', function() {
    expect(RoomArea).to.exist;
  });

  describe('constructor (with data)', function() {

    var id;
    var location;
    var size;
    var room;

    beforeEach(function() {
      id = PRKR.Utils.uuid();
      location = new THREE.Vector3(1, 2, 3);
      size = new THREE.Vector3(4, 5, 6);
      room = new RoomArea({
        id: id,
        location: location,
        size: size
      });
    });

    it('allows to set `id`', function() {
      expect(room.id).to.equal(id);
    });
    
    it('allows to set `location`', function() {
      expect(room.location.equals(location)).to.be.true;
    });

    it('allows to set `size`', function() {
      expect(room.size.equals(size)).to.be.true;
    });
  });

  describe('.getBoundingBox()', function() {

    it('is defined', function() {
      expect(new RoomArea()).to.have.property('getBoundingBox').a('Function');      
    });

    it('accounts for room definition', function() {
      var room = new RoomArea({
        size: new THREE.Vector3(1, 2, 3)
      });
      var box = room.getBoundingBox();
      expect(box).to.be.instanceof(THREE.Box3);
      expect(box.min.x).to.equal(0);
      expect(box.min.y).to.equal(0);
      expect(box.min.z).to.equal(0);
      expect(box.max.x).to.equal(1);
      expect(box.max.y).to.equal(2);
      expect(box.max.z).to.equal(3);
    });

    it('accounts for room location', function() {
      var room = new RoomArea({
        size: new THREE.Vector3(1, 2, 3),
        location: new THREE.Vector3(4, 5, 6)
      });
      var box = room.getBoundingBox();
      expect(box).to.be.instanceof(THREE.Box3);
      expect(box.min.x).to.equal(4);
      expect(box.min.y).to.equal(5);
      expect(box.min.z).to.equal(6);
      expect(box.max.x).to.equal(5);
      expect(box.max.y).to.equal(7);
      expect(box.max.z).to.equal(9);
    });
  });

  describe('.clone()', function() {
    it('should work', function() {
      var room = new RoomArea({
        location: new THREE.Vector3(1, 2, 3),
        size: new THREE.Vector3(4, 5, 6)
      });

      var clone = room.clone();
      expect(clone).to.be.instanceof(RoomArea);
      expect(clone).not.to.equal(room);
      expect(clone.location.x).to.equal(1);
      expect(clone.location.y).to.equal(2);
      expect(clone.location.z).to.equal(3);
      expect(clone.size.x).to.equal(4);
      expect(clone.size.y).to.equal(5);
      expect(clone.size.z).to.equal(6);
    });
  });

  describe('.toObject()', function() {
    it('is defined', function() {
      expect(new RoomArea().toObject).to.exist.and.to.be.a('Function');
    });

    describe('on an empty instance, it should', function() {

      var roomArea;
      var dataObject;

      beforeEach(function() {
        roomArea = new RoomArea({
          name: 'test room area',
          location: new THREE.Vector3(1, 2, 3),
          size: new THREE.Vector3(4, 5, 6)
        });
        dataObject = roomArea.toObject();
      });

      it('declare correct $type', function() {
        expect(dataObject).to.have.property('$type').equal('RoomArea');
      });

      it('declare the `ID`', function() {
        expect(dataObject).to.have.property('id').equal(roomArea.id);
      });

      it('declare the `name`', function() {
        expect(dataObject).to.have.property('name').equal(roomArea.name);
      });

      it('declare the `location`', function() {
        expect(dataObject.location)
          .to.have.ordered.members(roomArea.location.toArray());
      });

      it('declare the `size`', function() {
        expect(dataObject.size)
          .to.have.ordered.members(roomArea.size.toArray());
      });

    });
  });

  describe('.toJson()', function() {
    it('is defined', function() {
      expect(new RoomArea().toJson).to.exist.and.to.be.a('Function');
    });

    it('works as expected', function() {
      let room = new RoomArea({
        name: 'the first room',
        size: new THREE.Vector3(1, 2, 3),
        location: new THREE.Vector3(4, 5, 6)
      });
      let roomObj = room.toObject();
      let roomJson = room.toJson();
      console.debug('roomJson=', roomJson);
      expect(roomJson).to.equal(JSON.stringify(roomObj));
    });
  });
});

})();