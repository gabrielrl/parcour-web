namespace PRKR.Model {

  export interface Property {

    /** Property (inner) name. */
    name: string;

    /** Property's display text. */
    display: string;

    /** Property's additional information. */
    info: string;

    /** Property's data type (JavaScript/TypeScript type name). */
    type: string;

    /** Editor type. */
    editor: string;

    /** Minimal value (if applicable). */
    min?: number;

    /** Maximal value (if applicable). */
    max?: number;

    /** Available options (if applicable). */
    options?: PropertyOption[];

    /** Getter for the property's value. */
    getValue(target: any): any;

    /** Optional setter for the property's value. */
    setValue?(target: any, value: any): void; 

  }
}