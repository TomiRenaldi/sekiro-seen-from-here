import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

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
camera.position.x = 1
camera.position.y = 1
camera.position.z = 1
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Plane
 */
const plane = {}
plane.instance = {}
plane.instance.number = 500
plane.instance.dummy = new THREE.Object3D()

// Material
plane.material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: vertexGrassShader, 
    fragmentShader: fragmentGrassShader,
    uniforms: {
        uTime: { value: 0 },
    } 
})

// Geometry
plane.geometry = new THREE.PlaneGeometry(1.5, 0.075, 1, 1)
plane.geometry.translate(0, 0.5, 0)

// Mesh
plane.mesh = new THREE.InstancedMesh(plane.geometry, plane.material, plane.instance.number)
plane.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
scene.add(plane.mesh)

for(let i = 0; i < plane.instance.number; i++)
{
    plane.instance.dummy.position.set(
        (Math.random() - 0.5) * 10, 0,
        (Math.random() - 0.5) * 10
    )

    plane.instance.dummy.scale.setScalar(0.5 + Math.random() * 0.5)
    plane.instance.dummy.rotation.y = Math.random() * Math.PI

    plane.instance.dummy.updateMatrix()
    plane.mesh.setMatrixAt(i, plane.instance.dummy.matrix)
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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

    plane.material.uniforms.uTime.value = elapsedTime
    plane.material.uniformsNeedUpdate = true

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
