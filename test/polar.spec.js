var expect = chai.expect;

var EPSILON = 1e-6;

describe('Polar', function() {
  it('is defined', function() {
    expect(PRKR.Polar).to.exist;
  });

  it('can be instanciated', function() {
    expect(new PRKR.Polar()).to.exist
      .and.to.be.instanceof(PRKR.Polar);
  }); 

  describe('.theta', function() {
    it('is defined', function() {
      expect(new PRKR.Polar()).to.have.property('length').a('number');
    });

    it('default value is 0', function() {
      var p = new PRKR.Polar();
      expect(p.theta).to.equal(0);
    });

    it('is settable via the constructor', function() {
      var p = new PRKR.Polar(Math.PI, 0);
      expect(p.theta).to.equal(Math.PI);
    });

    it('is settable/gettable', function() {
      var p = new PRKR.Polar();
      p.theta = 1;
      expect(p.theta).to.equal(1);
    });

    it('wraps its value between 0 and 2π (negative direction)', function() {
      var p = new PRKR.Polar();

      p.theta = -Math.PI;
      expect(p.theta).to.be.closeTo(Math.PI, EPSILON);

      p.theta = -3 * Math.PI;
      expect(p.theta).to.be.closeTo(Math.PI, EPSILON);
    });

    it('wraps its value between 0 and 2π (positive direction)', function() {
      var p = new PRKR.Polar();

      p.theta = 3 * Math.PI;
      expect(p.theta).to.be.closeTo(Math.PI, EPSILON);

      p.theta = 5 * Math.PI;
      expect(p.theta).to.be.closeTo(Math.PI, EPSILON);
    });
  });

  describe('.length', function() {
    it('is defined', function() {
      expect(new PRKR.Polar()).to.have.property('length').a('number');
    });

    it('defaut value is 0', function () {
      expect(new PRKR.Polar().length).to.equal(0);
    });

    it('is settable via the constructor', function() {
      expect(new PRKR.Polar(0, 1).length).to.equal(1);
    });

    it('is settable/gettable', function() {
      var p = new PRKR.Polar();
      p.length = 1;
      expect(p.length).to.equal(1);
    });

    it('clamp it\'s value in the positive range', function() {
      var p = new PRKR.Polar();
      p.length = -1;
      expect(p.length).to.equal(0);
    });
  });

  describe('.set', function() {
    it('should exist', function() {
      var p = new PRKR.Polar();
      expect(p).to.respondTo('set');
    });

    it('should allow to set both theta and length in a single call', function() {
      var p = new PRKR.Polar();
      p.set(1, 2);
      expect(p.theta).to.equal(1);
      expect(p.length).to.equal(2);
    });

    it('should return itself', function() {
      var p = new PRKR.Polar();
      expect(p.set(0, 0)).to.equal(p);
    });
  });

  describe('.copy', function() {
    it('should exist', function() {
      expect(new PRKR.Polar()).to.respondTo('copy');
    });

    it('should copy another Polar\'s values', function() {
      var source = new PRKR.Polar(1, 2);
      var p = new PRKR.Polar();
      p.copy(source);
      expect(p.theta).to.equal(source.theta);
      expect(p.length).to.equal(source.length);
    });

    it('should return itself', function() {
      var source = new PRKR.Polar(1, 2);
      var p = new PRKR.Polar();
      expect(p.copy(source)).to.equal(p);
    });
  });

  describe('.toString', function() {
    it('is defined', function() {
      expect(new PRKR.Polar()).to.respondTo('toString');
    });

    it('result should contain type name', function() {
      expect(new PRKR.Polar(1, 2).toString()).to.contain('Polar');
    });

    it('result should contain theta\'s value', function() {
      expect(new PRKR.Polar(1, 2).toString()).to.contain('1');
    });

    it('result should contain length\'s value', function() {
      expect(new PRKR.Polar(1, 2).toString()).to.contain('2');
    });    
  });
});