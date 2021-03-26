/**
 * Implement basic particles system.
 * Author: Ronen Ness.
 * Since: 2019.
 */
const THREE = require("three");
const Particle = require("./particle");
const ParticlesMaterial = require("./material/material");

const Randomizers = require("./randomizers");
const Emitter = require("./emitter");

const NULL_ARRAY = [];

const BLENDING_OPTIONS = {
  opaque: THREE.NoBlending,
  additive: THREE.AdditiveBlending,
  multiply: THREE.MultiplyBlending,
  blend: THREE.NormalBlending
};

// to check if value is defined
function defined(val) {
  return val !== undefined && val !== null;
}

/**
 * deep-copies the settings,
 * and replaces the objects that have a "moduleType"
 * value with the appropriate class from partykals.
 *
 * a object, that can be replaced must look like
 * { moduleType:"e.g. ColorsRandomizer", values:[optional parameters]}
 *
 * @param {Object} object
 * @returns the copied object
 */
function copyFromJSON(object, resources) {
  if (!object) return object; // can either be 0, undefined, null, "" -> we do not care anyways

  if (typeof object !== "object") {
    return object;
  }

  if (Array.isArray(object)) {
    const result = [];
    for (let i = 0; i < object.length; i++) {
      result.push(copyFromJSON(object[i], resources));
    }
    return result;
  }

  // if object, create a new object and
  // copy all sub values
  if (!object.moduleType) {
    const result = {};
    for (let key in object) {
      result[key] = copyFromJSON(object[key], resources);
    }
    return result;
  }

  if (object.moduleType === "texture") {
    return resources[object.params[0]];
  }

  // if we need to convert to object
  const C = THREE[object.moduleType] || Randomizers[object.moduleType];
  return new C(...(object.params || NULL_ARRAY));
}

/**
 * Particles system.
 */
