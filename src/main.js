import "./styles.css";

document.querySelector("#app").innerHTML = `
  <canvas id="fluidCanvas"></canvas>

  <div class="footer-text">
    BagCat is built on principles of pedagogy and experiential learning, combining Bloom's taxonomy with scaffolding techniques to create an adaptive learning environment. Through differentiated instruction, formative and summative assessments, and problem-based learning methodologies, we implement outcome-based education that emphasizes competency development and proficiency attainment. Our curriculum integrates STEM education with universal design for learning principles, ensuring inclusive classroom practices. We leverage educational technology, blended learning, and gamification to promote metacognition, transfer of learning, and spaced repetition. Our pedagogical approach encompasses constructivism, progressive education, and critical pedagogy, supported by guided practice, modeling, and think-aloud strategies. We believe in holistic student support through mentoring, academic coaching, and enrichment programs that foster achievement and bridge learning gaps through continuous progress monitoring and benchmark assessments.
  </div>

  <div class="container">
    <div class="content">
      <div class="text-container">
        <div class="logo-container">
          <img src="/header-image.png" alt="BagCat Logo" class="logo" />
        </div>

        <h1>Under Construction</h1>
        <p class="subtitle">We'll be back soon with something great</p>
      </div>
    </div>
  </div>
`;

const vertexShaderSource = `#version 300 es
precision highp float;

const vec2 POS[3] = vec2[](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

void main() {
  gl_Position = vec4(POS[gl_VertexID], 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform float iTime;
uniform vec3 iResolution;

uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;

#define PIXEL_SIZE_FAC 700.0
#define SPIN_EASE 0.5
#define spin_amount 0.7
#define contrast 1.5

out vec4 outColor;

vec4 sampleColor(vec2 uv) {
  float contrast_mod = (0.25f * contrast + 0.5f * spin_amount + 1.2f);
  float paint_res = min(2.f, max(0.f, length(uv) * (0.035f) * contrast_mod));
  float c1p = max(0.f, 1.f - contrast_mod * abs(1.f - paint_res));
  float c2p = max(0.f, 1.f - contrast_mod * abs(paint_res));
  float c3p = 1.f - min(1.f, c1p + c2p);

  vec4 color = (0.3f / contrast) * uColor1 + (1.f - 0.3f / contrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + 0.3f * max(c1p * 5.f - 4.f, 0.f) + 0.4f * max(c2p * 5.f - 4.f, 0.f);
  return color;
}

void main() {
  float pixel_size = length(iResolution.xy) / PIXEL_SIZE_FAC;
  vec2 uv = (floor(gl_FragCoord.xy * (1.0f / pixel_size)) * pixel_size - 0.5f * iResolution.xy) / length(iResolution.xy) - vec2(0.0f, 0.0f);
  float uv_len = length(uv);

  float speed = (iTime * SPIN_EASE * 0.1f) + 302.2f;
  float new_pixel_angle = (atan(uv.y, uv.x)) + speed - SPIN_EASE * 20.f * (1.f * spin_amount * uv_len + (1.f - 1.f * spin_amount));
  vec2 mid = (iResolution.xy / length(iResolution.xy)) / 2.f;
  uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

  uv *= 30.f;
  speed = iTime * (1.f);
  vec2 uv2 = vec2(uv.x + uv.y);

  for (int i = 0; i < 5; i++) {
    uv2 += uv + cos(length(uv));
    uv += 0.5f * vec2(cos(5.1123314f + 0.353f * uv2.y + speed * 0.131121f), sin(uv2.x - 0.113f * speed));
    uv -= 1.0f * cos(uv.x + uv.y) - 1.0f * sin(uv.x * 0.711f - uv.y);
  }

  outColor = sampleColor(uv);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || "Shader compile failed");
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log || "Program link failed");
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

const canvas = document.getElementById("fluidCanvas");
const gl = canvas.getContext("webgl2", {
  alpha: true,
  antialias: true,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false
});

if (gl) {
  let disposed = false;
  let raf = 0;
  let last = performance.now();
  let simTime = 0;
  let speedBoost = 0;

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  const iTimeLoc = gl.getUniformLocation(program, "iTime");
  const iResolutionLoc = gl.getUniformLocation(program, "iResolution");
  const color1Loc = gl.getUniformLocation(program, "uColor1");
  const color2Loc = gl.getUniformLocation(program, "uColor2");
  const color3Loc = gl.getUniformLocation(program, "uColor3");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(2, Math.floor(window.innerWidth * dpr));
    const height = Math.max(2, Math.floor(window.innerHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render() {
    if (disposed) return;
    raf = requestAnimationFrame(render);

    resize();

    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    speedBoost *= 0.9;
    const timeScale = 1 + Math.min(7, speedBoost);
    simTime += dt * timeScale;

    gl.useProgram(program);
    gl.uniform1f(iTimeLoc, simTime);
    gl.uniform3f(iResolutionLoc, canvas.width, canvas.height, 1.0);
    gl.uniform4f(color1Loc, 0.36, 0.51, 0.79, 1.0);
    gl.uniform4f(color2Loc, 0.0, 0.61, 1.0, 1.0);
    gl.uniform4f(color3Loc, 0.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function onWheel(e) {
    speedBoost = Math.min(4.0, speedBoost + Math.min(1.2, Math.abs(e.deltaY) * 0.0025));
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });
  render();
}
