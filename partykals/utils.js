/**
 * Implement a single particle in the particles system.
 * Author: Ronen Ness.
 * Since: 2019.
 */
const THREE = require("three");

module.exports = {
  /**
   * Returns a random number between min (inclusive) and max (exclusive)
   */
  getRandomBetween: function (min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Get random between baseVal and baseVal + extraRandom.
   * If 'extraRandom' is not defined, will just return baseVal.
   * If baseVal is not defined, will return white.
   */
  getRandomWithSpread: function (baseVal, extraRandom) {
    if (!extraRandom) {
      return baseVal;
    }
    return this.getRandomBetween(baseVal, baseVal + extraRandom);
  },

  /**
   * Get random between two colors.
   * If 'colMax' is not defined, will just return colMin or white color if not defined.
   */
  getRandomColorBetween: function (colMin, colMax, target) {
    target = target || new THREE.Color();
    if (!colMax) {
      return colMin ? target.copy(colMin) : target.setRGB(0, 0, 0);
    }
    return target.setRGB(
      this.getRandomBetween(colMin.r, colMax.r),
      this.getRandomBetween(colMin.g, colMax.g),
      this.getRandomBetween(colMin.b, colMax.b)
    );
  },

  /**
   * Get random between two vectors.
   * If 'vecMax' is not defined, will just return vecMin or zero point if not defined.
   */
  getRandomVectorBetween: function (vecMin, vecMax, target) {
    target = null;
    target = target || new THREE.Vector3();
    if (!vecMax) {
      return vecMin ? target.copy(vecMin) : target.set(0, 0, 0);
    }
    return target.set(
      this.getRandomBetween(vecMin.x, vecMax.x),
      this.getRandomBetween(vecMin.y, vecMax.y),
      this.getRandomBetween(vecMin.z, vecMax.z)
    );
  },

  /**
   * Lerp between two colors, returning a new color without changing any of them.
   */
  lerpColors: function (colA, colB, alpha, target) {
    target = target || new THREE.Color();
    return target.copy(colA).lerp(colB, alpha);
  },

  /**
   * Lerp between two numbers.
   */
  lerp: function (x, y, alpha) {
    return x * (1 - alpha) + y * alpha;
  },

  /**
   * Get const numeric value or generate random value from randomizer.
   */
  randomizerOrValue: function (val) {
    return (val.generate ? val.generate() : val) || 0;
  }
};
