namespace PRKR.Utils {

  import Color = THREE.Color;

  /**
   * Converts an hsv trio to a `THREE.Color` object.
   * Algorithm from https://www.rapidtables.com/convert/color/hsv-to-rgb.html
   * @param h Hue value in radian, Assumed to be from 0 to 2pi.
   * @param s Saturation, from 0 to 1.
   * @param v Value (brightness-ish) from 0 to 1.
   * @param optionalTarget Optional Color object to set value
   */
  export function colorFromHsv(h: number, s: number, v: number, optionalTarget?: Color): Color {

    let c = v * s;

    let x = c * (1 - Math.abs( ((h / 1.0471975512 /* 60° */) % 2 - 1 ) ));
    let m = v - c;

    let rPrim, gPrim, bPrim;
    if (h < 1.0471975512 /* 60° */) {
      rPrim = c;
      gPrim = x;
      bPrim = 0;
    } else if (h < 2.0943951024 /* 120° */) {
      rPrim = x;
      gPrim = c;
      bPrim = 0;
    } else if (h < 3.1415926536 /* 180° */) {
      rPrim = 0;
      gPrim = c;
      bPrim = x;
    } else if (h < 4.1887902048 /* 240° */) {
      rPrim = 0;
      gPrim = x;
      bPrim = c;
    } else if (h < 5.235987756 /* 300° */) {
      rPrim = x;
      gPrim = 0;
      bPrim = c;
    } else /* < 360° */ {
      rPrim = c;
      gPrim = 0;
      bPrim = x;
    }

    let color = optionalTarget || new Color();
    
    color.setRGB(
      rPrim + m,
      gPrim + m,
      bPrim + m
    );

    return color;
  }
}