export const fragmentShader = [
  `
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {

    vec3 n = normalize(vNormal);

    float fresnel = pow(1.0 - abs(dot(n, vec3(0.0,0.0,1.0))), 4.1);

    vec3 colorA = vec3(0.15,0.05,1.0);
    vec3 colorB = vec3(0.0,0.85,1.0);
    vec3 colorC = vec3(1.0,0.2,0.7);
    vec3 colorD = vec3(1.0,0.6,0.1);

    float t =
        sin(vPosition.x*0.05 + uTime)*0.5+
        sin(vPosition.y*0.08-uTime*0.7)*0.3+
        sin(vPosition.z*0.07+uTime*1.2)*0.2;
    
        t = t * 0.5 + 0.5;

        
    vec3 color = mix(colorA,colorB,smoothstep(0.0,0.35,t));
    color = mix(color,colorC,smoothstep(0.35,0.7,t));
    color = mix(color,colorD,smoothstep(0.7,1.0,t));
    
    color += fresnel;

    gl_FragColor = vec4(color,1.0);
}
`,
`
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform float uFrame;

uniform sampler2D uTexture;

varying vec2 vUv;

mat2 rotate(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
    float cutsSize = 150.0 * (1.1 - uMouse.x / uResolution.x);
    float angle = 0.4 * uTime;
    vec2 offset = 30.0 * sin(angle) * vec2(cos(angle), sin(angle));

    vec2 rotatedPos = rotate(angle) * (gl_FragCoord.xy - 0.5 * uResolution) + 0.5 * uResolution;
    offset *= 2.0 * floor(mod(rotatedPos.y / cutsSize, 2.0)) - 1.0;

    gl_FragColor = texture2D(uTexture, vUv + offset / uResolution);
}
`,
];
