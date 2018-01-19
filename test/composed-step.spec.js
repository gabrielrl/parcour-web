(function() {
'use strict';

var expect = chai.expect;

var Parcour = PRKR.Model.Parcour;
var EditStep = PRKR.Editor.EditSteps.EditStep;
var ComposedStep = PRKR.Editor.EditSteps.ComposedStep;
var AggregateResult = PRKR.Editor.EditSteps.AggregateResult;

function FakeStep () {
  this.doCallCount = 0;
  this.undoCallCount = 0;
  this.parcour = null;
  this.result = null;
  this.undoData = null;

  var _nextDirtyId = 0;

  this.do = function _do(parcour) {
    this.doCallCount++;
    this.parcour = parcour;
    this.result = this._buildResult();
    return this.result;
  };

  this.undo = function _undo(parcour, data) {
    this.undoCallCount++;
    this.parcour = parcour;
    this.undoData = data;
    this.result = this._buildResult();
    return this.result;
  }

  this.reset = function _reset() {
    this.doCallCount = 0;
    this.undoCallCount = 0;
    this.result = null;
    this.undoData = null;
    this.parcour = null;
  }

  this._buildResult = function __buildResult() {
    var id = _nextDirtyId++;

    return {
      dirtyIds: [ id ],
      data: { },
      ts: new Date()
    };
  }
}

describe('ComposedStep', function() {

  it('is defined', function() {
    expect(ComposedStep).to.exist;
  });

  describe('constructor', function() {
    it('throws on missing first parameter', function() {
      expect(function() { new ComposedStep() }).to.throw(Error);
      expect(function() { new ComposedStep(null) }).to.throw(Error);      
    });


  });

  describe('.do()', function() {
    it('should call all the sub steps', function() {
      var parcour = new Parcour();
      var steps = [];
      steps.push(new FakeStep());
      steps.push(new FakeStep());

      var composed = new ComposedStep(steps);

      var result = composed.do(parcour);

      expect(steps[0].doCallCount).to.equal(1);
      expect(steps[0].parcour).to.equal(parcour);
      expect(steps[0].undoCallCount).to.equal(0);
      expect(steps[1].doCallCount).to.equal(1);
      expect(steps[1].undoCallCount).to.equal(0);
    });

    it('should return an aggregate result', function() {
      var parcour = new Parcour();
      var steps = [];
      steps.push(new FakeStep());
      steps.push(new FakeStep());

      var composed = new ComposedStep(steps);

      var result = composed.do(parcour);

      expect(result).to.be.instanceof(AggregateResult);
      
      var dirtyIds = result.dirtyIds;
      expect(dirtyIds).to.be.a('Array');

      var data = result.data;
      expect(data).to.be.a('Array');
      expect(data.length).to.equal(steps.length);

      for (var i = 0; i < steps.length; i++) {
        for (var j = 0; j < steps[i].result.dirtyIds.length; j++) {
          expect(dirtyIds).to.contain(steps[i].result.dirtyIds[j]);
        }
        expect(data[i]).to.equal(steps[i].result.data);
      }

    });

  });

  describe('.undo()', function() {
    it('should call all the sub steps', function() {
      var parcour = new Parcour();
      var steps = [];
      steps.push(new FakeStep());
      steps.push(new FakeStep());

      var composed = new ComposedStep(steps);

      var data = {};

      var result = composed.undo(parcour, data);

      expect(steps[0].doCallCount).to.equal(0);
      expect(steps[0].undoCallCount).to.equal(1);
      expect(steps[1].doCallCount).to.equal(0);
      expect(steps[1].undoCallCount).to.equal(1);

      // TODO result assertions...
      
    });

    it('should return an aggregate result', function() {
      var parcour = new Parcour();
      var steps = [];
      steps.push(new FakeStep());
      steps.push(new FakeStep());

      var composed = new ComposedStep(steps);
    });
  });
});

})();