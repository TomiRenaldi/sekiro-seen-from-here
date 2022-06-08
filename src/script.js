import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// import vertexGrassShader from './shaders/planeBackgroundGrass/vertex.glsl'
// import fragmentGrassShader from './shaders/planeBackgroundGrass/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const backgroundScene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height, false)
    renderer.setPixelRatio(sizes.pixelRatio)
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
 * Plane Background
 */
const planeBackground = {}

planeBackground.texture = {}
planeBackground.texture.elevation = 0.2
planeBackground.texture.azimuth = 0.4
planeBackground.texture.fogFade = 0.005

planeBackground.texture.loader = new THREE.TextureLoader()
planeBackground.texture.loader.grassTexture = planeBackground.texture.loader.load('./texture/bladeDiffuse.jpg')
planeBackground.texture.loader.alphaMap = planeBackground.texture.loader.load('./texture/bladeAlpha.jpg')

planeBackground.texture.loader.noiseTexture = planeBackground.texture.loader.load('./texture/perlinFbm.jpg')
planeBackground.texture.loader.noiseTexture.wrapS = THREE.RepeatWrapping
planeBackground.texture.loader.noiseTexture.wrapT = THREE.RepeatWrapping


// Material
planeBackground.material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
        uSunDirection: { value: new THREE.Vector3(Math.sin(planeBackground.texture.azimuth), Math.sin(planeBackground.texture.elevation), - Math.cos(planeBackground.texture.azimuth)) },
        uResolution: { value: new THREE.Vector2(sizes.width, sizes.height) },
        uFogFade: { value: planeBackground.texture.fogFade },
        uFov: { value: 75 }
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      gl_Position = vec4( position, 1.0 );    
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform vec3 uSunDirection;
    uniform float uFogFade;
    uniform float uFov;
    
    const vec3 skyColour = 0.65 * vec3(0.09, 0.33, 0.81);
    //Darken sky when looking up
    vec3 getSkyColour(vec3 rayDir){
      return mix(0.35*skyColour, skyColour, pow(1.0-rayDir.y, 4.0));
    }
    
    //https://iquilezles.org/www/articles/fog/fog.htm
    vec3 applyFog(vec3 rgb, vec3 rayOri, vec3 rayDir, vec3 sunDir){
      //Make horizon more hazy
      float dist = 4000.0;
      if(abs(rayDir.y) < 0.0001){rayDir.y = 0.0001;}
      float fogAmount = 1.0 * exp(-rayOri.y*uFogFade) * (1.0-exp(-dist*rayDir.y*uFogFade))/rayDir.y;
      float sunAmount = max( dot( rayDir, sunDir ), 0.0 );
      vec3 fogColor  = mix(vec3(0.35, 0.5, 0.9), vec3(1.0, 1.0, 0.75), pow(sunAmount, 16.0) );
      return mix(rgb, fogColor, clamp(fogAmount, 0.0, 1.0));
    }
    
    vec3 ACESFilm(vec3 x){
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
    }
    
    vec3 rayDirection(float fieldOfView, vec2 fragCoord) {
      vec2 xy = fragCoord - uResolution.xy / 2.0;
      float z = (0.5 * uResolution.y) / tan(radians(fieldOfView) / 2.0);
      return normalize(vec3(xy, -z));
    }
    
    //https://www.geertarien.com/blog/2017/07/30/breakdown-of-the-lookAt-function-in-OpenGL/
    mat3 lookAt(vec3 camera, vec3 at, vec3 up){
      vec3 zaxis = normalize(at-camera);    
      vec3 xaxis = normalize(cross(zaxis, up));
      vec3 yaxis = cross(xaxis, zaxis);
    
      return mat3(xaxis, yaxis, -zaxis);
    }
    
    float getGlow(float dist, float radius, float intensity){
      dist = max(dist, 1e-6);
      return pow(radius/dist, intensity);	
    }
    
    void main() {
    
      vec3 target = vec3(0.0, 0.0, 0.0);
      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 rayDir = rayDirection(uFov, gl_FragCoord.xy);
    
      //Get the view matrix from the camera orientation
      mat3 viewMatrix_ = lookAt(cameraPosition, target, up);
    
      //Transform the ray to point in the correct direction
      rayDir = viewMatrix_ * rayDir;
    
      vec3 col = getSkyColour(rayDir);
    
      //Draw sun
      vec3 sunDir = normalize(uSunDirection);
      float mu = dot(sunDir, rayDir);
      col += vec3(1.0, 1.0, 0.8) * getGlow(1.0-mu, 0.00005, 0.9);
    
      col += applyFog(col, vec3(0,1000,0), rayDir, sunDir);
    
      //Tonemapping
      col = ACESFilm(col);
    
      //Gamma correction 1.0/2.2 = 0.4545...
      col = pow(col, vec3(0.4545));
    
      gl_FragColor = vec4(col, 1.0 );
    }
   `
})
planeBackground.material.depthWrite = false

// Geometry
planeBackground.geometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1)

// Mesh
planeBackground.mesh = new THREE.Mesh(planeBackground.geometry, planeBackground.material)
backgroundScene.add(planeBackground.mesh)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.autoClear = false
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

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
