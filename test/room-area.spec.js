(function(){
'use strict';

var expect = chai.expect;

var Parcour = PRKR.Model.Parcour;
var RoomArea = PRKR.Model.RoomArea;
var TileType = PRKR.Model.TileType;

describe('RoomArea', function() {
  it('is defined', function() {
    expect(RoomArea).to.exist;
  });

  describe('constructor (with data)', function() {

    var id;
    var location;
    var size;
    var tiles;
    var room;

    beforeEach(function() {
      id = PRKR.Utils.uuid();
      location = new THREE.Vector3(1, 2, 3);
      size = new THREE.Vector3(4, 5, 6);
      tiles = [
        [ TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Hole,  TileType.Floor ],
        [ TileType.Floor, TileType.Floor, TileType.Floor, TileType.Hole,  TileType.Floor, TileType.Floor ],
        [ TileType.Floor, TileType.Floor, TileType.Hole,  TileType.Floor, TileType.Floor, TileType.Floor ],
        [ TileType.Floor, TileType.Hole,  TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor ]
      ];
      room = new RoomArea({
        id: id,
        location: location,
        size: size,
        tiles: tiles
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

    it('allows to set tile types', function() {
      expect(room.getTile(0, 1)).to.equal(TileType.Floor);
      expect(room.getTile(0, 4)).to.equal(TileType.Hole);
      expect(room.getTile(1, 3)).to.equal(TileType.Hole);
      expect(room.getTile(2, 2)).to.equal(TileType.Hole);
      expect(room.getTile(3, 1)).to.equal(TileType.Hole);
      expect(room.getTile(3, 4)).to.equal(TileType.Floor);
      
    });
  });
  
  describe('.getTile(x, z), setTile(x, z, tile)', function() {

    it('are defined', function() {
      expect(new RoomArea()).to.have.property('getTile').a('Function').of.length(2);
      expect(new RoomArea()).to.have.property('setTile').a('Function').of.length(3);
    });

    it('`getTile` returns `TileType.Floor` by default', function() {
      expect(new RoomArea().getTile(0, 0)).to.equal(TileType.Floor);
    });

    describe('`getTile` works after a call to `setTile`', function() {

      let set = [[0, 0], [0, 2], [2, 0], [1, 1]];

      set.forEach(function(coords) {
        it('at ' + JSON.stringify(coords), function() {
          let room = new RoomArea();
          room.setTile(coords[0], coords[1], TileType.Hole);
          let tile = room.getTile(coords[0], coords[1]);
          expect(tile).to.equal(TileType.Hole);
        });
      });

    });

    // it('`getTile` works after a call to `setTile`', function() {

    //   let room = new RoomArea();
    //   room.setTile(0, 0, TileType.Hole);
    //   let tile = room.getTile(0, 0);
    //   expect(tile).to.equal(TileType.Hole);
      
    // });
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
        roomArea = new RoomArea();
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

      it('declare the `tiles`', function() {
        expect(dataObject).to.have.property('tiles');
      });

    });

    describe('on a configured instance, it should', function() {

      var roomArea;
      var dataObject;

      beforeEach(function() {
        roomArea = new RoomArea({
          name: 'test room area',
          location: new THREE.Vector3(1, 2, 3),
          size: new THREE.Vector3(4, 5, 6),
          tiles: [
            [ TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor, TileType.Hole,  TileType.Floor ],
            [ TileType.Floor, TileType.Floor, TileType.Floor, TileType.Hole,  TileType.Floor, TileType.Floor ],
            [ TileType.Floor, TileType.Floor, TileType.Hole,  TileType.Floor, TileType.Floor, TileType.Floor ],
            [ TileType.Floor, TileType.Hole,  TileType.Floor, TileType.Floor, TileType.Floor, TileType.Floor ]
          ]
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

      it('declare the `tiles`', function() {
        expect(dataObject).to.have.property('tiles').an('Array').of.length(roomArea.size.x);
        dataObject.tiles.forEach(function (row, x) {
          expect(row).to.be.an('Array').of.length(roomArea.size.z);
          row.forEach(function (tile, z) {
            expect(tile).to.equal(roomArea.getTile(x, z));
          });
        });
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