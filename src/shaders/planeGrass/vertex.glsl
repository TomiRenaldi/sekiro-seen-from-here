varying vec2 vUv;
uniform float uTime;

void main()
{
    vec4 modelPosition = vec4(position, 1.0);
     #ifdef USE_INSTANCING
    	modelPosition = instanceMatrix * modelPosition;
    #endif

    float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
    
    float displacement = sin( modelPosition.z + uTime * 10.0 ) * ( 0.1 * dispPower );
    modelPosition.z += displacement;

    vec4 modelViewPosition = modelViewMatrix * modelPosition;
    gl_Position = projectionMatrix * modelViewPosition;

    vUv = uv;
}