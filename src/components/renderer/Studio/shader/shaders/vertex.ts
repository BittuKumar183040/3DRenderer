export const vertexShader = [`
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normal;

    vec3 pos = position;

    float wave =
        sin(pos.x * 2.2 + uTime) * 6.0 +
        sin(pos.y * 2.10 + uTime * 1.3) * 0.1 +
        sin(pos.z * 0.12 + uTime * 0.8) * 5.0;

    pos += normal * wave;

    vPosition = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`];