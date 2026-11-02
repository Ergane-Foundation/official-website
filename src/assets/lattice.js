// Hero network lattice: a procedural WebGL point/line mesh. No assets, no dependencies.
// Packets (bright bands) travel along each row; the mesh deflects away from the cursor.
(() => {
  const canvas = document.getElementById('lattice');
  if (!canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const start = () => {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const NX = 64, NY = 34;
    const vs = `
      attribute vec2 a;               // lattice coords, [-1,1]
      uniform float t, asp, pr;
      uniform vec2 m;                 // cursor in clip space
      varying float k;
      float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      void main(){
        float row = floor((a.y * .5 + .5) * ${NY - 1}.0 + .5);
        float col = floor((a.x * .5 + .5) * ${NX - 1}.0 + .5);
        vec2 p = a;
        p.y += sin(a.x * 3. + t * .6) * .02 + cos(a.y * 4. - t * .5) * .02;
        float z = a.y * .35;                         // shallow tilt for depth
        float s = 1. / (1. + z * .6);
        vec2 c = vec2(p.x * s, (p.y * .85 - .05) * s);
        vec2 d = (c - m) * vec2(asp, 1.);
        c += normalize(d + 1e-4) * exp(-dot(d, d) * 14.) * .1 / vec2(asp, 1.);
        float ph = fract(t * .11 + h(row));          // a packet per row, own phase
        float pulse = exp(-pow((a.x * .5 + .5 - ph) * 26., 2.)) * step(.55, h(row * 7.3));  // only ~45% of rows carry a packet
        float node = step(.985, h(row * 91. + col));
        k = pulse + node * .6;
        gl_Position = vec4(c, 0., 1.);
        gl_PointSize = (2.6 + pulse * 3.5 + node * 2.5) * pr * s;
      }`;
    const fs = `
      precision mediump float;
      uniform vec3 base, hi;
      uniform float pt;
      varying float k;
      void main(){
        float a = 1., kk = k;
        if (pt > .5) { float d = length(gl_PointCoord - .5); if (d > .5) discard; a = smoothstep(.5, .25, d); } else kk *= .3;
        gl_FragColor = vec4(mix(base, hi, clamp(kk * 1.4 - .1, 0., 1.)), clamp((pt > .5 ? .8 : .5) + kk, 0., 1.) * a);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const pts = new Float32Array(NX * NY * 2);
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) pts.set([(x / (NX - 1)) * 2 - 1, (y / (NY - 1)) * 2 - 1], (y * NX + x) * 2);
    const lines = [];
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const i = y * NX + x;
      if (x < NX - 1) lines.push(i, i + 1);
      if (y < NY - 1) lines.push(i, i + NX);
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const U = (n) => gl.getUniformLocation(prog, n);
    const u = { t: U('t'), asp: U('asp'), pr: U('pr'), pt: U('pt'), m: U('m'), base: U('base'), hi: U('hi') };

    // colours follow the active theme tokens
    const rgb = (v) => { const n = parseInt(v.trim().slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
    const theme = () => {
      const cs = getComputedStyle(document.documentElement);
      gl.uniform3fv(u.base, rgb(cs.getPropertyValue('--acc')));
      gl.uniform3fv(u.hi, rgb(cs.getPropertyValue('--amb')));
    };
    new MutationObserver(() => { theme(); if (!running) frame(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    theme();

    let w = 0, h = 0, running = false, visible = true;
    const mouse = { x: 2, y: 2, tx: 2, ty: 2 };       // off-screen until the pointer arrives
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = 1 - ((e.clientY - r.top) / r.height) * 2;
    });
    hero.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = 2; });

    const resize = () => {
      const pr = Math.min(window.devicePixelRatio || 1, 1.5);     // cap DPR so 4K screens stay cheap
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * pr); canvas.height = Math.round(h * pr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(u.pr, pr);
      gl.uniform1f(u.asp, w / Math.max(h, 1));
    };
    new ResizeObserver(() => { resize(); if (!running) frame(0); }).observe(canvas);
    resize();

    const t0 = performance.now();
    function frame(now) {
      mouse.x += (mouse.tx - mouse.x) * .08;
      mouse.y += (mouse.ty - mouse.y) * .08;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.t, reduced ? 3 : (now - t0) / 1000);
      gl.uniform2f(u.m, mouse.x, mouse.y);
      gl.uniform1f(u.pt, 0);
      gl.drawElements(gl.LINES, lines.length, gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(u.pt, 1);
      gl.drawArrays(gl.POINTS, 0, NX * NY);
      if (running) requestAnimationFrame(frame);
    }
    const sync = () => {
      const go = !reduced && visible && !document.hidden;
      if (go && !running) { running = true; requestAnimationFrame(frame); } else if (!go) running = false;
    };
    // pause the loop entirely once the hero scrolls out of view
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    frame(0);
    sync();
    canvas.classList.add('on');
  };

  // never compete with first paint
  (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(start, { timeout: 1200 });
})();
