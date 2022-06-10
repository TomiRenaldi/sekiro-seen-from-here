import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

import vertexGrassShader from './shaders/planeGrass/vertex.glsl'
import fragmentGrassShader from './shaders/planeGrass/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 5, 10)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Lights
 */
const lights = {}

/**
 * Plane
 */
const plane = {}

plane.instance = {}

plane.instance.number = 10000
plane.instance.dummy = new THREE.Object3D()

// Material
plane.material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: vertexGrassShader, 
    fragmentShader: fragmentGrassShader,
    uniforms: {
        uTime: { value: 0 },
    } 
})

// Geometry
plane.geometry = new THREE.PlaneGeometry(0.1, 1, 10, 10)
plane.geometry.translate(0, 0.5, 0)

// Mesh
plane.mesh = new THREE.InstancedMesh(plane.geometry, plane.material, plane.instance.number)
plane.mesh.receiveShadow = true
scene.add(plane.mesh)

for(let i = 0; i < plane.instance.number; i++)
{
    plane.instance.dummy.position.set(
        (Math.random() - 0.5) * 20, 0,
        (Math.random() - 0.5) * 20,
    )

    plane.instance.dummy.scale.setScalar(0.5 + Math.random() * 0.5)
    plane.instance.dummy.rotation.y = Math.random() * Math.PI

    plane.instance.dummy.updateMatrix()
    plane.mesh.setMatrixAt(i, plane.instance.dummy.matrix)
}

/**
 * Ground
 */
const ground = {}

ground.texture = {}

ground.texture.color = new THREE.TextureLoader().load('./texture/GroundForest003COL.jpg')
ground.texture.color.encoding = THREE.sRGBEncoding
ground.texture.color.wrapS = THREE.RepeatWrapping
ground.texture.color.wrapT = THREE.RepeatWrapping
ground.texture.color.repeat.set(1, 1)

ground.geometry = new THREE.PlaneGeometry(5, 5, 500, 500)
ground.geometry.rotateX(- Math.PI * 0.5)

ground.material = new THREE.MeshStandardMaterial({
    map: ground.texture.color,
    roughness: 0.8,
    metalness: 0.2,
    bumpScale: 0.0005
})

ground.mesh = new THREE.Mesh(ground.geometry, ground.material)
ground.mesh.scale.set(5, 5, 5)
ground.mesh.receiveShadow = true
scene.add(ground.mesh)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})

renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const sun = new THREE.Vector3()

/**
 * Sky
 */
const sky = new Sky()
sky.scale.setScalar(10000)
scene.add(sky)

const skyUniforms = sky.material.uniforms

skyUniforms[ 'turbidity' ].value = 10
skyUniforms[ 'rayleigh' ].value = 2
skyUniforms[ 'mieCoefficient' ].value = 0.005
skyUniforms[ 'mieDirectionalG' ].value = 0.8

const parameters = {
	elevation: 2,
	azimuth: 180
}

const pmremGenerator = new THREE.PMREMGenerator(renderer)

const phi = THREE.MathUtils.degToRad(90 - parameters.elevation)
const theta = THREE.MathUtils.degToRad(parameters.azimuth)

sun.setFromSphericalCoords(1, phi, theta)
sky.material.uniforms[ 'sunPosition' ].value.copy(sun)
scene.environment = pmremGenerator.fromScene(sky).texture

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime

    plane.material.uniforms.uTime.value = elapsedTime * 0.3
    plane.material.uniformsNeedUpdate = true

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
