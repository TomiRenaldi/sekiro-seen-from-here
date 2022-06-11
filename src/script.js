import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

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
camera.position.set(-6, 2, 12)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Lights
 */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
hemiLight.position.set(0, 20, 0)
scene.add(hemiLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 11)
dirLight.position.set( - 3, 10, - 10 )
dirLight.castShadow = true
dirLight.shadow.camera.top = 5
dirLight.shadow.camera.bottom = - 5
dirLight.shadow.camera.left = - 5
dirLight.shadow.camera.right = 5
dirLight.shadow.camera.near = 0.1
dirLight.shadow.camera.far = 50
scene.add(dirLight)

/**
 * Ground
 */
const ground = {}

ground.geometry = new THREE.PlaneGeometry(100, 100)
ground.geometry.rotateX(- Math.PI * 0.5)

ground.material = new THREE.MeshStandardMaterial({
    color: '#00030f',
    roughness: 0.8,
    metalness: 0.5,
    bumpScale: 0.005
})

ground.mesh = new THREE.Mesh(ground.geometry, ground.material)
ground.mesh.scale.set(10, 10, 10)
ground.mesh.receiveShadow = true
scene.add(ground.mesh)

/**
 * Model
 */
const model = {}
model.scale = 0.017
model.loader = new GLTFLoader()
model.loader.load('./model/sekiro.glb', (gltf) => {
    const sekiro = gltf.scene
    sekiro.scale.set(model.scale, model.scale, model.scale)
    sekiro.traverse((child) => {
        if(child instanceof THREE.Mesh)
        {
            child.castShadow = true
            child.receiveShadow = true
        }
    })
    scene.add(sekiro)
})

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
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.1
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

skyUniforms[ 'turbidity' ].value = 0.1
skyUniforms[ 'rayleigh' ].value = 0.018
skyUniforms[ 'mieCoefficient' ].value = 0.005
skyUniforms[ 'mieDirectionalG' ].value = 0.8

const parameters = {
	elevation: 10.8,
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

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
