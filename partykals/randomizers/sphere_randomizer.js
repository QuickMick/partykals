/**
 * Generate vectors within a 3d sphere.
 * Author: Ronen Ness.
 * Since: 2019.
 */
const THREE = require("three");
const Randomizer = require("./randomizer");
const Utils = require("../utils");

const MIN_VEC = new THREE.Vector3(-1, -1, -1);
const MAX_VEC = new THREE.Vector3(1, 1, 1);

// random between -1 and 1.
function randMinusToOne() {
  return Math.random() * 2 - 1;
}

/**
 * Sphere vector randomizer.
 */
class SphereRandomizer extends Randomizer {
  /**
   * Create the sphere randomizer from radius and optional scaler.
   */
  constructor(maxRadius, minRadius, scaler, minVector, maxVector) {
    super();
    this.maxRadius = maxRadius || 1;
    this.minRadius = minRadius || 0;
    this.scaler = scaler;
    this.minVector = minVector;
    this.maxVector = maxVector;
  }

  /**
   * Generate a random vector.
   */
  generate(target) {
    target = target || new THREE.Vector3();

    // create random vector
    target.set(randMinusToOne(), randMinusToOne(), randMinusToOne());

    // clamp values
    if (this.minVector || this.maxVector) {
      target.clamp(this.minVector || MIN_VEC, this.maxVector || MAX_VEC);
    }

    // normalize and multiply by radius
    target.normalize().multiplyScalar(Utils.getRandomBetween(this.minRadius, this.maxRadius));

    // apply scaler
    if (this.scaler) {
      target.multiply(this.scaler);
    }
    return target;
  }
}

// export the randomizer class
module.exports = SphereRandomizer;
