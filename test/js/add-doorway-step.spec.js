/// <reference path="../src/ts/defs/prkr-editor.bundle.d.ts" />
// (function() {
var PRKR;
(function (PRKR) {
    var Tests;
    (function (Tests) {
        var expect = chai.expect;
        describe('AddDoorwayStep', function () {
            it('is defined', function () {
                expect(PRKR.Editor.EditSteps)
                    .to.have.property('AddDoorwayStep')
                    .a('Function');
            });
            // NOT SURE THIS CAN BE VALID.
            // describe('without parameters on an empty parcour', function() {
            //   let step: AddDoorwayStep;
            //   let parcour: Parcour;
            //   let result: StepResult;
            //   beforeEach(function() {
            //     step = new AddDoorwayStep();
            //     parcour = new Parcour();
            //     result = step.do(parcour);
            //   });
            //   it('adds a doorway to it', function() {
            //     expect(parcour.objects).to.have.lengthOf(1);
            //     expect(parcour.objects[0]).to.be.instanceof(Doorway);
            //     expect(parcour.objects[0].id).not.to.be.null;
            //     expect(parcour.objects[0].id).not.to.equal('');
            //   });
            //   it('returns the appropriate "StepResult"', function() {
            //     expect(result.dirtyIds).to.have.lengthOf(1);
            //     expect(result.dirtyIds[0]).to.equal(parcour.objects[0].id);
            //   });
            //   it('can be undone', function() {
            //     let doorway = parcour.objects[0];
            //     let undoResult = step.undo(parcour, result.data);
            //     expect(parcour.objects).to.be.empty;
            //     expect(undoResult.dirtyIds).to.have.lengthOf(1);
            //     expect(undoResult.dirtyIds[0]).to.equal(doorway.id);
            //   });
            // });
            // NEVER VALID ON AN EMPTY PARCOUR. IT NEEDS A ROOM.
            // describe('with parameters on an empty parcour', function() {
            //   let data: DoorwayData = {
            //     areaId: 'area-id',
            //     location: new THREE.Vector3(1, 2, 3)
            //   }
            //   let step: AddDoorwayStep;
            //   let parcour: Parcour;
            //   let result: StepResult;
            //   beforeEach(function() {
            //     step = new AddDoorwayStep(data);
            //     parcour = new Parcour();
            //     result = step.do(parcour);
            //   });
            //   it('adds a Doorway object to the parcour', function () {
            //     expect(parcour.objects).to.have.lengthOf(1);
            //     expect(parcour.objects[0]).to.be.instanceof(Doorway);        
            //   })
            //   it('with the appropriate data', function() {
            //     let doorway = <Doorway>parcour.objects[0];
            //     expect(doorway.areaId).to.equal(data.areaId);
            //     expect(doorway.location.equals(data.location)).to.be.true;
            //   });
            //   it('can be undone', function() {
            //     let doorway = parcour.objects[0];
            //     let undoResult = step.undo(parcour, result.data);
            //     expect(parcour.objects).to.be.empty;
            //     expect(undoResult.dirtyIds).to.have.lengthOf(1);
            //     expect(undoResult.dirtyIds[0]).to.equal(doorway.id);
            //   });
            // });
        });
    })(Tests = PRKR.Tests || (PRKR.Tests = {}));
})(PRKR || (PRKR = {}));
// })(); 

//# sourceMappingURL=add-doorway-step.spec.js.map
