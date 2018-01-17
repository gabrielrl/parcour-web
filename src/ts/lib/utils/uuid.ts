namespace PRKR.Utils {

  /** Generates a uuid. return it as a string. */
  export function uuid() {
    function b(a?: string): string {
      if (a) {
        let n = parseInt(a);
        return ( n ^ Math.random() * 16 >> n / 4).toString(16)
      } else {
        return ('' + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
      }        
    }
    return b();
  }
}