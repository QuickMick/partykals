/**
 * Implement a single particle in the particles system.
 * Author: Ronen Ness.
 * Since: 2019.
 */
const THREE = require("three");
const Utils = require("./utils");

const TMP1 = new THREE.Vector3(0, 0, 0);
const TMP2 = new THREE.Vector3(0, 0, 0);

const TMP_COLOR = new THREE.Color(1, 1, 1);

/**
 * A single particle metadata in the particles system.
 * We attach this to the particle's vertices when in system's geometry.
 */
class Particle {
  /**
   * Create the particle.
   * @param {ParticlesSystem} system The particles system this particle belongs to.
   */
  constructor(system) {
    this.system = system;
    /*  this.velocity = null;
    this.acceleration = null; // optional
    this.position = null;
    this.startColor = null;
    this.endColor = null;
    this.gravityX = 0;
    this.gravityY = 0;
    this.gravityZ = 0;
    this.age = 0;
    this.finished = false;
    this.ttl = null;
    this.alpha = null;
    this.startAlpha = null;
    this.endAlpha = null;
    this.startAlphaChangeAt = null;
    this.startColorChangeAt = null;
    this.startSizeChangeAt = null;
    this.startWorldPosition = null;
    this.onUpdate = null;*/

    this.reset();
  }

  /**
   * Reset the particle.
   */
  reset() {
    const options = this.system.options.particles;

    // reset particle age and if alive
    this.age = 0;
    this.finished = false;

    // store gravity force
    this.gravityX = options.gravityX;
    this.gravityY = options.gravityY || options.gravity;
    this.gravityZ = options.gravityZ;

    // particle's velocity and velocity bonus
    this.velocity = getConstOrRandomVector(this.velocity, options.velocity);

    if (options.velocityBonus) {
      this.velocity.add(options.velocityBonus);
    }

    // particle's acceleration.
    this.acceleration = getConstOrRandomVector(this.acceleration, options.acceleration, true);

    // starting offset
    this.position = getConstOrRandomVector(this.position, options.offset);
    // if there is a bound object, we take its position as start
    // if (this.system.boundObject) {
    //   this.position = this.position.add(this.system.boundObject.position);
    // }
    // set particle's ttl
    this.ttl = Utils.getRandomWithSpread(options.ttl || 1, options.ttlExtra) || 1;

    // set per-particle alpha
    this.alpha = this.startAlpha = this.endAlpha = null;
    this.startAlphaChangeAt = (options.startAlphaChangeAt || 0) / this.ttl;
    if (options.fade) {
      // const alpha throughout particle's life?
      if (options.alpha !== undefined) {
        this.alpha = Utils.randomizerOrValue(options.alpha);
      }
      // shifting alpha?
      else {
        this.startAlpha = Utils.randomizerOrValue(options.startAlpha);
        this.endAlpha = Utils.randomizerOrValue(options.endAlpha);
      }
    }

    // set per-particle coloring
    this.colorize = Boolean(options.colorize);
    this.color = this.startColor = this.endColor = null;
    this.startColorChangeAt = (options.startColorChangeAt || 0) / this.ttl;
    if (this.colorize) {
      // const color throughout particle's life?
      if (options.color) {
        this.color = getConstOrRandomColor(this.color, options.color);
      }
      // shifting color?
      else {
        this.startColor = getConstOrRandomColor(this.startColor, options.startColor);
        this.endColor = getConstOrRandomColor(this.endColor, options.endColor);
      }
    }

    // set per-particle size
    this.size = this.startSize = this.endSize = null;
    this.startSizeChangeAt = (options.startSizeChangeAt || 0) / this.ttl;
    if (options.scaling) {
      // const size throughout particle's life?
      if (options.size !== undefined) {
        this.size = Utils.randomizerOrValue(options.size);
      }
      // shifting size?
      else {
        this.startSize = Utils.randomizerOrValue(options.startSize);
        this.endSize = Utils.randomizerOrValue(options.endSize);
      }
    }

    // set per-particle rotation
    this.rotation = this.rotationSpeed = null;
    if (options.rotating) {
      this.rotation = Utils.randomizerOrValue(options.rotation || 0);
      this.rotationSpeed = Utils.randomizerOrValue(options.rotationSpeed || 0);
    }

    // used to keep constant world position
    this.startWorldPosition = null;

    // store on-update callback, if defined
    this.onUpdate = options.onUpdate;

    // call custom spawn method
    if (options.onSpawn) {
      options.onSpawn(this);
    }
  }

