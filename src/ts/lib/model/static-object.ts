namespace PRKR.Model {
  
  export interface StaticObjectData extends AreaElementData {
    // TODO...
    // shape, size
  }

  export class StaticObject extends AreaElement {

    constructor(data?: StaticObjectData) {
      super(data);


    }

    // Override.
    public clone() {
      let clone = new StaticObject();
      clone._copy(this);
      return clone;
    }

    // Override.
    public toObject() {
      let o: any = { $type: 'StaticObject' };
      _.extend(o, {
        id: this.id,
        areaId: this.areaId,
        location: this.location.toArray(),
        // ...
      });
      return o;
    }

    // Override
    protected _copy(source: StaticObject) {
      super._copy(source);
      // ...
    }
  }
}