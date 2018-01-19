var expect = chai.expect;

describe('M', function() {
  it('should be defined', function() {
    expect(PRKR.M).to.exist;
  });

  describe('.wrappedDiff', function() {
    it('should be defined', function() {
      expect(PRKR.M.wrappedDiff).to.exist.and.to.be.a('function');
    });

    it('should return the standard difference if it is the smallest', function() {
      expect(PRKR.M.wrappedDiff(3, 2, 0, 10)).to.equal(3 - 2);
      expect(PRKR.M.wrappedDiff(1, 0, 0, 10)).to.equal(1 - 0);
      expect(PRKR.M.wrappedDiff(10, 9, 0, 10)).to.equal(10 - 9);
      expect(PRKR.M.wrappedDiff(9, 8, 0, 10)).to.equal(9 - 8);

      expect(PRKR.M.wrappedDiff(2, 3, 0, 10)).to.equal(2 - 3);
      expect(PRKR.M.wrappedDiff(0, 2, 0, 10)).to.equal(0 - 2);
      expect(PRKR.M.wrappedDiff(10, 8, 0, 10)).to.equal(10 - 8);
      expect(PRKR.M.wrappedDiff(9, 7, 0, 10)).to.equal(9 - 7);
    });

    it('should return wrapped difference if is the smallest', function() {
      // Note: 11 is equivalent to 1 when wrapping around [0, 10] and it is
      // closer to 9 than one so the shortest path to 1 from 9 is 11 - 9 = 2
      expect(PRKR.M.wrappedDiff(1, 9, 0, 10)).to.equal(11 - 9);
      expect(PRKR.M.wrappedDiff(0, 8, 0, 10)).to.equal(10 - 8);
      
      expect(PRKR.M.wrappedDiff(9, 1, 0, 10)).to.equal(9 - 11);
      expect(PRKR.M.wrappedDiff(10, 2, 0, 10)).to.equal(10 - 12);
    });

    it('should return 0 when used with "low" and "high"', function() {
      expect(PRKR.M.wrappedDiff(10, 0, 0, 10)).to.equal(0);
      expect(PRKR.M.wrappedDiff(0, 10, 0, 10)).to.equal(0);
    });

  });

  describe('.clamp', function() {
    it('should be defined', function() {
      expect(PRKR.M.clamp).to.exist.and.to.be.a('function');
    });

    it('should return the original number if in range', function() {
      expect(PRKR.M.clamp(1, 0, 2)).to.equal(1);
      expect(PRKR.M.clamp(0, 0, 2)).to.equal(0);
      expect(PRKR.M.clamp(2, 0, 2)).to.equal(2);
    });

    it('should return the lowest bound if value is below', function() {
      expect(PRKR.M.clamp(1, 5, 10)).to.equal(5);
      expect(PRKR.M.clamp(2.5, 5, 10)).to.equal(5);
      expect(PRKR.M.clamp(4, 5, 10)).to.equal(5);
    });

    it('should return the highest bound if value is above', function() {
      expect(PRKR.M.clamp(12.5, 5, 10)).to.equal(10);
      expect(PRKR.M.clamp(15, 5, 10)).to.equal(10);
      expect(PRKR.M.clamp(100, 5, 10)).to.equal(10);
    });
    
  });
});