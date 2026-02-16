import { useEffect, useMemo, useRef } from 'react';
import { useOptions } from '/src/utils/optionsContext';
import fluidThemes from '../../fluid-themes.json';

const FLOW_W = 192;
const FLOW_H = 192;

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
uniform sampler2D uFlowTex;

#define PIXEL_SIZE_FAC 700.0
#define SPIN_EASE 0.5
#define spin_amount 0.7
#define contrast 1.5

out vec4 outColor;

// Note: parts of this shader have been copied from https://www.playbalatro.com/

vec4 sampleColor(vec2 uv) {
  // Make the paint amount range from 0 - 2
  float contrast_mod = (0.25f * contrast + 0.5f * spin_amount + 1.2f);
  float paint_res = min(2.f, max(0.f, length(uv) * (0.035f) * contrast_mod));
  float c1p = max(0.f, 1.f - contrast_mod * abs(1.f - paint_res));
  float c2p = max(0.f, 1.f - contrast_mod * abs(paint_res));
  float c3p = 1.f - min(1.f, c1p + c2p);

  vec4 color = (0.3f / contrast) * uColor1 + (1.f - 0.3f / contrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + 0.3f * max(c1p * 5.f - 4.f, 0.f) + 0.4f * max(c2p * 5.f - 4.f, 0.f);
  return color;
}

void main() {
  //Convert to UV coords (0-1) and floor for pixel effect
  float pixel_size = length(iResolution.xy) / PIXEL_SIZE_FAC;
  vec2 uv = (floor(gl_FragCoord.xy * (1.0f / pixel_size)) * pixel_size - 0.5f * iResolution.xy) / length(iResolution.xy) - vec2(0.0f, 0.0f);
  vec2 flowUv = gl_FragCoord.xy / iResolution.xy;
  vec2 flow = texture(uFlowTex, flowUv).xy * 2.0 - 1.0;
  float flowMag = length(flow);
  uv -= flow * 0.05;
  float uv_len = length(uv);

  //Adding in a center swirl, changes with time. Only applies meaningfully if the 'spin amount' is a non-zero number
  float speed = (iTime * SPIN_EASE * 0.1f) + 302.2f;
  float new_pixel_angle = atan(uv.y, uv.x) + speed + flowMag * 0.12 - SPIN_EASE * 20.0 * (spin_amount * uv_len + (1.0 - spin_amount));
  vec2 mid = (iResolution.xy / length(iResolution.xy)) / 2.f;
  uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

  //Now add the paint effect to the swirled UV
  uv *= 30.f;
  speed = iTime * (1.f);
  vec2 uv2 = vec2(uv.x + uv.y);

  for(int i = 0; i < 5; i++) {
    uv2 += uv + cos(length(uv));
    uv += 0.5f * vec2(cos(5.1123314f + 0.353f * uv2.y + speed * 0.131121f), sin(uv2.x - 0.113f * speed));
    uv -= 1.0f * cos(uv.x + uv.y) - 1.0f * sin(uv.x * 0.711f - uv.y);
  }

  outColor = sampleColor(uv);
}
`;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Shader allocation failed');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || 'Shader compile failed');
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error('Program allocation failed');
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error(log || 'Program link failed');
  }
  return { program, vs, fs };
}

const themes = Array.isArray(fluidThemes) ? fluidThemes : [];
const FALLBACK_THEME = {
  color1: '#5c82ca',
  color2: '#009cff',
  color3: '#000000',
};

function hexToNormalizedRgb(hex, fallbackHex) {
  const normalized = typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex.trim()) ? hex.trim() : fallbackHex;
  return [
    parseInt(normalized.slice(1, 3), 16) / 255,
    parseInt(normalized.slice(3, 5), 16) / 255,
    parseInt(normalized.slice(5, 7), 16) / 255,
  ];
}

const FluidBackground = () => {
  const canvasRef = useRef(null);
  const { options } = useOptions();

  const fluidEnabled = options.fluidBackgroundEnabled !== false;
  const selectedTheme = useMemo(() => {
    const fallback = themes[0] || FALLBACK_THEME;
    const requested = options.fluidThemeName;
    return themes.find((theme) => theme.name === requested) || fallback;
  }, [options.fluidThemeName]);

  const color1 = useMemo(
    () => hexToNormalizedRgb(selectedTheme.color1, FALLBACK_THEME.color1),
    [selectedTheme.color1],
  );
  const color2 = useMemo(
    () => hexToNormalizedRgb(selectedTheme.color2, FALLBACK_THEME.color2),
    [selectedTheme.color2],
  );
  const color3 = useMemo(
    () => hexToNormalizedRgb(selectedTheme.color3, FALLBACK_THEME.color3),
    [selectedTheme.color3],
  );

  useEffect(() => {
    if (!fluidEnabled) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return undefined;

    let disposed = false;
    let raf = 0;
    let last = performance.now();
    let simTime = 0;
    let speedBoost = 0;
    let lastScrollY = window.scrollY;
    let mouseTargetX = 0.5;
    let mouseTargetY = 0.5;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let prevMouseX = 0.5;
    let prevMouseY = 0.5;
    let mouseVX = 0;
    let mouseVY = 0;

    let program;
    let vertexShader;
    let fragmentShader;
    try {
      const linked = createProgram(gl, vertexShaderSource, fragmentShaderSource);
      program = linked.program;
      vertexShader = linked.vs;
      fragmentShader = linked.fs;
    } catch {
      return undefined;
    }

    const flowSize = FLOW_W * FLOW_H;
    let flowX = new Float32Array(flowSize);
    let flowY = new Float32Array(flowSize);
    let nextFlowX = new Float32Array(flowSize);
    let nextFlowY = new Float32Array(flowSize);
    const flowPixels = new Uint8Array(flowSize * 4);

    for (let i = 0; i < flowPixels.length; i += 4) {
      flowPixels[i] = 128;
      flowPixels[i + 1] = 128;
      flowPixels[i + 2] = 128;
      flowPixels[i + 3] = 255;
    }

    const flowTex = gl.createTexture();
    if (!flowTex) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return undefined;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, flowTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      FLOW_W,
      FLOW_H,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      flowPixels,
    );

    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');
    const color1Loc = gl.getUniformLocation(program, 'uColor1');
    const color2Loc = gl.getUniformLocation(program, 'uColor2');
    const color3Loc = gl.getUniformLocation(program, 'uColor3');
    const flowTexLoc = gl.getUniformLocation(program, 'uFlowTex');

    const resize = () => {
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
    };

    const updateFlowField = (dt) => {
      const decay = Math.exp(-dt * 0.5);

      for (let i = 0; i < flowSize; i += 1) {
        flowX[i] *= decay;
        flowY[i] *= decay;
      }

      for (let y = 0; y < FLOW_H; y += 1) {
        const rowOffset = y * FLOW_W;
        for (let x = 0; x < FLOW_W; x += 1) {
          const idx = rowOffset + x;
          const left = x > 0 ? idx - 1 : idx;
          const right = x < FLOW_W - 1 ? idx + 1 : idx;
          const up = y > 0 ? idx - FLOW_W : idx;
          const down = y < FLOW_H - 1 ? idx + FLOW_W : idx;

          nextFlowX[idx] =
            flowX[idx] * 0.7 +
            (flowX[left] + flowX[right] + flowX[up] + flowX[down]) * 0.075;
          nextFlowY[idx] =
            flowY[idx] * 0.7 +
            (flowY[left] + flowY[right] + flowY[up] + flowY[down]) * 0.075;
        }
      }

      [flowX, nextFlowX] = [nextFlowX, flowX];
      [flowY, nextFlowY] = [nextFlowY, flowY];

      const speed = Math.hypot(mouseVX, mouseVY);
      if (speed > 0.0002) {
        const cx = Math.floor(mouseX * (FLOW_W - 1));
        const cy = Math.floor(mouseY * (FLOW_H - 1));
        const radius = 18;
        const radiusSq = radius * radius;
        const strength = clamp(speed * 0.16, 0.04, 0.38);
        const minX = Math.max(0, cx - radius);
        const maxX = Math.min(FLOW_W - 1, cx + radius);
        const minY = Math.max(0, cy - radius);
        const maxY = Math.min(FLOW_H - 1, cy + radius);
        const falloff = radiusSq * 0.42;

        for (let y = minY; y <= maxY; y += 1) {
          const ry = y - cy;
          for (let x = minX; x <= maxX; x += 1) {
            const rx = x - cx;
            const d2 = rx * rx + ry * ry;
            if (d2 > radiusSq) continue;

            const w = Math.exp(-d2 / falloff);
            const tx = -ry;
            const ty = rx;
            const idx = y * FLOW_W + x;
            const addX = (mouseVX * 0.85 + tx * speed * 0.45) * w * strength;
            const addY = (mouseVY * 0.85 + ty * speed * 0.45) * w * strength;

            flowX[idx] = clamp(flowX[idx] + addX, -2, 2);
            flowY[idx] = clamp(flowY[idx] + addY, -2, 2);
          }
        }
      }

      for (let i = 0; i < flowSize; i += 1) {
        const fx = clamp(flowX[i] * 0.25 + 0.5, 0, 1);
        const fy = clamp(flowY[i] * 0.25 + 0.5, 0, 1);
        const p = i * 4;
        flowPixels[p] = Math.round(fx * 255);
        flowPixels[p + 1] = Math.round(fy * 255);
        flowPixels[p + 2] = 128;
        flowPixels[p + 3] = 255;
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, flowTex);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        FLOW_W,
        FLOW_H,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        flowPixels,
      );
    };

    const render = () => {
      if (disposed) return;
      raf = requestAnimationFrame(render);

      resize();

      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const safeDt = Math.max(dt, 0.0001);

      mouseX = mouseTargetX;
      mouseY = mouseTargetY;
      const instVX = (mouseX - prevMouseX) / safeDt;
      const instVY = (mouseY - prevMouseY) / safeDt;
      mouseVX = clamp(mouseVX * 0.85 + instVX * 0.15, -3, 3);
      mouseVY = clamp(mouseVY * 0.85 + instVY * 0.15, -3, 3);
      prevMouseX = mouseX;
      prevMouseY = mouseY;

      updateFlowField(dt);

      // Super slow base movement + temporary acceleration from scrolling.
      speedBoost *= 0.9;
      const timeScale = 1 + Math.min(7, speedBoost);
      simTime += dt * timeScale;

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, flowTex);
      if (flowTexLoc !== null) {
        gl.uniform1i(flowTexLoc, 0);
      }
      gl.uniform1f(iTimeLoc, simTime);
      gl.uniform3f(iResolutionLoc, canvas.width, canvas.height, 1.0);
      gl.uniform4f(color1Loc, color1[0], color1[1], color1[2], 1.0);
      gl.uniform4f(color2Loc, color2[0], color2[1], color2[2], 1.0);
      gl.uniform4f(color3Loc, color3[0], color3[1], color3[2], 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onWheel = (e) => {
      speedBoost = Math.min(4.0, speedBoost + Math.min(1.2, Math.abs(e.deltaY) * 0.0025));
    };

    const onScroll = () => {
      const y = window.scrollY;
      const delta = Math.abs(y - lastScrollY);
      lastScrollY = y;
      if (delta > 0) {
        speedBoost = Math.min(4.0, speedBoost + Math.min(1.0, delta * 0.03));
      }
    };

    const onPointerMove = (event) => {
      mouseTargetX = clamp(event.clientX / window.innerWidth, 0, 1);
      mouseTargetY = clamp(1 - event.clientY / window.innerHeight, 0, 1);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.deleteTexture(flowTex);
      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [fluidEnabled, color1, color2, color3]);

  if (!fluidEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-100"
      aria-hidden="true"
    />
  );
};

export default FluidBackground;