class ParticlesSystem {
  /**
   * Create particles system.
   * @param {*} options Particles options.
   * @param {THREE.Object3D} options.container Container to add particles system to.
   *
   * // PARTICLES OPTIONS
   * ============================================================================
   * @param {*} options.particles Particle-related options.
   *
   * // PARTICLES TTL
   * @param {Number} options.particles.ttl How long, in seconds, every particle lives.
   * @param {Number} options.particles.ttlExtra If provided, will add random numbers from 0 to ttlExtra to particle's ttl.
   *
   * // PARTICLES FADING / ALPHA
   * @param {Boolean} options.particles.alpha Per-particle constant alpha; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.startAlpha Particles starting opacity; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.endAlpha Particles ending opacity; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.startAlphaChangeAt Will only start shifting alpha when age is over this value; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   *
   * // PARTICLES GROWING / SIZE
   * @param {Number} options.particles.size Per-particle constant size; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.startSize Particles starting size; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.endSize Particles ending size; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.startSizeChangeAt Will only start shifting size when age is over this value; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   *
   * // PARTICLES COLORING
   * @param {THREE.Color} options.particles.color Per-particle constant color; either a constant value (THREE.Color) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {THREE.Color} options.particles.startColor Starting color min value; either a constant value (THREE.Color) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {THREE.Color} options.particles.endColor Ending color min value; either a constant value (THREE.Color) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.startColorChangeAt Will only start shifting color when age is over this value; either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   *
   * // PARTICLES ACCELERATION
   * @param {THREE.Vector3} options.particles.acceleration Particles acceleration; either a constant value (THREE.Vector3) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.gravity Gravity force affecting the particles.
   *
   * // PARTICLES ROTATION
   * @param {Number} options.particles.rotation Per-particle rotation (only works with texture); either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {Number} options.particles.rotationSpeed Particles rotation speed (only works with texture); either a constant value (Number) or a Partykals.Randomizers.Randomizer instance to create random values.
   *
   * // PARTICLES VELOCITY
   * @param {*} options.particles.velocity Particles starting velocity; either a constant value (THREE.Vector3) or a Partykals.Randomizers.Randomizer instance to create random values.
   * @param {THREE.Vector3} options.particles.velocityBonus Velocity value to add to all particles after randomizing velocity.
   *
   * // PARTICLES OFFSET
   * @param {THREE.Vector3} options.particles.offset Particles offset from system's center; either a constant value (THREE.Vector3) or a Partykals.Randomizers.Randomizer instance to create random values.
   *
   * // PARTICLE GLOBALS
   * @param {Boolean} options.particles.worldPosition If true, particles will maintain their world position after spawn even if the system moves.
   * @param {Number} options.particles.globalSize Const size for all particles. Note: this is more efficient than setting per-particle size property.
   * @param {Number} options.particles.globalColor Global color to affect all particles. Note: this is more efficient than setting per-particle color property.
   * @param {String} options.particles.blending Particles blending mode (opaque / blend / additive).
   * @param {THREE.Texture} options.particles.texture Particle's texture to use.
   *
   * // CUSTOM CALLBACKS
   * @param {Function} options.particles.onUpdate Optional method to call per-particle every update frame.
   * @param {Function} options.particles.onSpawn Optional method to call per-particle every time a particle spawns (after everything is set).
   *
   * // SYSTEM OPTIONS
   * ============================================================================
   * @param {*} options.system System-related options.
   * @param {Number} options.system.particlesCount Particles count.
   * @param {Number} options.system.ttl How long, in seconds, the particle system lives.
   * @param {Number} options.system.speed Speed factor to affect all particles and emitting. Note: the only thing this don't affect is system's ttl.
   * @param {Function} options.system.onUpdate Optional method to call every update frame.
   * @param {Partykals.Emitter} options.system.emitters A single emitter or a list of emitters to attach to this system.
   * @param {Boolean} options.system.perspective If true, will scale particles based on distance from camera.
   * @param {Number} options.system.scale Overall system scale when in perspective mode (if perspective=false, will be ignored). A good value is between 400 and 600.
   * @param {Boolean} options.system.depthWrite Should we perform depth write? (default to true).
   * @param {Boolean} options.system.depthTest Should we perform depth test? (default to true).
   */
  constructor(options) {
    // use bindObject, to set these values
    // then particle system follows the passed object
    this.boundObject = null;
    this.lockBoundRotation = true;
    // optional event-handler
    this.onFinish = null;
    // optional event-handler
    this.onUpdate = null;

    // store options
    options.particles = options.particles || { worldPosition: true };
    options.system = options.system || {};
    this.options = options;

    // get particle options
    const pOptions = options.particles;

    // do some internal cheating to replace const size with global size
    if (typeof options.particles.size === "number") {
      console.warn(
        "Note: replaced 'size' with 'globalSize' property since its more efficient and provided size value was constant anyway."
      );
      options.particles.globalSize = options.particles.size;
      delete options.particles.size;
    }

    // do some internal cheating to replace const color with global color
    if (options.particles.color instanceof THREE.Color) {
      console.warn(
        "Note: replaced 'color' with 'globalColor' property since its more efficient and you provided color value was constant anyway."
      );
      options.particles.globalColor = options.particles.color;
      delete options.particles.color;
    }

    // set some internal flags
    options.particles.fade = defined(pOptions.startAlpha) || defined(pOptions.alpha);
    options.particles.rotating = defined(pOptions.rotationSpeed) || defined(pOptions.rotation);
    options.particles.colorize = defined(pOptions.color) || defined(pOptions.startColor);
    options.particles.scaling = defined(pOptions.size) || defined(pOptions.startSize);

    // validate alpha params
    if (defined(pOptions.startAlpha) && !defined(pOptions.endAlpha)) {
      throw new Error("When providing 'startAlpha' you must also provide 'endAlpha'!");
    }
    if (defined(pOptions.startAlpha) && defined(pOptions.alpha)) {
      throw new Error("When providing 'alpha' you can't also provide 'startAlpha'!");
    }

    // validate color params
    if (defined(pOptions.startColor) && !defined(pOptions.endColor)) {
      throw new Error("When providing 'startColor' you must also provide 'endColor'!");
    }
    if (defined(pOptions.startColor) && defined(pOptions.color)) {
      throw new Error("When providing 'color' you can't also provide 'startColor'!");
    }

    // validate size params
    if (defined(pOptions.startSize) && !defined(pOptions.endSize)) {
      throw new Error("When providing 'startSize' you must also provide 'endSize'!");
    }
    if (defined(pOptions.startSize) && defined(pOptions.size)) {
      throw new Error("When providing 'size' you can't also provide 'startSize'!");
    }

    // get particles count
    const particleCount = options.system.particlesCount || 10;

    // get blending mode
    const blending = options.particles.blending || "opaque";

    // get threejs blending mode
    const threeBlend = BLENDING_OPTIONS[blending];

    // set emitters
    this._emitters = [];
    if (options.system.emitters) {
      if (options.system.emitters instanceof Array) {
        for (let i = 0; i < options.system.emitters.length; ++i) {
          this.addEmitter(options.system.emitters[i]);
        }
      } else {
        this.addEmitter(options.system.emitters);
      }
    }

    // has transparency?
    const isTransparent = blending !== "opaque";

    // create the particle geometry
    this.particlesGeometry = new THREE.BufferGeometry();

    // set perspective mode
    const perspective =
      options.system.perspective !== undefined ? Boolean(options.system.perspective) : true;

    // create particles material
    const pMaterial = new ParticlesMaterial({
      size: options.particles.size || 10,
      color: options.particles.globalColor || 0xffffff,
      blending: threeBlend,
      perspective: perspective,
      transparent: isTransparent,
      map: options.particles.texture,
      perParticleColor: Boolean(options.particles.colorize),
      alphaTest: blending === "blend" && defined(options.particles.texture),
      constSize: defined(options.particles.globalSize) ? options.particles.globalSize : null,
      depthWrite: defined(options.system.depthWrite) ? options.system.depthWrite : true,
      depthTest: defined(options.system.depthTest) ? options.system.depthTest : true,
      perParticleRotation: options.particles.rotating
    });

    // store material for later usage
    this.material = pMaterial;

    // store speed factor
    this.speed = options.system.speed || 1;

    // set system starting ttl and other params
    this.reset();

    // dead particles and alive particles lists
    this._aliveParticles = [];
    this._deadParticles = [];

    // create all particles + set geometry attributes
    const vertices = new Float32Array(particleCount * 3);
    const colors = options.particles.colorize ? new Float32Array(particleCount * 3) : null;
    const alphas = options.particles.fade ? new Float32Array(particleCount * 1) : null;
    const sizes = options.particles.scaling ? new Float32Array(particleCount * 1) : null;
    const rotations = options.particles.rotating ? new Float32Array(particleCount * 1) : null;

    for (let p = 0; p < particleCount; p++) {
      const index = p * 3;
      vertices[index] = vertices[index + 1] = vertices[index + 2] = 0;

      if (colors) colors[index] = colors[index + 1] = colors[index + 2] = 1;
      if (alphas) alphas[p] = 1;
      if (sizes) sizes[p] = 1;
      if (rotations) rotations[p] = 0;

      this._deadParticles.push(new Particle(this));
    }

    this.particlesGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    if (alphas) {
      this.particlesGeometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    }
    if (colors) {
      this.particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    if (sizes) {
      this.particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    }
    if (rotations) {
      this.particlesGeometry.setAttribute("rotation", new THREE.BufferAttribute(rotations, 1));
    }
    this.particlesGeometry.setDrawRange(0, 0);

    // set scale
    this.material.setBaseScale(options.system.scale || 400);

    // create the particles system
    const particleSystem = new THREE.Points(this.particlesGeometry, this.material.material);
    particleSystem.sortParticles = isTransparent;

    // set default render order
    if (ParticlesSystem.defaultRenderOrder !== undefined) {
      particleSystem.renderOrder = ParticlesSystem.defaultRenderOrder;
    }

    // store particles system
    this.particleSystem = particleSystem;

    // to make sure first update will update everything
    this._positionDirty = true;
    this._colorsDirty = Boolean(colors);
    this._alphaDirty = Boolean(alphas);
    this._rotateDirty = Boolean(rotations);

    // add it to the parent container
    if (options.container) {
      this.addTo(options.container);
    }
  }

  /**
   * creates an instance from a json definition
   *
   * @static
   * @param {*} options
   * @return {ParticlesSystem} new ParticlesSystem created from the json-object
   * @memberof ParticlesSystem
   */
  static fromJSON(options, resources = {}) {
    const result = copyFromJSON(options, resources);
    if (Array.isArray(result.system.emitters)) {
      result.system.emitters = result.system.emitters.map((v) => new Emitter(v));
    } else {
      result.system.emitters = new Emitter(result.system.emitters);
    }
    return new ParticlesSystem(result);
  }

  /**
   * Add emitter to this particles system.
   */
  addEmitter(emitter) {
    this._emitters.push(emitter);
  }

  /**
   * Dispose the entire system.
   */
  dispose() {
    this.particlesGeometry.dispose();
    this.material.dispose();
  }

  /**
   * Return true when ttl is expired and there are no more alive particles in system.
   */
  get finished() {
    return this.ttlExpired && this.particlesCount === 0;
  }

  /**
   * Get if this system's ttl is expired.
   */
  get ttlExpired() {
    return this.ttl !== undefined && this.ttl <= 0;
  }

  /**
   * Reset particles system ttl.
   */
  reset() {
    this.ttl = this.options.system.ttl;
    this.age = 0;
    this._timeToUpdateBS = 0;
  }

  /**
   * sets the time to live to zero,
   * so that the emitter does not spawn any new particles
   */
  gracefulStop() {
    this.ttl = 0;
  }

  /**
   * Get system's world position.
   */
  getWorldPosition(ret) {
    ret = ret || new THREE.Vector3();
    this.particleSystem.getWorldPosition(ret);
    return ret;
  }

  /**
   * Add the particles system to scene or container.
   * @param {THREE.Object3D} container Container to add system to.
   */
  addTo(container) {
    container.add(this.particleSystem);
  }

  /**
   * Set a particle's color value.
   */
  setColor(index, color) {
    index *= 3;
    const colors = this.particlesGeometry.attributes.color.array;
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
    this._colorsDirty = true;
  }

  /**
   * Set a particle's position.
   */
  setPosition(index, position) {
    index *= 3;
    const vertices = this.particlesGeometry.attributes.position.array;
    vertices[index] = position.x;
    vertices[index + 1] = position.y;
    vertices[index + 2] = position.z;
    this._positionDirty = true;
  }

  /**
   * Set particle's alpha.
   */
  setAlpha(index, value) {
    this.particlesGeometry.attributes.alpha.array[index] = value;
    this._alphaDirty = true;
  }

  /**
   * Set particle's rotation.
   */
  setRotation(index, value) {
    this.particlesGeometry.attributes.rotation.array[index] = value;
    this._rotateDirty = true;
  }

  /**
   * Set particle's size.
   */
  setSize(index, value) {
    this.particlesGeometry.attributes.size.array[index] = value;
    this._sizeDirty = true;
  }

  /**
   * Get how many particles this system currently shows.
   */
  get particlesCount() {
    return this._aliveParticles.length;
  }

  /**
   * Get max particles count.
   */
  get maxParticlesCount() {
    return this._aliveParticles.length + this._deadParticles.length;
  }

  /**
   * If ttl is expired and there are no more alive particles, remove system and dispose it.
   * @returns True if removed & disposed, false if still alive.
   */
  removeAndDisposeIfFinished() {
    if (this.finished) {
      this.removeSelf();
      this.dispose();
      return true;
    }
    return false;
  }

  bindObject(object, lockBoundRotation) {
    this.boundObject = object;
    this.lockBoundRotation = defined(lockBoundRotation) ? lockBoundRotation : true;
  }

  /**
   * Update particles system.
   */
  update(deltaTime) {
    // if deltaTime is undefined, set automatically
    if (deltaTime === undefined) {
      const timeNow = new Date().getTime() / 1000.0;
      deltaTime = timeNow - this._lastTime || 0;
      this._lastTime = timeNow;
    }

    // delta time is 0? skip
    if (deltaTime === 0) {
      return;
    }

    // update ttl
    if (this.ttl !== undefined && this.ttl > 0) {
      this.ttl -= deltaTime;
    }

    // apply speed
    deltaTime *= this.speed;

    // store last delta time
    this.dt = deltaTime;
    this.age += deltaTime;

    // if we shall follow an object,
    // we just update the position on each frame,
    // to be the same, as the object
    if (this.boundObject) {
      const pos = this.boundObject.position;
      this.particleSystem.position.set(pos.x, pos.y, pos.z);
      if (!this.lockBoundRotation) {
        const rot = this.boundObject.rotation;
        this.particleSystem.rotation.set(rot.x, rot.y, rot.z);
      }
    }

    // to check if number of particles changed
    const prevParticlesCount = this._aliveParticles.length;

    // generate particles (unless ttl expired)
    if (!this.ttlExpired) {
      for (let i = 0; i < this._emitters.length; ++i) {
        const toSpawn = this._emitters[i].update(deltaTime, this);
        if (toSpawn) {
          this.spawnParticles(toSpawn);
        }
      }
    }

    // update particles
    for (let i = this._aliveParticles.length - 1; i >= 0; --i) {
      // update particle
      const particle = this._aliveParticles[i];
      particle.update(i, deltaTime);

      // finished? remove it
      if (particle.finished) {
        this._aliveParticles.splice(i, 1);
        this._deadParticles.push(particle);
      }
    }

    // hide invisible vertices
    if (prevParticlesCount !== this._aliveParticles.length) {
      this.particlesGeometry.setDrawRange(0, this._aliveParticles.length);
    }

    // set vertices dirty flag
    this.particlesGeometry.attributes.position.needsUpdate = this._positionDirty;
    this._needBoundingSphereUpdate = this._needBoundingSphereUpdate || this._positionDirty;
    this._positionDirty = false;

    // set colors dirty flag
    if (this._colorsDirty) {
      this.particlesGeometry.attributes.color.needsUpdate = true;
      this._colorsDirty = false;
    }

    // set alphas dirty flag
    if (this._alphaDirty) {
      this.particlesGeometry.attributes.alpha.needsUpdate = true;
      this._alphaDirty = false;
    }

    // set size dirty flag
    if (this._sizeDirty) {
      this.particlesGeometry.attributes.size.needsUpdate = true;
      this._sizeDirty = false;
    }

    // set rotation dirty flag
    if (this._rotateDirty) {
      this.particlesGeometry.attributes.rotation.needsUpdate = true;
      this._rotateDirty = false;
    }

    // update bounding sphere
    if (this._needBoundingSphereUpdate) {
      this._timeToUpdateBS -= deltaTime;
      if (this._timeToUpdateBS <= 0) {
        this._timeToUpdateBS = 0.2;
        this.particlesGeometry.computeBoundingSphere();
      }
    }

    // if finished, stop here
    if (this.finished) {
      // TODO: remove options finish
      if (this.options.system.onFinish) this.options.system.onFinish(this);
      if (this.onFinish) this.onFinish(this);
      return;
    }

    // call optional update
    // TODO: remove options onUpdate
    if (this.options.system.onUpdate) {
      this.options.system.onUpdate(this);
    }
    if (this.onUpdate) this.onUpdate(this);
  }

  /**
   * Spawn particles.
   * @param {Number} quantity Number of particles to spawn. If exceed max available particles in system, skip.
   */
  spawnParticles(quantity) {
    // spawn particles
    for (let i = 0; i < quantity; ++i) {
      // no available dead particles? skip
      if (this._deadParticles.length === 0) {
        return;
      }

      // spawn particle
      const particle = this._deadParticles.pop();
      particle.reset();
      this._aliveParticles.push(particle);
    }
  }

  /**
   * Remove particles system from its parent.
   */
  removeSelf() {
    if (this.particleSystem.parent) {
      this.particleSystem.parent.remove(this.particleSystem);
    }
  }
}

// override this to set default rendering order to all particle systems
ParticlesSystem.defaultRenderOrder = undefined;

// export the particles system
module.exports = ParticlesSystem;
