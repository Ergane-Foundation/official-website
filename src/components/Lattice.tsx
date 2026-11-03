'use client';

// Hero network lattice: a procedural point/line mesh rendered with react-three-fiber and a custom shader.
// No models or textures. Packets (bright bands) travel along each row and the mesh deflects away from the cursor.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from './hooks';

const NX = 64;
const NY = 34;

const vertexShader = /* glsl */ `
  uniform float t, asp, pr;
  uniform vec2 m;                  // cursor in clip space
  varying float k;
  float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
  void main(){
    vec2 a = position.xy;          // lattice coords, [-1,1]
    float row = floor((a.y * .5 + .5) * ${NY - 1}.0 + .5);
    float col = floor((a.x * .5 + .5) * ${NX - 1}.0 + .5);
    vec2 p = a;
    p.y += sin(a.x * 3. + t * .6) * .02 + cos(a.y * 4. - t * .5) * .02;
    float z = a.y * .35;           // shallow tilt for depth
    float s = 1. / (1. + z * .6);
    vec2 c = vec2(p.x * s, (p.y * .85 - .05) * s);
    vec2 d = (c - m) * vec2(asp, 1.);
    c += normalize(d + 1e-4) * exp(-dot(d, d) * 14.) * .1 / vec2(asp, 1.);
    float ph = fract(t * .11 + h(row));   // a packet per row, own phase
    float pulse = exp(-pow((a.x * .5 + .5 - ph) * 26., 2.)) * step(.55, h(row * 7.3));  // ~45% of rows carry one
    float node = step(.985, h(row * 91. + col));
    k = pulse + node * .6;
    gl_Position = vec4(c, 0., 1.);   // clip space directly, the camera is irrelevant
    gl_PointSize = (2.6 + pulse * 3.5 + node * 2.5) * pr * s;
  }`;

const fragmentShader = /* glsl */ `
  uniform vec3 base, hi;
  uniform float pt;
  varying float k;
  void main(){
    float a = 1., kk = k;
    if (pt > .5) { float d = length(gl_PointCoord - .5); if (d > .5) discard; a = smoothstep(.5, .25, d); } else kk *= .3;
    gl_FragColor = vec4(mix(base, hi, clamp(kk * 1.4 - .1, 0., 1.)), clamp((pt > .5 ? .8 : .5) + kk, 0., 1.) * a);
  }`;

const hex = (css: string) => {
  const n = parseInt(css.trim().slice(1), 16);
  return new THREE.Vector3((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

function Mesh({ animate }: { animate: boolean }) {
  const { gl, size, invalidate } = useThree();
  const mouse = useMemo(() => ({ x: 2, y: 2, tx: 2, ty: 2 }), []); // off-screen until the pointer arrives

  const { points, lines, uniforms } = useMemo(() => {
    const pos = new Float32Array(NX * NY * 3);
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) pos.set([(x / (NX - 1)) * 2 - 1, (y / (NY - 1)) * 2 - 1, 0], (y * NX + x) * 3);
    const idx: number[] = [];
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const i = y * NX + x;
      if (x < NX - 1) idx.push(i, i + 1);
      if (y < NY - 1) idx.push(i, i + NX);
    }
    const attr = new THREE.BufferAttribute(pos, 3);
    const pointsGeo = new THREE.BufferGeometry().setAttribute('position', attr);
    const linesGeo = new THREE.BufferGeometry().setAttribute('position', attr).setIndex(idx);
    const u = {
      t: { value: 0 }, asp: { value: 1 }, pr: { value: 1 },
      m: { value: new THREE.Vector2(2, 2) },
      base: { value: new THREE.Vector3() }, hi: { value: new THREE.Vector3() },
    };
    const material = (pt: number) => new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { ...u, pt: { value: pt } }, transparent: true, depthTest: false, depthWrite: false });
    return {
      points: { geometry: pointsGeo, material: material(1) },
      lines: { geometry: linesGeo, material: material(0) },
      uniforms: u,
    };
  }, []);

  // Free GPU buffers when the hero unmounts; a paused ('demand') loop still needs one more frame when `animate` flips.
  useEffect(() => () => {
    points.geometry.dispose(); lines.geometry.dispose(); points.material.dispose(); lines.material.dispose();
  }, [points, lines]);
  useEffect(() => invalidate(), [animate, invalidate]);

  // Colours follow the active theme tokens.
  useEffect(() => {
    const apply = () => {
      const cs = getComputedStyle(document.documentElement);
      uniforms.base.value.copy(hex(cs.getPropertyValue('--acc')));
      uniforms.hi.value.copy(hex(cs.getPropertyValue('--amb')));
      invalidate();
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [uniforms, invalidate]);

  useEffect(() => {
    uniforms.pr.value = gl.getPixelRatio();
    uniforms.asp.value = size.width / Math.max(size.height, 1);
  }, [gl, size, uniforms]);

  // Pointer position over the whole hero (the canvas itself sits behind the text).
  useEffect(() => {
    const hero = gl.domElement.closest('.hero');
    if (!hero) return;
    const move = (e: Event) => {
      const ev = e as PointerEvent;
      const r = gl.domElement.getBoundingClientRect();
      mouse.tx = ((ev.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = 1 - ((ev.clientY - r.top) / r.height) * 2;
    };
    const leave = () => { mouse.tx = mouse.ty = 2; };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', leave);
    return () => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); };
  }, [gl, mouse]);

  useFrame(({ clock }) => {
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    uniforms.t.value = animate ? clock.elapsedTime : 3;
    uniforms.m.value.set(mouse.x, mouse.y);
  });

  return (
    <>
      <lineSegments geometry={lines.geometry} material={lines.material} frustumCulled={false} />
      <points geometry={points.geometry} material={points.material} frustumCulled={false} />
    </>
  );
}

// A missing WebGL context must not break the page; the hero just has no background.
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Lattice() {
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced] = useState(prefersReducedMotion);

  // Pause the render loop entirely once the hero is off-screen or the tab is hidden.
  useEffect(() => {
    const hero = document.querySelector('.hero');
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    if (hero) io.observe(hero);
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  const animate = !reduced && inView && tabVisible;
  return (
    <div className={`lattice${ready ? ' on' : ''}`} aria-hidden="true">
      <Boundary>
        <Canvas
          orthographic
          dpr={[1, 1.5]} // cap pixel ratio so 4K screens stay cheap
          frameloop={animate ? 'always' : 'demand'}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
          onCreated={() => setReady(true)}
        >
          <Mesh animate={animate} />
        </Canvas>
      </Boundary>
    </div>
  );
}