  /**
   * Update the particle (call this every frame).
   * @param {*} index Particle index in system.
   * @param {*} deltaTime Update delta time.
   */
  update(index, deltaTime) {
    // if finished, skip
    if (this.finished) {
      return;
    }

    // is it first update call?
    const firstUpdate = this.age === 0;

    // do first-update stuff
    if (firstUpdate) {
      // if its first update and use world position, store current world position
      if (this.system.options.particles.worldPosition) {
        this.startWorldPosition = this.system.getWorldPosition();
      }

      // set constant alpha
      if (this.alpha !== null || this.startAlpha !== null) {
        this.system.setAlpha(index, this.alpha || this.startAlpha);
      }

      // set constant color
      if (this.color !== null || this.startColor !== null) {
        this.system.setColor(index, this.color || this.startColor);
      }

      // set constant size
      if (this.size !== null || this.startSize !== null) {
        this.system.setSize(index, this.size || this.startSize);
      }

      // set start rotation
      if (this.rotation !== null) {
        this.system.setRotation(index, this.rotation);
      }
    }
    // do normal updates
    else {
      // set animated color
      if (this.startColor && this.age >= this.startColorChangeAt) {
        this.system.setColor(
          index,
          Utils.lerpColors(
            this.startColor,
            this.endColor,
            this.startColorChangeAt
              ? (this.age - this.startColorChangeAt) / (1 - this.startColorChangeAt)
              : this.age,
            TMP_COLOR
          )
        );
      }

      // set animated alpha
      if (this.startAlpha != null && this.age >= this.startAlphaChangeAt) {
        this.system.setAlpha(
          index,
          Utils.lerp(
            this.startAlpha,
            this.endAlpha,
            this.startAlphaChangeAt
              ? (this.age - this.startAlphaChangeAt) / (1 - this.startAlphaChangeAt)
              : this.age
          )
        );
      }

      // set animated size
      if (this.startSize != null && this.age >= this.startSizeChangeAt) {
        this.system.setSize(
          index,
          Utils.lerp(
            this.startSize,
            this.endSize,
            this.startSizeChangeAt
              ? (this.age - this.startSizeChangeAt) / (1 - this.startSizeChangeAt)
              : this.age
          )
        );
      }
    }

    // set animated rotation
    if (this.rotationSpeed) {
      this.rotation += this.rotationSpeed * deltaTime;
      this.system.setRotation(index, this.rotation);
    }

    // update position
    if (this.velocity) {
      // add gravity force
      if (this.gravityX) this.velocity.x += this.gravityX * deltaTime;
      if (this.gravityY) this.velocity.y += this.gravityY * deltaTime;
      if (this.gravityZ) this.velocity.z += this.gravityZ * deltaTime;

      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.position.z += this.velocity.z * deltaTime;
    }
    let positionToSet = TMP1.set(this.position.x, this.position.y, this.position.z);

    // to maintain world position
    if (this.startWorldPosition) {
      const systemPos = this.system.getWorldPosition(TMP2); // returns TMP2
      systemPos.sub(this.startWorldPosition);
      positionToSet = positionToSet.sub(systemPos);
    }

    // set position in system
    // be aware, that positionToSet is a temp-vector at this point,
    // so do not store it anywhere
    this.system.setPosition(index, positionToSet);

    // update velocity
    if (this.acceleration && this.velocity) {
      this.velocity.x += this.acceleration.x * deltaTime;
      this.velocity.y += this.acceleration.y * deltaTime;
      this.velocity.z += this.acceleration.z * deltaTime;
    }

    // update age. note: use ttl as factor, so that age is always between 0 and 1
    this.age += deltaTime / this.ttl;

    // call custom methods
    if (this.onUpdate) {
      this.onUpdate(this);
    }

    // is done? set as finished and continue to set final state
    if (this.age > 1) {
      this.age = 1;
      this.finished = true;
    }
  }

  /**
   * Get particle's world position.
   */
  get worldPosition() {
    return this.system.getWorldPosition().add(this.position);
  }
}

/**
 * Return either the value of a randomizer, a const value, or a default empty or null.
 */
function getConstOrRandomVector(target, constValOrRandomizer, returnNullIfUndefined) {
  target = target || new THREE.Vector3();
  if (!constValOrRandomizer) return returnNullIfUndefined ? null : target.set(0, 0, 0);
  if (constValOrRandomizer.generate) return constValOrRandomizer.generate(target);
  return target.copy(constValOrRandomizer);
}

/**
 * Return either the value of a randomizer, a const value, or a default empty or null.
 */
function getConstOrRandomColor(target, constValOrRandomizer, returnNullIfUndefined) {
  target = target || new THREE.Color();
  if (!constValOrRandomizer) return returnNullIfUndefined ? null : target.setRGB(1, 1, 1);
  if (constValOrRandomizer.generate) return constValOrRandomizer.generate(target);
  return target.copy(constValOrRandomizer);
}

module.exports = Particle;
