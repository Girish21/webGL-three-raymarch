uniform float uTime;
uniform float uProgress;
uniform vec4 uResolution;
uniform vec2 uMouse;
uniform sampler2D uTexture;
varying vec2 vUv;

#define PI 3.1415926535

mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
              oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
              oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
              0.0,                                0.0,                                0.0,                                1.0);
}

vec2 matcap(vec3 eye, vec3 normal) {
  vec3 reflected = reflect(eye, normal);
  float m = 2.8284271247461903 * sqrt( reflected.z+1.0 );
  return reflected.xy / m + 0.5;
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

float sdBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdSphere( vec3 p, float s ) {
  return length(p)-s;
}

float smin( float a, float b, float k )
{
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float sdf(vec3 p) {
  vec3 newPoint = rotate(p, vec3(1., 1., 1.), uTime / 5.);

  float sphere = sdSphere(p - vec3(uMouse * uResolution.zw * 2., 0.), .2);
  float box = smin(sdBox(newPoint, vec3(.2)), sdSphere(p, .2), .3);
  float realSphere = sdSphere(newPoint, .3);
  float final = mix(realSphere, box, uProgress);

  for (float i = 0.; i < 5.; i++) {
    float randOffset = rand(vec2(i, 0.));
    float prog = fract((uTime) / 3. + randOffset * 3.);
    vec3 position = vec3(sin(randOffset * 2. * PI), cos(randOffset * 2. * PI), 0.);
    float goToCenter = sdSphere(p - position * prog, .1);
    final = smin(final, goToCenter, .3);
  }


  return smin(sphere, final, .1);
}

vec3 calcNormal( in vec3 p ) // for function f(p)
{
  const float eps = 0.0001; // or some other value
  const vec2 h = vec2(eps,0);
  return normalize( vec3(sdf(p+h.xyy) - sdf(p-h.xyy),
                          sdf(p+h.yxy) - sdf(p-h.yxy),
                          sdf(p+h.yyx) - sdf(p-h.yyx) ) );
}

void main() {
  float dist = length(vUv - vec2(.5));
  vec3 bg = mix(vec3(0.3), vec3(0.), dist);
  vec3 camPos = vec3(0., 0., 3.);
  vec3 ray = normalize(vec3((vUv - vec2(.5)) * uResolution.zw, -1.));

  float t = 0.;
  float tMax = 5.;
  for (int i = 0; i < 256; i++) {
    vec3 pos = camPos + t * ray;
    float h = sdf(pos);
    if (h < 0.0001 || t > tMax) {
      break;
    }
    t += h;
  }

  vec3 color = bg;
  float fresnel = 0.;
  if (t < tMax) {
    vec3 pos = camPos + t * ray;
    vec3 normal = calcNormal(pos);
    vec2 matcapUV = matcap(ray, normal);
    fresnel = pow(1. + dot(ray, normal), 3.);
    // color = vec3(dot(vec3(1.), normal));
    color = texture2D(uTexture, matcapUV).rgb;
    color = mix(color, bg, fresnel);
  }

  gl_FragColor = vec4(color, 1.);
}
