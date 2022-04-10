import * as THREE from 'three'
import * as dat from 'dat.gui'

import matcap from './blue_matcap.jpeg'
import fragmentShader from './shader/fragment.frag?raw'
import vertexShader from './shader/vertex.vert?raw'

import './style.css'

class Sketch {
  constructor(el) {
    this.domElement = el

    this.windowSize = new THREE.Vector2(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    )

    this.scene = new THREE.Scene()

    this.clock = new THREE.Clock()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.domElement.append(this.renderer.domElement)

    this.mouse = new THREE.Vector2(0, 0)

    this.addCamera()
    this.addObject()
    this.addEventListener()
    this.setupSettings()
    this.resize()
    this.render()
  }

  setupSettings() {
    this.settings = { progress: 0 }
    this.gui = new dat.GUI({ closed: true })
    this.gui.add(this.settings, 'progress', 0, 1, 0.01)
  }

  addCamera() {
    this.camera = new THREE.OrthographicCamera(
      1 / -2,
      1 / 2,
      1 / 2,
      1 / -2,
      -1000,
      1000
    )
    this.camera.position.z = 1
    this.scene.add(this.camera)
  }

  addObject() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector4(0) },
        uTexture: { value: new THREE.TextureLoader().load(matcap) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uProgress: { value: 0 },
      },
      fragmentShader,
      vertexShader,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)

    this.scene.add(this.mesh)
  }

  resize() {
    this.windowSize.set(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    )

    const imageAspect = 1
    let side1, side2
    const width = this.windowSize.x
    const height = this.windowSize.y

    if (height / width > imageAspect) {
      side1 = (width / height) * imageAspect
      side2 = 1
    } else {
      side1 = 1
      side2 = height / width / imageAspect
    }

    this.material.uniforms.uResolution.value.x = width
    this.material.uniforms.uResolution.value.y = height
    this.material.uniforms.uResolution.value.z = side1
    this.material.uniforms.uResolution.value.w = side2

    this.camera.aspect = this.windowSize.x / this.windowSize.y
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.windowSize.x, this.windowSize.y)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  }

  mouseMove(e) {
    this.mouse.x = e.x / this.windowSize.x - 0.5
    this.mouse.y = -e.y / this.windowSize.y + 0.5
  }

  addEventListener() {
    window.addEventListener('resize', this.resize.bind(this))
    window.addEventListener('mousemove', this.mouseMove.bind(this))
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime()

    this.material.uniforms.uTime.value = elapsedTime
    this.material.uniforms.uMouse.value = this.mouse
    this.material.uniforms.uProgress.value = this.settings.progress

    this.renderer.render(this.scene, this.camera)

    window.requestAnimationFrame(this.render.bind(this))
  }
}

new Sketch(document.getElementById('app'))
