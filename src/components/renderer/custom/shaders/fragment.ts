export const fragmentShader = `
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
`;