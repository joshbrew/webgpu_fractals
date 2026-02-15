(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // shaders/fractalComponent.html
  var fractalComponent_default = `<!-- shaders/fractalComponent.html -->\r
<div id="canvas-container">\r
  <canvas id="gpu-canvas"></canvas>\r
\r
  <aside id="ui" class="sidebar" aria-label="Fractal controls">\r
    <div class="ui-header">\r
      <div class="ui-header-left">\r
        <span class="ui-brand" aria-hidden="true">\u2630</span>\r
        <div class="ui-title">\r
          <div class="ui-title-main">Fractal Controls</div>\r
          <div class="ui-title-sub">\r
            Click canvas to lock mouse. ESC to release.\r
          </div>\r
        </div>\r
      </div>\r
\r
      <button\r
        id="toggle-ui"\r
        type="button"\r
        class="icon-btn"\r
        aria-label="Toggle sidebar"\r
        aria-controls="ui-content"\r
        aria-expanded="true"\r
        title="Collapse sidebar"\r
      >\r
        \u25C0\r
      </button>\r
    </div>\r
\r
    <div id="ui-content" class="sidebar-body">\r
      <div class="row button-row">\r
        <button\r
          id="resetCameraBtn"\r
          type="button"\r
          title="Reset camera position and look direction"\r
        >\r
          Reset Camera\r
        </button>\r
\r
        <button\r
          id="exportCanvasBtn"\r
          type="button"\r
          title="Save a PNG of the current canvas"\r
        >\r
          Save PNG\r
        </button>\r
\r
        <button\r
          id="exportFullBtn"\r
          type="button"\r
          title="Save a full-resolution PNG render (uses Resolution)"\r
        >\r
          Save Full-Res\r
        </button>\r
      </div>\r
\r
      <details class="section" open>\r
        <summary>\r
          <span class="section-title">Preset</span>\r
          <span class="section-badge" title="Copy/paste settings">json</span>\r
        </summary>\r
\r
        <div class="row">\r
          <div class="hint">\r
            Export copies your current UI settings as JSON. Paste JSON and Apply\r
            to restore.\r
          </div>\r
\r
          <textarea\r
            id="presetJson"\r
            class="preset-textarea numeric-input mono"\r
            spellcheck="false"\r
            placeholder='{"version":1,"controls":{...}}'\r
            aria-label="Preset JSON"\r
          ></textarea>\r
\r
          <div class="preset-buttons">\r
            <button\r
              id="presetExportBtn"\r
              type="button"\r
              class="mini-btn"\r
              title="Generate JSON from current UI"\r
            >\r
              Export\r
            </button>\r
            <button\r
              id="presetCopyBtn"\r
              type="button"\r
              class="mini-btn"\r
              title="Copy JSON to clipboard"\r
            >\r
              Copy\r
            </button>\r
            <button\r
              id="presetPasteBtn"\r
              type="button"\r
              class="mini-btn subtle"\r
              title="Paste JSON from clipboard"\r
            >\r
              Paste\r
            </button>\r
            <button\r
              id="presetApplyBtn"\r
              type="button"\r
              class="mini-btn"\r
              title="Apply JSON settings"\r
            >\r
              Apply\r
            </button>\r
          </div>\r
\r
          <div id="presetStatus" class="preset-status" aria-live="polite"></div>\r
        </div>\r
      </details>\r
\r
      <details class="section" open>\r
        <summary>\r
          <span class="section-title">View</span>\r
          <span class="section-badge" title="Things that change performance"\r
            >perf</span\r
          >\r
        </summary>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Internal render resolution (GPU grid size). Higher values cost more GPU time."\r
          >\r
            <span class="lbl">Resolution</span>\r
            <input\r
              id="gridSize"\r
              type="range"\r
              min="64"\r
              max="8192"\r
              step="64"\r
              value="1024"\r
            />\r
            <input\r
              id="gridSizeOut"\r
              class="numeric-input"\r
              type="number"\r
              min="64"\r
              max="8192"\r
              step="64"\r
              value="1024"\r
            />\r
          </label>\r
          <div class="hint">\r
            Higher = sharper. If it stutters, drop this first.\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <label class="control select" title="Render output mode">\r
            <span class="lbl">Render mode</span>\r
            <select\r
              id="renderMode"\r
              title="Fractal rendering, slab view, or raw debug output"\r
            >\r
              <option value="fractal">Fractal</option>\r
              <option value="slab">Slab</option>\r
              <option value="raw">Raw</option>\r
            </select>\r
            <span class="spacer"></span>\r
          </label>\r
          <div class="hint">\r
            Slab is a marching squares test. Raw is a debug view.\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control select"\r
            title="Controls final canvas alpha compositing mode"\r
          >\r
            <span class="lbl">Alpha mode</span>\r
            <select\r
              id="alphaMode"\r
              title="How transparency is applied to rendered pixels"\r
            >\r
              <option value="0">Opaque</option>\r
              <option value="1">Fade out</option>\r
              <option value="2">Reverse fade</option>\r
            </select>\r
            <span class="spacer"></span>\r
          </label>\r
        </div>\r
      </details>\r
\r
      <details class="section" open>\r
        <summary>\r
          <span class="section-title">Fractal</span>\r
          <span class="section-badge" title="Core equation settings">core</span>\r
        </summary>\r
\r
        <div class="row">\r
          <label\r
            title="Select the fractal equation family"\r
            class="control select"\r
          >\r
            <span class="lbl">Fractal</span>\r
            <select id="fractalType" title="Choose the fractal formula (0-71)">\r
              <option value="0">Mandelbrot</option>\r
              <option value="1">Tricorn</option>\r
              <option value="2">Burning Ship</option>\r
              <option value="3">Perpendicular Mandelbrot</option>\r
              <option value="4">Celtic</option>\r
              <option value="5">Buffalo</option>\r
              <option value="6">Phoenix</option>\r
              <option value="7">Cubic Multibrot (z\xB3 + c)</option>\r
              <option value="8">Quartic Multibrot (z\u2074 + c)</option>\r
              <option value="9">Cosine</option>\r
              <option value="10">Sine</option>\r
              <option value="11">Heart</option>\r
              <option value="12">Perpendicular Buffalo</option>\r
              <option value="13">Spiral Mandelbrot</option>\r
              <option value="14">Quintic Multibrot (z\u2075 + c)</option>\r
              <option value="15">Sextic Multibrot (z\u2076 + c)</option>\r
              <option value="16">Tangent (tan z + c)</option>\r
              <option value="17">Exponential (exp z + c)</option>\r
              <option value="18">Septic Multibrot (z\u2077 + c)</option>\r
              <option value="19">Octic Multibrot (z\u2078 + c)</option>\r
              <option value="20">Inverse Mandelbrot (1/z\xB2 + c)</option>\r
              <option value="21">Burning Ship Deep Zoom</option>\r
              <option value="22">Cubic Burning Ship (|z|\xB3 + c)</option>\r
              <option value="23">Quartic Burning Ship (|z|\u2074 + c)</option>\r
              <option value="24">Quintic Burning Ship (|z|\u2075 + c)</option>\r
              <option value="25">Hexic Burning Ship (|z|\u2076 + c)</option>\r
              <option value="26">Nova (Newton z\xB3\u22121)</option>\r
              <option value="27">Man-o-War</option>\r
              <option value="28">Stretched Celtic Spiral</option>\r
              <option value="29">Polar-Flame</option>\r
              <option value="30">Inverse Cubic (1/z\xB3 + c)</option>\r
              <option value="31">Inverse Quartic (1/z\u2074 + c)</option>\r
              <option value="32">Inverse Quintic (1/z\u2075 + c)</option>\r
              <option value="33">Inverse Sextic (1/z\u2076 + c)</option>\r
              <option value="34">Inverse Septic (1/z\u2077 + c)</option>\r
              <option value="35">Inverse Octic (1/z\u2078 + c)</option>\r
              <option value="36">Inverse Burning Ship</option>\r
              <option value="37">Inverse Tricorn</option>\r
              <option value="38">Inverse Celtic</option>\r
              <option value="39">Inverse Phoenix</option>\r
              <option value="40">Tri-Nova</option>\r
              <option value="41">Nova-Mandelbrot</option>\r
              <option value="42">Nova 2 (inverse)</option>\r
              <option value="43">Nova 2 variant</option>\r
              <option value="44">Quartic-Nova</option>\r
              <option value="45">Flower Nova</option>\r
              <option value="46">Scatter-Nova</option>\r
              <option value="47">Twisted-Flower Nova</option>\r
              <option value="48">Lobed-Scatter Nova</option>\r
              <option value="49">Hybrid-FlScatter Nova</option>\r
              <option value="50">Fractional-Nova (p\u22483.7)</option>\r
              <option value="51">Kaleido-Nova</option>\r
              <option value="52">Cross-Nova</option>\r
              <option value="53">Mirror-Nova</option>\r
              <option value="54">Spiro-Nova</option>\r
              <option value="55">Vibrant-Nova</option>\r
              <option value="56">Julia-Nova Hybrid</option>\r
              <option value="57">Inverse-Spiral Nova</option>\r
              <option value="58">Wavefront Nova</option>\r
              <option value="59">Vortex Nova</option>\r
              <option value="60">Sine Ring Nova</option>\r
              <option value="61">Inverse-Spiral Nova 2</option>\r
              <option value="62">Inverse-Vortex Nova</option>\r
              <option value="63">Inverse Sine Ring Nova</option>\r
              <option value="64">Inverse-Mirror Nova</option>\r
              <option value="65">Inverse-Vibrant Nova</option>\r
              <option value="66">Golden-Ratio Rational</option>\r
              <option value="67">SinCos-Kernel</option>\r
              <option value="68">Golden-Push-Pull</option>\r
              <option value="69">Sinc-Kernel</option>\r
              <option value="70">Bizarre Grid (set x/y to 1)</option>\r
              <option value="71">Julia (use Pan X/Y)</option>\r
            </select>\r
            <input\r
              id="fractalTypeOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="71"\r
              step="1"\r
              value="0"\r
            />\r
          </label>\r
          <div class="hint">Julia uses Pan X and Pan Y as the constant.</div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Control zoom scale (size of the complex plane window)"\r
          >\r
            <span class="lbl">Zoom</span>\r
            <input\r
              id="zoom"\r
              type="range"\r
              min="0.00000001"\r
              max="10"\r
              step="0.000001"\r
              value="4.0"\r
            />\r
            <input\r
              id="zoomOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0.00000001"\r
              max="10"\r
              step="0.000001"\r
              value="4.00"\r
            />\r
          </label>\r
          <div class="hint">Lower zoom = deeper zoom-in.</div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Shift the view left/right in the complex plane"\r
          >\r
            <span class="lbl">Pan X</span>\r
            <input\r
              id="dx"\r
              type="range"\r
              min="-2"\r
              max="2"\r
              step="0.00001"\r
              value="0.0"\r
            />\r
            <input\r
              id="dxOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-2"\r
              max="2"\r
              step="0.00001"\r
              value="0.00"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Shift the view up/down in the complex plane"\r
          >\r
            <span class="lbl">Pan Y</span>\r
            <input\r
              id="dy"\r
              type="range"\r
              min="-2"\r
              max="2"\r
              step="0.00001"\r
              value="0.0"\r
            />\r
            <input\r
              id="dyOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-2"\r
              max="2"\r
              step="0.00001"\r
              value="0.00"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Higher values reveal more detail but increase render time"\r
          >\r
            <span class="lbl">Max Iter</span>\r
            <input\r
              id="maxIter"\r
              type="range"\r
              min="50"\r
              max="5000"\r
              step="50"\r
              value="150"\r
            />\r
            <input\r
              id="maxIterOut"\r
              class="numeric-input"\r
              type="number"\r
              min="50"\r
              max="5000"\r
              step="50"\r
              value="150"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Escape threshold (distance where the orbit is considered divergent)"\r
          >\r
            <span class="lbl">Escape R</span>\r
            <input\r
              id="escapeR"\r
              type="range"\r
              min="1"\r
              max="20"\r
              step="0.1"\r
              value="4.0"\r
            />\r
            <input\r
              id="escapeROut"\r
              class="numeric-input"\r
              type="number"\r
              min="1"\r
              max="20"\r
              step="0.1"\r
              value="4.0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control check"\r
            title="Toggle convergence-based termination for Newton or hybrid maps"\r
          >\r
            <input id="convergenceTest" type="checkbox" />\r
            <span class="check-text">Convergence test</span>\r
          </label>\r
          <div class="hint">\r
            Turn on for Newton-like fractals to stop when they settle on a root.\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control select"\r
            title="Whether the iteration should escape when diverging or converge toward a root"\r
          >\r
            <span class="lbl">Escape mode</span>\r
            <select id="escapeMode" title="Divergence or convergence mode">\r
              <option value="0">Converge</option>\r
              <option value="1">Diverge</option>\r
            </select>\r
            <input\r
              id="escapeModeOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="1"\r
              step="1"\r
              value="0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Convergence tolerance for Newton-like fractals"\r
          >\r
            <span class="lbl">Epsilon</span>\r
            <input\r
              id="epsilon"\r
              type="range"\r
              min="0.000001"\r
              max="0.01"\r
              step="0.000001"\r
              value="0.000001"\r
            />\r
            <input\r
              id="epsilonOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0.000001"\r
              max="0.01"\r
              step="0.000001"\r
              value="0.000001"\r
            />\r
          </label>\r
        </div>\r
      </details>\r
\r
      <details class="section" open>\r
        <summary>\r
          <span class="section-title">Color</span>\r
          <span class="section-badge" title="Palette + mapping">look</span>\r
        </summary>\r
\r
        <div class="row">\r
          <label\r
            class="control select"\r
            title="Choose the color palette used for mapping iterations to RGB"\r
          >\r
            <span class="lbl">Palette</span>\r
            <select\r
              id="colorScheme"\r
              title="Choose the color palette used for mapping iterations to RGB"\r
            >\r
              <option value="0">Violet-Cyan-White</option>\r
              <option value="6">Grayscale</option>\r
              <option value="1">Fire</option>\r
              <option value="2">Ice</option>\r
              <option value="3">Sunset</option>\r
              <option value="4">Forest</option>\r
              <option value="5">Neon</option>\r
              <option value="7">Inferno</option>\r
              <option value="8">Rainbow 360\xB0</option>\r
              <option value="9">Rainbow 720\xB0</option>\r
              <option value="10">Pastel Loop</option>\r
              <option value="11">Viridis-ish</option>\r
              <option value="12">Magma</option>\r
              <option value="13">Plasma</option>\r
              <option value="14">Cividis</option>\r
              <option value="15">Ocean</option>\r
              <option value="16">Midnight Blue</option>\r
              <option value="17">Cool-Warm Diverge</option>\r
              <option value="18">Rainbow 1080\xB0 (3 loops)</option>\r
              <option value="19">Rainbow 1440\xB0 (4 loops)</option>\r
              <option value="20">Pastel 5-loop</option>\r
              <option value="21">Thermal</option>\r
              <option value="22">Turbulent Wave</option>\r
              <option value="23">Autumn</option>\r
              <option value="24">Spring</option>\r
              <option value="25">Summer</option>\r
              <option value="26">Mono-loop (10\xD7 grayscale flicker)</option>\r
              <option value="27">High-contrast Diverging</option>\r
              <option value="28">Sine-wave Hue</option>\r
              <option value="29">Sawtooth Loop (3 loops)</option>\r
              <option value="30">Rainbow 2160\xB0 (6 loops)</option>\r
              <option value="31">Triangle-wave 8 loops</option>\r
              <option value="32">Exponential 12 loops</option>\r
              <option value="33">Sawtooth 10 loops + offset</option>\r
            </select>\r
            <input\r
              id="colorSchemeOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="33"\r
              step="1"\r
              value="0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Shift the global hue of the palette (wraps the color wheel)"\r
          >\r
            <span class="lbl">Hue offset</span>\r
            <input\r
              id="hueOffset"\r
              type="range"\r
              min="-1"\r
              max="1"\r
              step="0.001"\r
              value="0"\r
            />\r
            <input\r
              id="hueOffsetOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-1"\r
              max="1"\r
              step="0.001"\r
              value="0.00"\r
            />\r
          </label>\r
        </div>\r
      </details>\r
\r
      <details class="section">\r
        <summary>\r
          <span class="section-title">Warps</span>\r
          <span\r
            class="section-badge"\r
            title="Ordered ops list. Duplicates allowed."\r
            >ops</span\r
          >\r
        </summary>\r
\r
        <div class="row">\r
          <div class="hint">\r
            Build an ordered list of coordinate warps. Duplicates allowed. Only\r
            the first 16 ops are used.\r
          </div>\r
\r
          <div class="scale-toolbar">\r
            <select id="scaleOpPicker" title="Choose a warp op to add"></select>\r
\r
            <button\r
              id="scaleOpAdd"\r
              type="button"\r
              class="mini-btn"\r
              title="Add the selected op to the list"\r
            >\r
              Add\r
            </button>\r
\r
            <button\r
              id="scaleOpClear"\r
              type="button"\r
              class="mini-btn subtle"\r
              title="Clear the op list"\r
            >\r
              Clear\r
            </button>\r
\r
            <span\r
              id="scaleOpsCount"\r
              class="pill"\r
              title="How many ops are currently in the list (max 16 used)"\r
            >\r
              0/16\r
            </span>\r
\r
            <input\r
              id="scaleOpsOut"\r
              class="numeric-input mono"\r
              type="text"\r
              value=""\r
              readonly\r
              title="Current op list (codes)"\r
            />\r
          </div>\r
\r
          <div\r
            id="scaleOpsList"\r
            class="scale-ops-list"\r
            aria-label="Selected scale ops"\r
          ></div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Iteration-based parameter used by warp modes"\r
          >\r
            <span class="lbl">Gamma</span>\r
            <input\r
              id="gamma"\r
              type="range"\r
              min="-50"\r
              max="50"\r
              step="0.001"\r
              value="1.0"\r
            />\r
            <input\r
              id="gammaOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-50"\r
              max="50"\r
              step="0.001"\r
              value="1.0"\r
            />\r
          </label>\r
          <div class="hint">\r
            Warp intensity often lives here. Try small steps first.\r
          </div>\r
        </div>\r
      </details>\r
\r
      <details class="section">\r
        <summary>\r
          <span class="section-title">Threshold + Mask</span>\r
          <span class="section-badge" title="Clamp and mask outputs">mask</span>\r
        </summary>\r
\r
        <div class="row">\r
          <label\r
            class="control select"\r
            title="What field the threshold masking operates on"\r
          >\r
            <span class="lbl">Basis</span>\r
            <select id="thresholdBasis" title="Choose threshold basis">\r
              <option value="0">Inner</option>\r
              <option value="1">Outer</option>\r
              <option value="2">Height (normalized)</option>\r
            </select>\r
            <input\r
              id="thresholdBasisOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="2"\r
              step="1"\r
              value="0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label class="control slider" title="Lower clamp for threshold mask">\r
            <span class="lbl">Low</span>\r
            <input\r
              id="lowThresh"\r
              type="range"\r
              min="0"\r
              max="1"\r
              step="0.01"\r
              value="0.00"\r
            />\r
            <input\r
              id="lowThreshOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="1"\r
              step="0.01"\r
              value="0.00"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label class="control slider" title="Upper clamp for threshold mask">\r
            <span class="lbl">High</span>\r
            <input\r
              id="highThresh"\r
              type="range"\r
              min="0"\r
              max="1"\r
              step="0.01"\r
              value="1.00"\r
            />\r
            <input\r
              id="highThreshOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="1"\r
              step="0.01"\r
              value="1.00"\r
            />\r
          </label>\r
        </div>\r
      </details>\r
\r
      <details class="section">\r
        <summary>\r
          <span class="section-title">Layer Stack</span>\r
          <span class="section-badge" title="Multi-layer gamma-stepped stacks"\r
            >stack</span\r
          >\r
        </summary>\r
\r
        <div\r
          class="row"\r
          title="Enables multi-layer gamma-stepped stacks. Turning this ON auto-sets Displacement=None, Lighting OFF, and Render mode=Fractal."\r
        >\r
          <label class="control check">\r
            <input type="checkbox" id="layerMode" />\r
            <span class="check-text">Layer mode (gamma-stepped stacks)</span>\r
          </label>\r
          <div class="hint">\r
            Good for stacked looks. It disables SDF displacement, and lighting\r
            (for now).\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Number of layers (only used when Layer Mode is enabled)"\r
          >\r
            <span class="lbl">Layers</span>\r
            <input\r
              id="nLayers"\r
              type="range"\r
              min="1"\r
              max="128"\r
              step="1"\r
              value="1"\r
            />\r
            <input\r
              id="nLayersOut"\r
              class="numeric-input"\r
              type="number"\r
              min="1"\r
              max="128"\r
              step="1"\r
              value="1"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Gamma increment per layer: gamma(li) = gamma + layerGammaStep * li"\r
          >\r
            <span class="lbl">Gamma step</span>\r
            <input\r
              id="layerGammaStep"\r
              type="range"\r
              min="-5"\r
              max="5"\r
              step="0.0001"\r
              value="0.001"\r
            />\r
            <input\r
              id="layerGammaStepOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-5"\r
              max="5"\r
              step="0.0001"\r
              value="0.1"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="World-space separation per layer for stacked rendering"\r
          >\r
            <span class="lbl">Separation</span>\r
            <input\r
              id="layerSeparation"\r
              type="range"\r
              min="-10"\r
              max="10"\r
              step="0.001"\r
              value="0.0"\r
            />\r
            <input\r
              id="layerSeparationOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-10"\r
              max="10"\r
              step="0.001"\r
              value="0.0"\r
            />\r
          </label>\r
        </div>\r
      </details>\r
\r
      <details class="section">\r
        <summary>\r
          <span class="section-title">Displacement + Lighting</span>\r
          <span class="section-badge" title="SDF and shading">3d</span>\r
        </summary>\r
\r
        <div class="row">\r
          <label\r
            class="control check"\r
            title="Enable radial bowl displacement for lighting/extrusion"\r
          >\r
            <input type="checkbox" id="bowlOn" />\r
            <span class="check-text">Enable bowl</span>\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Depth of the bowl displacement curve"\r
          >\r
            <span class="lbl">Bowl depth</span>\r
            <input\r
              type="range"\r
              id="bowlDepth"\r
              min="0"\r
              max="3.14"\r
              step="0.01"\r
              value="0.25"\r
            />\r
            <input\r
              id="bowlDepthOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="3.14"\r
              step="0.01"\r
              value="0.25"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Scale the on-screen quad used for rendering (for multi-pass / stacked zoom modes)"\r
          >\r
            <span class="lbl">Quad scale</span>\r
            <input\r
              id="quadScale"\r
              type="range"\r
              min="1"\r
              max="1000"\r
              step="1"\r
              value="1"\r
            />\r
            <input\r
              id="quadScaleOut"\r
              class="numeric-input"\r
              type="number"\r
              min="1"\r
              max="1000"\r
              step="1"\r
              value="1"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control select"\r
            title="Choose the type of height displacement applied to lighting / extrusion"\r
          >\r
            <span class="lbl">Disp mode</span>\r
            <select id="dispMode" title="Displacement height mapping mode">\r
              <option value="0">None</option>\r
              <option value="1">Max Peak</option>\r
              <option value="2">Min Peak</option>\r
              <option value="3">Max Peak Log</option>\r
              <option value="4">Min Peak Log</option>\r
              <option value="5">Max Peak Pow</option>\r
              <option value="6">Min Peak Pow</option>\r
            </select>\r
            <span class="spacer"></span>\r
          </label>\r
          <div class="hint">\r
            Displacement and lighting require SDF and will cost extra GPU time.\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Resolution of the displacement sampling grid"\r
          >\r
            <span class="lbl">Grid divs</span>\r
            <input\r
              id="gridDivs"\r
              type="range"\r
              min="64"\r
              max="4096"\r
              step="64"\r
              value="256"\r
            />\r
            <input\r
              id="gridDivsOut"\r
              class="numeric-input"\r
              type="number"\r
              min="64"\r
              max="4096"\r
              step="64"\r
              value="256"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Amplitude of displacement applied to lighting"\r
          >\r
            <span class="lbl">Disp amp</span>\r
            <input\r
              type="range"\r
              id="dispAmp"\r
              min="0"\r
              max="2"\r
              step="0.01"\r
              value="0.15"\r
            />\r
            <input\r
              id="dispAmpOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="2"\r
              step="0.01"\r
              value="0.15"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Curve shaping for displacement height response"\r
          >\r
            <span class="lbl">Disp curve</span>\r
            <input\r
              type="range"\r
              id="dispCurve"\r
              min="0.001"\r
              max="100"\r
              step="0.001"\r
              value="3"\r
            />\r
            <input\r
              id="dispCurveOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0.001"\r
              max="100"\r
              step="0.001"\r
              value="3"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control check"\r
            title="Enable a max-slope clamp to prevent artifacts"\r
          >\r
            <input id="dispLimitOn" type="checkbox" />\r
            <span class="check-text">Disp limit</span>\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Maximum surface slope allowed (degrees)"\r
          >\r
            <span class="lbl">Max slope</span>\r
            <input\r
              id="slopeLimit"\r
              type="range"\r
              min="0"\r
              max="91"\r
              step="0.001"\r
              value="45"\r
            />\r
            <input\r
              id="slopeLimitOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="91"\r
              step="0.001"\r
              value="45"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Maximum height discontinuity allowed (normalized units)"\r
          >\r
            <span class="lbl">Wall clamp</span>\r
            <input\r
              id="wallJump"\r
              type="range"\r
              min="0"\r
              max="1"\r
              step="0.001"\r
              value="0.05"\r
            />\r
            <input\r
              id="wallJumpOut"\r
              class="numeric-input"\r
              type="number"\r
              min="0"\r
              max="1"\r
              step="0.001"\r
              value="0.05"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control check"\r
            title="Enable Phong-style shading based on displacement height"\r
          >\r
            <input id="lightingOn" type="checkbox" />\r
            <span class="check-text">Lighting</span>\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label class="control slider" title="Light position X coordinate">\r
            <span class="lbl">Light X</span>\r
            <input\r
              id="lightX"\r
              type="range"\r
              min="-50"\r
              max="50"\r
              step="0.1"\r
              value="0"\r
            />\r
            <input\r
              id="lightXOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-50"\r
              max="50"\r
              step="0.1"\r
              value="0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label class="control slider" title="Light position Y coordinate">\r
            <span class="lbl">Light Y</span>\r
            <input\r
              id="lightY"\r
              type="range"\r
              min="-50"\r
              max="50"\r
              step="0.1"\r
              value="0"\r
            />\r
            <input\r
              id="lightYOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-50"\r
              max="50"\r
              step="0.1"\r
              value="0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Light position Z coordinate (height)"\r
          >\r
            <span class="lbl">Light Z</span>\r
            <input\r
              id="lightZ"\r
              type="range"\r
              min="-50"\r
              max="50"\r
              step="0.1"\r
              value="50"\r
            />\r
            <input\r
              id="lightZOut"\r
              class="numeric-input"\r
              type="number"\r
              min="-50"\r
              max="50"\r
              step="0.1"\r
              value="50"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row">\r
          <label\r
            class="control slider"\r
            title="Specular exponent controlling shininess"\r
          >\r
            <span class="lbl">Spec power</span>\r
            <input\r
              id="specPower"\r
              type="range"\r
              min="1"\r
              max="128"\r
              step="1"\r
              value="32"\r
            />\r
            <input\r
              id="specPowerOut"\r
              class="numeric-input"\r
              type="number"\r
              min="1"\r
              max="128"\r
              step="1"\r
              value="32"\r
            />\r
          </label>\r
        </div>\r
      </details>\r
\r
      <details class="section">\r
        <summary>\r
          <span class="section-title">Advanced</span>\r
          <span class="section-badge" title="Mostly for debugging">dbg</span>\r
        </summary>\r
\r
        <div class="row" style="display: none">\r
          <label class="control slider">\r
            <span class="lbl">zMin</span>\r
            <input id="zMin" type="number" step="0.1" value="0.0" />\r
            <input\r
              id="zMinOut"\r
              class="numeric-input"\r
              type="number"\r
              step="0.1"\r
              value="0.0"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row" style="display: none">\r
          <label class="control slider">\r
            <span class="lbl">dz</span>\r
            <input id="dz" type="number" step="0.01" value="0.2" />\r
            <input\r
              id="dzOut"\r
              class="numeric-input"\r
              type="number"\r
              step="0.01"\r
              value="0.2"\r
            />\r
          </label>\r
        </div>\r
\r
        <div class="row" style="display: none">\r
          <label class="control slider">\r
            <span class="lbl">Split max</span>\r
            <input\r
              id="splitCount"\r
              type="number"\r
              step="100000"\r
              min="100000"\r
              value="8000000"\r
            />\r
            <input\r
              id="splitCountOut"\r
              class="numeric-input"\r
              type="number"\r
              step="100000"\r
              min="100000"\r
              value="8000000"\r
            />\r
          </label>\r
        </div>\r
      </details>\r
\r
      <div class="ui-footer">\r
        <div class="kbd-line"><span class="kbd">WASD</span> move</div>\r
        <div class="kbd-line">\r
          <span class="kbd">Space</span>/<span class="kbd">C</span> up/down\r
        </div>\r
        <div class="kbd-line">\r
          <span class="kbd">Shift</span> fast,\r
          <span class="kbd">Ctrl</span> slow\r
        </div>\r
      </div>\r
    </div>\r
  </aside>\r
</div>\r
`;

  // shaders/fractalCompute.wgsl
  var fractalCompute_default = "// shaders/fractalCompute.wgsl\r\n// Compute WGSL (entry point: main)\r\nstruct Params {\r\n  gridSize: u32,\r\n  maxIter: u32,\r\n  fractalType: u32,\r\n  _padA: u32,\r\n\r\n  // 16 ordered ops (0 ends early), packed as 4 vec4<u32> for 16-byte alignment\r\n  scaleOps: array<vec4<u32>, 4>,\r\n\r\n  zoom: f32,\r\n  dx: f32,\r\n  dy: f32,\r\n  escapeR: f32,\r\n  gamma: f32,\r\n  layerIndex: u32,\r\n  epsilon: f32,\r\n  convergenceTest: u32,\r\n  escapeMode: u32,\r\n  tileOffsetX: u32,\r\n  tileOffsetY: u32,\r\n  tileWidth: u32,\r\n  tileHeight: u32,\r\n  aspect: f32,\r\n  _pad0: u32,\r\n  _pad1: u32,\r\n  _pad2: u32,        // adjust so struct size remains multiple of 16 (or fits your uniformBufferSize)\r\n};\r\n@group(0) @binding(0) var<uniform> params: Params;\r\n@group(1) @binding(0) var storageTex: texture_storage_2d_array<rgba8unorm, write>;\r\n\r\nfn scaleOpAt(i: u32) -> u32 {\r\n  let v = params.scaleOps[i >> 2u];\r\n  let j = i32(i & 3u);\r\n  return v[j];\r\n}\r\n\r\n// Helpers:\r\nfn shipPower(ax: f32, ay: f32, p: f32) -> vec2<f32> {\r\n  // r = sqrt(ax^2 + ay^2)^p ; \u03B8 = atan2(ay,ax)*p\r\n  let r2 = ax*ax + ay*ay;\r\n  // avoid negative or zero? r2>=0\r\n  let r = pow(r2, 0.5 * p);\r\n  let theta = atan2(ay, ax) * p;\r\n  return vec2<f32>(r * cos(theta), r * sin(theta));\r\n}\r\n\r\nfn invPower(qx: f32, qy: f32, p: f32) -> vec2<f32> {\r\n  // 1/(qx+ i qy)^p via polar\r\n  let r2 = qx*qx + qy*qy + 1e-9;\r\n  let rp = pow(r2, 0.5 * p);\r\n  let th = atan2(qy, qx) * p;\r\n  let inv = 1.0 / rp;\r\n  return vec2<f32>(inv * cos(th), -inv * sin(th));\r\n}\r\n\r\nstruct InitialZ { qx: f32, qy: f32, px: f32, py: f32 };\r\n\r\nfn getInitialZ(typ: u32, x0: f32, y0: f32) -> InitialZ {\r\n  // Newton-typ indices: 26,40-46\r\n  let isNewton =\r\n      (typ == 26u) || (typ == 40u) || (typ == 41u) || (typ == 42u)\r\n      || (typ == 43u) || (typ == 44u) || (typ == 45u) || (typ == 46u);\r\n  if (isNewton) {\r\n    return InitialZ(1.0, 0.0, 0.0, 0.0);\r\n  }\r\n  // inverse families 30-39 start at c\r\n  if (typ >= 30u && typ <= 39u) {\r\n    return InitialZ(x0, y0, 0.0, 0.0);\r\n  }\r\n\r\n  // Basic Julia starts at the pixel's complex coordinate c = (x0,y0)\r\n  if (typ == 71u) {\r\n    return InitialZ(x0, y0, 0.0, 0.0);\r\n  }\r\n\r\n  // default start at 0\r\n  return InitialZ(0.0, 0.0, 0.0, 0.0);\r\n}\r\n\r\n// Main fractal step returning new z and new px,py:\r\nstruct FractalResult { nx: f32, ny: f32, npx: f32, npy: f32 };\r\n\r\nfn computeFractal(\r\n  typ: u32,\r\n  qx: f32, qy: f32, px: f32, py: f32,\r\n  cx: f32, cy: f32,\r\n  gamma: f32,\r\n  iter: u32,\r\n) -> FractalResult {\r\n\r\n  let s = 1.0 + f32(iter) * (gamma - 1.0);\r\n  var ccx = cx;\r\n  var ccy = cy;\r\n\r\n  for (var ti: u32 = 0u; ti < 16u; ti = ti + 1u) {\r\n    let op = scaleOpAt(ti);\r\n    if (op == 0u) {\r\n      break;\r\n    }\r\n\r\n    switch(op) {\r\n      case 1u: { // Multiply\r\n        ccx = ccx * s;\r\n        ccy = ccy * s;\r\n      }\r\n\r\n      case 2u: { // Divide\r\n        ccx = ccx / s;\r\n        ccy = ccy / s;\r\n      }\r\n\r\n      case 3u: { // Sine warp\r\n        let m = sin(s);\r\n        ccx = ccx * m;\r\n        ccy = ccy * m;\r\n      }\r\n\r\n      case 4u: { // Tangent warp\r\n        let m = tan(s);\r\n        ccx = ccx * m;\r\n        ccy = ccy * m;\r\n      }\r\n\r\n      case 5u: { // Cosine warp\r\n        let m = cos(s);\r\n        ccx = ccx * m;\r\n        ccy = ccy * m;\r\n      }\r\n\r\n      case 6u: { // Exponential zoom\r\n        let m = exp(s);\r\n        ccx = ccx * m;\r\n        ccy = ccy * m;\r\n      }\r\n\r\n      case 7u: { // Logarithmic shrink\r\n        let m = log(s + 1e-3);\r\n        ccx = ccx * m;\r\n        ccy = ccy * m;\r\n      }\r\n\r\n      case 8u: { // Anisotropic warp (x\xB7s, y\xF7s)\r\n        ccx = ccx * s;\r\n        ccy = ccy / s;\r\n      }\r\n\r\n      case 9u: { // Rotate by s radians\r\n        let \u03B8 = s;\r\n        let x0 = ccx * cos(\u03B8) - ccy * sin(\u03B8);\r\n        let y0 = ccx * sin(\u03B8) + ccy * cos(\u03B8);\r\n        ccx = x0;\r\n        ccy = y0;\r\n      }\r\n\r\n      case 10u: { // Radial twist (r^s, \u03B8\xB7s)\r\n        let r0  = sqrt(ccx*ccx + ccy*ccy);\r\n        let \u03B80  = atan2(ccy, ccx);\r\n        let rp  = pow(r0, s);\r\n        let \u03B8p  = \u03B80 * s;\r\n        ccx = rp * cos(\u03B8p);\r\n        ccy = rp * sin(\u03B8p);\r\n      }\r\n\r\n      case 11u: { // Hyperbolic warp (sinh, cosh)\r\n        ccx = ccx * sinh(s);\r\n        ccy = ccy * cosh(s);\r\n      }\r\n\r\n      case 12u: { // Radial hyperbolic (sinh(r*s))\r\n        let r0  = sqrt(ccx*ccx + ccy*ccy);\r\n        let \u03B80  = atan2(ccy, ccx);\r\n        let rp  = sinh(r0 * s);\r\n        ccx = rp * cos(\u03B80);\r\n        ccy = rp * sin(\u03B80);\r\n      }\r\n\r\n      case 13u: { // Swirl (\u03B8 + r*s)\r\n        let r0  = sqrt(ccx*ccx + ccy*ccy);\r\n        let \u03B80  = atan2(ccy, ccx);\r\n        let \u03B8p  = \u03B80 + r0 * s;\r\n        ccx = r0 * cos(\u03B8p);\r\n        ccy = r0 * sin(\u03B8p);\r\n      }\r\n\r\n      case 14u: { // Modular wrap\r\n        let m0 = fract(s * 0.5) * 2.0;      // s mod 2\r\n        let ux = ccx * m0 + 1.0;\r\n        let uy = ccy * m0 + 1.0;\r\n        ccx = fract(ux * 0.5) * 2.0 - 1.0;\r\n        ccy = fract(uy * 0.5) * 2.0 - 1.0;\r\n      }\r\n\r\n      case 15u: { // Axis swap & scale\r\n        let tx = ccy * s;\r\n        let ty = ccx * s;\r\n        ccx = tx;\r\n        ccy = ty;\r\n      }\r\n\r\n      case 16u: { // Mixed warp (blend multiply & sine)\r\n        let \u03B1   = fract(s * 0.1);\r\n        let m1x = ccx * s;\r\n        let m2x = ccx * sin(s);\r\n        let m1y = ccy * s;\r\n        let m2y = ccy * sin(s);\r\n        ccx = mix(m1x, m2x, \u03B1);\r\n        ccy = mix(m1y, m2y, \u03B1);\r\n      }\r\n\r\n      case 17u: { // Jitter noise\r\n        let jx = fract(sin(ccx * s) * 43758.5453) - 0.5;\r\n        let jy = fract(sin(ccy * s) * 97531.2468) - 0.5;\r\n        ccx = ccx + jx * s * 0.2;\r\n        ccy = ccy + jy * s * 0.2;\r\n      }\r\n\r\n      case 18u: { // Signed power warp\r\n        ccx = sign(ccx) * pow(abs(ccx), s);\r\n        ccy = sign(ccy) * pow(abs(ccy), s);\r\n      }\r\n\r\n      case 19u: { // Smoothstep fade\r\n        let t0 = smoothstep(0.0, 1.0, s);\r\n        ccx = ccx * t0;\r\n        ccy = ccy * t0;\r\n      }\r\n\r\n      default: {}\r\n    }\r\n  }\r\n\r\n  let a = abs(qx);\r\n  let b = abs(qy);\r\n  var nx: f32 = 0.0;\r\n  var ny: f32 = 0.0;\r\n  var npx = px;\r\n  var npy = py;\r\n\r\n  switch(typ) {\r\n    case 1u: { // Tricorn\r\n      nx = qx*qx - qy*qy + ccx;\r\n      ny = -2.0*qx*qy + ccy;\r\n    }\r\n    case 2u: { // Burning Ship\r\n      nx = a*a - b*b + ccx;\r\n      ny = 2.0*a*b + ccy;\r\n    }\r\n    case 3u: { // Perpendicular Mandelbrot\r\n      nx = qx*qx - qy*qy + ccx;\r\n      ny = -2.0*a*qy + ccy;\r\n    }\r\n    case 4u: { // Celtic\r\n      nx = abs(qx*qx - qy*qy) + ccx;\r\n      ny = 2.0*qx*qy + ccy;\r\n    }\r\n    case 5u: { // Buffalo\r\n      nx = abs(qx*qx - qy*qy) + ccx;\r\n      ny = -2.0*qx*qy + ccy;\r\n    }\r\n    case 6u: { // Phoenix (\u03BB = -0.5)\r\n      nx = qx*qx - qy*qy + ccx - 0.5*px;\r\n      ny = 2.0*qx*qy + ccy - 0.5*py;\r\n      npx = qx;\r\n      npy = qy;\r\n    }\r\n    case 7u: { // Cubic Multibrot z^3 + c\r\n      let r2 = qx*qx + qy*qy;\r\n      let theta = atan2(qy, qx);\r\n      let r3 = pow(r2, 1.5);\r\n      nx = r3 * cos(3.0 * theta) + ccx;\r\n      ny = r3 * sin(3.0 * theta) + ccy;\r\n    }\r\n    case 8u: { // Quartic Multibrot z^4 + c\r\n      let r2 = qx*qx + qy*qy;\r\n      let theta = atan2(qy, qx);\r\n      let r4 = r2*r2;\r\n      nx = r4 * cos(4.0 * theta) + ccx;\r\n      ny = r4 * sin(4.0 * theta) + ccy;\r\n    }\r\n    case 9u: { // Cosine\r\n      nx = cos(qx)*cosh(qy) + ccx;\r\n      ny = -sin(qx)*sinh(qy) + ccy;\r\n    }\r\n    case 10u: { // Sine\r\n      nx = sin(qx)*cosh(qy) + ccx;\r\n      ny = cos(qx)*sinh(qy) + ccy;\r\n    }\r\n    case 11u: { // Heart\r\n      let rx = abs(qx);\r\n      nx = rx*rx - qy*qy + ccx;\r\n      ny = 2.0*rx*qy + ccy;\r\n    }\r\n    case 12u: { // Perpendicular Buffalo\r\n      nx = abs(qx*qx - qy*qy) + ccx;\r\n      ny = -2.0*a*qy + ccy;\r\n    }\r\n    case 13u: { // Spiral Mandelbrot with twist\r\n      let THETA = 0.35 + 2.0*gamma;\r\n      let wRe = cos(THETA);\r\n      let wIm = sin(THETA);\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n      let tx = wRe*zx2 - wIm*zy2;\r\n      let ty = wRe*zy2 + wIm*zx2;\r\n      nx = tx + ccx;\r\n      ny = ty + ccy;\r\n    }\r\n    case 14u: { // Quintic z^5 + c\r\n      let r2 = qx*qx + qy*qy;\r\n      let theta = atan2(qy, qx);\r\n      let r5 = pow(r2, 2.5);\r\n      nx = r5*cos(5.0*theta) + ccx;\r\n      ny = r5*sin(5.0*theta) + ccy;\r\n    }\r\n    case 15u: { // Sextic z^6 + c\r\n      let r2 = qx*qx + qy*qy;\r\n      let theta = atan2(qy, qx);\r\n      let r6 = r2*r2*r2;\r\n      nx = r6*cos(6.0*theta) + ccx;\r\n      ny = r6*sin(6.0*theta) + ccy;\r\n    }\r\n    case 16u: { // Tangent fractal tan(z)+c\r\n      let sin2x = sin(2.0*qx);\r\n      let sinh2y = sinh(2.0*qy);\r\n      let denom = cos(2.0*qx) + cosh(2.0*qy) + 1e-9;\r\n      nx = sin2x/denom + ccx;\r\n      ny = sinh2y/denom + ccy;\r\n    }\r\n    case 17u: { // Exponential fractal exp(z)+c\r\n      let ex = exp(qx);\r\n      nx = ex*cos(qy) + ccx;\r\n      ny = ex*sin(qy) + ccy;\r\n    }\r\n    case 18u: { // Septic z^7 + c\r\n      let r2 = qx*qx + qy*qy;\r\n      let theta = atan2(qy, qx);\r\n      let r7 = pow(r2, 3.5);\r\n      nx = r7*cos(7.0*theta) + ccx;\r\n      ny = r7*sin(7.0*theta) + ccy;\r\n    }\r\n    case 19u: { // Octic z^8 + c\r\n      let r2 = qx*qx + qy*qy;\r\n      let theta = atan2(qy, qx);\r\n      let r8 = r2*r2*r2*r2;\r\n      nx = r8*cos(8.0*theta) + ccx;\r\n      ny = r8*sin(8.0*theta) + ccy;\r\n    }\r\n    case 20u: { // Inverse Mandelbrot 1/z^2 + c\r\n      let r2 = qx*qx + qy*qy + 1e-9;\r\n      let invv = 1.0/(r2*r2);\r\n      nx = (qx*qx - qy*qy)*invv + ccx;\r\n      ny = (2.0*qx*qy)*invv + ccy;\r\n    }\r\n    case 21u: { // Burning Ship deep zoom\r\n      let centerRe = -1.7443359375;\r\n      let centerIm = -0.017451171875;\r\n      let sub = 0.04;\r\n      let dx2 = ccx*sub + centerRe;\r\n      let dy2 = ccy*sub + centerIm;\r\n      nx = a*a - b*b + dx2;\r\n      ny = 2.0*a*b + dy2;\r\n    }\r\n    case 22u: { // Cubic Burning Ship |z|^3 + c\r\n      let pr = shipPower(a, b, 3.0);\r\n      nx = pr.x + ccx;\r\n      ny = pr.y + ccy;\r\n    }\r\n    case 23u: { // Quartic Burning Ship |z|^4 + c\r\n      let pr = shipPower(a, b, 4.0);\r\n      nx = pr.x + ccx;\r\n      ny = pr.y + ccy;\r\n    }\r\n    case 24u: { // Quintic Burning Ship |z|^5 + c\r\n      let pr = shipPower(a, b, 5.0);\r\n      nx = pr.x + ccx;\r\n      ny = pr.y + ccy;\r\n    }\r\n    case 25u: { // Hexic Burning Ship |z|^6 + c\r\n      let pr = shipPower(a, b, 6.0);\r\n      nx = pr.x + ccx;\r\n      ny = pr.y + ccy;\r\n    }\r\n    case 26u: { // Nova: z - (z^3-1)/(3 z^2) + c\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n      let zx3 = zx2*qx - zy2*qy;\r\n      let zy3 = zx2*qy + zy2*qx;\r\n      let numx = zx3 - 1.0;\r\n      let numy = zy3;\r\n      let denx = 3.0*zx2;\r\n      let deny = 3.0*zy2;\r\n      let den2 = denx*denx + deny*deny + 1e-9;\r\n      let qxDiv = (numx*denx + numy*deny)/den2;\r\n      let qyDiv = (numy*denx - numx*deny)/den2;\r\n      nx = qx - qxDiv + ccx;\r\n      ny = qy - qyDiv + ccy;\r\n    }\r\n    case 27u: { // Man-o-War: z^2 + c + prev\r\n      nx = qx*qx - qy*qy + ccx + px;\r\n      ny = 2.0*qx*qy + ccy + py;\r\n      npx = qx;\r\n      npy = qy;\r\n    }\r\n    /* =============================================================== */\r\n    /* 28 -  Stretched-Celtic-Spiral                                   */\r\n    /* =============================================================== */\r\n    case 28u: {\r\n        let k = 1.5;                    /* stretch factor              */\r\n        let sx = qx * k;\r\n        let sy = qy / k;\r\n\r\n        /* perpendicular-Celtic core                                   */\r\n        var tx = abs(sx*sx - sy*sy);\r\n        var ty = -2.0*abs(sx)*sy;\r\n\r\n        /* gentle spiral twist using gamma & iteration #               */\r\n        let \u03C1   = length(vec2<f32>(tx, ty));\r\n        let \u03B8   = atan2(ty, tx)\r\n                + gamma * 6.2831853 * 0.1\r\n                + f32(iter) * 0.03;\r\n\r\n        nx = \u03C1 * cos(\u03B8) + cx;\r\n        ny = \u03C1 * sin(\u03B8) + cy;\r\n    }\r\n\r\n    /* =============================================================== */\r\n    /* 29 -  Polar-Flame fractal                                       */\r\n    /* =============================================================== */\r\n    case 29u: {\r\n        let r      = length(vec2<f32>(qx, qy)) + 1e-9;\r\n        let theta  = atan2(qy, qx);\r\n\r\n        /* flame parameters modulated by gamma                         */\r\n        let c0 = 0.25 + 0.15*gamma;\r\n        let c1 = 0.5  + 0.5 *gamma;\r\n\r\n        let r2    = r*r + c0;\r\n        let theta2= 2.0*theta + c1;\r\n\r\n        nx = r2 * cos(theta2) + cx;\r\n        ny = r2 * sin(theta2) + cy;\r\n    }\r\n    case 30u, 31u, 32u, 33u, 34u, 35u: { // inv 3..8\r\n      let p = f32(typ - 27u); // 30->3, 31->4, ..., 35->8\r\n      let pr = invPower(qx, qy, p);\r\n      nx = pr.x + ccx;\r\n      ny = pr.y + ccy;\r\n    }\r\n    case 36u: { // Inverse Burning-Ship\r\n      let a2 = abs(qx);\r\n      let b2 = abs(qy);\r\n      let r2 = qx*qx + qy*qy + 1e-9;\r\n      let invv = 1.0/(r2*r2);\r\n      nx = (a2*a2 - b2*b2)*invv + ccx;\r\n      ny = (2.0*a2*b2)*invv + ccy;\r\n    }\r\n    case 37u: { // Inverse Tricorn\r\n      let r2 = qx*qx + qy*qy + 1e-9;\r\n      let invv = 1.0/(r2*r2);\r\n      nx = (qx*qx - qy*qy)*invv + ccx;\r\n      ny = (-2.0*qx*qy)*invv + ccy;\r\n    }\r\n    case 38u: { // Inverse Celtic\r\n      let r2 = qx*qx + qy*qy + 1e-9;\r\n      let invv = 1.0/(r2*r2);\r\n      let rx = abs(qx*qx - qy*qy);\r\n      nx = rx*invv + ccx;\r\n      ny = (2.0*qx*qy)*invv + ccy;\r\n    }\r\n    case 39u: { // Inverse Phoenix\r\n      let r2 = qx*qx + qy*qy + 1e-9;\r\n      let invv = 1.0/(r2*r2);\r\n      let zx2 = (qx*qx - qy*qy)*invv;\r\n      let zy2 = (2.0*qx*qy)*invv;\r\n      nx = zx2 + ccx - 0.5*px;\r\n      ny = zy2 + ccy - 0.5*py;\r\n      npx = qx;\r\n      npy = qy;\r\n    }\r\n    case 40u: { // Tri-Nova\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n      let zx4 = zx2*zx2 - zy2*zy2;\r\n      let zy4 = 2.0*zx2*zy2;\r\n      nx = 1.3333333*qx - 0.3333333*zx4 + ccx;\r\n      ny = 1.3333333*qy - 0.3333333*zy4 + ccy;\r\n    }\r\n    case 41u: { // Nova-Mandelbrot\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n      let zx3 = zx2*qx - zy2*qy;\r\n      let zy3 = zx2*qy + zy2*qx;\r\n      let denx = 3.0*zx2;\r\n      let deny = 3.0*zy2;\r\n      let den2 = denx*denx + deny*deny + 1e-9;\r\n      let numx = zx3 - 1.0;\r\n      let numy = zy3;\r\n      let divx = (numx*denx + numy*deny)/den2;\r\n      let divy = (numy*denx - numx*deny)/den2;\r\n      nx = qx - divx + ccx;\r\n      ny = qy - divy + ccy;\r\n    }\r\n    case 42u: { // Nova 2 (inverse variant)\r\n      let r2_inv = 1.0/(qx*qx + qy*qy + 1e-9);\r\n      let izRe = qx * r2_inv;\r\n      let izIm = -qy * r2_inv;\r\n      let zx2 = izRe*izRe - izIm*izIm;\r\n      let zy2 = 2.0*izRe*izIm;\r\n      let zx4 = zx2*zx2 - zy2*zy2;\r\n      let zy4 = 2.0*zx2*zy2;\r\n      let fRe = 1.3333333*izRe - 0.3333333*zx4 + ccx;\r\n      let fIm = 1.3333333*izIm - 0.3333333*zy4 + ccy;\r\n      let den = 1.0/(fRe*fRe + fIm*fIm + 1e-9);\r\n      nx = fRe*den;\r\n      ny = -fIm*den;\r\n    }\r\n    case 43u: { // Nova 2 variant\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n      let zx4 = zx2*zx2 - zy2*zy2;\r\n      let zy4 = 2.0*zx2*zy2;\r\n      let fRe = 1.3333333*qx - 0.3333333*zx4 + ccx;\r\n      let fIm = 1.3333333*qy - 0.3333333*zy4 + ccy;\r\n      let invR2 = 1.0/(fRe*fRe + fIm*fIm + 1e-9);\r\n      nx = fRe*invR2;\r\n      ny = -fIm*invR2;\r\n    }\r\n    case 44u: { // Quartic-Nova\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n      let zx3 = zx2*qx - zy2*qy;\r\n      let zy3 = zx2*qy + zy2*qx;\r\n      let zx4 = zx3*qx - zy3*qy;\r\n      let zy4 = zx3*qy + zy3*qx;\r\n      let numx = zx4 - 1.0;\r\n      let numy = zy4;\r\n      let denx = 4.0*(zx2*qx - zy2*qy);\r\n      let deny = 4.0*(zx2*qy + zy2*qx);\r\n      let den2 = denx*denx + deny*deny + 1e-9;\r\n      let divx = (numx*denx + numy*deny)/den2;\r\n      let divy = (numy*denx - numx*deny)/den2;\r\n      nx = qx - divx + ccx;\r\n      ny = qy - divy + ccy;\r\n    }\r\ncase 45u: { // Flower Nova\r\n  var zx0 = qx;\r\n  var zy0 = qy;\r\n  if (iter == 0u) {\r\n    zx0 = cx;\r\n    zy0 = cy;\r\n  }\r\n  let zx2 = zx0*zx0 - zy0*zy0;\r\n  let zy2 = 2.0*zx0*zy0;\r\n  let zx3 = zx2*zx0 - zy2*zy0;\r\n  let zy3 = zx2*zy0 + zy2*zx0;\r\n  let zx4 = zx3*zx0 - zy3*zy0;\r\n  let zy4 = zx3*zy0 + zy3*zx0;\r\n  let denx = 4.0*zx3;\r\n  let deny = 4.0*zy3;\r\n  let den2 = denx*denx + deny*deny + 1e-9;\r\n  let numx = zx4 - 1.0;\r\n  let numy = zy4;\r\n  let divx = (numx*denx + numy*deny) / den2;\r\n  let divy = (numy*denx - numx*deny) / den2;\r\n  let fx = zx0 - divx + ccx;\r\n  let fy = zy0 - divy + ccy;\r\n  nx = -fx;\r\n  ny = -fy;\r\n  break;\r\n}\r\ncase 46u: { // Scatter-Nova\r\n  var zx0 = qx;\r\n  var zy0 = qy;\r\n  if (iter == 0u) {\r\n    zx0 = cx;\r\n    zy0 = cy;\r\n  }\r\n  let zx2 = zx0*zx0 - zy0*zy0;\r\n  let zy2 = 2.0*zx0*zy0;\r\n  let zx3 = zx2*zx0 - zy2*zy0;\r\n  let zy3 = zx2*zy0 + zy2*zx0;\r\n  let zx4 = zx3*zx0 - zy3*zy0;\r\n  let zy4 = zx3*zy0 + zy3*zx0;\r\n  let denx = 4.0*zx3;\r\n  let deny = 4.0*zy3;\r\n  let den2 = denx*denx + deny*deny + 1e-9;\r\n  let numx = zx4 - 1.0;\r\n  let numy = zy4;\r\n  let divx = (numx*denx + numy*deny) / den2;\r\n  let divy = (numy*denx - numx*deny) / den2;\r\n  let fx = zx0 - divx + ccx;\r\n  let fy = zy0 - divy + ccy;\r\n  let invR2 = 1.0 / (fx*fx + fy*fy + 1e-9);\r\n  nx = fx * invR2;\r\n  ny = -fy * invR2;\r\n  break;\r\n}\r\n\r\n// 47: Twisted-Flower Nova\r\ncase 47u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx; zy0 = cy;\r\n    }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let denx = 4.0*zx3;\r\n    let deny = 4.0*zy3;\r\n    let den2 = denx*denx + deny*deny + 1e-9;\r\n    let numx = zx4 - 1.0;\r\n    let numy = zy4;\r\n    let divx = (numx*denx + numy*deny) / den2;\r\n    let divy = (numy*denx - numx*deny) / den2;\r\n    let fx = zx0 - divx + ccx;\r\n    let fy = zy0 - divy + ccy;\r\n    let r = length(vec2<f32>(fx, fy));\r\n    let theta = atan2(fy, fx);\r\n    let twist = theta + gamma * 2.0 * 3.14159265 * sin(f32(iter) * 0.2);\r\n    nx = r * cos(twist);\r\n    ny = r * sin(twist);\r\n    npx = qx;\r\n    npy = qy;\r\n    break;\r\n}\r\n\r\n// 48: Lobed-Scatter Nova\r\ncase 48u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numx = zx4 - 1.0;\r\n    let numy = zy4;\r\n    let denx = 4.0*zx3;\r\n    let deny = 4.0*zy3;\r\n    let den2 = denx*denx + deny*deny + 1e-9;\r\n    let divx = (numx*denx + numy*deny) / den2;\r\n    let divy = (numy*denx - numx*deny) / den2;\r\n    let fx = zx0 - divx + ccx;\r\n    let fy = zy0 - divy + ccy;\r\n    let invR2 = 1.0 / (fx*fx + fy*fy + 1e-9);\r\n    var sx = fx * invR2;\r\n    var sy = -fy * invR2;\r\n    let ang = atan2(sy, sx);\r\n    let r0  = length(vec2<f32>(sx, sy));\r\n    let lobes = 5.0 + sin(gamma * 10.0);\r\n    let petal = 1.0 + 0.3 * cos(ang * lobes + f32(iter) * 0.15);\r\n    nx = sx * petal;\r\n    ny = sy * petal;\r\n    npx = qx;\r\n    npy = qy;\r\n    break;\r\n}\r\n// 49: Hybrid-FlScatter Nova\r\ncase 49u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invDenF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fxF = zx0 - ((numxF*denxF + numyF*denyF) * invDenF) + ccx;\r\n    let fyF = zy0 - ((numyF*denxF - numxF*denyF) * invDenF) + ccy;\r\n    let invR2 = 1.0 / (fxF*fxF + fyF*fyF + 1e-9);\r\n    let sx    = fxF * invR2;\r\n    let sy    = -fyF * invR2;\r\n    let blend = 0.5 + 0.5 * sin(gamma * 3.14159265 + f32(iter) * 0.05);\r\n    nx = mix(fxF, sx, blend);\r\n    ny = mix(fyF, sy, blend);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 50: Fractional-Nova\r\ncase 50u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let p   = 3.7;\r\n    let r0  = length(vec2<f32>(zx0, zy0));\r\n    let theta0 = atan2(zy0, zx0);\r\n    let rp  = pow(r0, p);\r\n    let xp  = rp * cos(p * theta0);\r\n    let yp  = rp * sin(p * theta0);\r\n    let rm1 = pow(r0, p - 1.0);\r\n    let xm1 = rm1 * cos((p - 1.0) * theta0);\r\n    let ym1 = rm1 * sin((p - 1.0) * theta0);\r\n    let denx = p * xm1;\r\n    let deny = p * ym1;\r\n    let d2   = denx*denx + deny*deny + 1e-9;\r\n    let divx = ((xp - 1.0) * denx + yp * deny) / d2;\r\n    let divy = ( yp * denx - (xp - 1.0) * deny) / d2;\r\n    nx = zx0 - divx + ccx;\r\n    ny = zy0 - divy + ccy;\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 51: Kaleido-Nova\r\ncase 51u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let zx2   = zx0*zx0 - zy0*zy0;\r\n    let zy2   = 2.0*zx0*zy0;\r\n    let zx3   = zx2*zx0 - zy2*zy0;\r\n    let zy3   = zx2*zy0 + zy2*zx0;\r\n    let zx4   = zx3*zx0 - zy3*zy0;\r\n    let zy4   = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invDen = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invDen) + ccx;\r\n    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invDen) + ccy;\r\n\r\n    let sect   = 7.0;\r\n    let slice  = 2.0 * 3.14159265 / sect;\r\n    let angle  = atan2(fy, fx);\r\n    let aDiv  = floor(angle / slice);\r\n    let a2    = angle - aDiv * slice;\r\n    var aMir: f32;\r\n    if (a2 < slice * 0.5) {\r\n        aMir = a2;\r\n    } else {\r\n        aMir = slice - a2;\r\n    }\r\n    let angK  = aDiv * slice + aMir;\r\n    let rad0  = length(vec2<f32>(fx, fy));\r\n    nx = rad0 * cos(angK);\r\n    ny = rad0 * sin(angK);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 52: Cross-Nova\r\ncase 52u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    var sx = cx;\r\n    var sy = cy;\r\n    if ((iter & 1u) == 1u) {\r\n        sx = params.dx;\r\n        sy = params.dy;\r\n    }\r\n    let ux0 = zx0 + (sx - cx);\r\n    let uy0 = zy0 + (sy - cy);\r\n    let ux2 = ux0*ux0 - uy0*uy0;\r\n    let uy2 = 2.0*ux0*uy0;\r\n    let ux3 = ux2*ux0 - uy2*uy0;\r\n    let uy3 = ux2*uy0 + uy2*ux0;\r\n    let ux4 = ux3*ux0 - uy3*uy0;\r\n    let uy4 = ux3*uy0 + uy3*ux0;\r\n    let numx = ux4 - 1.0;\r\n    let numy = uy4;\r\n    let denx = 4.0*ux3;\r\n    let deny = 4.0*uy3;\r\n    let invD = 1.0 / (denx*denx + deny*deny + 1e-9);\r\n    let divx = (numx*denx + numy*deny) * invD;\r\n    let divy = (numy*denx - numx*deny) * invD;\r\n    let fx = ux0 - divx + ccx;\r\n    let fy = uy0 - divy + ccy;\r\n    nx = fx;\r\n    ny = fy;\r\n    npx = qx;\r\n    npy = qy;\r\n    break;\r\n}\r\n\r\n// 53: Mirror-Nova\r\ncase 53u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let zx2   = zx0*zx0 - zy0*zy0;\r\n    let zy2   = 2.0*zx0*zy0;\r\n    let zx3   = zx2*zx0 - zy2*zy0;\r\n    let zy3   = zx2*zy0 + zy2*zx0;\r\n    let zx4   = zx3*zx0 - zy3*zy0;\r\n    let zy4   = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invD  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r\n    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r\n\r\n    if ((iter & 1u) == 0u) {\r\n        nx = -fx; ny = fy;\r\n    } else {\r\n        nx = fx;  ny = -fy;\r\n    }\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 54: Spiro-Nova\r\ncase 54u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let zx2   = zx0*zx0 - zy0*zy0;\r\n    let zy2   = 2.0*zx0*zy0;\r\n    let zx3   = zx2*zx0 - zy2*zy0;\r\n    let zy3   = zx2*zy0 + zy2*zx0;\r\n    let zx4   = zx3*zx0 - zy3*zy0;\r\n    let zy4   = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invD  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r\n    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r\n\r\n    let theta   = atan2(fy, fx);\r\n    let r0      = length(vec2<f32>(fx, fy));\r\n    let tmpA    = gamma * 5.0;\r\n    let aDiv    = floor(tmpA / 4.0);\r\n    let freqA   = tmpA - aDiv * 4.0;\r\n    let aFreq   = 3.0 + freqA;\r\n    let tmpB    = gamma * 7.0;\r\n    let bDiv    = floor(tmpB / 5.0);\r\n    let freqB   = tmpB - bDiv * 5.0;\r\n    let bFreq   = 4.0 + freqB;\r\n    let amp     = 0.2 + 0.1 * sin(f32(iter) * 0.1);\r\n\r\n    nx = (r0 + amp * sin(aFreq * theta)) * cos(theta + amp * cos(bFreq * theta));\r\n    ny = (r0 + amp * sin(aFreq * theta)) * sin(theta + amp * cos(bFreq * theta));\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 55: Vibrant-Nova\r\ncase 55u: {\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let zx2   = zx0*zx0 - zy0*zy0;\r\n    let zy2   = 2.0*zx0*zy0;\r\n    let zx3   = zx2*zx0 - zy2*zy0;\r\n    let zy3   = zx2*zy0 + zy2*zx0;\r\n    let zx4   = zx3*zx0 - zy3*zy0;\r\n    let zy4   = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invD   = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx     = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r\n    let fy     = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r\n\r\n    let r0      = length(vec2<f32>(fx, fy));\r\n    let theta   = atan2(fy, fx);\r\n    let wave    = 1.0 + 0.3 * sin(6.0*theta + f32(iter)*0.2 + gamma*10.0);\r\n\r\n    nx = r0 * wave * cos(theta);\r\n    ny = r0 * wave * sin(theta);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n// 56: Julia-Nova Hybrid\r\ncase 56u: {\r\n    let jx = params.dx;\r\n    let jy = params.dy;\r\n    var zx0 = qx;\r\n    var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx;\r\n        zy0 = cy;\r\n    }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let numx = zx3 - 1.0;\r\n    let numy = zy3;\r\n    let denx = 3.0*zx2;\r\n    let deny = 3.0*zy2;\r\n    let invD = 1.0 / (denx*denx + deny*deny + 1e-9);\r\n    let divx = (numx*denx + numy*deny) * invD;\r\n    let divy = (numy*denx - numx*deny) * invD;\r\n    let fx = zx0 - divx + ccx;\r\n    let fy = zy0 - divy + ccy;\r\n    let alpha = 0.3 + 0.2 * sin(gamma * 6.28);\r\n    nx = fx + alpha * (fx - jx);\r\n    ny = fy + alpha * (fy - jy);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 57: Inverse-Spiral Nova\r\ncase 57u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numx = zx4 - 1.0; let numy = zy4;\r\n    let denx = 4.0*zx3; let deny = 4.0*zy3;\r\n    let invD = 1.0/(denx*denx + deny*deny + 1e-9);\r\n    let fx   = zx0 - (numx*denx + numy*deny)*invD + ccx;\r\n    let fy   = zy0 - (numy*denx - numx*deny)*invD + ccy;\r\n    let invR2= 1.0/(fx*fx + fy*fy + 1e-9);\r\n    var sx   = fx * invR2; var sy = -fy * invR2;\r\n    let \u03B8 = atan2(sy, sx);\r\n    let r = length(vec2<f32>(sx, sy));\r\n    let beta = 0.1 + 0.05*sin(f32(iter)*0.2);\r\n    let rw = r * exp(beta * \u03B8);\r\n    nx = rw * cos(\u03B8);\r\n    ny = rw * sin(\u03B8);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 58: Wavefront Nova\r\ncase 58u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let denx = 4.0*zx3; let deny = 4.0*zy3;\r\n    let numx = zx4 - 1.0; let numy = zy4;\r\n    let invD = 1.0/(denx*denx + deny*deny + 1e-9);\r\n    let fx   = zx0 - (numx*denx + numy*deny)*invD + ccx;\r\n    let fy   = zy0 - (numy*denx - numx*deny)*invD + ccy;\r\n    let r0    = length(vec2<f32>(fx, fy));\r\n    let phase = sin(f32(iter) * 0.3 + gamma * 12.0);\r\n    let offset= 0.2 * phase * sin(8.0 * r0);\r\n    let r1    = max(0.0, r0 + offset);\r\n    let \u03B8     = atan2(fy, fx);\r\n    nx = r1 * cos(\u03B8);\r\n    ny = r1 * sin(\u03B8);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 59: Vortex-Nova\r\ncase 59u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx; zy0 = cy;\r\n    }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invD = 1.0/(denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r\n    let fy = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r\n\r\n    let r   = length(vec2<f32>(fx, fy));\r\n    let baseAngle = atan2(fy, fx);\r\n    let swirlAmt  = 1.5 * exp(-r * 2.0);\r\n    let angle2    = baseAngle + swirlAmt;\r\n    nx = r * cos(angle2);\r\n    ny = r * sin(angle2);\r\n\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 60: Sine-Ring Nova\r\ncase 60u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx; zy0 = cy;\r\n    }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invD   = 1.0/(denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx0    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r\n    let fy0    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r\n\r\n    let r0    = length(vec2<f32>(fx0, fy0));\r\n    let \u03B8     = atan2(fy0, fx0);\r\n    let freq  = 10.0 + 5.0 * sin(gamma * 6.2831853);\r\n    let amp   = 0.1 + 0.05 * cos(f32(iter) * 0.1);\r\n    let ring  = r0 + amp * sin(freq * r0);\r\n    nx = ring * cos(\u03B8);\r\n    ny = ring * sin(\u03B8);\r\n\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 61: Inverse-Spiral Nova (gentler)\r\ncase 61u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) {\r\n        zx0 = cx; zy0 = cy;\r\n    }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numx = zx4 - 1.0;   let numy = zy4;\r\n    let denx = 4.0*zx3;     let deny = 4.0*zy3;\r\n    let invD = 1.0/(denx*denx + deny*deny + 1e-9);\r\n    let fx0  = zx0 - (numx*denx + numy*deny)*invD + ccx;\r\n    let fy0  = zy0 - (numy*denx - numx*deny)*invD + ccy;\r\n    let invR2= 1.0/(fx0*fx0 + fy0*fy0 + 1e-9);\r\n    let sx   = fx0 * invR2;\r\n    let sy   = -fy0 * invR2;\r\n\r\n    let \u03B8    = atan2(sy, sx);\r\n    let r    = length(vec2<f32>(sx, sy));\r\n    let t    = \u03B8 / 3.14159265;\r\n    let beta = 1.0 + 0.2 * t;\r\n    let rw   = pow(r, beta);\r\n\r\n    nx = rw * cos(\u03B8);\r\n    ny = rw * sin(\u03B8);\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n// 62: Inverse-Vortex Nova\r\ncase 62u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invDF  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx0    = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r\n    let fy0    = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r\n\r\n    let r   = length(vec2<f32>(fx0, fy0));\r\n    let \u03B8   = atan2(fy0, fx0);\r\n    let swirlAmt = 1.5 * exp(-r * 2.0);\r\n    let \u03B82  = \u03B8 + swirlAmt;\r\n    var vx  = r * cos(\u03B82);\r\n    var vy  = r * sin(\u03B82);\r\n\r\n    let invR2 = 1.0 / (vx*vx + vy*vy + 1e-9);\r\n    nx = vx * invR2;\r\n    ny = -vy * invR2;\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 63: Inverse-Sine-Ring Nova\r\ncase 63u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n    let zx2 = zx0*zx0 - zy0*zy0;\r\n    let zy2 = 2.0*zx0*zy0;\r\n    let zx3 = zx2*zx0 - zy2*zy0;\r\n    let zy3 = zx2*zy0 + zy2*zx0;\r\n    let zx4 = zx3*zx0 - zy3*zy0;\r\n    let zy4 = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invDF  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx0    = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r\n    let fy0    = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r\n\r\n    let r0   = length(vec2<f32>(fx0, fy0));\r\n    let \u03B8    = atan2(fy0, fx0);\r\n    let freq = 10.0 + 5.0 * sin(gamma * 6.2831853);\r\n    let amp  = 0.1 + 0.05 * cos(f32(iter) * 0.1);\r\n    var rx  = r0 + amp * sin(freq * r0);\r\n    var ry  = \u03B8;\r\n\r\n    let sx = rx * cos(ry);\r\n    let sy = rx * sin(ry);\r\n\r\n    let invR2 = 1.0 / (sx*sx + sy*sy + 1e-9);\r\n    nx = sx * invR2;\r\n    ny = -sy * invR2;\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 64: Inverse-Mirror Nova\r\ncase 64u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n\r\n    let zx2   = zx0*zx0 - zy0*zy0;\r\n    let zy2   = 2.0*zx0*zy0;\r\n    let zx3   = zx2*zx0 - zy2*zy0;\r\n    let zy3   = zx2*zy0 + zy2*zx0;\r\n    let zx4   = zx3*zx0 - zy3*zy0;\r\n    let zy4   = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invDF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx0   = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r\n    let fy0   = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r\n\r\n    var mx: f32; var my: f32;\r\n    if ((iter & 1u) == 0u) {\r\n        mx = -fx0; my = fy0;\r\n    } else {\r\n        mx =  fx0; my = -fy0;\r\n    }\r\n\r\n    let invR2 = 1.0 / (mx*mx + my*my + 1e-9);\r\n    nx = mx * invR2;\r\n    ny = -my * invR2;\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\n\r\n// 65: Inverse-Vibrant Nova\r\ncase 65u: {\r\n    var zx0 = qx; var zy0 = qy;\r\n    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r\n\r\n    let zx2   = zx0*zx0 - zy0*zy0;\r\n    let zy2   = 2.0*zx0*zy0;\r\n    let zx3   = zx2*zx0 - zy2*zy0;\r\n    let zy3   = zx2*zy0 + zy2*zx0;\r\n    let zx4   = zx3*zx0 - zy3*zy0;\r\n    let zy4   = zx3*zy0 + zy3*zx0;\r\n    let numxF = zx4 - 1.0;\r\n    let numyF = zy4;\r\n    let denxF = 4.0*zx3;\r\n    let denyF = 4.0*zy3;\r\n    let invDF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r\n    let fx0   = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r\n    let fy0   = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r\n\r\n    let r0     = length(vec2<f32>(fx0, fy0));\r\n    let theta  = atan2(fy0, fx0);\r\n    let wave   = 1.0 + 0.3 * sin(6.0*theta + f32(iter)*0.2 + gamma*10.0);\r\n    let vx     = r0 * wave * cos(theta);\r\n    let vy     = r0 * wave * sin(theta);\r\n\r\n    let invR2  = 1.0 / (vx*vx + vy*vy + 1e-9);\r\n    nx = vx * invR2;\r\n    ny = -vy * invR2;\r\n    npx = qx; npy = qy;\r\n    break;\r\n}\r\ncase 66u: {                // Golden-Ratio Rational\r\n    let phi  = 1.61803398875;\r\n    let crx = -phi;\r\n    let cry =  phi;\r\n    let cax =  phi - 1.0;\r\n    let cay =  0.5 * phi;\r\n\r\n    let zx2 = qx*qx - qy*qy;\r\n    let zy2 = 2.0 * qx * qy;\r\n\r\n    let numx = zx2 + crx;\r\n    let numy = zy2 + cry;\r\n    let denx = zx2 + cax;\r\n    let deny = zy2 + cay;\r\n    let den2 = denx*denx + deny*deny + 1e-9;\r\n\r\n    let divx = (numx*denx + numy*deny) / den2;\r\n    let divy = (numy*denx - numx*deny) / den2;\r\n\r\n    nx = divx + ccx;\r\n    ny = divy + ccy;\r\n}\r\n\r\ncase 67u: {                // SinCos-Kernel\r\n    let sinx = sin(qx) * cosh(qy);\r\n    let siny =  cos(qx) * sinh(qy);\r\n    let cosx = cos(qx) * cosh(qy);\r\n    let cosy = -sin(qx) * sinh(qy);\r\n\r\n    let prodx = sinx*cosx - siny*cosy;\r\n    let prody = sinx*cosy + siny*cosx;\r\n\r\n    nx = prodx + ccx;\r\n    ny = prody + ccy;\r\n}\r\n/* 68 : Golden-Push-Pull */\r\ncase 68u: {\r\n    let phi  = 1.61803398875;\r\n    let crex = -phi;  let crey =  phi;\r\n    let caex =  phi-1.0; let caey = 0.5*phi;\r\n\r\n    let zx2 = qx*qx - qy*qy;\r\n    let zy2 = 2.0*qx*qy;\r\n\r\n    let numx = zx2 + crex;\r\n    let numy = zy2 + crey;\r\n    let denx = zx2 + caex;\r\n    let deny = zy2 + caey;\r\n    let den2 = denx*denx + deny*deny + 1e-9;\r\n    let divx = (numx*denx + numy*deny) / den2;\r\n    let divy = (numy*denx - numx*deny) / den2;\r\n\r\n    let beta = 0.5 + 0.5 * sin(f32(iter) * 0.25);\r\n    let mixx = caex * (1.0-beta) + crex * beta;\r\n    let mixy = caey * (1.0-beta) + crey * beta;\r\n\r\n    nx = divx + mixx + ccx;\r\n    ny = divy + mixy + ccy;\r\n}\r\n\r\n/* 69 : Sinc-Kernel */\r\ncase 69u: {\r\n    let pi  = 3.14159265359;\r\n    let sinX =  sin(pi*qx) * cosh(pi*qy);\r\n    let sinY =  cos(pi*qx) * sinh(pi*qy);\r\n\r\n    let denX = pi * qx;\r\n    let denY = pi * qy;\r\n    let den2 = denX*denX + denY*denY + 1e-9;\r\n\r\n    let sincX = ( sinX*denX + sinY*denY) / den2;\r\n    let sincY = ( sinY*denX - sinX*denY) / den2;\r\n\r\n    nx = sincX + ccx;\r\n    ny = sincY + ccy;\r\n  }\r\n\r\n    // 70: Bizarre Grid\r\n    case 70u: {\r\n      var zx = qx;\r\n      var zy = qy;\r\n      if (iter == 0u) {\r\n        zx = cx;\r\n        zy = cy;\r\n      }\r\n\r\n      if (zx > 1.0) {\r\n        zx = 2.0 - zx;\r\n      }\r\n      if (zx < -1.0) {\r\n        zx = -2.0 - zx;\r\n      }\r\n      if (zy > 1.0) {\r\n        zy = 2.0 - zy;\r\n      }\r\n      if (zy < -1.0) {\r\n        zy = -2.0 - zy;\r\n      }\r\n\r\n      let r2 = zx*zx + zy*zy;\r\n      var scale = 1.0;\r\n      let Rmin2 = 0.25;\r\n      let Rmax2 = 2.25;\r\n\r\n      if (r2 < Rmin2) {\r\n        scale = Rmax2 / Rmin2;\r\n      } else if (r2 < Rmax2) {\r\n        scale = Rmax2 / r2;\r\n      }\r\n\r\n      zx = zx * scale * 1.5;\r\n      zy = zy * scale * 1.5;\r\n\r\n      let kx = params.dx;\r\n      let ky = params.dy;\r\n\r\n      nx = zx + kx;\r\n      ny = zy + ky;\r\n    }\r\n\r\n    // 71: Julia (z\xB2 + k, z\u2080 = c, k = dx + i dy)\r\n    case 71u: {\r\n      let kx = params.dx;\r\n      let ky = params.dy;\r\n\r\n      let zx2 = qx*qx - qy*qy;\r\n      let zy2 = 2.0*qx*qy;\r\n\r\n      nx = zx2 + kx + 0.3; //offset to not get a perfect circle\r\n      ny = zy2 + ky + 0.5;\r\n    }\r\n\r\n    default: { // Mandelbrot\r\n      nx = qx*qx - qy*qy + ccx;\r\n      ny = 2.0*qx*qy + ccy;\r\n    }\r\n  }\r\n  return FractalResult(nx, ny, npx, npy);\r\n}\r\n\r\n@compute @workgroup_size(8,8,1)\r\nfn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r\n  // Local index within this strip texture\r\n  let lx = gid.x;\r\n  let ly = gid.y;\r\n\r\n  // Skip threads that fall outside the strip bounds for this dispatch\r\n  if (lx >= params.tileWidth || ly >= params.tileHeight) {\r\n    return;\r\n  }\r\n\r\n  // Global index within the *full* fractal grid (e.g. 8192\xD78192)\r\n  let gx = params.tileOffsetX + lx;\r\n  let gy = params.tileOffsetY + ly;\r\n\r\n  // Skip anything that lies outside the global grid\r\n  if (gx >= params.gridSize || gy >= params.gridSize) {\r\n    return;\r\n  }\r\n\r\n  // Normalized coordinates across the full grid [0,1]\r\n  // gridSize should be the full resolution (8192), not the strip size.\r\n  let invF = 1.0 / f32(params.gridSize - 1u);\r\n  let nxFull = f32(gx) * invF;\r\n  let nyFull = f32(gy) * invF;\r\n\r\n  // Center at zero, maintain aspect so it is not stretched\r\n  let centeredX = (nxFull - 0.5) * params.aspect;\r\n  let centeredY = (nyFull - 0.5);\r\n\r\n  // Zoom + pan - zoom is the size of the window in complex space\r\n  let cx = centeredX * params.zoom + params.dx;\r\n  let cy = centeredY * params.zoom + params.dy;\r\n\r\n  var init = getInitialZ(params.fractalType, cx, cy);\r\n  var qx = init.qx;\r\n  var qy = init.qy;\r\n  var px = init.px;\r\n  var py = init.py;\r\n\r\n  var iter: u32 = 0u;\r\n  let escapeR2 = params.escapeR * params.escapeR;\r\n\r\n  loop {\r\n    if (iter >= params.maxIter) {\r\n      break;\r\n    }\r\n    if (qx*qx + qy*qy > escapeR2) {\r\n      break;\r\n    }\r\n\r\n    let res = computeFractal(\r\n      params.fractalType, qx, qy, px, py,\r\n      cx, cy, params.gamma, iter\r\n    );\r\n\r\n    let nxz = res.nx;\r\n    let nyz = res.ny;\r\n    let npx = res.npx;\r\n    let npy = res.npy;\r\n\r\n    if (params.convergenceTest == 1u) {\r\n      if (params.escapeMode == 1u) {\r\n        if (nxz*nxz + nyz*nyz > escapeR2) {\r\n          iter = iter + 1u;\r\n          break;\r\n        }\r\n      } else {\r\n        let dx_ = nxz - qx;\r\n        let dy_ = nyz - qy;\r\n        if (dx_*dx_ + dy_*dy_ < params.epsilon * params.epsilon) {\r\n          iter = iter + 1u;\r\n          break;\r\n        }\r\n      }\r\n    } else {\r\n      if (nxz*nxz + nyz*nyz > escapeR2) {\r\n        iter = iter + 1u;\r\n        break;\r\n      }\r\n    }\r\n\r\n    px = npx; py = npy;\r\n    qx = nxz; qy = nyz;\r\n    iter = iter + 1u;\r\n  }\r\n\r\n  let ratio = f32(iter) / f32(params.maxIter);\r\n  let col = vec4<f32>(ratio, ratio, ratio, 1.0);\r\n\r\n  // IMPORTANT: write into the strip texture at local coords\r\n  textureStore(\r\n    storageTex,\r\n    vec2<i32>(i32(lx), i32(ly)),\r\n    i32(params.layerIndex),\r\n    col\r\n  );\r\n}\r\n";

  // shaders/fractalCompute.js
  var FRACTALS = {
    Mandelbrot: 0,
    Tricorn: 1,
    BurningShip: 2,
    PerpendicularMandelbrot: 3,
    Celtic: 4,
    Buffalo: 5,
    Phoenix: 6,
    CubicMultibrot: 7,
    QuarticMultibrot: 8,
    Cosine: 9,
    Sine: 10,
    Heart: 11,
    PerpendicularBuffalo: 12,
    SpiralMandelbrot: 13,
    QuinticMultibrot: 14,
    SexticMultibrot: 15,
    Tangent: 16,
    Exponential: 17,
    SepticMultibrot: 18,
    OcticMultibrot: 19,
    InverseMandelbrot: 20,
    BurningShipDeepZoom: 21,
    CubicBurningShip: 22,
    QuarticBurningShip: 23,
    QuinticBurningShip: 24,
    HexicBurningShip: 25,
    Nova: 26,
    ManOWar: 27,
    StretchedCelticSpiral: 28,
    PolarFlame: 29,
    InverseCubic: 30,
    InverseQuartic: 31,
    InverseQuintic: 32,
    InverseSextic: 33,
    InverseSeptic: 34,
    InverseOctic: 35,
    InverseBurningShip: 36,
    InverseTricorn: 37,
    InverseCeltic: 38,
    InversePhoenix: 39,
    TriNova: 40,
    NovaMandelbrot: 41,
    Nova2: 42,
    Nova2Variant: 43,
    QuarticNova: 44,
    FlowerNova: 45,
    ScatterNova: 46,
    TwistedFlowerNova: 47,
    LobedScatterNova: 48,
    HybridFlScatterNova: 49,
    FractionalNova: 50,
    KaleidoNova: 51,
    CrossNova: 52,
    MirrorNova: 53,
    SpiroNova: 54,
    VibrantNova: 55,
    JuliaNovaHybrid: 56,
    InverseSpiralNova: 57,
    WavefrontNova: 58,
    VortexNova: 59,
    SineRingNova: 60,
    InverseSpiralNova2: 61,
    InverseVortexNova: 62,
    InverseSineRingNova: 63,
    InverseMirrorNova: 64,
    InverseVibrantNova: 65,
    GoldenRatioRational: 66,
    ConvolutionKernel: 67,
    GoldenPushPull: 68,
    SincKernel: 69,
    BizarreGrid: 70,
    Julia: 71
  };
  var SCALE_OPS = {
    End: 0,
    Multiply: 1,
    Divide: 2,
    Sine: 3,
    Tangent: 4,
    Cosine: 5,
    ExpZoom: 6,
    LogShrink: 7,
    AnisoWarp: 8,
    Rotate: 9,
    RadialTwist: 10,
    HyperWarp: 11,
    RadialHyper: 12,
    Swirl: 13,
    Modular: 14,
    AxisSwap: 15,
    MixedWarp: 16,
    Jitter: 17,
    PowerWarp: 18,
    SmoothFade: 19
  };
  function _pushOp(out, idxRef, v) {
    let i = idxRef.i | 0;
    if (i >= 16) return idxRef;
    const n = v == null ? 0 : v >>> 0;
    out[i] = n >>> 0;
    idxRef.i = i + 1;
    return idxRef;
  }
  function _addOpsFromAny(out, idxRef, ops) {
    if (idxRef.i >= 16) return idxRef;
    if (ops == null || ops === false) return idxRef;
    if (typeof ops === "number") {
      return _pushOp(out, idxRef, ops);
    }
    if (typeof ops === "string") {
      const toks = ops.trim().split(/[|,+\s]+/);
      for (let t = 0; t < toks.length && idxRef.i < 16; ++t) {
        const tok = toks[t];
        if (!tok) continue;
        const val = SCALE_OPS[tok] ?? parseInt(tok, 10);
        if (Number.isFinite(val)) _pushOp(out, idxRef, val);
      }
      return idxRef;
    }
    if (Array.isArray(ops)) {
      for (let k = 0; k < ops.length && idxRef.i < 16; ++k) {
        idxRef = _addOpsFromAny(out, idxRef, ops[k]);
      }
      return idxRef;
    }
    if (typeof ops === "object") {
      const keys = Object.keys(ops);
      for (let k = 0; k < keys.length && idxRef.i < 16; ++k) {
        const key = keys[k];
        if (!ops[key]) continue;
        const val = SCALE_OPS[key] ?? parseInt(key, 10);
        if (Number.isFinite(val)) _pushOp(out, idxRef, val);
      }
    }
    return idxRef;
  }
  function packScaleOps(ops = 0) {
    const out = new Uint32Array(16);
    const idxRef = { i: 0 };
    _addOpsFromAny(out, idxRef, ops);
    if (idxRef.i < 16) out[idxRef.i] = 0;
    for (let i = idxRef.i + 1; i < 16; ++i) out[i] = 0;
    return out;
  }
  var FractalTileComputeGPU = class {
    /**
     * @param {GPUDevice} device
     * @param {GPUBindGroupLayout} [uniformsLayout] - dynamic UBO (group 0)
     * @param {GPUBindGroupLayout} [storageLayout] - storage texture (group 1)
     * @param {number} [uniformStride=256]
     */
    constructor(device, uniformsLayout = void 0, storageLayout = void 0, uniformStride = 256) {
      this.device = device;
      this.uniformStride = uniformStride >>> 0;
      this._uniformsLayout = uniformsLayout ?? device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.uniformStride
            }
          }
        ]
      });
      this._storageLayout = storageLayout ?? device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "write-only",
              format: "rgba8unorm",
              viewDimension: "2d-array"
            }
          }
        ]
      });
      this._layout = { gridSize: 0, splitCount: 0, layers: 0 };
      this.chunks = [];
      this._module = device.createShaderModule({ code: fractalCompute_default });
      this._pipeCache = /* @__PURE__ */ new Map();
    }
    _pipeline(entryPoint) {
      const key = entryPoint || "main";
      let p = this._pipeCache.get(key);
      if (p) return p;
      p = this.device.createComputePipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this._uniformsLayout, this._storageLayout]
        }),
        compute: { module: this._module, entryPoint: key }
      });
      this._pipeCache.set(key, p);
      return p;
    }
    /**
     * Ensure chunk textures exist for (gridSize, splitCount, layers).
     * Textures are allocated as 2D-array where each array layer represents one output layer.
     *
     * IMPORTANT: storageView is created with arrayLayerCount=layers so the shader can write
     * any layerIndex. layerViews remain single-layer views for convenience elsewhere.
     *
     * @param {number} gridSize
     * @param {number} splitCount
     * @param {number} layers
     * @returns {FractalChunk[]}
     */
    _ensureTextures(gridSize, splitCount, layers = 1) {
      const L = Math.max(1, layers | 0);
      if (this._layout.gridSize === gridSize && this._layout.splitCount === splitCount && this._layout.layers === L && Array.isArray(this.chunks) && this.chunks.length > 0) {
        return this.chunks;
      }
      for (const c of this.chunks) {
        try {
          if (c.fractalTex) c.fractalTex.destroy();
        } catch {
        }
      }
      this.chunks.length = 0;
      const G = gridSize | 0;
      const tileH = G;
      const tileW = Math.min(G, Math.max(1, Math.floor((splitCount | 0) / tileH)));
      const numX = Math.ceil(G / tileW);
      for (let tx = 0; tx < numX; ++tx) {
        const offX = tx * tileW;
        const w = Math.min(tileW, G - offX);
        if (!w) continue;
        const fractalTex = this.device.createTexture({
          size: [w, tileH, L],
          format: "rgba8unorm",
          usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
        });
        const storageView = fractalTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: L
        });
        const layerViews = new Array(L);
        for (let li = 0; li < L; ++li) {
          layerViews[li] = fractalTex.createView({
            dimension: "2d-array",
            baseArrayLayer: li,
            arrayLayerCount: 1
          });
        }
        this.chunks.push({
          offsetX: offX,
          offsetY: 0,
          width: w,
          height: tileH,
          fractalTex,
          storageView,
          layerViews,
          storageBindGroup: null
        });
      }
      this._layout = { gridSize, splitCount, layers: L };
      return this.chunks;
    }
    _ensureStorageBindGroup(chunk) {
      let bg = chunk.storageBindGroup;
      if (bg) return bg;
      bg = this.device.createBindGroup({
        layout: this._storageLayout,
        entries: [{ binding: 0, resource: chunk.storageView }]
      });
      chunk.storageBindGroup = bg;
      return bg;
    }
    /**
     * Pack the dynamic uniform block for a tile.
     * Field order must match the WGSL Params struct.
     *
     * @param {FractalParams} params
     * @param {FractalChunk} tileInfo
     * @param {number} layerIdx
     * @param {number} aspect
     * @returns {ArrayBuffer}
     */
    _pack(params, tileInfo, layerIdx, aspect) {
      const buf = new ArrayBuffer(this.uniformStride);
      const dv = new DataView(buf);
      let o = 0;
      const gridSize = params.gridSize >>> 0;
      const maxIter = (params.maxIter ?? 0) >>> 0;
      const fractalType = (params.fractalType ?? FRACTALS.Mandelbrot) >>> 0;
      const opsInput = params && typeof params === "object" && "scaleOps" in params ? params.scaleOps : params.scaleMode;
      const scaleOps = packScaleOps(opsInput ?? 0);
      dv.setUint32(o, gridSize, true);
      o += 4;
      dv.setUint32(o, maxIter, true);
      o += 4;
      dv.setUint32(o, fractalType, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      for (let i = 0; i < 16; ++i) {
        dv.setUint32(o, scaleOps[i] >>> 0, true);
        o += 4;
      }
      dv.setFloat32(o, +params.zoom || 1, true);
      o += 4;
      dv.setFloat32(o, +params.dx || 0, true);
      o += 4;
      dv.setFloat32(o, +params.dy || 0, true);
      o += 4;
      dv.setFloat32(o, Number.isFinite(+params.escapeR) ? +params.escapeR : 4, true);
      o += 4;
      dv.setFloat32(o, Number.isFinite(+params.gamma) ? +params.gamma : 1, true);
      o += 4;
      dv.setUint32(o, layerIdx >>> 0, true);
      o += 4;
      dv.setFloat32(o, Number.isFinite(+params.epsilon) ? +params.epsilon : 1e-6, true);
      o += 4;
      dv.setUint32(o, params.convergenceTest ? 1 : 0, true);
      o += 4;
      dv.setUint32(o, (params.escapeMode ?? 0) >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.offsetX >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.offsetY >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.width >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.height >>> 0, true);
      o += 4;
      dv.setFloat32(o, +aspect || 1, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      return buf;
    }
    /**
     * Compute a single layer (writes to the array-layer = layerIndex).
     *
     * @param {FractalParams} paramsState
     * @param {number} layerIndex
     * @param {number} [aspect=1]
     * @param {string} [entryPoint='main']
     * @param {number} [requestedLayers=1]
     * @returns {Promise<FractalChunk[]>}
     */
    async compute(paramsState, layerIndex, aspect = 1, entryPoint = "main", requestedLayers = 1) {
      const layers = Math.max(1, requestedLayers | 0);
      const L = layerIndex >>> 0;
      if (L >= layers) {
        throw new Error(`compute: layerIndex ${L} out of range for layers=${layers}`);
      }
      const chunks = this._ensureTextures(paramsState.gridSize, paramsState.splitCount, layers);
      const N = chunks.length;
      if (N === 0) return chunks;
      const bigUBO = this.device.createBuffer({
        size: this.uniformStride * N,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      for (let i = 0; i < N; ++i) {
        const block = this._pack(paramsState, chunks[i], L, aspect);
        this.device.queue.writeBuffer(bigUBO, i * this.uniformStride, block);
      }
      const uBG = this.device.createBindGroup({
        layout: this._uniformsLayout,
        entries: [
          { binding: 0, resource: { buffer: bigUBO, size: this.uniformStride } }
        ]
      });
      const pipeline = this._pipeline(entryPoint);
      const enc = this.device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(pipeline);
      for (let i = 0; i < N; ++i) {
        const c = chunks[i];
        const sBG = this._ensureStorageBindGroup(c);
        pass.setBindGroup(0, uBG, [i * this.uniformStride]);
        pass.setBindGroup(1, sBG);
        pass.dispatchWorkgroups(
          Math.ceil(c.width / 8),
          Math.ceil(c.height / 8),
          1
        );
      }
      pass.end();
      try {
        this.device.queue.submit([enc.finish()]);
        await this.device.queue.onSubmittedWorkDone();
      } finally {
        try {
          bigUBO.destroy();
        } catch {
        }
      }
      return chunks;
    }
    /**
     * Compute N layers from explicit per-layer parameter overrides.
     *
     * Each entry in layerParamsList is merged onto paramsState:
     *   finalParams = { ...paramsState, ...layerParamsList[L] }
     * and written into array-layer L.
     *
     * @param {FractalParams} paramsState
     * @param {Array<Partial<FractalParams>>} layerParamsList
     * @param {number} [aspect=1]
     * @param {string} [entryPoint='main']
     * @returns {Promise<FractalChunk[]>}
     */
    async computeLayers(paramsState, layerParamsList, aspect = 1, entryPoint = "main") {
      const layers = Math.max(1, (layerParamsList?.length ?? 0) | 0);
      const chunks = this._ensureTextures(paramsState.gridSize, paramsState.splitCount, layers);
      const N = chunks.length;
      if (N === 0) return chunks;
      const pipeline = this._pipeline(entryPoint);
      const totalBlocks = N * layers;
      const bigUBO = this.device.createBuffer({
        size: this.uniformStride * totalBlocks,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      let blockIdx = 0;
      for (let L = 0; L < layers; ++L) {
        const ov = layerParamsList[L] || {};
        const packParams = { ...paramsState, ...ov };
        for (let i = 0; i < N; ++i) {
          const block = this._pack(packParams, chunks[i], L, aspect);
          this.device.queue.writeBuffer(
            bigUBO,
            blockIdx * this.uniformStride,
            block
          );
          blockIdx++;
        }
      }
      const uBG = this.device.createBindGroup({
        layout: this._uniformsLayout,
        entries: [
          { binding: 0, resource: { buffer: bigUBO, size: this.uniformStride } }
        ]
      });
      const enc = this.device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(pipeline);
      for (let L = 0; L < layers; ++L) {
        for (let i = 0; i < N; ++i) {
          const c = chunks[i];
          const sBG = this._ensureStorageBindGroup(c);
          const dyn = (L * N + i) * this.uniformStride;
          pass.setBindGroup(0, uBG, [dyn]);
          pass.setBindGroup(1, sBG);
          pass.dispatchWorkgroups(
            Math.ceil(c.width / 8),
            Math.ceil(c.height / 8),
            1
          );
        }
      }
      pass.end();
      try {
        this.device.queue.submit([enc.finish()]);
        await this.device.queue.onSubmittedWorkDone();
      } finally {
        try {
          bigUBO.destroy();
        } catch {
        }
      }
      return chunks;
    }
    /**
     * Convenience: generate a layer series, with optional per-layer overrides.
     *
     * gamma is interpolated across [gammaStart .. gammaStart + gammaRange] unless
     * the override for a layer provides its own gamma.
     *
     * layerOverrides can be:
     * - Array<Partial<FractalParams>> of length count
     * - function (layerIndex, t01, layers) => Partial<FractalParams>
     *
     * @param {FractalParams} paramsState
     * @param {number} gammaStart
     * @param {number} gammaRange
     * @param {number} count
     * @param {number} [aspect=1]
     * @param {string} [entryPoint='main']
     * @param {Array<Partial<FractalParams>>|((layerIndex:number,t01:number,layers:number)=>Partial<FractalParams>)} [layerOverrides]
     * @returns {Promise<FractalChunk[]>}
     */
    async computeLayerSeries(paramsState, gammaStart, gammaRange, count, aspect = 1, entryPoint = "main", layerOverrides = void 0) {
      const layers = Math.max(1, count >>> 0);
      const list = new Array(layers);
      for (let L = 0; L < layers; ++L) {
        const t = layers === 1 ? 0 : L / (layers - 1);
        const gamma = gammaStart + t * gammaRange;
        let ov = null;
        if (typeof layerOverrides === "function") {
          ov = layerOverrides(L, t, layers);
        } else if (Array.isArray(layerOverrides)) {
          ov = layerOverrides[L] || null;
        }
        if (ov && typeof ov === "object") {
          list[L] = "gamma" in ov ? ov : { ...ov, gamma };
        } else {
          list[L] = { gamma };
        }
      }
      return this.computeLayers(paramsState, list, aspect, entryPoint);
    }
    getChunks() {
      return this.chunks;
    }
    destroy() {
      for (const c of this.chunks) {
        try {
          if (c.fractalTex) c.fractalTex.destroy();
        } catch {
        }
        c.storageBindGroup = null;
        c.storageView = null;
        c.layerViews = null;
      }
      this.chunks.length = 0;
      this._layout = { gridSize: 0, splitCount: 0, layers: 0 };
      this._pipeCache.clear();
    }
    clearPipelineCache() {
      this._pipeCache.clear();
    }
  };

  // shaders/fsdfCompute.wgsl
  var fsdfCompute_default = "// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\r\n//  SDF + Normal + Connectivity   (compute entry: main)\r\n//  \u2013 works with horizontal strip tiling \u2013\r\n// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\r\n\r\nstruct SDFParams {\r\n    gridSize        : u32,   // full fractal resolution (square)\r\n    layerIndex      : u32,\r\n    tileOffsetX     : u32,   // unused once we switch to local coords\r\n    tileOffsetY     : u32,\r\n    tileWidth       : u32,   // local X range of this texture view\r\n    tileHeight      : u32,   // = gridSize in current layout (full height)\r\n    dispAmp         : f32,\r\n    quadScale       : f32,\r\n    slopeLimit      : f32,\r\n    wallJump        : f32,\r\n    connectivityMode: u32,   // 0=2-way , 1=4-way , 2=8-way\r\n    dispMode        : u32,\r\n    dispCurve       : f32,\r\n    normalMode      : u32,   // 0=2-sample , 1=4-sample , 2=8-sample\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> sdfParams : SDFParams;\r\n\r\n@group(1) @binding(0) var fractalTex : texture_storage_2d_array<rgba8unorm , read >;\r\n@group(1) @binding(1) var sdfTex     : texture_storage_2d_array<rgba16float, write>;\r\n@group(1) @binding(2) var flagTex    : texture_storage_2d_array<r32uint   , write>;\r\n\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 helper functions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nfn computeHnorm(v: f32) -> f32 {\r\n    switch (sdfParams.dispMode) {\r\n        case 1u  { return v; }\r\n        case 2u  { return 1.0 - v; }\r\n        case 3u, 4u {\r\n            let k = sdfParams.dispCurve;\r\n            let x = select(v, 1.0 - v, sdfParams.dispMode == 4u);\r\n            return log(1.0 + k * x) / log(1.0 + k);\r\n        }\r\n        case 5u, 6u {\r\n            let p = max(sdfParams.dispCurve, 1e-4);\r\n            let x = select(v, 1.0 - v, sdfParams.dispMode == 6u);\r\n            return pow(x, p);\r\n        }\r\n        default  { return 0.0; }\r\n    }\r\n}\r\n\r\n/*  Clamp X to tile-width (local) and Y to full grid (global). */\r\nfn clampLocal(px: i32, py: i32, w: i32, h: i32) -> vec2<i32> {\r\n    return vec2<i32>(clamp(px, 0, w - 1),\r\n                     clamp(py, 0, h - 1));\r\n}\r\n\r\n/*  4-sample normal (cross) */\r\nfn normal4(px: i32, py: i32, L: i32,\r\n           w: i32, h: i32, ws: f32, dScalar: f32) -> vec3<f32> {\r\n\r\n    let uvL = clampLocal(px - 1, py,     w, h);\r\n    let uvR = clampLocal(px + 1, py,     w, h);\r\n    let uvD = clampLocal(px,     py - 1, w, h);\r\n    let uvU = clampLocal(px,     py + 1, w, h);\r\n\r\n    let hL = computeHnorm(textureLoad(fractalTex, uvL, L).r) * dScalar;\r\n    let hR = computeHnorm(textureLoad(fractalTex, uvR, L).r) * dScalar;\r\n    let hD = computeHnorm(textureLoad(fractalTex, uvD, L).r) * dScalar;\r\n    let hU = computeHnorm(textureLoad(fractalTex, uvU, L).r) * dScalar;\r\n\r\n    let dx = (hR - hL) * 0.5;\r\n    let dy = (hU - hD) * 0.5;\r\n    return normalize(vec3<f32>(dx, dy, ws));\r\n}\r\n\r\n/*  8-sample normal (cross + diagonals) */\r\nfn normal8(px: i32, py: i32, L: i32,\r\n           w: i32, h: i32, ws: f32, dScalar: f32) -> vec3<f32> {\r\n\r\n    let uv  = array<vec2<i32>, 8>(\r\n        clampLocal(px + 1, py,     w, h), // R\r\n        clampLocal(px - 1, py,     w, h), // L\r\n        clampLocal(px,     py + 1, w, h), // U\r\n        clampLocal(px,     py - 1, w, h), // D\r\n        clampLocal(px + 1, py + 1, w, h), // UR\r\n        clampLocal(px - 1, py + 1, w, h), // UL\r\n        clampLocal(px + 1, py - 1, w, h), // DR\r\n        clampLocal(px - 1, py - 1, w, h)  // DL\r\n    );\r\n\r\n    let hVal = array<f32, 8>(\r\n        computeHnorm(textureLoad(fractalTex, uv[0], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[1], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[2], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[3], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[4], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[5], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[6], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[7], L).r) * dScalar\r\n    );\r\n\r\n    let dx = ((hVal[0] + 0.5 * (hVal[4] + hVal[6])) -\r\n              (hVal[1] + 0.5 * (hVal[5] + hVal[7]))) * 0.5;\r\n    let dy = ((hVal[2] + 0.5 * (hVal[4] + hVal[5])) -\r\n              (hVal[3] + 0.5 * (hVal[6] + hVal[7]))) * 0.5;\r\n\r\n    return normalize(vec3<f32>(dx, dy, ws));\r\n}\r\n\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 compute entry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n@compute @workgroup_size(8, 8)\r\nfn main(@builtin(global_invocation_id) gid : vec3<u32>) {\r\n\r\n    /* 1) guard: stay inside this tile view */\r\n    if (gid.x >= sdfParams.tileWidth || gid.y >= sdfParams.tileHeight) {\r\n        return;\r\n    }\r\n\r\n    /* 2) constants */\r\n    let px = i32(gid.x);\r\n    let py = i32(gid.y);\r\n    let w  = i32(sdfParams.tileWidth);   // local clamp (X)\r\n    let h  = i32(sdfParams.gridSize);    // global clamp (Y)\r\n    let L  = i32(sdfParams.layerIndex);\r\n    let ws = 2.0 * sdfParams.quadScale / f32(sdfParams.gridSize);\r\n\r\n    /* 3) height at centre */\r\n    let vC     = textureLoad(fractalTex, clampLocal(px, py, w, h), L).r;\r\n    let hNormC = computeHnorm(vC);\r\n    let dScalar = sdfParams.dispAmp * sdfParams.quadScale;\r\n    let hC     = hNormC * dScalar;\r\n    let wallJump = sdfParams.wallJump * dScalar;\r\n \r\n    /* \u2500\u2500 4) decide once which neighbours we need \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r\n    let needLDU  = (sdfParams.normalMode >= 1u) ||\r\n                (sdfParams.connectivityMode >= 1u);\r\n\r\n    let needDiag = (sdfParams.normalMode == 2u) ||\r\n                (sdfParams.connectivityMode == 2u);\r\n\r\n    /* always R + U -------------------------------------------------- */\r\n    let hR = computeHnorm(textureLoad(\r\n            fractalTex, clampLocal(px + 1, py    , w, h), L).r)\r\n            * dScalar;\r\n\r\n    let hU = computeHnorm(textureLoad(\r\n            fractalTex, clampLocal(px    , py + 1, w, h), L).r)\r\n            * dScalar;\r\n\r\n    /* optional L + D ------------------------------------------------ */\r\n    var hL : f32 = 0.0;\r\n    var hD : f32 = 0.0;\r\n\r\n    if (needLDU) {\r\n        hL = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px - 1, py    , w, h), L).r)\r\n            * dScalar;\r\n\r\n        hD = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px    , py - 1, w, h), L).r)\r\n            * dScalar;\r\n    }\r\n\r\n    /* optional diagonals ------------------------------------------- */\r\n    var hUR : f32 = 0.0;\r\n    var hUL : f32 = 0.0;\r\n    var hDR : f32 = 0.0;\r\n    var hDL : f32 = 0.0;\r\n\r\n    if (needDiag) {\r\n        hUR = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px + 1, py + 1, w, h), L).r)\r\n            * dScalar;\r\n        hUL = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px - 1, py + 1, w, h), L).r)\r\n            * dScalar;\r\n        hDR = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px + 1, py - 1, w, h), L).r)\r\n            * dScalar;\r\n        hDL = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px - 1, py - 1, w, h), L).r)\r\n            * dScalar;\r\n    }\r\n\r\n   \r\n    /* 5) normal + gradient ----------------------------------------- */\r\n    var n      : vec3<f32>;\r\n    var grad2  : f32;          // (rise)\xB2  =  dx\xB2 + dy\xB2\r\n\r\n    switch (sdfParams.normalMode) {\r\n        // ---------- 2-sample ---------------------------------------\r\n        case 0u {\r\n            let dx =  hR - hC;\r\n            let dy =  hU - hC;\r\n            grad2 = dx*dx + dy*dy;\r\n            n     = normalize(vec3<f32>(dx, dy, ws));\r\n        }\r\n\r\n        // ---------- 4-sample ---------------------------------------\r\n        case 1u {\r\n            let dx = (hR - hL) * 0.5;\r\n            let dy = (hU - hD) * 0.5;\r\n            grad2 = dx*dx + dy*dy;\r\n            n     = normalize(vec3<f32>(dx, dy, ws));\r\n        }\r\n\r\n        // ---------- 8-sample ---------------------------------------\r\n        default {\r\n            let dx = ((hR + 0.5*(hUR+hDR)) -\r\n                    (hL + 0.5*(hUL+hDL))) * 0.5;\r\n            let dy = ((hU + 0.5*(hUR+hUL)) -\r\n                    (hD + 0.5*(hDR+hDL))) * 0.5;\r\n            grad2 = dx*dx + dy*dy;\r\n            n     = normalize(vec3<f32>(dx, dy, ws));\r\n        }\r\n    }\r\n\r\n    /* ---- 6) wall flags ------------------------------------------- */\r\n    /* bit layout: 0 R,1 U,2 L,3 D,4-7 diagonals, 8 = steep slope   */\r\n    var flags : u32 = 0u;\r\n\r\n    /* always test R & U ------------------------------------------- */\r\n    if (abs(hR - hC) > wallJump) { flags |= 1u << 0; }   // R\r\n    if (abs(hU - hC) > wallJump) { flags |= 1u << 1; }   // U\r\n\r\n    /* 4-way adds L & D -------------------------------------------- */\r\n    if (sdfParams.connectivityMode >= 1u) {\r\n        if (abs(hL - hC) > wallJump) { flags |= 1u << 2; } // L\r\n        if (abs(hD - hC) > wallJump) { flags |= 1u << 3; } // D\r\n    }\r\n\r\n    /* 8-way adds diagonals ---------------------------------------- */\r\n    if (sdfParams.connectivityMode == 2u) {\r\n        if (abs(hUR - hC) > wallJump) { flags |= 1u << 4; } // UR\r\n        if (abs(hUL - hC) > wallJump) { flags |= 1u << 5; } // UL\r\n        if (abs(hDR - hC) > wallJump) { flags |= 1u << 6; } // DR\r\n        if (abs(hDL - hC) > wallJump) { flags |= 1u << 7; } // DL\r\n    }\r\n\r\n    let invRun2 =            // ( gridSize / 2\xB7quadScale )\xB2\r\n        (f32(sdfParams.gridSize) *\r\n        f32(sdfParams.gridSize)) /\r\n        (4.0 * sdfParams.quadScale * sdfParams.quadScale);\r\n\r\n    // (rise / run)\xB2   =   grad2 \xB7 invRun2\r\n    if (grad2 * invRun2 > sdfParams.slopeLimit) {\r\n        flags |= 1u << 8;\r\n    }\r\n\r\n    /* \u2500\u2500 7) store height, normal & flags ---------------- */\r\n    textureStore(sdfTex , vec2<i32>(px, py), L,\r\n                vec4<f32>(hC, n.x, n.y, n.z));\r\n\r\n    textureStore(flagTex, vec2<i32>(px, py), L,\r\n                vec4<u32>(flags, 0u, 0u, 0u));\r\n}";

  // shaders/fsdfCompute.js
  var SdfComputeGPU = class {
    constructor(device, uniformStride = 256, group0 = null, group1 = null) {
      this.device = device;
      this.uniformStride = uniformStride;
      this._allocEpoch = 0;
      this._group0 = group0 ?? device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: uniformStride
            }
          }
        ]
      });
      this._group1 = group1 ?? device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "read-only",
              format: "rgba8unorm",
              viewDimension: "2d-array"
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "write-only",
              format: "rgba16float",
              viewDimension: "2d-array"
            }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            storageTexture: {
              access: "write-only",
              format: "r32uint",
              viewDimension: "2d-array"
            }
          }
        ]
      });
      this._pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [this._group0, this._group1]
      });
      this._module = device.createShaderModule({ code: fsdfCompute_default });
      this._pipeCache = /* @__PURE__ */ new Map();
    }
    _pipeline(entryPoint = "main") {
      let p = this._pipeCache.get(entryPoint);
      if (!p) {
        p = this.device.createComputePipeline({
          layout: this._pipelineLayout,
          compute: { module: this._module, entryPoint }
        });
        this._pipeCache.set(entryPoint, p);
      }
      return p;
    }
    /**
     * Ensure SDF & Flag textures + layer-0 views exist for every chunk.
     * Always allocates 1 layer (arrayLayerCount=1).
     *
     * Note: GPUTexture has no readable `.size`, so we track allocation dimensions on the chunk.
     */
    ensureSdfForChunks(chunks) {
      if (!Array.isArray(chunks)) {
        throw new Error("ensureSdfForChunks: chunks must be an array");
      }
      for (const c of chunks) {
        const w = c && Number.isFinite(+c.width) ? c.width | 0 : 0;
        const h = c && Number.isFinite(+c.height) ? c.height | 0 : 0;
        if (w <= 0 || h <= 0) {
          throw new Error(
            "ensureSdfForChunks: each chunk must have numeric width and height"
          );
        }
        const needRecreate = !c.sdfTex || !c.flagTex || (c._sdfW | 0) !== w || (c._sdfH | 0) !== h || (c._sdfLayers | 0) !== 1;
        if (needRecreate) {
          try {
            if (c.sdfTex) c.sdfTex.destroy();
          } catch (_) {
          }
          try {
            if (c.flagTex) c.flagTex.destroy();
          } catch (_) {
          }
          const sdfTex = this.device.createTexture({
            size: [w, h, 1],
            format: "rgba16float",
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
          });
          const flagTex = this.device.createTexture({
            size: [w, h, 1],
            format: "r32uint",
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
          });
          const sdfLayerView0 = sdfTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1
          });
          const flagLayerView0 = flagTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1
          });
          const sdfView = sdfTex.createView({
            dimension: "2d-array",
            arrayLayerCount: 1
          });
          const flagView = flagTex.createView({
            dimension: "2d-array",
            arrayLayerCount: 1
          });
          c.sdfTex = sdfTex;
          c.flagTex = flagTex;
          c.sdfLayerViews = [sdfLayerView0];
          c.flagLayerViews = [flagLayerView0];
          c.sdfView = sdfView;
          c.flagView = flagView;
          c._sdfW = w;
          c._sdfH = h;
          c._sdfLayers = 1;
          c._sdfLayerBgs = /* @__PURE__ */ new Map();
          c._sdfFractalView = null;
          this._allocEpoch = this._allocEpoch + 1 | 0;
        } else {
          if (!Array.isArray(c.sdfLayerViews) || !c.sdfLayerViews[0]) {
            c.sdfLayerViews = [
              c.sdfTex.createView({
                dimension: "2d-array",
                baseArrayLayer: 0,
                arrayLayerCount: 1
              })
            ];
          }
          if (!Array.isArray(c.flagLayerViews) || !c.flagLayerViews[0]) {
            c.flagLayerViews = [
              c.flagTex.createView({
                dimension: "2d-array",
                baseArrayLayer: 0,
                arrayLayerCount: 1
              })
            ];
          }
          if (!c.sdfView) {
            try {
              c.sdfView = c.sdfTex.createView({
                dimension: "2d-array",
                arrayLayerCount: 1
              });
            } catch (_) {
            }
          }
          if (!c.flagView) {
            try {
              c.flagView = c.flagTex.createView({
                dimension: "2d-array",
                arrayLayerCount: 1
              });
            } catch (_) {
            }
          }
          if (!c._sdfLayerBgs) c._sdfLayerBgs = /* @__PURE__ */ new Map();
        }
      }
    }
    /**
     * Resolve a fractal source view for a chunk.
     * Prefer layer 0; fall back to whatever the chunk carries.
     */
    _getFractalView(chunk) {
      if (Array.isArray(chunk.layerViews)) {
        if (chunk.layerViews[0]) return chunk.layerViews[0];
        const first = chunk.layerViews.find(Boolean);
        if (first) return first;
      }
      if (chunk.fractalView) return chunk.fractalView;
      if (chunk.fractalTex) {
        try {
          return chunk.fractalTex.createView({
            dimension: "2d-array",
            baseArrayLayer: 0,
            arrayLayerCount: 1
          });
        } catch (_) {
          return chunk.fractalTex.createView({ dimension: "2d" });
        }
      }
      throw new Error("SdfComputeGPU: chunk has no fractal view/texture to read");
    }
    /**
     * Pack one dynamic UBO block for a tile. Matches WGSL layout.
     * We always write to array-layer 0 (single-layer outputs).
     */
    _pack(paramsState, chunk) {
      const buf = new ArrayBuffer(this.uniformStride);
      const dv = new DataView(buf);
      let off = 0;
      dv.setUint32(off, paramsState.gridSize >>> 0, true);
      off += 4;
      dv.setUint32(off, 0, true);
      off += 4;
      dv.setUint32(off, chunk.offsetX >>> 0, true);
      off += 4;
      dv.setUint32(off, (chunk.offsetY ?? 0) >>> 0, true);
      off += 4;
      dv.setUint32(off, chunk.width >>> 0, true);
      off += 4;
      dv.setUint32(off, paramsState.gridSize >>> 0, true);
      off += 4;
      dv.setFloat32(off, paramsState.dispAmp ?? 0.15, true);
      off += 4;
      dv.setFloat32(off, paramsState.quadScale ?? 1, true);
      off += 4;
      dv.setFloat32(off, paramsState.slopeLimit ?? 0.5, true);
      off += 4;
      dv.setFloat32(off, paramsState.wallJump ?? 0.05, true);
      off += 4;
      dv.setUint32(off, (paramsState.connectivityMode ?? 0) >>> 0, true);
      off += 4;
      dv.setUint32(off, (paramsState.dispMode ?? 0) >>> 0, true);
      off += 4;
      dv.setFloat32(off, paramsState.dispCurve ?? 0, true);
      off += 4;
      dv.setUint32(off, (paramsState.normalMode ?? 2) >>> 0, true);
      off += 4;
      return buf;
    }
    /**
     * Compute SDFs for chunks into layer 0.
     */
    async compute(chunks, paramsState, layerIndex = 0, aspect = 1, entryPoint = "main") {
      if (!chunks || !chunks.length) return chunks;
      this.ensureSdfForChunks(chunks);
      const N = chunks.length;
      const bigBuf = this.device.createBuffer({
        size: this.uniformStride * N,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      for (let i = 0; i < N; ++i) {
        const blk = this._pack(paramsState, chunks[i], layerIndex, aspect);
        this.device.queue.writeBuffer(bigBuf, i * this.uniformStride, blk);
      }
      const uBG = this.device.createBindGroup({
        layout: this._group0,
        entries: [
          { binding: 0, resource: { buffer: bigBuf, size: this.uniformStride } }
        ]
      });
      const sBgs = new Array(N);
      for (let i = 0; i < N; ++i) {
        const c = chunks[i];
        const fractalView = this._getFractalView(c);
        if (c._sdfFractalView !== fractalView) {
          if (c._sdfLayerBgs) c._sdfLayerBgs.clear();
          c._sdfFractalView = fractalView;
        }
        const cacheKey = 0;
        let bg = c._sdfLayerBgs.get(cacheKey);
        if (!bg) {
          const sdfView = c.sdfLayerViews && c.sdfLayerViews[0];
          const flagView = c.flagLayerViews && c.flagLayerViews[0];
          if (!sdfView || !flagView) {
            throw new Error(
              "SdfComputeGPU.compute: missing sdf/flag layer-0 views for chunk " + i
            );
          }
          bg = this.device.createBindGroup({
            layout: this._group1,
            entries: [
              { binding: 0, resource: fractalView },
              { binding: 1, resource: sdfView },
              { binding: 2, resource: flagView }
            ]
          });
          c._sdfLayerBgs.set(cacheKey, bg);
        }
        sBgs[i] = bg;
      }
      const pipe = this._pipeline(entryPoint);
      const enc = this.device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(pipe);
      for (let i = 0; i < N; ++i) {
        const c = chunks[i];
        pass.setBindGroup(0, uBG, [i * this.uniformStride]);
        pass.setBindGroup(1, sBgs[i]);
        pass.dispatchWorkgroups(
          Math.ceil(c.width / 8),
          Math.ceil(c.height / 8),
          1
        );
      }
      pass.end();
      this.device.queue.submit([enc.finish()]);
      await this.device.queue.onSubmittedWorkDone();
      return chunks;
    }
    destroy(chunks = []) {
      for (const c of chunks) {
        try {
          if (c.sdfTex) c.sdfTex.destroy();
        } catch (_) {
        }
        try {
          if (c.flagTex) c.flagTex.destroy();
        } catch (_) {
        }
        if (c._sdfLayerBgs) c._sdfLayerBgs.clear();
        c.sdfLayerViews = null;
        c.flagLayerViews = null;
        c.sdfView = null;
        c.flagView = null;
        c._sdfLayerBgs = null;
        c._sdfFractalView = null;
        c._sdfW = 0;
        c._sdfH = 0;
        c._sdfLayers = 0;
      }
      this._pipeCache.clear();
    }
    clearPipelineCache() {
      this._pipeCache.clear();
    }
  };

  // shaders/helpers/gl-math.js
  function perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0
    ]);
  }
  function lookAt(eye, center, up) {
    const [ex, ey, ez] = eye;
    const [cx, cy, cz] = center;
    const [ux, uy, uz] = up;
    let fx = ex - cx;
    let fy = ey - cy;
    let fz = ez - cz;
    let rlf = 1 / Math.hypot(fx, fy, fz);
    fx *= rlf;
    fy *= rlf;
    fz *= rlf;
    let rx = uy * fz - uz * fy;
    let ry = uz * fx - ux * fz;
    let rz = ux * fy - uy * fx;
    let rlr = 1 / Math.hypot(rx, ry, rz);
    rx *= rlr;
    ry *= rlr;
    rz *= rlr;
    const ux2 = fy * rz - fz * ry;
    const uy2 = fz * rx - fx * rz;
    const uz2 = fx * ry - fy * rx;
    return new Float32Array([
      rx,
      ux2,
      fx,
      0,
      ry,
      uy2,
      fy,
      0,
      rz,
      uz2,
      fz,
      0,
      -(rx * ex + ry * ey + rz * ez),
      -(ux2 * ex + uy2 * ey + uz2 * ez),
      -(fx * ex + fy * ey + fz * ez),
      1
    ]);
  }
  function mulMat(A, B, out) {
    const dst = out || new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      const cOff = col * 4;
      const b0 = B[cOff + 0];
      const b1 = B[cOff + 1];
      const b2 = B[cOff + 2];
      const b3 = B[cOff + 3];
      dst[cOff + 0] = A[0] * b0 + A[4] * b1 + A[8] * b2 + A[12] * b3;
      dst[cOff + 1] = A[1] * b0 + A[5] * b1 + A[9] * b2 + A[13] * b3;
      dst[cOff + 2] = A[2] * b0 + A[6] * b1 + A[10] * b2 + A[14] * b3;
      dst[cOff + 3] = A[3] * b0 + A[7] * b1 + A[11] * b2 + A[15] * b3;
    }
    return dst;
  }
  var _tmp4x4 = new Float32Array(16);

  // workers/smartBuffers.js
  var hasSAB = typeof SharedArrayBuffer !== "undefined";
  function allocTyped(Type, length) {
    const buf = hasSAB ? new SharedArrayBuffer(Type.BYTES_PER_ELEMENT * length) : new ArrayBuffer(Type.BYTES_PER_ELEMENT * length);
    return new Type(buf);
  }
  function transferList(buffers) {
    const filtered = hasSAB ? buffers.filter((b) => !(b instanceof SharedArrayBuffer)) : buffers;
    if (filtered.length > 0) return filtered;
    return void 0;
  }

  // workers/WorkerPool.js
  var WorkerPool = class {
    /**
     * @param {string | URL} workerUrl  Module worker script.
     * @param {number} [size]           #workers (defaults to hw threads or 4).
     */
    constructor(workerUrl, size = Math.max(1, navigator.hardwareConcurrency || 4)) {
      this.workers = [];
      this.queue = [];
      this.pending = /* @__PURE__ */ new Map();
      this.nextId = 0;
      for (let i = 0; i < size; i++) {
        const w = new Worker(workerUrl, { type: "module" });
        w.onmessage = (e) => this.#handleDone(w, e.data);
        w.onerror = (err) => console.error("Worker error:", err);
        this.workers.push({ w, busy: false });
      }
    }
    /**
     * Enqueue work in the pool.
     * @param {any}            payload  Data posted to the worker.
     * @param {ArrayBuffer[]} [buffers] ArrayBuffers you *might* want transferred.
     *                                  SharedArrayBuffers will be auto-filtered out.
     * @returns {Promise<any>}          Resolves with worker's `result`.
     */
    exec(payload, buffers = []) {
      return new Promise((resolve, reject) => {
        const id = this.nextId++;
        const xfer = transferList(buffers);
        this.pending.set(id, { resolve, reject });
        this.queue.push({ id, payload, transfer: xfer });
        this.#pump();
      });
    }
    /** Kill workers and clear queues/promises. */
    async terminate() {
      for (const { w } of this.workers) w.terminate();
      this.queue.length = 0;
      this.pending.clear();
    }
    /* ───────── private helpers ───────── */
    #handleDone(worker, { id, result, error }) {
      const entry = this.pending.get(id);
      if (!entry) return;
      error ? entry.reject(error) : entry.resolve(result);
      this.pending.delete(id);
      const slot = this.workers.find((s) => s.w === worker);
      if (slot) slot.busy = false;
      this.#pump();
    }
    #pump() {
      while (this.queue.length) {
        const idle = this.workers.find((s) => !s.busy);
        if (!idle) break;
        const job = this.queue.shift();
        idle.busy = true;
        idle.w.postMessage(
          { id: job.id, payload: job.payload },
          job.transfer
          // already SAB-safe
        );
      }
    }
  };

  // workers/quadBuilder.worker.js
  var import_meta = {};
  var url;
  if (typeof process !== "undefined") {
    try {
      if (typeof import_meta !== "undefined") {
        globalThis.__filename = fileURLToPath(import_meta.url);
        globalThis.__dirname = fileURLToPath(new URL(".", import_meta.url));
      }
      let p = __require("path");
      url = p.join(process.cwd(), __dirname, "dist", "quadBuilder.worker.js");
    } catch {
    }
  } else {
    let href = globalThis.location.href;
    let relLoc = href.split("/");
    relLoc.pop();
    relLoc = relLoc.join("/");
    url = relLoc + "/dist/quadBuilder.worker.js";
  }
  var quadBuilder_worker_default = url;

  // workers/buildPlaneGrid.js
  var pool = new WorkerPool(
    quadBuilder_worker_default,
    4
    // threads — tweak or derive from navigator.hardwareConcurrency
  );
  async function buildPlaneGridChunks(device, divs, maxVerts = 8e6) {
    const vertsPerRow = divs + 1;
    const rowsPerStripe = Math.max(1, Math.floor(maxVerts / vertsPerRow));
    const jobs = [];
    let y0 = 0;
    while (y0 < divs) {
      const quadRows = Math.min(rowsPerStripe, divs - y0);
      const ownFirstRow = y0 === 0;
      if (hasSAB) {
        const vertRows = quadRows + (ownFirstRow ? 1 : 2);
        const localVerts = vertRows * vertsPerRow;
        const localIdx = quadRows * divs * 6;
        const vArr = allocTyped(Float32Array, localVerts * 5);
        const iArr = allocTyped(Uint32Array, localIdx);
        jobs.push(
          pool.exec(
            {
              divs,
              y0,
              quadRows,
              ownFirstRow,
              vBuf: vArr.buffer,
              iBuf: iArr.buffer
            },
            /* SABs are *not* transferable but we still pass the list
               so AB fallback code stays symmetric. */
            transferList([vArr.buffer, iArr.buffer])
          ).then((meta) => ({ ...meta, vArr, iArr }))
        );
      } else {
        jobs.push(
          pool.exec({ divs, y0, quadRows, ownFirstRow }).then(({ vArray, iArray, indexCount, y0: y02, y1 }) => ({
            vArr: new Float32Array(vArray),
            iArr: new Uint32Array(iArray),
            indexCount,
            y0: y02,
            y1
          }))
        );
      }
      y0 += quadRows;
    }
    const chunks = await Promise.all(jobs);
    return chunks.map(({ vArr, iArr, indexCount, y0: y02, y1 }) => {
      const vbuf = device.createBuffer({
        size: vArr.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      const ibuf = device.createBuffer({
        size: iArr.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(vbuf, 0, vArr);
      device.queue.writeBuffer(ibuf, 0, iArr);
      return { vbuf, ibuf, indexCount, y0: y02, y1 };
    });
  }

  // shaders/fractalFragment.wgsl
  var fractalFragment_default = "// \u2500\u2500 camera & sampler (group 0) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct Camera {\r\n  viewProj : mat4x4<f32>,\r\n};\r\n@group(0) @binding(3) var<uniform> camera : Camera;\r\n\r\n@group(0) @binding(1) var mySamp : sampler;\r\n\r\n// \u2500\u2500 render params (group 0 / binding 2) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n// Must match vertex shader and JS packing.\r\nstruct RenderParams {\r\n  layerIndex      : u32,\r\n  scheme          : u32,\r\n  useHueGradient  : u32,\r\n  dispMode        : u32,\r\n\r\n  bowlOn          : u32,\r\n  lightingOn      : u32,\r\n  dispLimitOn     : u32,\r\n  alphaMode       : u32,\r\n\r\n  hueOffset       : f32,\r\n  dispAmp         : f32,\r\n  dispCurve       : f32,\r\n  bowlDepth       : f32,\r\n\r\n  quadScale       : f32,\r\n  gridSize        : f32,\r\n  slopeLimit      : f32,\r\n  wallJump        : f32,\r\n\r\n  lightPos        : vec3<f32>,\r\n  specPower       : f32,\r\n\r\n  worldOffset     : f32,\r\n  worldStart      : f32,\r\n  _pad0           : vec2<f32>,\r\n};\r\n@group(0) @binding(2) var<uniform> render : RenderParams;\r\n\r\nstruct Threshold {\r\n  lowT   : f32,\r\n  highT  : f32,\r\n  basis  : f32,\r\n  _pad0  : f32,\r\n};\r\n@group(0) @binding(4) var<uniform> thr : Threshold;\r\n\r\n// Optional gradient texture (group 0 / binding 5)\r\n// 1D gradient packed in a 2D texture: width = N, height = 1\r\n@group(0) @binding(5) var gradTex : texture_2d<f32>;\r\n\r\n// group 0 / binding 0 -> color array texture (fractal source)\r\n@group(0) @binding(0) var myTex : texture_2d_array<f32>;\r\n\r\n// group 1: model + sdf + flag + sampler (bindings exist even if fragment doesn't read them)\r\nstruct Model {\r\n  world         : mat4x4<f32>,\r\n  uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\n@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;\r\n@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r\n@group(1) @binding(3) var samp : sampler;\r\n\r\n// vertex -> fragment IO (must match your vertex shader)\r\nstruct FSIn {\r\n  @builtin(position)              pos    : vec4<f32>,\r\n  @location(0)                    uv     : vec2<f32>,\r\n  @location(1)                    wPos   : vec3<f32>,\r\n  @location(2)                    s      : vec4<f32>,\r\n  @location(3) @interpolate(flat) flag   : u32,\r\n};\r\n\r\nfn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {\r\n  let H = fract(hsl.x);\r\n  let S = clamp(hsl.y, 0.0, 1.0);\r\n  let L = clamp(hsl.z, 0.0, 1.0);\r\n\r\n  let C  = (1.0 - abs(2.0 * L - 1.0)) * S;\r\n  let Hp = H * 6.0;\r\n\r\n  let t  = Hp - 2.0 * floor(Hp * 0.5);\r\n  let X  = C * (1.0 - abs(t - 1.0));\r\n\r\n  var rgb = vec3<f32>(0.0);\r\n\r\n  if      (Hp < 1.0) { rgb = vec3<f32>(C, X, 0.0); }\r\n  else if (Hp < 2.0) { rgb = vec3<f32>(X, C, 0.0); }\r\n  else if (Hp < 3.0) { rgb = vec3<f32>(0.0, C, X); }\r\n  else if (Hp < 4.0) { rgb = vec3<f32>(0.0, X, C); }\r\n  else if (Hp < 5.0) { rgb = vec3<f32>(X, 0.0, C); }\r\n  else               { rgb = vec3<f32>(C, 0.0, X); }\r\n\r\n  let m = L - 0.5 * C;\r\n  return rgb + vec3<f32>(m, m, m);\r\n}\r\n\r\nfn sampleGradientRGB(t: f32) -> vec3<f32> {\r\n  let u = clamp(t, 0.0, 1.0);\r\n  let c = textureSampleLevel(gradTex, mySamp, vec2<f32>(u, 0.5), 0.0);\r\n  return clamp(c.rgb, vec3<f32>(0.0), vec3<f32>(1.0));\r\n}\r\n\r\nfn monoTintRGB(l: f32) -> vec3<f32> {\r\n  let ll = clamp(l, 0.0, 1.0);\r\n\r\n  if (abs(render.hueOffset) <= 1e-6) {\r\n    return vec3<f32>(ll);\r\n  }\r\n\r\n  let hue = sampleGradientRGB(fract(render.hueOffset));\r\n  return hue * ll;\r\n}\r\n\r\nfn paletteRGB(r: f32) -> vec3<f32> {\r\n  if (render.useHueGradient != 0u) {\r\n    let u = fract(r + render.hueOffset);\r\n    return sampleGradientRGB(u);\r\n  }\r\n\r\n  var H : f32 = 0.0;\r\n  var S : f32 = 1.0;\r\n  var L : f32 = 0.5;\r\n\r\n  var monoL : f32 = -1.0;\r\n\r\n  switch (render.scheme) {\r\n    case 0u:  { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }\r\n    case 1u:  { H = (0.0 + 60.0 * r) / 360.0;            L = 0.50 + 0.50 * r; }\r\n    case 2u:  { H = (200.0 - 100.0 * r) / 360.0;         L = 0.30 + 0.70 * r; }\r\n    case 3u:  { H = (30.0 + 270.0 * r) / 360.0;          L = 0.30 + 0.40 * r; }\r\n    case 4u:  { H = (120.0 -  90.0 * r) / 360.0;         L = 0.20 + 0.50 * r; }\r\n    case 5u:  { H = (300.0 - 240.0 * r) / 360.0;         L = 0.55 + 0.20 * sin(r * 3.14159); }\r\n\r\n    case 6u:  { monoL = r; }\r\n\r\n    case 7u:  { H = (10.0 + 60.0 * pow(r, 1.2)) / 360.0; L = 0.15 + 0.75 * pow(r, 1.5); }\r\n    case 8u:  { H = r;                                   L = 0.45 + 0.25 * (1.0 - r); }\r\n    case 9u:  { H = fract(2.0 * r);                       L = 0.50; }\r\n    case 10u: { H = fract(3.0 * r + 0.1);                 L = 0.65; }\r\n    case 11u: { H = 0.75 - 0.55 * r;                      L = 0.25 + 0.55 * r * r; }\r\n    case 12u: { H = (5.0 + 70.0 * r) / 360.0;             L = 0.10 + 0.80 * pow(r, 1.4); }\r\n    case 13u: { H = (260.0 - 260.0 * r) / 360.0;          L = 0.30 + 0.60 * pow(r, 0.8); }\r\n    case 14u: { H = (230.0 - 160.0 * r) / 360.0;          L = 0.25 + 0.60 * r; }\r\n    case 15u: { H = (200.0 + 40.0 * r) / 360.0;           L = 0.20 + 0.50 * r; }\r\n    case 16u: { H = 0.60;                                 L = 0.15 + 0.35 * r; }\r\n    case 17u: {\r\n      if (r < 0.5) { H = 0.55 + (0.75 - 0.55) * (r * 2.0); }\r\n      else        { H = 0.02 + (0.11 - 0.02) * ((r - 0.5) * 2.0); }\r\n      L = 0.25 + 0.55 * abs(r - 0.5);\r\n    }\r\n    case 18u: { H = fract(3.0 * r);                       L = 0.50 + 0.25 * (1.0 - r); }\r\n    case 19u: { H = fract(4.0 * r);                       L = 0.50; }\r\n    case 20u: { H = fract(5.0 * r + 0.2);                 L = 0.65; }\r\n    case 21u: { H = (240.0 - 240.0 * r) / 360.0;          L = 0.30 + 0.40 * r; }\r\n    case 22u: { H = fract(r * 6.0 + sin(r * 10.0));       L = 0.40 + 0.30 * sin(r * 20.0); }\r\n    case 23u: { H = (30.0 + 50.0 * r) / 360.0;            L = 0.45 + 0.30 * r; }\r\n    case 24u: { H = (90.0 - 80.0 * r) / 360.0;            L = 0.50 + 0.40 * r; }\r\n    case 25u: { H = (100.0 - 100.0 * r) / 360.0;          L = 0.40 + 0.50 * r; }\r\n\r\n    case 26u: {\r\n      let loopVal = fract(r * 10.0);\r\n      monoL = loopVal * 0.8;\r\n    }\r\n\r\n    case 27u: {\r\n      if (r < 0.5) { H = 0.80 + (0.40 - 0.80) * (r * 2.0); }\r\n      else        { H = 0.10 + (0.00 - 0.10) * ((r - 0.5) * 2.0); }\r\n      L = 0.20 + 0.60 * abs(r - 0.5);\r\n    }\r\n    case 28u: { H = fract(sin(r * 6.28318) * 0.5 + 0.5);  L = 0.50; }\r\n    case 29u: { H = fract(r * 3.0);                       L = fract(r * 3.0); }\r\n    case 30u: { H = fract(r * 6.0);                       L = 0.45 + 0.40 * abs(sin(r * 6.0 * 3.14159)); }\r\n    case 31u: {\r\n      let t = fract(r * 8.0);\r\n      if (t < 0.5) { H = t * 2.0; } else { H = (1.0 - t) * 2.0; }\r\n      L = 0.60 - 0.30 * abs(t - 0.5);\r\n    }\r\n    case 32u: { H = fract(pow(r, 0.7) * 12.0);            L = 0.50 + 0.30 * pow(r, 1.2); }\r\n    case 33u: { H = fract(r * 10.0 + 0.3);                L = 0.40 + 0.50 * r; }\r\n\r\n    default:  { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }\r\n  }\r\n\r\n  if (monoL >= 0.0) {\r\n    return monoTintRGB(monoL);\r\n  }\r\n\r\n  H = fract(H + render.hueOffset);\r\n  return hsl2rgb(vec3<f32>(H, S, L));\r\n}\r\n\r\nstruct GateResult {\r\n  passed : bool,\r\n  alpha  : f32,\r\n};\r\n\r\nfn shouldPassAndComputeAlpha(r: f32, a_in: f32, s_r: f32, flagVal: u32) -> GateResult {\r\n  var res : GateResult;\r\n  var a = a_in;\r\n\r\n  if (render.alphaMode == 1u) {\r\n    a = r;\r\n  } else if (render.alphaMode == 2u) {\r\n    a = 1.0 - r;\r\n  }\r\n\r\n  if (thr.basis < 2.0) {\r\n    let inside = (r >= thr.lowT) && (r <= thr.highT);\r\n    if (thr.basis == 0.0 && !inside) {\r\n      res.passed = false;\r\n      res.alpha = a;\r\n      return res;\r\n    } else if (thr.basis == 1.0 && inside) {\r\n      res.passed = false;\r\n      res.alpha = a;\r\n      return res;\r\n    }\r\n  } else {\r\n    let hC = s_r;\r\n    if (hC < thr.lowT || hC > thr.highT) {\r\n      res.passed = false;\r\n      res.alpha = a;\r\n      return res;\r\n    }\r\n  }\r\n\r\n  if (render.dispLimitOn != 0u && flagVal != 0u) {\r\n    res.passed = false;\r\n    res.alpha = a;\r\n    return res;\r\n  }\r\n\r\n  if (a < 0.01) {\r\n    res.passed = false;\r\n    res.alpha = a;\r\n    return res;\r\n  }\r\n\r\n  res.passed = true;\r\n  res.alpha = a;\r\n  return res;\r\n}\r\n\r\nfn effectiveArrayLayerIndex() -> i32 {\r\n  let nl = max(1u, textureNumLayers(myTex));\r\n  return i32(render.layerIndex % nl);\r\n}\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n// Depth-only prepass\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n@fragment\r\nfn fs_prepass(input : FSIn) -> @location(0) vec4<f32> {\r\n  let li = effectiveArrayLayerIndex();\r\n  let texel = textureSample(myTex, mySamp, input.uv, li);\r\n  let r = texel.r;\r\n  let a = texel.a;\r\n\r\n  let s_r = input.s.r;\r\n  let flagVal = input.flag;\r\n\r\n  let g = shouldPassAndComputeAlpha(r, a, s_r, flagVal);\r\n  if (!g.passed) {\r\n    discard;\r\n  }\r\n\r\n  return vec4<f32>(0.0, 0.0, 0.0, 0.0);\r\n}\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n// Full shading pass\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n@fragment\r\nfn fs_main(input : FSIn) -> @location(0) vec4<f32> {\r\n  let li = effectiveArrayLayerIndex();\r\n  let texel = textureSample(myTex, mySamp, input.uv, li);\r\n  let r     = texel.r;\r\n  let a_in  = texel.a;\r\n\r\n  let s_r = input.s.r;\r\n  let flagVal = input.flag;\r\n\r\n  let g = shouldPassAndComputeAlpha(r, a_in, s_r, flagVal);\r\n  if (!g.passed) {\r\n    discard;\r\n  }\r\n  let a = clamp(g.alpha, 0.0, 1.0);\r\n\r\n  var rgb = paletteRGB(r);\r\n\r\n  if (render.lightingOn != 0u) {\r\n    let n       = normalize(input.s.gba);\r\n    let lightWS = render.lightPos * render.quadScale;\r\n    let Ldir    = normalize(lightWS - input.wPos);\r\n    let Vdir    = normalize(-input.wPos);\r\n    let hVec    = normalize(Ldir + Vdir);\r\n\r\n    let diff = max(dot(n, Ldir), 0.0);\r\n    let spec = pow(max(dot(n, hVec), 0.0), render.specPower) * smoothstep(0.0, 0.1, diff);\r\n\r\n    let ambient    = 0.15;\r\n    let diffWeight = 1.0;\r\n    let specWeight = 1.25;\r\n\r\n    rgb = clamp(\r\n      rgb * (ambient + diffWeight * diff) + specWeight * spec,\r\n      vec3<f32>(0.0),\r\n      vec3<f32>(1.0)\r\n    );\r\n  }\r\n\r\n  return vec4<f32>(rgb, a);\r\n}\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n// Weighted blended OIT pass\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct OITOut {\r\n  @location(0) accum  : vec4<f32>,\r\n  @location(1) reveal : vec4<f32>,\r\n};\r\n\r\nfn oitWeight(depth01: f32, a: f32) -> f32 {\r\n  let z = clamp(depth01, 0.0, 1.0);\r\n  let z2 = z * z;\r\n  let z4 = z2 * z2;\r\n  let wZ = clamp(0.03 / (0.0001 + z4), 0.01, 50.0);\r\n  let wA = max(a, 0.02);\r\n  return wZ * wA;\r\n}\r\n\r\n@fragment\r\nfn fs_oit(input : FSIn) -> OITOut {\r\n  let li = effectiveArrayLayerIndex();\r\n  let texel = textureSample(myTex, mySamp, input.uv, li);\r\n  let r     = texel.r;\r\n  let a_in  = texel.a;\r\n\r\n  let s_r = input.s.r;\r\n  let flagVal = input.flag;\r\n\r\n  let g = shouldPassAndComputeAlpha(r, a_in, s_r, flagVal);\r\n  if (!g.passed) {\r\n    discard;\r\n  }\r\n\r\n  let a = clamp(g.alpha, 0.0, 1.0);\r\n\r\n  var rgb = paletteRGB(r);\r\n\r\n  if (render.lightingOn != 0u) {\r\n    let n       = normalize(input.s.gba);\r\n    let lightWS = render.lightPos * render.quadScale;\r\n    let Ldir    = normalize(lightWS - input.wPos);\r\n    let Vdir    = normalize(-input.wPos);\r\n    let hVec    = normalize(Ldir + Vdir);\r\n\r\n    let diff = max(dot(n, Ldir), 0.0);\r\n    let spec = pow(max(dot(n, hVec), 0.0), render.specPower) * smoothstep(0.0, 0.1, diff);\r\n\r\n    let ambient    = 0.15;\r\n    let diffWeight = 1.0;\r\n    let specWeight = 1.25;\r\n\r\n    rgb = clamp(\r\n      rgb * (ambient + diffWeight * diff) + specWeight * spec,\r\n      vec3<f32>(0.0),\r\n      vec3<f32>(1.0)\r\n    );\r\n  }\r\n\r\n  let w = oitWeight(input.pos.z, a);\r\n\r\n  var out : OITOut;\r\n  out.accum = vec4<f32>(rgb * (a * w), a * w);\r\n  out.reveal = vec4<f32>(0.0, 0.0, 0.0, a);\r\n  return out;\r\n}\r\n";

  // shaders/fractalVertex.wgsl
  var fractalVertex_default = "// \u2500\u2500 camera & sampler (group 0) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct Camera {\r\n  viewProj : mat4x4<f32>,\r\n};\r\n@group(0) @binding(3) var<uniform> camera : Camera;\r\n\r\n@group(0) @binding(1) var mySamp : sampler;\r\n\r\n// \u2500\u2500 render-wide parameters (group 0 / binding 2) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n// Must match JS packing in RenderPipelineGPU.writeRenderUniform() and the fragment shader.\r\nstruct RenderParams {\r\n  layerIndex      : u32,\r\n  scheme          : u32,\r\n  useHueGradient  : u32,\r\n  dispMode        : u32,\r\n\r\n  bowlOn          : u32,\r\n  lightingOn      : u32,\r\n  dispLimitOn     : u32,\r\n  alphaMode       : u32,\r\n\r\n  hueOffset       : f32,\r\n  dispAmp         : f32,\r\n  dispCurve       : f32,\r\n  bowlDepth       : f32,\r\n\r\n  quadScale       : f32,\r\n  gridSize        : f32,\r\n  slopeLimit      : f32,\r\n  wallJump        : f32,\r\n\r\n  lightPos        : vec3<f32>,\r\n  specPower       : f32,\r\n\r\n  worldOffset     : f32,\r\n  worldStart      : f32,\r\n  _pad0           : vec2<f32>,\r\n};\r\n@group(0) @binding(2) var<uniform> render : RenderParams;\r\n\r\n// \u2500\u2500 group 1: per-tile model + precomputed textures + sampler \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct Model {\r\n  world         : mat4x4<f32>,\r\n  uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\n@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;\r\n@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r\n@group(1) @binding(3) var samp : sampler;\r\n\r\n// \u2500\u2500 vertex I/O \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct VertexIn {\r\n  @location(0) position : vec3<f32>,\r\n  @location(1) uv       : vec2<f32>,\r\n};\r\n\r\nstruct VSOut {\r\n  @builtin(position)              pos  : vec4<f32>,\r\n  @location(0)                    uv   : vec2<f32>,\r\n  @location(1)                    wPos : vec3<f32>,\r\n  @location(2)                    s    : vec4<f32>,\r\n  @location(3) @interpolate(flat) flag : u32,\r\n};\r\n\r\nfn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {\r\n  let dims = vec2<i32>(textureDimensions(sdfTex).xy);\r\n  let ix = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);\r\n  let iy = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);\r\n  return vec2<i32>(ix, iy);\r\n}\r\n\r\n@vertex\r\nfn vs_main(in: VertexIn) -> VSOut {\r\n  var out : VSOut;\r\n\r\n  var worldPos = model.world * vec4<f32>(in.position, 1.0);\r\n\r\n  if (render.bowlOn != 0u && render.bowlDepth > 0.00001) {\r\n    let globalUV = model.uvOffsetScale.xy + in.uv * model.uvOffsetScale.zw;\r\n    let offset = globalUV - vec2<f32>(0.5, 0.5);\r\n    let r2 = dot(offset, offset);\r\n    let maxR2 = 0.5;\r\n    let t = 1.0 - clamp(r2 / maxR2, 0.0, 1.0);\r\n    worldPos.z += -render.bowlDepth * t * render.quadScale;\r\n  }\r\n\r\n  var s : vec4<f32> = vec4<f32>(0.0);\r\n  var maskVal : u32 = 0u;\r\n\r\n  if (render.dispMode != 0u || render.lightingOn != 0u) {\r\n    let ij = texelIJ(in.uv);\r\n\r\n    let sdfL = max(1u, textureNumLayers(sdfTex));\r\n    let li = i32(render.layerIndex % sdfL);\r\n\r\n    s = textureLoad(sdfTex, ij, li, 0);\r\n\r\n    if (render.dispMode != 0u && render.dispAmp != 0.0) {\r\n      let h0 = s.r;\r\n      let curve = max(render.dispCurve, 0.0001);\r\n      let h = sign(h0) * pow(abs(h0), curve) * render.dispAmp;\r\n      worldPos.z += h;\r\n    }\r\n\r\n    let flagL = max(1u, textureNumLayers(flagTex));\r\n    let liF = i32(render.layerIndex % flagL);\r\n\r\n    maskVal = textureLoad(flagTex, ij, liF, 0).r;\r\n  }\r\n\r\n  let layerZ = render.worldStart + render.worldOffset * f32(render.layerIndex);\r\n  worldPos.z += layerZ;\r\n\r\n  out.pos  = camera.viewProj * worldPos;\r\n  out.uv   = in.uv;\r\n  out.wPos = worldPos.xyz;\r\n  out.s    = s;\r\n  out.flag = maskVal;\r\n  return out;\r\n}\r\n";

  // shaders/fBlitFragment.wgsl
  var fBlitFragment_default = "// shaders/fBlitFragment.wgsl\r\n\r\nstruct RenderParams {\r\n  layerIndex      : u32,\r\n  scheme          : u32,\r\n  useHueGradient  : u32,\r\n  dispMode        : u32,\r\n\r\n  bowlOn          : u32,\r\n  lightingOn      : u32,\r\n  dispLimitOn     : u32,\r\n  alphaMode       : u32,\r\n\r\n  hueOffset       : f32,\r\n  dispAmp         : f32,\r\n  dispCurve       : f32,\r\n  bowlDepth       : f32,\r\n\r\n  quadScale       : f32,\r\n  gridSize        : f32,\r\n  slopeLimit      : f32,\r\n  wallJump        : f32,\r\n\r\n  lightPos        : vec3<f32>,\r\n  specPower       : f32,\r\n\r\n  worldOffset     : f32,\r\n  worldStart      : f32,\r\n  _pad0           : vec2<f32>,\r\n};\r\n@group(0) @binding(2) var<uniform> render : RenderParams;\r\n\r\nstruct Threshold {\r\n  lowT   : f32,\r\n  highT  : f32,\r\n  basis  : f32,\r\n  _pad0  : f32,\r\n};\r\n@group(0) @binding(4) var<uniform> thr : Threshold;\r\n\r\n@group(0) @binding(0) var myTex : texture_2d_array<f32>;\r\n@group(0) @binding(1) var mySamp : sampler;\r\n\r\n@group(0) @binding(5) var gradTex : texture_2d<f32>;\r\n\r\nstruct Model {\r\n  world         : mat4x4<f32>,\r\n  uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\n@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;\r\n@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r\n@group(1) @binding(3) var samp : sampler;\r\n\r\nstruct VSOut {\r\n  @builtin(position)              pos  : vec4<f32>,\r\n  @location(0)                    uv   : vec2<f32>,\r\n  @location(1)                    wPos : vec3<f32>,\r\n  @location(2)                    s    : vec4<f32>,\r\n  @location(3) @interpolate(flat) flag : u32,\r\n};\r\n\r\nfn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {\r\n  let H = fract(hsl.x);\r\n  let S = clamp(hsl.y, 0.0, 1.0);\r\n  let L = clamp(hsl.z, 0.0, 1.0);\r\n\r\n  let C  = (1.0 - abs(2.0 * L - 1.0)) * S;\r\n  let Hp = H * 6.0;\r\n\r\n  let t  = Hp - 2.0 * floor(Hp * 0.5);\r\n  let X  = C * (1.0 - abs(t - 1.0));\r\n\r\n  var rgb = vec3<f32>(0.0);\r\n\r\n  if      (Hp < 1.0) { rgb = vec3<f32>(C, X, 0.0); }\r\n  else if (Hp < 2.0) { rgb = vec3<f32>(X, C, 0.0); }\r\n  else if (Hp < 3.0) { rgb = vec3<f32>(0.0, C, X); }\r\n  else if (Hp < 4.0) { rgb = vec3<f32>(0.0, X, C); }\r\n  else if (Hp < 5.0) { rgb = vec3<f32>(X, 0.0, C); }\r\n  else               { rgb = vec3<f32>(C, 0.0, X); }\r\n\r\n  let m = L - 0.5 * C;\r\n  return rgb + vec3<f32>(m, m, m);\r\n}\r\n\r\nfn sampleGradientRGB(t: f32) -> vec3<f32> {\r\n  let u = clamp(t, 0.0, 1.0);\r\n  let c = textureSampleLevel(gradTex, mySamp, vec2<f32>(u, 0.5), 0.0);\r\n  return clamp(c.rgb, vec3<f32>(0.0), vec3<f32>(1.0));\r\n}\r\n\r\nstruct GateResult {\r\n  passed : bool,\r\n  alpha  : f32,\r\n};\r\n\r\nfn shouldPassAndComputeAlpha(r: f32, a_in: f32, s_r: f32, flagVal: u32) -> GateResult {\r\n  var res : GateResult;\r\n  var a = a_in;\r\n\r\n  if (render.alphaMode == 1u) {\r\n    a = r;\r\n  } else if (render.alphaMode == 2u) {\r\n    a = 1.0 - r;\r\n  }\r\n\r\n  if (thr.basis < 2.0) {\r\n    let inside = (r >= thr.lowT) && (r <= thr.highT);\r\n    if (thr.basis == 0.0 && !inside) {\r\n      res.passed = false;\r\n      res.alpha = a;\r\n      return res;\r\n    } else if (thr.basis == 1.0 && inside) {\r\n      res.passed = false;\r\n      res.alpha = a;\r\n      return res;\r\n    }\r\n  } else {\r\n    let hC = s_r;\r\n    if (hC < thr.lowT || hC > thr.highT) {\r\n      res.passed = false;\r\n      res.alpha = a;\r\n      return res;\r\n    }\r\n  }\r\n\r\n  if (render.dispLimitOn != 0u && flagVal != 0u) {\r\n    res.passed = false;\r\n    res.alpha = a;\r\n    return res;\r\n  }\r\n\r\n  if (a < 0.01) {\r\n    res.passed = false;\r\n    res.alpha = a;\r\n    return res;\r\n  }\r\n\r\n  res.passed = true;\r\n  res.alpha = a;\r\n  return res;\r\n}\r\n\r\nfn effectiveArrayLayerIndex() -> i32 {\r\n  let nl = max(1u, textureNumLayers(myTex));\r\n  return i32(render.layerIndex % nl);\r\n}\r\n\r\n@fragment\r\nfn fs_blit(input : VSOut) -> @location(0) vec4<f32> {\r\n  let li = effectiveArrayLayerIndex();\r\n  let texel = textureSample(myTex, mySamp, input.uv, li);\r\n  let r     = texel.r;\r\n  let a_in  = texel.a;\r\n\r\n  let s_r = input.s.r;\r\n  let flagVal = input.flag;\r\n\r\n  let g = shouldPassAndComputeAlpha(r, a_in, s_r, flagVal);\r\n  if (!g.passed) {\r\n    discard;\r\n  }\r\n  let a = g.alpha;\r\n\r\n  var rgb = vec3<f32>(0.0);\r\n\r\n  if (render.useHueGradient != 0u) {\r\n    let u = fract(r + render.hueOffset);\r\n    rgb = sampleGradientRGB(u);\r\n  } else {\r\n    var H : f32 = 0.0;\r\n    var S : f32 = 1.0;\r\n    var L : f32 = 0.5;\r\n\r\n    switch (render.scheme) {\r\n      case 0u: { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }\r\n      case 1u: { H = (0.0 + 60.0 * r) / 360.0; L = 0.50 + 0.50 * r; }\r\n      case 2u: { H = (200.0 - 100.0 * r) / 360.0; L = 0.30 + 0.70 * r; }\r\n      case 3u: { H = (30.0 + 270.0 * r) / 360.0; L = 0.30 + 0.40 * r; }\r\n      case 4u: { H = (120.0 -  90.0 * r) / 360.0; L = 0.20 + 0.50 * r; }\r\n      case 5u: { H = (300.0 - 240.0 * r) / 360.0; L = 0.55 + 0.20 * sin(r * 3.14159); }\r\n      case 6u: { return vec4<f32>(vec3<f32>(r), a); }\r\n      case 7u: { H = (10.0 + 60.0 * pow(r, 1.2)) / 360.0; L = 0.15 + 0.75 * pow(r, 1.5); }\r\n      case 8u: { H = r; L = 0.45 + 0.25 * (1.0 - r); }\r\n      case 9u: { H = fract(2.0 * r); L = 0.50; }\r\n      case 10u: { H = fract(3.0 * r + 0.1); L = 0.65; }\r\n      case 11u: { H = 0.75 - 0.55 * r; L = 0.25 + 0.55 * r * r; }\r\n      case 12u: { H = (5.0 + 70.0 * r) / 360.0; L = 0.10 + 0.80 * pow(r, 1.4); }\r\n      case 13u: { H = (260.0 - 260.0 * r) / 360.0; L = 0.30 + 0.60 * pow(r, 0.8); }\r\n      case 14u: { H = (230.0 - 160.0 * r) / 360.0; L = 0.25 + 0.60 * r; }\r\n      case 15u: { H = (200.0 + 40.0 * r) / 360.0; L = 0.20 + 0.50 * r; }\r\n      case 16u: { H = 0.60; L = 0.15 + 0.35 * r; }\r\n      case 17u: {\r\n        if (r < 0.5) { H = 0.55 + (0.75 - 0.55) * (r * 2.0); }\r\n        else { H = 0.02 + (0.11 - 0.02) * ((r - 0.5) * 2.0); }\r\n        L = 0.25 + 0.55 * abs(r - 0.5);\r\n      }\r\n      case 18u: { H = fract(3.0 * r); L = 0.50 + 0.25 * (1.0 - r); }\r\n      case 19u: { H = fract(4.0 * r); L = 0.50; }\r\n      case 20u: { H = fract(5.0 * r + 0.2); L = 0.65; }\r\n      case 21u: { H = (240.0 - 240.0 * r) / 360.0; L = 0.30 + 0.40 * r; }\r\n      case 22u: { H = fract(r * 6.0 + sin(r * 10.0)); L = 0.40 + 0.30 * sin(r * 20.0); }\r\n      case 23u: { H = (30.0 + 50.0 * r) / 360.0; L = 0.45 + 0.30 * r; }\r\n      case 24u: { H = (90.0 - 80.0 * r) / 360.0; L = 0.50 + 0.40 * r; }\r\n      case 25u: { H = (100.0 - 100.0 * r) / 360.0; L = 0.40 + 0.50 * r; }\r\n      case 26u: {\r\n        let loopVal = fract(r * 10.0);\r\n        let Lmono   = loopVal * 0.8;\r\n        return vec4<f32>(vec3<f32>(Lmono), a);\r\n      }\r\n      case 27u: {\r\n        if (r < 0.5) { H = 0.80 + (0.40 - 0.80) * (r * 2.0); }\r\n        else { H = 0.10 + (0.00 - 0.10) * ((r - 0.5) * 2.0); }\r\n        L = 0.20 + 0.60 * abs(r - 0.5);\r\n      }\r\n      case 28u: { H = fract(sin(r * 6.28318) * 0.5 + 0.5); L = 0.50; }\r\n      case 29u: { H = fract(r * 3.0); L = fract(r * 3.0); }\r\n      case 30u: { H = fract(r * 6.0); L = 0.45 + 0.40 * abs(sin(r * 6.0 * 3.14159)); }\r\n      case 31u: {\r\n        let t = fract(r * 8.0);\r\n        if (t < 0.5) { H = t * 2.0; } else { H = (1.0 - t) * 2.0; }\r\n        L = 0.60 - 0.30 * abs(t - 0.5);\r\n      }\r\n      case 32u: { H = fract(pow(r, 0.7) * 12.0); L = 0.50 + 0.30 * pow(r, 1.2); }\r\n      case 33u: { H = fract(r * 10.0 + 0.3); L = 0.40 + 0.50 * r; }\r\n      default: { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }\r\n    }\r\n\r\n    H = fract(H + render.hueOffset);\r\n    rgb = hsl2rgb(vec3<f32>(H, S, L));\r\n  }\r\n\r\n  if (render.lightingOn != 0u) {\r\n    let n       = normalize(input.s.gba);\r\n    let lightWS = render.lightPos * render.quadScale;\r\n    let Ldir    = normalize(lightWS - input.wPos);\r\n    let Vdir    = normalize(-input.wPos);\r\n    let hVec    = normalize(Ldir + Vdir);\r\n\r\n    let diff = max(dot(n, Ldir), 0.0);\r\n    let spec = pow(max(dot(n, hVec), 0.0), render.specPower) * smoothstep(0.0, 0.1, diff);\r\n\r\n    let ambient    = 0.15;\r\n    let diffWeight = 1.0;\r\n    let specWeight = 1.25;\r\n\r\n    rgb = clamp(\r\n      rgb * (ambient + diffWeight * diff) + specWeight * spec,\r\n      vec3<f32>(0.0),\r\n      vec3<f32>(1.0)\r\n    );\r\n  }\r\n\r\n  return vec4<f32>(rgb, a);\r\n}\r\n";

  // shaders/fBlitVertex.wgsl
  var fBlitVertex_default = "// shaders/fBlitVertex.wgsl\r\n\r\nstruct RenderParams {\r\n  layerIndex      : u32,\r\n  scheme          : u32,\r\n  useHueGradient  : u32,\r\n  dispMode        : u32,\r\n\r\n  bowlOn          : u32,\r\n  lightingOn      : u32,\r\n  dispLimitOn     : u32,\r\n  alphaMode       : u32,\r\n\r\n  hueOffset       : f32,\r\n  dispAmp         : f32,\r\n  dispCurve       : f32,\r\n  bowlDepth       : f32,\r\n\r\n  quadScale       : f32,\r\n  gridSize        : f32,\r\n  slopeLimit      : f32,\r\n  wallJump        : f32,\r\n\r\n  lightPos        : vec3<f32>,\r\n  specPower       : f32,\r\n\r\n  worldOffset     : f32,\r\n  worldStart      : f32,\r\n  _pad0           : vec2<f32>,\r\n};\r\n@group(0) @binding(2) var<uniform> render : RenderParams;\r\n\r\nstruct Model {\r\n  world         : mat4x4<f32>,\r\n  uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\n@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;\r\n@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r\n@group(1) @binding(3) var samp : sampler;\r\n\r\nstruct VSIn {\r\n  @location(0) position : vec3<f32>,\r\n  @location(1) uv       : vec2<f32>,\r\n};\r\n\r\nstruct VSOut {\r\n  @builtin(position)              pos  : vec4<f32>,\r\n  @location(0)                    uv   : vec2<f32>,\r\n  @location(1)                    wPos : vec3<f32>,\r\n  @location(2)                    s    : vec4<f32>,\r\n  @location(3) @interpolate(flat) flag : u32,\r\n};\r\n\r\nfn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {\r\n  let dims = vec2<i32>(textureDimensions(sdfTex).xy);\r\n  let ix = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);\r\n  let iy = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);\r\n  return vec2<i32>(ix, iy);\r\n}\r\n\r\n@vertex\r\nfn vs_blit(input : VSIn) -> VSOut {\r\n  var out : VSOut;\r\n\r\n  let globalUV = model.uvOffsetScale.xy + input.uv * model.uvOffsetScale.zw;\r\n\r\n  let clipX = globalUV.x * 2.0 - 1.0;\r\n  let clipY = 1.0 - globalUV.y * 2.0;\r\n\r\n  var s : vec4<f32> = vec4<f32>(0.0);\r\n  var maskVal : u32 = 0u;\r\n\r\n  if (render.dispMode != 0u || render.lightingOn != 0u || render.dispLimitOn != 0u) {\r\n    let ij = texelIJ(input.uv);\r\n\r\n    let sdfL = max(1u, textureNumLayers(sdfTex));\r\n    let li = i32(render.layerIndex % sdfL);\r\n    s = textureLoad(sdfTex, ij, li, 0);\r\n\r\n    let flagL = max(1u, textureNumLayers(flagTex));\r\n    let liF = i32(render.layerIndex % flagL);\r\n    maskVal = textureLoad(flagTex, ij, liF, 0).r;\r\n  }\r\n\r\n  var wz = render.worldStart + render.worldOffset * f32(render.layerIndex);\r\n\r\n  if (render.bowlOn != 0u && render.bowlDepth > 0.00001) {\r\n    let offset = globalUV - vec2<f32>(0.5, 0.5);\r\n    let r2 = dot(offset, offset);\r\n    let maxR2 = 0.5;\r\n    let t = 1.0 - clamp(r2 / maxR2, 0.0, 1.0);\r\n    wz += -render.bowlDepth * t * render.quadScale;\r\n  }\r\n\r\n  if (render.dispMode != 0u && render.dispAmp != 0.0) {\r\n    let h0 = s.r;\r\n    let curve = max(render.dispCurve, 0.0001);\r\n    let h = sign(h0) * pow(abs(h0), curve) * render.dispAmp;\r\n    wz += h;\r\n  }\r\n\r\n  out.pos  = vec4<f32>(clipX, clipY, 0.0, 1.0);\r\n  out.uv   = input.uv;\r\n  out.wPos = vec3<f32>(clipX * render.quadScale, clipY * render.quadScale, wz);\r\n  out.s    = s;\r\n  out.flag = maskVal;\r\n  return out;\r\n}\r\n";

  // shaders/fractalRender.js
  function _clamp01(x) {
    x = +x;
    return x <= 0 ? 0 : x >= 1 ? 1 : x;
  }
  function _alignUp(v, a) {
    v = v | 0;
    a = a | 0;
    return v + (a - 1) & ~(a - 1);
  }
  function _isFiniteNum(x) {
    return typeof x === "number" && Number.isFinite(x);
  }
  function _u32(v, d) {
    const n = v == null ? d : v;
    return n >>> 0 | 0;
  }
  function _f32(v, d) {
    const n = v == null ? d : v;
    const x = +n;
    return Number.isFinite(x) ? x : d;
  }
  function _v3(a, d0, d1, d2) {
    if (!Array.isArray(a)) return [d0, d1, d2];
    return [
      Number.isFinite(+a[0]) ? +a[0] : d0,
      Number.isFinite(+a[1]) ? +a[1] : d1,
      Number.isFinite(+a[2]) ? +a[2] : d2
    ];
  }
  var _OIT_COMPOSITE_WGSL = `
// group(0): accum/reveal + sampler
@group(0) @binding(0) var accumTex : texture_2d<f32>;
@group(0) @binding(1) var revealTex : texture_2d<f32>;
@group(0) @binding(2) var samp : sampler;

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs_fullscreen(@builtin(vertex_index) vi : u32) -> VSOut {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );

  // Flip V so the offscreen render-target samples match the onscreen orientation.
  var uv = array<vec2<f32>, 3>(
    vec2<f32>(0.0,  1.0),
    vec2<f32>(2.0,  1.0),
    vec2<f32>(0.0, -1.0)
  );

  var o : VSOut;
  o.pos = vec4<f32>(pos[vi], 0.0, 1.0);
  o.uv = uv[vi];
  return o;
}

fn safeDiv(a: vec3<f32>, b: f32) -> vec3<f32> {
  let d = max(b, 1e-6);
  return a / d;
}

@fragment
fn fs_composite_premul(i: VSOut) -> @location(0) vec4<f32> {
  let acc = textureSampleLevel(accumTex, samp, i.uv, 0.0);
  let rev = textureSampleLevel(revealTex, samp, i.uv, 0.0);

  let rgb = safeDiv(acc.rgb, acc.a);
  let revealage = clamp(rev.a, 0.0, 1.0);
  let a = clamp(1.0 - revealage, 0.0, 1.0);

  return vec4<f32>(rgb * a, a);
}

@fragment
fn fs_composite_opaque(i: VSOut) -> @location(0) vec4<f32> {
  let acc = textureSampleLevel(accumTex, samp, i.uv, 0.0);
  let rgb = safeDiv(acc.rgb, acc.a);
  return vec4<f32>(rgb, 1.0);
}
`;
  var RenderPipelineGPU = class _RenderPipelineGPU {
    constructor(device, context, vsCode = fractalVertex_default, fsCode = fractalFragment_default, opts = {}) {
      this.device = device;
      this.context = context;
      this.vsCode = vsCode;
      this.fsCode = fsCode;
      this.renderUniformStride = _alignUp(opts.renderUniformStride ?? 256, 256);
      this.gridDivs = opts.initialGridDivs ?? 256;
      this.quadScale = opts.quadScale ?? 1;
      this.canvasAlphaMode = opts.canvasAlphaMode ?? "premultiplied";
      this.invertCameraY = opts.invertCameraY != null ? !!opts.invertCameraY : true;
      this.format = navigator.gpu.getPreferredCanvasFormat();
      this._gradientSize = Math.max(
        2,
        Math.min(4096, (opts.gradientSize ?? 512) | 0)
      );
      this._gradientTex = null;
      this._gradientView = null;
      this._fallbackGradTex = null;
      this._fallbackGradView = null;
      this.sampler = device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
      });
      this._renderUBOCapLayers = 0;
      this.renderUniformBuffer = null;
      this._renderUBOTmp = new ArrayBuffer(96);
      this._renderUBODV = new DataView(this._renderUBOTmp);
      this._threshTmp = new Float32Array(4);
      this.threshBuf = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.cameraBuffer = device.createBuffer({
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.gridStripes = null;
      this.chunks = [];
      this.modelBuffers = [];
      this._depthView = null;
      this.depthTexture = null;
      this._lastCanvasSize = [0, 0];
      this._fallbackSdfTex = null;
      this._fallbackSdfView = null;
      this._fallbackFlagTex = null;
      this._fallbackFlagView = null;
      this._oitAccumTex = null;
      this._oitAccumView = null;
      this._oitRevealTex = null;
      this._oitRevealView = null;
      this._oitW = 0;
      this._oitH = 0;
      this._oitBg = null;
      this._modelKey = "";
      this._lastSetChunksState = {
        chunksRef: null,
        layersCount: 0,
        requireSdf: false
      };
      this._tmpLookTarget = [0, 0, 0];
      this._rpDescOpaque = {
        colorAttachments: [
          {
            view: null,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }
        ],
        depthStencilAttachment: {
          view: null,
          depthLoadOp: "clear",
          depthStoreOp: "store",
          depthClearValue: 1
        }
      };
      this._rpDescOIT = {
        colorAttachments: [
          {
            view: null,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 0 }
          },
          {
            view: null,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }
        ]
      };
      this._rpDescCompositePremul = {
        colorAttachments: [
          {
            view: null,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 0 }
          }
        ]
      };
      this._rpDescCompositeOpaque = {
        colorAttachments: [
          {
            view: null,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }
        ]
      };
      this._rpDescBlitOpaque = {
        colorAttachments: [
          {
            view: null,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }
        ]
      };
      this._createFallbackTextures();
      this._ensureGradientTexture(this._gradientSize);
      this.setHueGradientWheel({ count: this._gradientSize });
      this._createSharedLayouts();
      this._createRenderPipelines();
      this._createOITCompositePipeline();
      this._createBlitPipelines();
      this._ensureRenderUniformCapacity(1);
      this.writeThresholdUniform = (p) => this.writeThreshUniform(p);
      this.renderFrame = (p, c) => this.render(p, c);
      this.draw = (p, c) => this.render(p, c);
      this.blitToView = (p, v) => this.renderBlitToView(p, v);
    }
    setInvertCameraY(v) {
      this.invertCameraY = !!v;
    }
    static generateHueWheelRGBA8(count = 512, opts = {}) {
      const K = Math.max(2, Math.min(4096, count | 0));
      const hueOffset = _isFiniteNum(opts.hueOffset) ? +opts.hueOffset : 0;
      const cycles = _isFiniteNum(opts.cycles) ? +opts.cycles : 1;
      const s = _isFiniteNum(opts.sat) ? +opts.sat : 1;
      const v = _isFiniteNum(opts.val) ? +opts.val : 1;
      const a = _isFiniteNum(opts.alpha) ? +opts.alpha : 1;
      const out = new Uint8Array(K * 4);
      const denom = K === 1 ? 1 : K - 1;
      for (let i = 0; i < K; ++i) {
        const u = denom ? i / denom : 0;
        const h = hueOffset + u * cycles;
        const hh = (h % 1 + 1) % 1;
        const ii = Math.floor(hh * 6);
        const ff = hh * 6 - ii;
        const p = v * (1 - s);
        const q = v * (1 - ff * s);
        const t = v * (1 - (1 - ff) * s);
        let r = v, g = t, b = p;
        switch (ii % 6) {
          case 0:
            r = v;
            g = t;
            b = p;
            break;
          case 1:
            r = q;
            g = v;
            b = p;
            break;
          case 2:
            r = p;
            g = v;
            b = t;
            break;
          case 3:
            r = p;
            g = q;
            b = v;
            break;
          case 4:
            r = t;
            g = p;
            b = v;
            break;
          default:
            r = v;
            g = p;
            b = q;
            break;
        }
        const o = i * 4;
        out[o + 0] = r * 255 + 0.5 | 0;
        out[o + 1] = g * 255 + 0.5 | 0;
        out[o + 2] = b * 255 + 0.5 | 0;
        out[o + 3] = _clamp01(a) * 255 + 0.5 | 0;
      }
      return out;
    }
    _createFallbackTextures() {
      try {
        this._fallbackSdfTex = this.device.createTexture({
          size: [1, 1, 1],
          format: "rgba16float",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this._fallbackSdfView = this._fallbackSdfTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: 1
        });
      } catch (e) {
        this._fallbackSdfTex = null;
        this._fallbackSdfView = null;
        console.warn("Could not create fallback SDF texture:", e);
      }
      try {
        this._fallbackFlagTex = this.device.createTexture({
          size: [1, 1, 1],
          format: "r32uint",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this._fallbackFlagView = this._fallbackFlagTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: 1
        });
      } catch (e) {
        this._fallbackFlagTex = null;
        this._fallbackFlagView = null;
        console.warn("Could not create fallback Flag texture:", e);
      }
      this._ensureFallbackGradientTexture();
    }
    _ensureGradientTexture(count) {
      const W = Math.max(2, Math.min(4096, count | 0));
      if (this._gradientTex && this._gradientSize === W && this._gradientView)
        return true;
      try {
        if (this._gradientTex) this._gradientTex.destroy();
      } catch {
      }
      this._gradientTex = null;
      this._gradientView = null;
      try {
        this._gradientTex = this.device.createTexture({
          size: [W, 1, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this._gradientView = this._gradientTex.createView({ dimension: "2d" });
        this._gradientSize = W;
        return true;
      } catch (e) {
        console.warn("Could not create gradient texture:", e);
        this._gradientTex = null;
        this._gradientView = null;
        return false;
      }
    }
    _uploadGradientRGBA8(dataRGBA8, count) {
      const W = Math.max(2, Math.min(4096, count | 0));
      if (!this._ensureGradientTexture(W)) return false;
      const tex = this._gradientTex;
      if (!tex) return false;
      const rawBpr = W * 4;
      const bpr = _alignUp(rawBpr, 256);
      let bytes = dataRGBA8;
      if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
      if (bytes.byteLength < rawBpr) return false;
      if (bpr !== rawBpr) {
        const padded = new Uint8Array(bpr);
        padded.set(bytes.subarray(0, rawBpr), 0);
        bytes = padded;
      }
      try {
        this.device.queue.writeTexture(
          { texture: tex },
          bytes,
          { bytesPerRow: bpr, rowsPerImage: 1 },
          { width: W, height: 1, depthOrArrayLayers: 1 }
        );
        return true;
      } catch (e) {
        console.warn("Gradient upload failed:", e);
        return false;
      }
    }
    setHueGradientWheel(opts = {}) {
      const W = Math.max(
        2,
        Math.min(4096, opts.count | 0 || this._gradientSize || 512)
      );
      const rgba = _RenderPipelineGPU.generateHueWheelRGBA8(W, opts);
      const ok = this._uploadGradientRGBA8(rgba, W);
      if (ok) this._rebuildBg0ForGradientIfNeeded();
      return ok;
    }
    _ensureFallbackGradientTexture() {
      if (this._fallbackGradTex && this._fallbackGradView) return true;
      try {
        if (this._fallbackGradTex) this._fallbackGradTex.destroy();
      } catch {
      }
      this._fallbackGradTex = null;
      this._fallbackGradView = null;
      try {
        this._fallbackGradTex = this.device.createTexture({
          size: [1, 1, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        this._fallbackGradView = this._fallbackGradTex.createView({
          dimension: "2d"
        });
        this.device.queue.writeTexture(
          { texture: this._fallbackGradTex },
          new Uint8Array([255, 255, 255, 255]),
          { bytesPerRow: 256, rowsPerImage: 1 },
          { width: 1, height: 1, depthOrArrayLayers: 1 }
        );
        return true;
      } catch (e) {
        this._fallbackGradTex = null;
        this._fallbackGradView = null;
        console.warn("Could not create fallback Gradient texture:", e);
        return false;
      }
    }
    _getGradientView() {
      if (this._gradientView) return this._gradientView;
      if (this._fallbackGradView) return this._fallbackGradView;
      if (this._ensureFallbackGradientTexture()) return this._fallbackGradView;
      return null;
    }
    _ensureArrayViewFromTexture(tex, layersCount) {
      if (!tex || typeof tex.createView !== "function") return null;
      const L = Math.max(1, layersCount | 0);
      try {
        return tex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: L
        });
      } catch {
      }
      try {
        return tex.createView({ dimension: "2d-array" });
      } catch {
      }
      return null;
    }
    _pickChunkArrayView(info, names) {
      for (const n of names) {
        const v = info[n];
        if (!v) continue;
        if (Array.isArray(v)) {
          for (let i = 0; i < v.length; ++i) {
            if (v[i]) return v[i];
          }
          continue;
        }
        return v;
      }
      return null;
    }
    _rebuildBg0ForGradientIfNeeded() {
      if (!this.chunks || this.chunks.length === 0) return;
      const bgLayout0 = this._bgLayout0;
      const gradView = this._getGradientView();
      if (!gradView) return;
      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];
        const fractalView = info._fractalArrayView || info.storageView || info.fractalView || null;
        if (!fractalView) continue;
        try {
          info._renderBg0 = this.device.createBindGroup({
            layout: bgLayout0,
            entries: [
              { binding: 0, resource: fractalView },
              { binding: 1, resource: this.sampler },
              {
                binding: 2,
                resource: {
                  buffer: this.renderUniformBuffer,
                  offset: 0,
                  size: this.renderUniformStride
                }
              },
              { binding: 3, resource: { buffer: this.cameraBuffer } },
              { binding: 4, resource: { buffer: this.threshBuf } },
              { binding: 5, resource: gradView }
            ]
          });
        } catch {
        }
      }
    }
    _ensureRenderUniformCapacity(layers) {
      const need = Math.max(1, layers | 0);
      if (this.renderUniformBuffer && (this._renderUBOCapLayers | 0) >= need)
        return;
      let cap = 1;
      while (cap < need) cap <<= 1;
      try {
        if (this.renderUniformBuffer) this.renderUniformBuffer.destroy();
      } catch {
      }
      this.renderUniformBuffer = this.device.createBuffer({
        size: this.renderUniformStride * cap,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this._renderUBOCapLayers = cap;
      this._rebuildBg0ForGradientIfNeeded();
    }
    _createSharedLayouts() {
      this._bgLayout0 = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d-array" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: { type: "filtering" }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.renderUniformStride
            }
          },
          {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          },
          {
            binding: 4,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          },
          {
            binding: 5,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d" }
          }
        ]
      });
      this._bgLayout1 = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d-array" }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: { sampleType: "uint", viewDimension: "2d-array" }
          },
          {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: { type: "filtering" }
          }
        ]
      });
      this._pipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [this._bgLayout0, this._bgLayout1]
      });
    }
    _createRenderPipelines() {
      const vsModule = this.device.createShaderModule({ code: this.vsCode });
      const fsModule = this.device.createShaderModule({ code: this.fsCode });
      const vstate = {
        module: vsModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 5 * 4,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 3 * 4, format: "float32x2" }
            ]
          }
        ]
      };
      this.renderPipelineOpaque = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: vstate,
        fragment: {
          module: fsModule,
          entryPoint: "fs_main",
          targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }]
        },
        primitive: { topology: "triangle-list" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less"
        }
      });
      this._oitAccumFormat = "rgba16float";
      this._oitRevealFormat = "rgba16float";
      this.renderPipelineOIT = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: vstate,
        fragment: {
          module: fsModule,
          entryPoint: "fs_oit",
          targets: [
            {
              format: this._oitAccumFormat,
              blend: {
                color: { srcFactor: "one", dstFactor: "one", operation: "add" },
                alpha: { srcFactor: "one", dstFactor: "one", operation: "add" }
              },
              writeMask: GPUColorWrite.ALL
            },
            {
              format: this._oitRevealFormat,
              blend: {
                color: {
                  srcFactor: "zero",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add"
                },
                alpha: {
                  srcFactor: "zero",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add"
                }
              },
              writeMask: GPUColorWrite.ALPHA
            }
          ]
        },
        primitive: { topology: "triangle-list" }
      });
    }
    _createOITCompositePipeline() {
      this._oitCompositeLayout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d" }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: { type: "filtering" }
          }
        ]
      });
      this._oitCompositePipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [this._oitCompositeLayout]
      });
      const mod = this.device.createShaderModule({ code: _OIT_COMPOSITE_WGSL });
      this._oitCompositePipelinePremul = this.device.createRenderPipeline({
        layout: this._oitCompositePipelineLayout,
        vertex: { module: mod, entryPoint: "vs_fullscreen" },
        fragment: {
          module: mod,
          entryPoint: "fs_composite_premul",
          targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }]
        },
        primitive: { topology: "triangle-list" }
      });
      this._oitCompositePipelineOpaque = this.device.createRenderPipeline({
        layout: this._oitCompositePipelineLayout,
        vertex: { module: mod, entryPoint: "vs_fullscreen" },
        fragment: {
          module: mod,
          entryPoint: "fs_composite_opaque",
          targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }]
        },
        primitive: { topology: "triangle-list" }
      });
    }
    _createBlitPipelines() {
      const vsBlitModule = this.device.createShaderModule({ code: fBlitVertex_default });
      const fsBlitModule = this.device.createShaderModule({ code: fBlitFragment_default });
      const vstate = {
        module: vsBlitModule,
        entryPoint: "vs_blit",
        buffers: [
          {
            arrayStride: 5 * 4,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 3 * 4, format: "float32x2" }
            ]
          }
        ]
      };
      this.renderPipelineBlitOpaque = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: vstate,
        fragment: {
          module: fsBlitModule,
          entryPoint: "fs_blit",
          targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }]
        },
        primitive: { topology: "triangle-list" },
        depthStencil: void 0
      });
      this.renderPipelineBlitTransparent = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: vstate,
        fragment: {
          module: fsBlitModule,
          entryPoint: "fs_blit",
          targets: [
            {
              format: this.format,
              blend: {
                color: {
                  srcFactor: "src-alpha",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add"
                },
                alpha: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add"
                }
              },
              writeMask: GPUColorWrite.ALL
            }
          ]
        },
        primitive: { topology: "triangle-list" },
        depthStencil: void 0
      });
    }
    _destroyOITTargets() {
      try {
        if (this._oitAccumTex) this._oitAccumTex.destroy();
      } catch {
      }
      try {
        if (this._oitRevealTex) this._oitRevealTex.destroy();
      } catch {
      }
      this._oitAccumTex = null;
      this._oitAccumView = null;
      this._oitRevealTex = null;
      this._oitRevealView = null;
      this._oitBg = null;
      this._oitW = 0;
      this._oitH = 0;
    }
    _ensureOITTargets(w, h) {
      const W = Math.max(1, w | 0);
      const H = Math.max(1, h | 0);
      if (this._oitAccumTex && this._oitRevealTex && this._oitW === W && this._oitH === H) {
        if (this._oitBg) return true;
        if (this._oitAccumView && this._oitRevealView) {
          try {
            this._oitBg = this.device.createBindGroup({
              layout: this._oitCompositeLayout,
              entries: [
                { binding: 0, resource: this._oitAccumView },
                { binding: 1, resource: this._oitRevealView },
                { binding: 2, resource: this.sampler }
              ]
            });
            return true;
          } catch {
            this._oitBg = null;
            return false;
          }
        }
      }
      this._destroyOITTargets();
      try {
        this._oitAccumTex = this.device.createTexture({
          size: [W, H, 1],
          format: this._oitAccumFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this._oitAccumView = this._oitAccumTex.createView({ dimension: "2d" });
        this._oitRevealTex = this.device.createTexture({
          size: [W, H, 1],
          format: this._oitRevealFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this._oitRevealView = this._oitRevealTex.createView({ dimension: "2d" });
        this._oitBg = this.device.createBindGroup({
          layout: this._oitCompositeLayout,
          entries: [
            { binding: 0, resource: this._oitAccumView },
            { binding: 1, resource: this._oitRevealView },
            { binding: 2, resource: this.sampler }
          ]
        });
        this._oitW = W;
        this._oitH = H;
        return true;
      } catch (e) {
        console.warn("Could not create OIT targets:", e);
        this._destroyOITTargets();
        return false;
      }
    }
    resize(clientWidth, clientHeight) {
      const dpr = window.devicePixelRatio || 1;
      const pw = Math.floor(clientWidth * dpr);
      const ph = Math.floor(clientHeight * dpr);
      const lastW = this._lastCanvasSize[0] | 0;
      const lastH = this._lastCanvasSize[1] | 0;
      if (pw === lastW && ph === lastH && pw > 0 && ph > 0) return;
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: this.canvasAlphaMode,
        size: [pw, ph],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
      });
      try {
        if (this.depthTexture) this.depthTexture.destroy();
      } catch {
      }
      this.depthTexture = this.device.createTexture({
        size: [pw, ph, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      this._depthView = null;
      this._lastCanvasSize = [pw, ph];
      this.gridStripes = null;
      this._destroyOITTargets();
    }
    async setChunks(chunks = [], layers = 1, opts = {}) {
      const layersCount = Math.max(1, Math.floor(layers || 1));
      const requireSdf = !!opts.requireSdf;
      if (this._lastSetChunksState.chunksRef === chunks && this._lastSetChunksState.layersCount === layersCount && this._lastSetChunksState.requireSdf === requireSdf) {
        return;
      }
      this._ensureRenderUniformCapacity(layersCount);
      const gradView = this._getGradientView();
      if (!gradView) {
        throw new Error(
          "RenderPipelineGPU.setChunks: missing gradient view for binding(0,5)."
        );
      }
      const nextChunks = chunks || [];
      const nextCount = nextChunks.length | 0;
      if (this.chunks !== nextChunks) this.chunks = nextChunks;
      if (this.modelBuffers.length !== nextCount) {
        const old = this.modelBuffers;
        for (let i = nextCount; i < old.length; ++i) {
          try {
            old[i].destroy();
          } catch {
          }
        }
        old.length = nextCount;
        for (let i = 0; i < nextCount; ++i) {
          if (!old[i]) {
            old[i] = this.device.createBuffer({
              size: 4 * 20,
              usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
          }
        }
        this.modelBuffers = old;
      }
      const bgLayout0 = this._bgLayout0;
      const bgLayout1 = this._bgLayout1;
      for (let i = 0; i < nextCount; ++i) {
        const info = nextChunks[i];
        if (!info) continue;
        if (!info._modelData) info._modelData = new Float32Array(20);
        const fractalTex = info.fractalTex || info.fractalTexture || info.fractal || null;
        const sdfTex = info.sdfTex || info.sdfTexture || info.sdf || null;
        const flagTex = info.flagTex || info.flagTexture || info.flag || null;
        const fractalArrayView = this._ensureArrayViewFromTexture(fractalTex, layersCount) || info.storageView || info.fractalView || this._pickChunkArrayView(info, [
          "fractalViews",
          "fractalLayerViews",
          "layerViews"
        ]);
        if (!fractalArrayView) {
          const keys = Object.keys(info);
          const msg = `RenderPipelineGPU.setChunks: chunk[${i}] missing fractal array view. chunk keys: ${keys.join(",")}`;
          console.error(msg, info);
          throw new Error(msg);
        }
        const sdfArrayView = this._ensureArrayViewFromTexture(sdfTex, layersCount) || info.sdfView || this._fallbackSdfView;
        const flagArrayView = this._ensureArrayViewFromTexture(flagTex, layersCount) || info.flagView || this._fallbackFlagView;
        if (requireSdf && (!sdfArrayView || !flagArrayView)) {
          throw new Error(
            `RenderPipelineGPU.setChunks: chunk[${i}] missing SDF or flag view and requireSdf=true.`
          );
        }
        const key = `${layersCount}|${requireSdf ? 1 : 0}`;
        const prevKey = info._bindKey || "";
        info._fractalArrayView = fractalArrayView;
        info._sdfArrayView = sdfArrayView;
        info._flagArrayView = flagArrayView;
        if (prevKey !== key || !info._renderBg0) {
          info._renderBg0 = this.device.createBindGroup({
            layout: bgLayout0,
            entries: [
              { binding: 0, resource: fractalArrayView },
              { binding: 1, resource: this.sampler },
              {
                binding: 2,
                resource: {
                  buffer: this.renderUniformBuffer,
                  offset: 0,
                  size: this.renderUniformStride
                }
              },
              { binding: 3, resource: { buffer: this.cameraBuffer } },
              { binding: 4, resource: { buffer: this.threshBuf } },
              { binding: 5, resource: gradView }
            ]
          });
          try {
            info._renderBg1 = this.device.createBindGroup({
              layout: bgLayout1,
              entries: [
                { binding: 0, resource: { buffer: this.modelBuffers[i] } },
                { binding: 1, resource: sdfArrayView },
                { binding: 2, resource: flagArrayView },
                { binding: 3, resource: this.sampler }
              ]
            });
          } catch (e) {
            console.error(
              "setChunks: createBindGroup(bg1) failed for chunk",
              i,
              e
            );
            info._renderBg1 = null;
          }
          info._modelBufIdx = i;
          info._bindKey = key;
        } else {
          info._modelBufIdx = i;
        }
      }
      this._modelKey = "";
      this._lastSetChunksState = { chunksRef: chunks, layersCount, requireSdf };
    }
    updateCamera(cam, aspect) {
      const proj = perspective(cam.fov, aspect, 0.01, 1e4);
      let target = cam.lookTarget;
      if (this.invertCameraY && target && cam.cameraPos) {
        const cp = cam.cameraPos;
        const cx = +cp[0], cy = +cp[1], cz = +cp[2];
        const tx = +target[0], ty = +target[1], tz = +target[2];
        const dy = ty - cy;
        const tmp = this._tmpLookTarget;
        tmp[0] = tx;
        tmp[1] = cy - dy;
        tmp[2] = tz;
        target = tmp;
      }
      const view = lookAt(cam.cameraPos, target, cam.upDir);
      const viewProj = mulMat(proj, view);
      this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);
    }
    writeRenderUniform(paramsState = {}, dstByteOffset = 0) {
      const dv = this._renderUBODV;
      const layerIndex = _u32(paramsState.layerIndex, 0);
      const scheme = _u32(paramsState.scheme, 0);
      const useHueGradient = paramsState.useHueGradient != null ? !!paramsState.useHueGradient : paramsState.hueGradientOn != null ? !!paramsState.hueGradientOn : paramsState.hueGradient != null ? !!paramsState.hueGradient : false;
      const dispMode = _u32(paramsState.dispMode, 0);
      const bowlOn = !!paramsState.bowlOn;
      const lightingOn = !!paramsState.lightingOn;
      const dispLimitOn = !!paramsState.dispLimitOn;
      const alphaMode = _u32(paramsState.alphaMode, 0);
      const hueOffset = _f32(paramsState.hueOffset, 0);
      const dispAmp = _f32(paramsState.dispAmp, 0.15);
      const dispCurve = _f32(paramsState.dispCurve, 3);
      const bowlDepth = _f32(paramsState.bowlDepth, 0.25);
      const quadScale = _f32(
        paramsState.quadScale,
        _isFiniteNum(this.quadScale) ? +this.quadScale : 1
      );
      const gridSize = _f32(paramsState.gridSize, 512);
      const slopeLimit = _f32(paramsState.slopeLimit, 0.5);
      const wallJump = _f32(paramsState.wallJump, 0.05);
      const lp = _v3(paramsState.lightPos, 0, 0, 5);
      const specPower = _f32(paramsState.specPower, 32);
      const worldOffset = paramsState.worldOffset != null ? _f32(paramsState.worldOffset, 0) : paramsState.layerSeparation != null ? _f32(paramsState.layerSeparation, 0) : paramsState.layerSpacing != null ? _f32(paramsState.layerSpacing, 0) : paramsState.layerStep != null ? _f32(paramsState.layerStep, 0) : paramsState.layerOffset != null ? _f32(paramsState.layerOffset, 0) : 0;
      const worldStart = paramsState.worldStart != null ? _f32(paramsState.worldStart, 0) : paramsState.layerStart != null ? _f32(paramsState.layerStart, 0) : paramsState.layerBase != null ? _f32(paramsState.layerBase, 0) : 0;
      dv.setUint32(0, layerIndex >>> 0, true);
      dv.setUint32(4, scheme >>> 0, true);
      dv.setUint32(8, useHueGradient ? 1 : 0, true);
      dv.setUint32(12, dispMode >>> 0, true);
      dv.setUint32(16, bowlOn ? 1 : 0, true);
      dv.setUint32(20, lightingOn ? 1 : 0, true);
      dv.setUint32(24, dispLimitOn ? 1 : 0, true);
      dv.setUint32(28, alphaMode >>> 0, true);
      dv.setFloat32(32, hueOffset, true);
      dv.setFloat32(36, dispAmp, true);
      dv.setFloat32(40, dispCurve, true);
      dv.setFloat32(44, bowlDepth, true);
      dv.setFloat32(48, quadScale, true);
      dv.setFloat32(52, gridSize, true);
      dv.setFloat32(56, slopeLimit, true);
      dv.setFloat32(60, wallJump, true);
      dv.setFloat32(64, lp[0], true);
      dv.setFloat32(68, lp[1], true);
      dv.setFloat32(72, lp[2], true);
      dv.setFloat32(76, specPower, true);
      dv.setFloat32(80, worldOffset, true);
      dv.setFloat32(84, worldStart, true);
      dv.setFloat32(88, 0, true);
      dv.setFloat32(92, 0, true);
      this.device.queue.writeBuffer(
        this.renderUniformBuffer,
        dstByteOffset >>> 0,
        this._renderUBOTmp
      );
    }
    writeThreshUniform(paramsState = {}) {
      const lowT = _f32(paramsState.lowT, 0);
      const highT = _f32(paramsState.highT, 1);
      const basis = _f32(paramsState.basis, 0);
      this._threshTmp[0] = lowT;
      this._threshTmp[1] = highT;
      this._threshTmp[2] = basis;
      this._threshTmp[3] = 0;
      this.device.queue.writeBuffer(this.threshBuf, 0, this._threshTmp);
    }
    _updateModelBuffersIfNeeded(paramsState) {
      const gridSize = _isFiniteNum(paramsState.gridSize) ? +paramsState.gridSize : 512;
      const quadScale = _isFiniteNum(paramsState.quadScale) ? +paramsState.quadScale : this.quadScale;
      const key = `${gridSize}|${quadScale}|${this.chunks.length}`;
      if (key === this._modelKey) return;
      const texelWorld = 2 * quadScale / gridSize;
      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];
        const modelBuf = this.modelBuffers[i];
        const data = info._modelData || (info._modelData = new Float32Array(20));
        const w = info.width * texelWorld;
        const h = info.height * texelWorld;
        const x = -quadScale + info.offsetX * texelWorld;
        const y = -quadScale + (info.offsetY ?? 0) * texelWorld;
        data[0] = w;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        data[4] = 0;
        data[5] = h;
        data[6] = 0;
        data[7] = 0;
        data[8] = 0;
        data[9] = 0;
        data[10] = 1;
        data[11] = 0;
        data[12] = x;
        data[13] = y;
        data[14] = 0;
        data[15] = 1;
        const u0 = info.offsetX / gridSize;
        const v0 = (info.offsetY ?? 0) / gridSize;
        const su = info.width / gridSize;
        const sv = info.height / gridSize;
        data[16] = u0;
        data[17] = v0;
        data[18] = su;
        data[19] = sv;
        this.device.queue.writeBuffer(modelBuf, 0, data);
      }
      this._modelKey = key;
    }
    _drawAll(pass, paramsState, nLayers) {
      const chunks = this.chunks;
      const stripes = this.gridStripes;
      const stride = this.renderUniformStride;
      const chunkCount = chunks.length | 0;
      const stripeCount = stripes.length | 0;
      const savedLayer = paramsState.layerIndex;
      for (let s = 0; s < stripeCount; ++s) {
        const stripe = stripes[s];
        pass.setVertexBuffer(0, stripe.vbuf);
        pass.setIndexBuffer(stripe.ibuf, "uint32");
        for (let layer = 0; layer < nLayers; ++layer) {
          const dyn = layer * stride >>> 0;
          paramsState.layerIndex = layer;
          this.writeRenderUniform(paramsState, dyn);
          for (let i = 0; i < chunkCount; ++i) {
            const info = chunks[i];
            const bg0 = info && info._renderBg0;
            const bg1 = info && info._renderBg1;
            if (!bg0 || !bg1) continue;
            pass.setBindGroup(0, bg0, [dyn]);
            pass.setBindGroup(1, bg1);
            pass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
          }
        }
      }
      paramsState.layerIndex = savedLayer;
    }
    async _ensureGrid() {
      if (!this.gridStripes) {
        this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
      }
    }
    async render(paramsState, camState) {
      const p = paramsState || {};
      const w = this._lastCanvasSize[0] | 0;
      const h = this._lastCanvasSize[1] | 0;
      const aspect = w > 0 && h > 0 ? w / h : 1;
      this.updateCamera(camState, aspect);
      const nLayers = Math.max(1, Math.floor(p.nLayers ?? p.layers ?? 1));
      const alphaMode = _u32(p.alphaMode, 0);
      const useOIT = alphaMode === 1 || alphaMode === 2;
      this._ensureRenderUniformCapacity(nLayers);
      this.writeThreshUniform(p);
      await this._ensureGrid();
      this._updateModelBuffersIfNeeded(p);
      const encoder = this.device.createCommandEncoder();
      const outView = this.context.getCurrentTexture().createView();
      if (useOIT) {
        if (!this._ensureOITTargets(w || 1, h || 1)) return;
        const oitDesc = this._rpDescOIT;
        oitDesc.colorAttachments[0].view = this._oitAccumView;
        oitDesc.colorAttachments[1].view = this._oitRevealView;
        const oitPass = encoder.beginRenderPass(oitDesc);
        oitPass.setPipeline(this.renderPipelineOIT);
        this._drawAll(oitPass, p, nLayers);
        oitPass.end();
        const compositePipeline = this.canvasAlphaMode === "opaque" ? this._oitCompositePipelineOpaque : this._oitCompositePipelinePremul;
        const compDesc = this.canvasAlphaMode === "opaque" ? this._rpDescCompositeOpaque : this._rpDescCompositePremul;
        compDesc.colorAttachments[0].view = outView;
        const compPass = encoder.beginRenderPass(compDesc);
        compPass.setPipeline(compositePipeline);
        compPass.setBindGroup(0, this._oitBg);
        compPass.draw(3, 1, 0, 0);
        compPass.end();
      } else {
        if (!this.depthTexture) {
          this.depthTexture = this.device.createTexture({
            size: [Math.max(1, w), Math.max(1, h), 1],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
          });
          this._depthView = null;
        }
        if (!this._depthView) this._depthView = this.depthTexture.createView();
        const desc = this._rpDescOpaque;
        desc.colorAttachments[0].view = outView;
        desc.depthStencilAttachment.view = this._depthView;
        const pass = encoder.beginRenderPass(desc);
        pass.setPipeline(this.renderPipelineOpaque);
        this._drawAll(pass, p, nLayers);
        pass.end();
      }
      this.device.queue.submit([encoder.finish()]);
      if (p && p.waitGPU) {
        await this.device.queue.onSubmittedWorkDone();
      }
    }
    async renderBlitToView(paramsState, colorView) {
      const p = paramsState || {};
      const w = this._lastCanvasSize[0] | 0;
      const h = this._lastCanvasSize[1] | 0;
      const nLayers = Math.max(1, Math.floor(p.nLayers ?? p.layers ?? 1));
      const alphaMode = _u32(p.alphaMode, 0);
      const useOIT = alphaMode === 1 || alphaMode === 2;
      this._ensureRenderUniformCapacity(nLayers);
      this.writeThreshUniform(p);
      await this._ensureGrid();
      this._updateModelBuffersIfNeeded(p);
      const encoder = this.device.createCommandEncoder();
      if (useOIT) {
        if (!this._ensureOITTargets(w || 1, h || 1)) return;
        const oitDesc = this._rpDescOIT;
        oitDesc.colorAttachments[0].view = this._oitAccumView;
        oitDesc.colorAttachments[1].view = this._oitRevealView;
        const oitPass = encoder.beginRenderPass(oitDesc);
        oitPass.setPipeline(this.renderPipelineOIT);
        this._drawAll(oitPass, p, nLayers);
        oitPass.end();
        const compositePipeline = this.canvasAlphaMode === "opaque" ? this._oitCompositePipelineOpaque : this._oitCompositePipelinePremul;
        const compDesc = this.canvasAlphaMode === "opaque" ? this._rpDescCompositeOpaque : this._rpDescCompositePremul;
        compDesc.colorAttachments[0].view = colorView;
        const compPass = encoder.beginRenderPass(compDesc);
        compPass.setPipeline(compositePipeline);
        compPass.setBindGroup(0, this._oitBg);
        compPass.draw(3, 1, 0, 0);
        compPass.end();
      } else {
        const desc = this._rpDescBlitOpaque;
        desc.colorAttachments[0].view = colorView;
        const rpass = encoder.beginRenderPass(desc);
        rpass.setPipeline(this.renderPipelineBlitOpaque);
        this._drawAll(rpass, p, nLayers);
        rpass.end();
      }
      this.device.queue.submit([encoder.finish()]);
      if (p && p.waitGPU) {
        await this.device.queue.onSubmittedWorkDone();
      }
    }
    async renderBlitToTexture(paramsState, targetTexture) {
      const view = targetTexture.createView();
      await this.renderBlitToView(paramsState, view);
    }
    destroy() {
      for (const b of this.modelBuffers) {
        try {
          b.destroy();
        } catch {
        }
      }
      this.modelBuffers.length = 0;
      if (this.gridStripes) {
        for (const s of this.gridStripes) {
          try {
            s.vbuf.destroy();
          } catch {
          }
          try {
            s.ibuf.destroy();
          } catch {
          }
        }
        this.gridStripes = null;
      }
      try {
        if (this.depthTexture) this.depthTexture.destroy();
      } catch {
      }
      this.depthTexture = null;
      this._depthView = null;
      this._destroyOffscreenDepth();
      try {
        if (this._fallbackSdfTex) this._fallbackSdfTex.destroy();
      } catch {
      }
      this._fallbackSdfTex = null;
      this._fallbackSdfView = null;
      try {
        if (this._fallbackFlagTex) this._fallbackFlagTex.destroy();
      } catch {
      }
      this._fallbackFlagTex = null;
      this._fallbackFlagView = null;
      try {
        if (this._gradientTex) this._gradientTex.destroy();
      } catch {
      }
      this._gradientTex = null;
      this._gradientView = null;
      try {
        if (this._fallbackGradTex) this._fallbackGradTex.destroy();
      } catch {
      }
      this._fallbackGradTex = null;
      this._fallbackGradView = null;
      try {
        if (this.renderUniformBuffer) this.renderUniformBuffer.destroy();
      } catch {
      }
      this.renderUniformBuffer = null;
      this._renderUBOCapLayers = 0;
      this._destroyOITTargets();
    }
    _destroyOffscreenDepth() {
      try {
        if (this._offDepthTex) this._offDepthTex.destroy();
      } catch {
      }
      this._offDepthTex = null;
      this._offDepthView = null;
      this._offDepthW = 0;
      this._offDepthH = 0;
    }
    _ensureOffscreenDepth(w, h) {
      const W = Math.max(1, w | 0);
      const H = Math.max(1, h | 0);
      if (this._offDepthTex && this._offDepthView && (this._offDepthW | 0) === W && (this._offDepthH | 0) === H) {
        return this._offDepthView;
      }
      this._destroyOffscreenDepth();
      this._offDepthTex = this.device.createTexture({
        size: [W, H, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      this._offDepthView = this._offDepthTex.createView();
      this._offDepthW = W;
      this._offDepthH = H;
      return this._offDepthView;
    }
    async renderToView(paramsState, camState, colorView, width, height) {
      const p = paramsState || {};
      const w = Math.max(1, width | 0);
      const h = Math.max(1, height | 0);
      const aspect = w > 0 && h > 0 ? w / h : 1;
      this.updateCamera(camState, aspect);
      const nLayers = Math.max(1, Math.floor(p.nLayers ?? p.layers ?? 1));
      const alphaMode = _u32(p.alphaMode, 0);
      const useOIT = alphaMode === 1 || alphaMode === 2;
      this._ensureRenderUniformCapacity(nLayers);
      this.writeThreshUniform(p);
      await this._ensureGrid();
      this._updateModelBuffersIfNeeded(p);
      const encoder = this.device.createCommandEncoder();
      if (useOIT) {
        if (!this._ensureOITTargets(w, h)) return;
        const oitDesc = this._rpDescOIT;
        oitDesc.colorAttachments[0].view = this._oitAccumView;
        oitDesc.colorAttachments[1].view = this._oitRevealView;
        const oitPass = encoder.beginRenderPass(oitDesc);
        oitPass.setPipeline(this.renderPipelineOIT);
        this._drawAll(oitPass, p, nLayers);
        oitPass.end();
        const compositePipeline = this.canvasAlphaMode === "opaque" ? this._oitCompositePipelineOpaque : this._oitCompositePipelinePremul;
        const compDesc = this.canvasAlphaMode === "opaque" ? this._rpDescCompositeOpaque : this._rpDescCompositePremul;
        compDesc.colorAttachments[0].view = colorView;
        const compPass = encoder.beginRenderPass(compDesc);
        compPass.setPipeline(compositePipeline);
        compPass.setBindGroup(0, this._oitBg);
        compPass.draw(3, 1, 0, 0);
        compPass.end();
      } else {
        const dview = this._ensureOffscreenDepth(w, h);
        const desc = this._rpDescOpaque;
        desc.colorAttachments[0].view = colorView;
        desc.depthStencilAttachment.view = dview;
        const pass = encoder.beginRenderPass(desc);
        pass.setPipeline(this.renderPipelineOpaque);
        this._drawAll(pass, p, nLayers);
        pass.end();
      }
      this.device.queue.submit([encoder.finish()]);
      if (p && p.waitGPU) {
        await this.device.queue.onSubmittedWorkDone();
      }
    }
    async renderToTexture(paramsState, camState, targetTexture) {
      const tex = targetTexture;
      const w = (tex && tex.width) | 0;
      const h = (tex && tex.height) | 0;
      const view = tex.createView();
      await this.renderToView(paramsState, camState, view, w, h);
    }
  };
  var fractalRender_default = RenderPipelineGPU;

  // shaders/fheightQueryCompute.wgsl
  var fheightQueryCompute_default = "/* fheightQueryNeighbours.wgsl  \u2013 8-way height, normal & UV lookup\r\n   ----------------------------------------------------------- */\r\n\r\nstruct CentreQuery {\r\n    worldXZ : vec2<f32>\r\n};\r\n@group(0) @binding(0) var<uniform> Q : CentreQuery;\r\n\r\n/* RGBA16F  (R = height, GBA = normal) */\r\n@group(0) @binding(1) var sdfTex : texture_2d_array<f32>;\r\n@group(0) @binding(2) var samp   : sampler;\r\n\r\n/* render-wide params */\r\nstruct RenderParams {\r\n    layerIndex  : u32,\r\n    scheme      : u32,        // unused here\r\n    dispMode    : u32,        // unused here\r\n    bowlOn      : u32,\r\n\r\n    hueOffset   : f32,        // unused\r\n    dispAmp     : f32,        // unused\r\n    dispCurve   : f32,        // unused\r\n    bowlDepth   : f32,        // needed for bowlOffset\r\n\r\n    quadScale   : f32,\r\n    gridSize    : f32,\r\n    _pad0       : vec2<f32>,\r\n};\r\n\r\n@group(0) @binding(3) var<uniform> R : RenderParams;\r\n\r\n/* scratch buffer: 9 \xD7 (h, n.xyz, flag, UV.xy, pad) = 72 floats */\r\n@group(0) @binding(4) var<storage, read_write> outBuf : array<f32,72>;\r\n@group(0) @binding(5) var<uniform> tileUV : vec4<f32>;\r\n@group(0) @binding(6) var flagTex : texture_storage_2d_array<r32uint,read>;\r\n\r\n/* ----------------------------------------------------------- */\r\nfn bowlOffset(gUV: vec2<f32>) -> f32 {\r\n    if (R.bowlOn == 0u || R.bowlDepth <= 0.00001) { return 0.0; }\r\n    let d = gUV - vec2(0.5,0.5);\r\n    return -R.bowlDepth * (1.0 - clamp(dot(d,d)/0.5,0.0,1.0)) * R.quadScale;\r\n}\r\n\r\n/* neighbour offsets: C,N,NE,E,SE,S,SW,W,NW */\r\nconst dir : array<vec2<i32>,9> = array<vec2<i32>,9>(\r\n    vec2<i32>( 0,  0), vec2<i32>( 0,  1), vec2<i32>( 1,  1),\r\n    vec2<i32>( 1,  0), vec2<i32>( 1, -1), vec2<i32>( 0, -1),\r\n    vec2<i32>(-1, -1), vec2<i32>(-1,  0), vec2<i32>(-1,  1)\r\n);\r\n\r\nconst DUMMY_H    : f32 = -3.4e38;          // FLT_MIN  sentinel\r\nconst DUMMY_FLAG : u32 = 0xffffffffu;\r\n\r\n@compute @workgroup_size(1)\r\nfn main() {\r\n    /* global UV of centre */\r\n    let half   = R.quadScale;\r\n    let gUVc   = (Q.worldXZ + vec2(half)) / (2.0 * half);\r\n\r\n    /* inside whole quad? */\r\n    let inQuad = all(gUVc >= vec2(0.0)) && all(gUVc < vec2(1.0));\r\n\r\n    /* tile dims / helpers */\r\n    let dims   = textureDimensions(flagTex);     // (w, h)\r\n    let invDim = 1.0 / vec2<f32>(dims);\r\n\r\n    for (var i: u32 = 0u; i < 9u; i = i + 1u) {\r\n        var h   : f32;\r\n        var n   : vec3<f32>;\r\n        var flg : u32;\r\n\r\n        // compute neighbour global UV\r\n        let gUV = gUVc + vec2<f32>(dir[i]) * invDim * tileUV.zw;\r\n\r\n        if (inQuad) {\r\n            // is neighbour still inside this tile?\r\n            let insideTile = all(gUV >= tileUV.xy) &&\r\n                             all(gUV <  tileUV.xy + tileUV.zw);\r\n\r\n            if (insideTile) {\r\n                let uv  = (gUV - tileUV.xy) / tileUV.zw;\r\n                let sdf = textureSampleLevel(sdfTex, samp, uv, i32(R.layerIndex), 0.0);\r\n                h   = sdf.r + bowlOffset(gUV);\r\n                n   = sdf.gba;\r\n\r\n                let ij  = vec2<i32>(uv * vec2<f32>(dims));\r\n                flg = textureLoad(flagTex, ij, R.layerIndex).x;\r\n            } else {\r\n                h   = DUMMY_H;\r\n                n   = vec3(0.0, 0.0, 1.0);\r\n                flg = DUMMY_FLAG;\r\n            }\r\n        } else {\r\n            h   = DUMMY_H;\r\n            n   = vec3(0.0, 0.0, 1.0);\r\n            flg = DUMMY_FLAG;\r\n        }\r\n\r\n        // write 8 floats per neighbour: height, normal.xyz, flag(->f32), pad, u, v\r\n        let base = i * 8u;\r\n        outBuf[base + 0u] = h;\r\n        outBuf[base + 1u] = n.x;\r\n        outBuf[base + 2u] = n.y;\r\n        outBuf[base + 3u] = n.z;\r\n        outBuf[base + 4u] = bitcast<f32>(flg);\r\n        outBuf[base + 5u] = gUV.x;\r\n        outBuf[base + 6u] = gUV.y;\r\n        outBuf[base + 7u] = 0.0;\r\n    }\r\n}\r\n";

  // shaders/fheightQueryCompute.js
  var QueryComputeGPU = class {
    /**
     * @param {GPUDevice} device
     * @param {string} [queryWGSL=computeWGSL] - WGSL source
     * @param {GPUSampler} sampler - sampler used to sample SDF textures
     * @param {GPUBuffer} renderUniformBuffer - UBO used by the shader for render params (binding 3)
     * @param {object} [opts]
     * @param {number} [opts.uniformQuerySize=16] - size in bytes for cam query UBO (rounded up to 16)
     * @param {number} [opts.queryResultBytes=288] - bytes the shader will write to the storage buffer (rounded to 16)
     */
    constructor(device, queryWGSL = fheightQueryCompute_default, sampler, renderUniformBuffer, opts = {}) {
      this.device = device;
      this.sampler = sampler;
      this.renderUniformBuffer = renderUniformBuffer;
      const requestedQuerySize = opts.uniformQuerySize ?? 16;
      this.uniformQuerySize = Math.max(16, Math.ceil(requestedQuerySize / 16) * 16);
      const requestedResult = opts.queryResultBytes ?? 288;
      this.QUERY_RESULT_BYTES = Math.max(288, Math.ceil(requestedResult / 16) * 16);
      this._module = device.createShaderModule({ code: queryWGSL });
      this._bgl = device.createBindGroupLayout({
        entries: [
          // 0: camQuery (uniform)
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform", minBindingSize: this.uniformQuerySize } },
          // 1: sdf texture (2d-array)
          { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { viewDimension: "2d-array" } },
          // 2: sampler
          { binding: 2, visibility: GPUShaderStage.COMPUTE, sampler: {} },
          // 3: render params UBO (reuse external buffer)
          { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
          // 4: result storage buffer (shader writes into this)
          { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage", minBindingSize: this.QUERY_RESULT_BYTES } },
          // 5: tile UBO (vec4) describing this chunk's UV offset/scale
          { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform", minBindingSize: 16 } },
          // 6: flag storage texture (r32uint 2d-array)
          { binding: 6, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: "read-only", format: "r32uint", viewDimension: "2d-array" } }
        ]
      });
      this._pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [this._bgl] }),
        compute: { module: this._module, entryPoint: "main" }
      });
      this._camQueryBuf = device.createBuffer({
        size: this.uniformQuerySize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this._tileUBuf = device.createBuffer({
        size: 16,
        // vec4
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this._resultBuf = device.createBuffer({
        size: this.QUERY_RESULT_BYTES,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });
      this._bgCache = /* @__PURE__ */ new Map();
      this.clearCache = () => {
        this._bgCache.clear();
      };
    }
    /**
     * Find the chunk index that contains worldX.
     * @param {number} worldX
     * @param {Array} chunks
     * @param {object} paramsState
     * @returns {number}
     */
    idxForWorldX(worldX, chunks, paramsState) {
      const half = paramsState.quadScale;
      const uGlobal = (worldX + half) / (2 * half);
      const pixelX = Math.floor(uGlobal * paramsState.gridSize);
      for (let i = 0; i < chunks.length; ++i) {
        const c = chunks[i];
        if (pixelX >= c.offsetX && pixelX < c.offsetX + c.width) return i;
      }
      return 0;
    }
    _chooseSdfView(chunk, layerIndex = 0) {
      if (Array.isArray(chunk.sdfLayerViews) && chunk.sdfLayerViews[layerIndex]) return chunk.sdfLayerViews[layerIndex];
      if (chunk.sdfView) return chunk.sdfView;
      if (chunk.sdfTex) {
        try {
          return chunk.sdfTex.createView({ dimension: "2d-array", baseArrayLayer: layerIndex, arrayLayerCount: 1 });
        } catch (e) {
          try {
            return chunk.sdfTex.createView({ dimension: "2d" });
          } catch (e2) {
            return null;
          }
        }
      }
      return null;
    }
    _chooseFlagView(chunk, layerIndex = 0) {
      if (Array.isArray(chunk.flagLayerViews) && chunk.flagLayerViews[layerIndex]) return chunk.flagLayerViews[layerIndex];
      if (chunk.flagView) return chunk.flagView;
      if (chunk.flagTex) {
        try {
          return chunk.flagTex.createView({ dimension: "2d-array", baseArrayLayer: layerIndex, arrayLayerCount: 1 });
        } catch (e) {
          try {
            return chunk.flagTex.createView({ dimension: "2d" });
          } catch (e2) {
            return null;
          }
        }
      }
      return null;
    }
    /**
     * Query the compute shader for the 3x3 neighbourhood + centre at worldX,worldY.
     * Returns Float32Array or null.
     *
     * @param {number} worldX
     * @param {number} worldY
     * @param {Array} chunks - chunkInfos produced by fractal compute
     * @param {object} paramsState - renderGlobals.paramsState
     * @param {number} [layerIndex=0]
     * @returns {Promise<Float32Array|null>}
     */
    async query(worldX, worldY, chunks, paramsState, layerIndex = 0) {
      if (!Array.isArray(chunks) || chunks.length === 0) return null;
      const tileIdx = this.idxForWorldX(worldX, chunks, paramsState);
      const t = chunks[tileIdx];
      const gs = paramsState.gridSize;
      this.device.queue.writeBuffer(this._tileUBuf, 0, new Float32Array([t.offsetX / gs, 0, t.width / gs, 1]));
      const cacheKey = `${t.offsetX}:${layerIndex}`;
      let bg = this._bgCache.get(cacheKey);
      if (!bg) {
        const sdfView = this._chooseSdfView(t, layerIndex);
        const flagView = this._chooseFlagView(t, layerIndex);
        if (!sdfView || !flagView) {
          throw new Error("QueryComputeGPU: missing sdf/flag view for chunk; make sure SDF compute succeeded or fallbacks exist.");
        }
        bg = this.device.createBindGroup({
          layout: this._bgl,
          entries: [
            { binding: 0, resource: { buffer: this._camQueryBuf, offset: 0, size: this.uniformQuerySize } },
            { binding: 1, resource: sdfView },
            { binding: 2, resource: this.sampler },
            { binding: 3, resource: { buffer: this.renderUniformBuffer } },
            { binding: 4, resource: { buffer: this._resultBuf, offset: 0, size: this.QUERY_RESULT_BYTES } },
            { binding: 5, resource: { buffer: this._tileUBuf, offset: 0, size: 16 } },
            { binding: 6, resource: flagView }
          ]
        });
        this._bgCache.set(cacheKey, bg);
      }
      const camArr = new Float32Array([worldX, worldY, 0, 0]);
      this.device.queue.writeBuffer(this._camQueryBuf, 0, camArr);
      const enc = this.device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(this._pipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(1);
      pass.end();
      const readBuf = this.device.createBuffer({
        size: this.QUERY_RESULT_BYTES,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      enc.copyBufferToBuffer(this._resultBuf, 0, readBuf, 0, this.QUERY_RESULT_BYTES);
      this.device.queue.submit([enc.finish()]);
      await readBuf.mapAsync(GPUMapMode.READ);
      const mapped = readBuf.getMappedRange();
      const out = new Float32Array(mapped).slice();
      readBuf.unmap();
      return out;
    }
    destroy() {
      try {
        this._camQueryBuf.destroy();
      } catch (e) {
      }
      try {
        this._tileUBuf.destroy();
      } catch (e) {
      }
      try {
        this._resultBuf.destroy();
      } catch (e) {
      }
      this._bgCache.clear();
    }
  };

  // shaders/fSlabWallsCompute.wgsl
  var fSlabWallsCompute_default = "// slabs: marching-squares wall extraction into an instance buffer\r\n\r\nstruct SlabParams {\r\n  layerIndex : u32,\r\n  fieldMode  : u32,   // 0=escape r, 1=grad |\u2207h|, 2=height h(r) (normalized)\r\n  useBand    : u32,   // 0=iso, 1=band [low,high]\r\n  meshStep   : u32,   // sample stride in texels (1..)\r\n\r\n  offX       : u32,   // chunk origin in texels within the atlas\r\n  offY       : u32,\r\n  chunkW     : u32,   // chunk dimensions in texels\r\n  chunkH     : u32,\r\n\r\n  maxWalls   : u32,   // capacity in wallInstances\r\n  _pad0_u32  : u32,\r\n  _pad1_u32  : u32,\r\n  _pad2_u32  : u32,\r\n\r\n  iso        : f32,\r\n  bandLow    : f32,\r\n  bandHigh   : f32,\r\n  capBias    : f32,\r\n\r\n  quadScale  : f32,\r\n  dispAmp    : f32,\r\n  dispCurve  : f32,\r\n  dispMode   : u32,\r\n\r\n  gradScale  : f32,\r\n  _pad3_f    : vec3<f32>,\r\n};\r\n\r\n@group(0) @binding(0) var myTex : texture_2d_array<f32>;\r\n@group(0) @binding(1) var<uniform> slab : SlabParams;\r\n\r\nstruct WallInstance {\r\n  uvA  : vec2<f32>,\r\n  uvB  : vec2<f32>,\r\n  nXY  : vec2<f32>,\r\n  _pad : vec2<f32>,\r\n};\r\n\r\nstruct Counter {\r\n  count : atomic<u32>,\r\n};\r\n\r\nstruct DrawIndirectArgs {\r\n  vertexCount   : u32,\r\n  instanceCount : u32,\r\n  firstVertex   : u32,\r\n  firstInstance : u32,\r\n};\r\n\r\n@group(0) @binding(2) var<storage, read_write> wallInstances : array<WallInstance>;\r\n@group(0) @binding(3) var<storage, read_write> wallCount : Counter;\r\n@group(0) @binding(4) var<storage, read_write> wallDrawArgs : DrawIndirectArgs;\r\n\r\nfn clampI(v: i32, lo: i32, hi: i32) -> i32 {\r\n  return clamp(v, lo, hi);\r\n}\r\n\r\nfn loadR_global(ix: i32, iy: i32, layer: i32, texW: i32, texH: i32) -> f32 {\r\n  let x = clampI(ix, 0, texW - 1);\r\n  let y = clampI(iy, 0, texH - 1);\r\n  return textureLoad(myTex, vec2<i32>(x, y), layer, 0).r;\r\n}\r\n\r\nfn computeHnorm(v: f32) -> f32 {\r\n  switch (slab.dispMode) {\r\n    case 0u, 1u: { return v; }\r\n    case 2u: { return 1.0 - v; }\r\n    case 3u, 4u: {\r\n      let k = slab.dispCurve;\r\n      let x = select(v, 1.0 - v, slab.dispMode == 4u);\r\n      return log(1.0 + k * x) / log(1.0 + k);\r\n    }\r\n    case 5u, 6u: {\r\n      let p = max(slab.dispCurve, 1e-4);\r\n      let x = select(v, 1.0 - v, slab.dispMode == 6u);\r\n      return pow(x, p);\r\n    }\r\n    default: { return v; }\r\n  }\r\n}\r\n\r\nfn evalField_local(x: i32, y: i32, layer: i32, texW: i32, texH: i32) -> f32 {\r\n  let ox = i32(slab.offX);\r\n  let oy = i32(slab.offY);\r\n\r\n  let gx = ox + x;\r\n  let gy = oy + y;\r\n\r\n  let rC = loadR_global(gx, gy, layer, texW, texH);\r\n\r\n  switch (slab.fieldMode) {\r\n    case 0u: {\r\n      return rC;\r\n    }\r\n    case 1u: {\r\n      let rL = loadR_global(gx - 1, gy, layer, texW, texH);\r\n      let rR = loadR_global(gx + 1, gy, layer, texW, texH);\r\n      let rD = loadR_global(gx, gy - 1, layer, texW, texH);\r\n      let rU = loadR_global(gx, gy + 1, layer, texW, texH);\r\n\r\n      let hL = computeHnorm(rL);\r\n      let hR = computeHnorm(rR);\r\n      let hD = computeHnorm(rD);\r\n      let hU = computeHnorm(rU);\r\n\r\n      let gx2 = 0.5 * (hR - hL);\r\n      let gy2 = 0.5 * (hU - hD);\r\n\r\n      return slab.gradScale * length(vec2<f32>(gx2, gy2));\r\n    }\r\n    default: {\r\n      return computeHnorm(rC);\r\n    }\r\n  }\r\n}\r\n\r\nfn signedFromField(f: f32) -> f32 {\r\n  if (slab.useBand != 0u) {\r\n    return max(slab.bandLow - f, f - slab.bandHigh) - slab.capBias;\r\n  }\r\n  return (slab.iso - f) - slab.capBias;\r\n}\r\n\r\nfn edgeT(sa: f32, sb: f32) -> f32 {\r\n  let d = (sa - sb);\r\n  if (abs(d) < 1e-20) { return 0.5; }\r\n  return clamp(sa / d, 0.0, 1.0);\r\n}\r\n\r\nfn lerp2(a: vec2<f32>, b: vec2<f32>, t: f32) -> vec2<f32> {\r\n  return a + (b - a) * t;\r\n}\r\n\r\nfn emitWall(uvA: vec2<f32>, uvB: vec2<f32>, grad: vec2<f32>) {\r\n  let idx = atomicAdd(&wallCount.count, 1u);\r\n  if (idx >= slab.maxWalls) { return; }\r\n\r\n  let d = uvB - uvA;\r\n  let len2 = dot(d, d);\r\n  var n = vec2<f32>(0.0, 1.0);\r\n\r\n  if (len2 > 1e-20) {\r\n    let invLen = inverseSqrt(len2);\r\n    let dir = d * invLen;\r\n    n = normalize(vec2<f32>(-dir.y, dir.x));\r\n  }\r\n\r\n  if (dot(n, grad) < 0.0) { n = -n; }\r\n\r\n  wallInstances[idx] = WallInstance(uvA, uvB, n, vec2<f32>(0.0));\r\n}\r\n\r\n@compute @workgroup_size(8, 8, 1)\r\nfn build(@builtin(global_invocation_id) gid: vec3<u32>) {\r\n  let dimsU = textureDimensions(myTex);\r\n  let texW = i32(dimsU.x);\r\n  let texH = i32(dimsU.y);\r\n\r\n  let cw = i32(max(1u, slab.chunkW));\r\n  let ch = i32(max(1u, slab.chunkH));\r\n\r\n  let layer = i32(slab.layerIndex);\r\n\r\n  let step = max(1u, slab.meshStep);\r\n  let cellsX = max(0, (cw - 1) / i32(step));\r\n  let cellsY = max(0, (ch - 1) / i32(step));\r\n\r\n  if (i32(gid.x) >= cellsX || i32(gid.y) >= cellsY) { return; }\r\n\r\n  let x0 = i32(gid.x) * i32(step);\r\n  let y0 = i32(gid.y) * i32(step);\r\n  let x1 = min(x0 + i32(step), cw - 1);\r\n  let y1 = min(y0 + i32(step), ch - 1);\r\n\r\n  let ox = i32(slab.offX);\r\n  let oy = i32(slab.offY);\r\n\r\n  let denomX = f32(max(1, texW - 1));\r\n  let denomY = f32(max(1, texH - 1));\r\n\r\n  let uv0 = vec2<f32>(f32(ox + x0) / denomX, f32(oy + y0) / denomY);\r\n  let uv1 = vec2<f32>(f32(ox + x1) / denomX, f32(oy + y0) / denomY);\r\n  let uv2 = vec2<f32>(f32(ox + x1) / denomX, f32(oy + y1) / denomY);\r\n  let uv3 = vec2<f32>(f32(ox + x0) / denomX, f32(oy + y1) / denomY);\r\n\r\n  let f0 = evalField_local(x0, y0, layer, texW, texH);\r\n  let f1 = evalField_local(x1, y0, layer, texW, texH);\r\n  let f2 = evalField_local(x1, y1, layer, texW, texH);\r\n  let f3 = evalField_local(x0, y1, layer, texW, texH);\r\n\r\n  let s0 = signedFromField(f0);\r\n  let s1 = signedFromField(f1);\r\n  let s2 = signedFromField(f2);\r\n  let s3 = signedFromField(f3);\r\n\r\n  let b0 = select(0u, 1u, s0 <= 0.0);\r\n  let b1 = select(0u, 1u, s1 <= 0.0);\r\n  let b2 = select(0u, 1u, s2 <= 0.0);\r\n  let b3 = select(0u, 1u, s3 <= 0.0);\r\n  let c = b0 | (b1 << 1u) | (b2 << 2u) | (b3 << 3u);\r\n\r\n  if (c == 0u || c == 15u) { return; }\r\n\r\n  let saddle = (s0 * s2) - (s1 * s3);\r\n\r\n  let t0 = edgeT(s0, s1);\r\n  let t1 = edgeT(s1, s2);\r\n  let t2 = edgeT(s3, s2);\r\n  let t3 = edgeT(s0, s3);\r\n\r\n  let e0 = lerp2(uv0, uv1, t0);\r\n  let e1 = lerp2(uv1, uv2, t1);\r\n  let e2 = lerp2(uv3, uv2, t2);\r\n  let e3 = lerp2(uv0, uv3, t3);\r\n\r\n  let gx = 0.5 * ((s1 + s2) - (s0 + s3));\r\n  let gy = 0.5 * ((s3 + s2) - (s0 + s1));\r\n  let grad = vec2<f32>(gx, gy);\r\n\r\n  switch (c) {\r\n    case 1u:  { emitWall(e3, e0, grad); }\r\n    case 2u:  { emitWall(e0, e1, grad); }\r\n    case 3u:  { emitWall(e3, e1, grad); }\r\n    case 4u:  { emitWall(e1, e2, grad); }\r\n    case 5u:  {\r\n      if (saddle < 0.0) { emitWall(e0, e1, grad); emitWall(e2, e3, grad); }\r\n      else { emitWall(e3, e0, grad); emitWall(e1, e2, grad); }\r\n    }\r\n    case 6u:  { emitWall(e0, e2, grad); }\r\n    case 7u:  { emitWall(e3, e2, grad); }\r\n    case 8u:  { emitWall(e2, e3, grad); }\r\n    case 9u:  { emitWall(e2, e0, grad); }\r\n    case 10u: {\r\n      if (saddle < 0.0) { emitWall(e3, e0, grad); emitWall(e1, e2, grad); }\r\n      else { emitWall(e0, e1, grad); emitWall(e2, e3, grad); }\r\n    }\r\n    case 11u: { emitWall(e1, e2, grad); }\r\n    case 12u: { emitWall(e3, e1, grad); }\r\n    case 13u: { emitWall(e0, e1, grad); }\r\n    case 14u: { emitWall(e3, e0, grad); }\r\n    default:  { }\r\n  }\r\n}\r\n\r\n@compute @workgroup_size(1, 1, 1)\r\nfn finalize() {\r\n  let n = atomicLoad(&wallCount.count);\r\n  wallDrawArgs.vertexCount = 6u;\r\n  wallDrawArgs.instanceCount = min(n, slab.maxWalls);\r\n  wallDrawArgs.firstVertex = 0u;\r\n  wallDrawArgs.firstInstance = 0u;\r\n}\r\n";

  // shaders/fSlabWallsRender.wgsl
  var fSlabWallsRender_default = "// shaders/fSlabWallsRender.wgsl\r\n// renders each wall segment instance as a vertical quad, camera-aware\r\n\r\nstruct Camera {\r\n  viewProj : mat4x4<f32>,\r\n  camPos   : vec4<f32>,\r\n};\r\n@group(0) @binding(0) var<uniform> camera : Camera;\r\n\r\nstruct RenderParams {\r\n  layerIndex  : u32,\r\n  scheme      : u32,\r\n  dispMode    : u32,\r\n  bowlOn      : u32,\r\n\r\n  hueOffset   : f32,\r\n  dispAmp     : f32,\r\n  dispCurve   : f32,\r\n  bowlDepth   : f32,\r\n\r\n  quadScale   : f32,\r\n  gridSize    : f32,\r\n  lightingOn  : u32,\r\n  dispLimitOn : u32,\r\n\r\n  lightPos    : vec3<f32>,\r\n  specPower   : f32,\r\n\r\n  slopeLimit  : f32,\r\n  wallJump    : f32,\r\n  alphaMode   : u32,\r\n  _pad0       : u32,\r\n\r\n  worldOffset : f32,\r\n  worldStart  : f32,\r\n  thickness   : f32,\r\n  feather     : f32,\r\n};\r\n@group(0) @binding(1) var<uniform> render : RenderParams;\r\n\r\n@group(0) @binding(2) var myTex : texture_2d_array<f32>;\r\n@group(0) @binding(3) var mySamp : sampler;\r\n\r\nstruct Model {\r\n  world         : mat4x4<f32>,\r\n  uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\nstruct WallInstance {\r\n  uvA  : vec2<f32>,\r\n  uvB  : vec2<f32>,\r\n  nXY  : vec2<f32>,\r\n  _pad : vec2<f32>,\r\n};\r\n@group(1) @binding(1) var<storage, read> wallInstances : array<WallInstance>;\r\n\r\nstruct VSOut {\r\n  @builtin(position) pos  : vec4<f32>,\r\n  @location(0)       uv   : vec2<f32>,\r\n  @location(1)       wPos : vec3<f32>,\r\n  @location(2)       nWS  : vec3<f32>,\r\n};\r\n\r\nfn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {\r\n  let H = hsl.x;\r\n  let S = hsl.y;\r\n  let L = hsl.z;\r\n\r\n  let C  = (1.0 - abs(2.0 * L - 1.0)) * S;\r\n  let Hp = H * 6.0;\r\n  let X  = C * (1.0 - abs(fract(Hp) * 2.0 - 1.0));\r\n\r\n  var rgb = vec3<f32>(0.0);\r\n\r\n  if (Hp < 1.0) { rgb = vec3<f32>(C, X, 0.0); }\r\n  else if (Hp < 2.0) { rgb = vec3<f32>(X, C, 0.0); }\r\n  else if (Hp < 3.0) { rgb = vec3<f32>(0.0, C, X); }\r\n  else if (Hp < 4.0) { rgb = vec3<f32>(0.0, X, C); }\r\n  else if (Hp < 5.0) { rgb = vec3<f32>(X, 0.0, C); }\r\n  else { rgb = vec3<f32>(C, 0.0, X); }\r\n\r\n  let m = L - 0.5 * C;\r\n  return rgb + m;\r\n}\r\n\r\nfn palette(r: f32) -> vec3<f32> {\r\n  var H: f32;\r\n  var L: f32;\r\n\r\n  switch (render.scheme) {\r\n    case 0u:  { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }\r\n    case 1u:  { H = (0.0 + 60.0 * r) / 360.0; L = 0.50 + 0.50 * r; }\r\n    case 2u:  { H = (200.0 - 100.0 * r) / 360.0; L = 0.30 + 0.70 * r; }\r\n    case 3u:  { H = (30.0 + 270.0 * r) / 360.0; L = 0.30 + 0.40 * r; }\r\n    case 4u:  { H = (120.0 -  90.0 * r) / 360.0; L = 0.20 + 0.50 * r; }\r\n    case 6u:  { return vec3<f32>(r); }\r\n    default:  { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }\r\n  }\r\n\r\n  H = fract(H + render.hueOffset);\r\n  return hsl2rgb(vec3<f32>(H, 1.0, L));\r\n}\r\n\r\nfn bowlHeight(worldXY: vec2<f32>) -> f32 {\r\n  if (render.bowlOn == 0u) { return 0.0; }\r\n  let q = max(1e-6, render.quadScale);\r\n  let n = worldXY / q;\r\n  let r2 = dot(n, n);\r\n  return -render.bowlDepth * r2 * q;\r\n}\r\n\r\nfn localFromUv(uvT: vec2<f32>) -> vec2<f32> {\r\n  let u0 = model.uvOffsetScale.xy;\r\n  let su = max(vec2<f32>(1e-6), model.uvOffsetScale.zw);\r\n  return (uvT - u0) / su;\r\n}\r\n@vertex\r\nfn vs_main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VSOut {\r\n  var out: VSOut;\r\n\r\n  let inst = wallInstances[iid];\r\n  let uvA = inst.uvA;\r\n  let uvB = inst.uvB;\r\n\r\n  let aL = localFromUv(uvA);\r\n  let bL = localFromUv(uvB);\r\n\r\n  var wA4 = model.world * vec4<f32>(aL.x, aL.y, 0.0, 1.0);\r\n  var wB4 = model.world * vec4<f32>(bL.x, bL.y, 0.0, 1.0);\r\n\r\n  let dW = wB4.xy - wA4.xy;\r\n  let invLen = inverseSqrt(max(1e-12, dot(dW, dW)));\r\n  var nW = vec2<f32>(-dW.y, dW.x) * invLen;\r\n\r\n  let wLocalX = abs(model.world[0].x);\r\n  let wLocalY = abs(model.world[1].y);\r\n  let su = max(1e-6, model.uvOffsetScale.z);\r\n  let sv = max(1e-6, model.uvOffsetScale.w);\r\n\r\n  let nHint = normalize(vec2<f32>(inst.nXY.x * (wLocalX / su), inst.nXY.y * (wLocalY / sv)));\r\n  if (dot(nW, nHint) < 0.0) { nW = -nW; }\r\n\r\n  let dimsU = textureDimensions(myTex);\r\n  let duT = 1.0 / max(1.0, f32(max(1u, dimsU.x - 1u)));\r\n  let dvT = 1.0 / max(1.0, f32(max(1u, dimsU.y - 1u)));\r\n\r\n  let texelWorldX = wLocalX * (duT / su);\r\n  let texelWorldY = wLocalY * (dvT / sv);\r\n  let texelWorld = 0.5 * (texelWorldX + texelWorldY);\r\n\r\n  let contourOnly = (render.alphaMode & 2u) != 0u;\r\n  let jumpW = select(render.wallJump * texelWorld, 0.0, contourOnly);\r\n\r\n  wA4.x = wA4.x + nW.x * jumpW;\r\n  wA4.y = wA4.y + nW.y * jumpW;\r\n  wB4.x = wB4.x + nW.x * jumpW;\r\n  wB4.y = wB4.y + nW.y * jumpW;\r\n\r\n  let useB = (vid == 1u) || (vid == 2u) || (vid == 4u);\r\n  let useTop = (vid == 2u) || (vid == 4u) || (vid == 5u);\r\n\r\n  let baseZ = render.worldStart + render.worldOffset * f32(render.layerIndex);\r\n\r\n  let pXY = select(wA4.xy, wB4.xy, useB);\r\n  let bowl = bowlHeight(pXY);\r\n\r\n  let halfThick = 0.5 * render.thickness;\r\n  let zBot = baseZ + bowl - halfThick;\r\n  let zTop = baseZ + bowl + halfThick;\r\n  let z = select(zBot, zTop, useTop);\r\n\r\n  let wpos = vec3<f32>(pXY.x, pXY.y, z);\r\n\r\n  out.pos = camera.viewProj * vec4<f32>(wpos, 1.0);\r\n  out.uv = select(uvA, uvB, useB);\r\n  out.wPos = wpos;\r\n  out.nWS = normalize(vec3<f32>(nW, 0.0));\r\n\r\n  return out;\r\n}\r\n\r\n\r\n\r\n@fragment\r\nfn fs_main(input: VSOut) -> @location(0) vec4<f32> {\r\n  let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));\r\n  let r = clamp(texel.r, 0.0, 1.0);\r\n\r\n  var rgb = palette(r);\r\n\r\n  if (render.lightingOn != 0u) {\r\n    let lightWS = render.lightPos * render.quadScale;\r\n    let Ldir = normalize(lightWS - input.wPos);\r\n    let Vdir = normalize(camera.camPos.xyz - input.wPos);\r\n    let hVec = normalize(Ldir + Vdir);\r\n\r\n    let diff = max(dot(input.nWS, Ldir), 0.0);\r\n    let spec = pow(max(dot(input.nWS, hVec), 0.0), render.specPower) * smoothstep(0.0, 0.1, diff);\r\n\r\n    let ambient = 0.15;\r\n    rgb = clamp(rgb * (ambient + diff) + 1.25 * spec, vec3<f32>(0.0), vec3<f32>(1.0));\r\n  }\r\n\r\n  return vec4<f32>(rgb, 1.0);\r\n}\r\n";

  // shaders/fSlabCapsRender.wgsl
  var fSlabCapsRender_default = "// shaders/fSlabCapsRender.wgsl\r\n\r\nstruct Camera {\r\n  viewProj : mat4x4<f32>,\r\n  camPos   : vec4<f32>,\r\n};\r\n@group(0) @binding(0) var<uniform> camera : Camera;\r\n\r\nstruct RenderParams {\r\n  layerIndex  : u32,\r\n  scheme      : u32,\r\n  dispMode    : u32,\r\n  bowlOn      : u32,\r\n\r\n  hueOffset   : f32,\r\n  dispAmp     : f32,\r\n  dispCurve   : f32,\r\n  bowlDepth   : f32,\r\n\r\n  quadScale   : f32,\r\n  gridSize    : f32,\r\n  lightingOn  : u32,\r\n  dispLimitOn : u32,\r\n\r\n  lightPos    : vec3<f32>,\r\n  specPower   : f32,\r\n\r\n  slopeLimit  : f32,\r\n  wallJump    : f32,\r\n  alphaMode   : u32,\r\n  _pad0       : u32,\r\n\r\n  worldOffset : f32,\r\n  worldStart  : f32,\r\n  thickness   : f32,\r\n  feather     : f32,\r\n};\r\n@group(0) @binding(1) var<uniform> render : RenderParams;\r\n\r\nstruct SlabParams {\r\n  layerIndex : u32,\r\n  fieldMode  : u32,\r\n  useBand    : u32,\r\n  meshStep   : u32,\r\n\r\n  iso        : f32,\r\n  bandLow    : f32,\r\n  bandHigh   : f32,\r\n  capBias    : f32,\r\n\r\n  quadScale  : f32,\r\n  dispAmp    : f32,\r\n  dispCurve  : f32,\r\n  dispMode   : u32,\r\n\r\n  gradScale  : f32,\r\n  _pad0_f    : vec3<f32>,\r\n};\r\n@group(0) @binding(2) var<uniform> slab : SlabParams;\r\n\r\n@group(0) @binding(3) var myTex : texture_2d_array<f32>;\r\n@group(0) @binding(4) var mySamp : sampler;\r\n\r\nstruct Model {\r\n  world         : mat4x4<f32>,\r\n  uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\nstruct VSOut {\r\n  @builtin(position) pos  : vec4<f32>,\r\n  @location(0)       uv   : vec2<f32>,\r\n  @location(1)       wPos : vec3<f32>,\r\n  @location(2)       nWS  : vec3<f32>,\r\n  @location(3)       side : f32,\r\n};\r\n\r\nconst CONTOUR_ON_BIT    : u32 = 1u;\r\nconst CONTOUR_ONLY_BIT  : u32 = 2u;\r\nconst CONTOUR_FRONT_BIT : u32 = 4u;\r\n\r\nfn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {\r\n  let H = hsl.x;\r\n  let S = hsl.y;\r\n  let L = hsl.z;\r\n\r\n  let C  = (1.0 - abs(2.0 * L - 1.0)) * S;\r\n  let Hp = H * 6.0;\r\n  let X  = C * (1.0 - abs(fract(Hp) * 2.0 - 1.0));\r\n\r\n  var rgb = vec3<f32>(0.0);\r\n\r\n  if (Hp < 1.0) { rgb = vec3<f32>(C, X, 0.0); }\r\n  else if (Hp < 2.0) { rgb = vec3<f32>(X, C, 0.0); }\r\n  else if (Hp < 3.0) { rgb = vec3<f32>(0.0, C, X); }\r\n  else if (Hp < 4.0) { rgb = vec3<f32>(0.0, X, C); }\r\n  else if (Hp < 5.0) { rgb = vec3<f32>(X, 0.0, C); }\r\n  else { rgb = vec3<f32>(C, 0.0, X); }\r\n\r\n  let m = L - 0.5 * C;\r\n  return rgb + m;\r\n}\r\n\r\nfn palette(r: f32) -> vec3<f32> {\r\n  var H: f32;\r\n  var L: f32;\r\n\r\n  switch (render.scheme) {\r\n    case 0u:  { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }\r\n    case 1u:  { H = (0.0 + 60.0 * r) / 360.0; L = 0.50 + 0.50 * r; }\r\n    case 2u:  { H = (200.0 - 100.0 * r) / 360.0; L = 0.30 + 0.70 * r; }\r\n    case 3u:  { H = (30.0 + 270.0 * r) / 360.0; L = 0.30 + 0.40 * r; }\r\n    case 4u:  { H = (120.0 -  90.0 * r) / 360.0; L = 0.20 + 0.50 * r; }\r\n    case 6u:  { return vec3<f32>(r); }\r\n    default:  { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }\r\n  }\r\n\r\n  H = fract(H + render.hueOffset);\r\n  return hsl2rgb(vec3<f32>(H, 1.0, L));\r\n}\r\n\r\nfn dispHeight(r: f32) -> f32 {\r\n  if (render.dispMode == 0u) { return 0.0; }\r\n  let rr = clamp(r, 0.0, 1.0);\r\n  switch (render.dispMode) {\r\n    case 1u: { return pow(rr, render.dispCurve) * render.dispAmp; }\r\n    case 2u: { return (pow(rr, render.dispCurve) - 0.5) * (2.0 * render.dispAmp); }\r\n    case 3u: {\r\n      let t = 1.0 - abs(2.0 * rr - 1.0);\r\n      return pow(clamp(t, 0.0, 1.0), render.dispCurve) * render.dispAmp;\r\n    }\r\n    default: { return pow(rr, render.dispCurve) * render.dispAmp; }\r\n  }\r\n}\r\n\r\nfn bowlHeight(worldXY: vec2<f32>) -> f32 {\r\n  if (render.bowlOn == 0u) { return 0.0; }\r\n  let q = max(1e-6, render.quadScale);\r\n  let n = worldXY / q;\r\n  let r2 = dot(n, n);\r\n  return -render.bowlDepth * r2 * q;\r\n}\r\n\r\nfn maxGradFromSlopeLimit(s2: f32) -> f32 {\r\n  let x = clamp(s2, 0.0, 0.9999);\r\n  return sqrt(x / max(1e-6, 1.0 - x));\r\n}\r\n\r\nfn computeHnorm(v: f32) -> f32 {\r\n  switch (slab.dispMode) {\r\n    case 0u, 1u: { return v; }\r\n    case 2u: { return 1.0 - v; }\r\n    case 3u, 4u: {\r\n      let k = slab.dispCurve;\r\n      let x = select(v, 1.0 - v, slab.dispMode == 4u);\r\n      return log(1.0 + k * x) / log(1.0 + k);\r\n    }\r\n    case 5u, 6u: {\r\n      let p = max(slab.dispCurve, 1e-4);\r\n      let x = select(v, 1.0 - v, slab.dispMode == 6u);\r\n      return pow(x, p);\r\n    }\r\n    default: { return v; }\r\n  }\r\n}\r\n\r\nfn signedFromField(f: f32) -> f32 {\r\n  if (slab.useBand != 0u) {\r\n    return max(slab.bandLow - f, f - slab.bandHigh) - slab.capBias;\r\n  }\r\n  return (slab.iso - f) - slab.capBias;\r\n}\r\n\r\nfn insideAmountFromSigned(s: f32) -> f32 {\r\n  return -s;\r\n}\r\n\r\nfn coverageAlphaFromInside(insideAmount: f32) -> f32 {\r\n  let feather = max(0.0, render.feather);\r\n  if (feather > 0.0) {\r\n    return smoothstep(0.0, feather, insideAmount);\r\n  }\r\n  return select(0.0, 1.0, insideAmount >= 0.0);\r\n}\r\n\r\nfn contourMaskFromSigned(s: f32) -> f32 {\r\n  let fw = max(1e-6, fwidth(s));\r\n  let feather = max(0.0, render.feather);\r\n  let lw = max(fw * 1.5, max(1e-6, feather) * 0.25);\r\n  return 1.0 - smoothstep(0.0, lw, abs(s));\r\n}\r\n\r\nfn loadR(ix: i32, iy: i32) -> f32 {\r\n  let dims = textureDimensions(myTex);\r\n  let maxX = max(0, i32(dims.x) - 1);\r\n  let maxY = max(0, i32(dims.y) - 1);\r\n\r\n  let x = clamp(ix, 0, maxX);\r\n  let y = clamp(iy, 0, maxY);\r\n\r\n  return textureLoad(myTex, vec2<i32>(x, y), i32(render.layerIndex), 0).r;\r\n}\r\n\r\nfn sampleRGridFromUv(uvT: vec2<f32>) -> f32 {\r\n  let dims = textureDimensions(myTex);\r\n  let denomX = max(1, i32(dims.x) - 1);\r\n  let denomY = max(1, i32(dims.y) - 1);\r\n\r\n  let xf = clamp(uvT.x, 0.0, 1.0) * f32(denomX);\r\n  let yf = clamp(uvT.y, 0.0, 1.0) * f32(denomY);\r\n\r\n  let ix = clamp(i32(round(xf)), 0, denomX);\r\n  let iy = clamp(i32(round(yf)), 0, denomY);\r\n\r\n  return loadR(ix, iy);\r\n}\r\n\r\nfn evalFieldAtGrid(ix: i32, iy: i32) -> f32 {\r\n  let rC = loadR(ix, iy);\r\n\r\n  switch (slab.fieldMode) {\r\n    case 0u: {\r\n      return rC;\r\n    }\r\n    case 1u: {\r\n      let hL = computeHnorm(loadR(ix - 1, iy));\r\n      let hR = computeHnorm(loadR(ix + 1, iy));\r\n      let hD = computeHnorm(loadR(ix, iy - 1));\r\n      let hU = computeHnorm(loadR(ix, iy + 1));\r\n\r\n      let gx = 0.5 * (hR - hL);\r\n      let gy = 0.5 * (hU - hD);\r\n\r\n      return slab.gradScale * length(vec2<f32>(gx, gy));\r\n    }\r\n    default: {\r\n      return computeHnorm(rC);\r\n    }\r\n  }\r\n}\r\n\r\nfn cellFromUv(uvT: vec2<f32>) -> vec4<f32> {\r\n  let dims = textureDimensions(myTex);\r\n  let denomX = max(1, i32(dims.x) - 1);\r\n  let denomY = max(1, i32(dims.y) - 1);\r\n\r\n  let xF = clamp(uvT.x, 0.0, 1.0) * f32(denomX);\r\n  let yF = clamp(uvT.y, 0.0, 1.0) * f32(denomY);\r\n\r\n  let x0 = clamp(i32(floor(xF)), 0, max(0, denomX - 1));\r\n  let y0 = clamp(i32(floor(yF)), 0, max(0, denomY - 1));\r\n\r\n  let fx = clamp(xF - f32(x0), 0.0, 1.0);\r\n  let fy = clamp(yF - f32(y0), 0.0, 1.0);\r\n\r\n  return vec4<f32>(f32(x0), f32(y0), fx, fy);\r\n}\r\n@vertex\r\nfn vs_main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VSOut {\r\n  var out: VSOut;\r\n\r\n  var uvLocal: vec2<f32>;\r\n  switch (vid) {\r\n    case 0u: { uvLocal = vec2<f32>(0.0, 0.0); }\r\n    case 1u: { uvLocal = vec2<f32>(1.0, 0.0); }\r\n    case 2u: { uvLocal = vec2<f32>(1.0, 1.0); }\r\n    case 3u: { uvLocal = vec2<f32>(0.0, 0.0); }\r\n    case 4u: { uvLocal = vec2<f32>(1.0, 1.0); }\r\n    default: { uvLocal = vec2<f32>(0.0, 1.0); }\r\n  }\r\n\r\n  let side = select(-1.0, 1.0, iid == 1u);\r\n\r\n  let uvMin = model.uvOffsetScale.xy;\r\n  let uvT = uvMin + uvLocal * model.uvOffsetScale.zw;\r\n\r\n  var wp = model.world * vec4<f32>(uvLocal.x, uvLocal.y, 0.0, 1.0);\r\n\r\n  let q = max(1e-6, render.quadScale);\r\n\r\n  let dimsU = textureDimensions(myTex);\r\n  let denomX = max(1u, dimsU.x - 1u);\r\n  let denomY = max(1u, dimsU.y - 1u);\r\n  let duT = 1.0 / max(1.0, f32(denomX));\r\n  let dvT = 1.0 / max(1.0, f32(denomY));\r\n\r\n  let rC = sampleRGridFromUv(uvT);\r\n\r\n  let wLocalX = abs(model.world[0].x);\r\n  let wLocalY = abs(model.world[1].y);\r\n  let su = max(1e-6, model.uvOffsetScale.z);\r\n  let sv = max(1e-6, model.uvOffsetScale.w);\r\n\r\n  let dxW = duT * (wLocalX / su);\r\n  let dyW = dvT * (wLocalY / sv);\r\n\r\n  let uvTL = uvT + vec2<f32>(-duT, 0.0);\r\n  let uvTR = uvT + vec2<f32>( duT, 0.0);\r\n  let uvTD = uvT + vec2<f32>(0.0, -dvT);\r\n  let uvTU = uvT + vec2<f32>(0.0,  dvT);\r\n\r\n  let hC = dispHeight(rC) * q;\r\n  let hL = dispHeight(sampleRGridFromUv(uvTL)) * q;\r\n  let hR = dispHeight(sampleRGridFromUv(uvTR)) * q;\r\n  let hD = dispHeight(sampleRGridFromUv(uvTD)) * q;\r\n  let hU = dispHeight(sampleRGridFromUv(uvTU)) * q;\r\n\r\n  var dHx = (hR - hL) / max(1e-6, dxW);\r\n  var dHy = (hU - hD) / max(1e-6, dyW);\r\n\r\n  if (render.bowlOn != 0u) {\r\n    dHx = dHx + (-2.0 * render.bowlDepth * wp.x) / q;\r\n    dHy = dHy + (-2.0 * render.bowlDepth * wp.y) / q;\r\n  }\r\n\r\n  let maxG = maxGradFromSlopeLimit(render.slopeLimit);\r\n  let gLen = length(vec2<f32>(dHx, dHy));\r\n  if (gLen > maxG) {\r\n    let s = maxG / max(1e-6, gLen);\r\n    dHx = dHx * s;\r\n    dHy = dHy * s;\r\n  }\r\n\r\n  var n = normalize(vec3<f32>(-dHx, -dHy, 1.0));\r\n  n = n * side;\r\n\r\n  let baseZ = (render.worldStart + render.worldOffset * f32(render.layerIndex)) * q;\r\n  let bowl = bowlHeight(wp.xy);\r\n  let halfThick = 0.5 * render.thickness * q;\r\n  let z = baseZ + bowl + hC + side * halfThick;\r\n\r\n  wp.z = z;\r\n\r\n  out.pos = camera.viewProj * wp;\r\n\r\n  if ((render.alphaMode & CONTOUR_FRONT_BIT) != 0u) {\r\n    out.pos.z = out.pos.z - 0.002 * out.pos.w;\r\n  }\r\n\r\n  out.uv = uvT;\r\n  out.wPos = wp.xyz;\r\n  out.nWS = n;\r\n  out.side = side;\r\n\r\n  return out;\r\n}\r\n\r\n\r\n@fragment\r\nfn fs_main(input: VSOut) -> @location(0) vec4<f32> {\r\n  let cp = cellFromUv(input.uv);\r\n  let x0 = i32(cp.x);\r\n  let y0 = i32(cp.y);\r\n  let fx = cp.z;\r\n  let fy = cp.w;\r\n\r\n  let r00 = loadR(x0,     y0);\r\n  let r10 = loadR(x0 + 1, y0);\r\n  let r01 = loadR(x0,     y0 + 1);\r\n  let r11 = loadR(x0 + 1, y0 + 1);\r\n\r\n  let rx0 = mix(r00, r10, fx);\r\n  let rx1 = mix(r01, r11, fx);\r\n  let rRaw = mix(rx0, rx1, fy);\r\n  let r = clamp(rRaw, 0.0, 1.0);\r\n\r\n  var s00: f32;\r\n  var s10: f32;\r\n  var s01: f32;\r\n  var s11: f32;\r\n\r\n  if (slab.fieldMode == 0u) {\r\n    s00 = signedFromField(r00);\r\n    s10 = signedFromField(r10);\r\n    s01 = signedFromField(r01);\r\n    s11 = signedFromField(r11);\r\n  } else {\r\n    s00 = signedFromField(evalFieldAtGrid(x0,     y0));\r\n    s10 = signedFromField(evalFieldAtGrid(x0 + 1, y0));\r\n    s01 = signedFromField(evalFieldAtGrid(x0,     y0 + 1));\r\n    s11 = signedFromField(evalFieldAtGrid(x0 + 1, y0 + 1));\r\n  }\r\n\r\n  let sx0 = mix(s00, s10, fx);\r\n  let sx1 = mix(s01, s11, fx);\r\n  let s = mix(sx0, sx1, fy);\r\n\r\n  let contour = contourMaskFromSigned(s);\r\n\r\n  if ((render.alphaMode & CONTOUR_ONLY_BIT) != 0u) {\r\n    if (contour <= 0.0) { discard; }\r\n    return vec4<f32>(vec3<f32>(1.0, 1.0, 1.0), contour);\r\n  }\r\n\r\n  let insideAmount = insideAmountFromSigned(s);\r\n  let a = coverageAlphaFromInside(insideAmount);\r\n  if (a <= 0.0) { discard; }\r\n\r\n  var rgb = palette(r);\r\n\r\n  if (render.lightingOn != 0u) {\r\n    let lightWS = render.lightPos * render.quadScale;\r\n    let Ldir = normalize(lightWS - input.wPos);\r\n    let Vdir = normalize(camera.camPos.xyz - input.wPos);\r\n    let hVec = normalize(Ldir + Vdir);\r\n\r\n    let diff = max(dot(input.nWS, Ldir), 0.0);\r\n    let spec = pow(max(dot(input.nWS, hVec), 0.0), render.specPower) * smoothstep(0.0, 0.1, diff);\r\n\r\n    let ambient = 0.15;\r\n    rgb = clamp(rgb * (ambient + diff) + 1.25 * spec, vec3<f32>(0.0), vec3<f32>(1.0));\r\n  }\r\n\r\n  if ((render.alphaMode & CONTOUR_ON_BIT) != 0u) {\r\n    rgb = clamp(rgb * (1.0 - 0.65 * contour), vec3<f32>(0.0), vec3<f32>(1.0));\r\n  }\r\n\r\n  return vec4<f32>(rgb, a);\r\n}\r\n";

  // shaders/fSlabCompute.js
  var SlabMeshPipelineGPU = class {
    /**
     * @param {GPUDevice} device
     * @param {GPUCanvasContext} context
     * @param {object} [opts]
     * @param {number} [opts.uniformStride=256]
     * @param {number} [opts.maxWallsPerChunk=524288]
     * @param {string} [opts.canvasAlphaMode="premultiplied"]
     */
    constructor(device, context, opts = {}) {
      this.device = device;
      this.context = context;
      this.uniformStride = (opts.uniformStride ?? 256) >>> 0;
      this.maxWallsPerChunk = (opts.maxWallsPerChunk ?? 524288) >>> 0;
      this.canvasAlphaMode = opts.canvasAlphaMode ?? "premultiplied";
      this.format = navigator.gpu.getPreferredCanvasFormat();
      this._pipeCache = /* @__PURE__ */ new Map();
      this._chunks = [];
      this._layers = 1;
      this._lastCanvasSize = [0, 0];
      this.depthTexture = null;
      this._rendering = false;
      this._pendingResize = null;
      this._deferredDestroy = [];
      this._renderUBO = null;
      this._slabRenderUBO = null;
      this._createSharedBuffers();
      this._createLayouts();
      this._createPipelines();
      this.sampler = device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
      });
    }
    /* -------------------------------------------------------------- */
    /*  Shared GPU buffers                                            */
    /* -------------------------------------------------------------- */
    _createSharedBuffers() {
      this.cameraBuffer = this.device.createBuffer({
        size: 20 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this._slabComputeUBO = null;
    }
    _ensureLayerUniforms(nLayers) {
      const n = Math.max(1, nLayers | 0);
      const bytes = this.uniformStride * n;
      if (!this._renderUBO || this._renderUBO.size < bytes) {
        try {
          if (this._renderUBO) this._renderUBO.destroy();
        } catch (e) {
        }
        this._renderUBO = this.device.createBuffer({
          size: bytes,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
      }
      if (!this._slabRenderUBO || this._slabRenderUBO.size < bytes) {
        try {
          if (this._slabRenderUBO) this._slabRenderUBO.destroy();
        } catch (e) {
        }
        this._slabRenderUBO = this.device.createBuffer({
          size: bytes,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
      }
    }
    /* -------------------------------------------------------------- */
    /*  Layouts                                                       */
    /* -------------------------------------------------------------- */
    _createLayouts() {
      this._computeLayout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            texture: { sampleType: "float", viewDimension: "2d-array" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.uniformStride
            }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
          },
          {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
          },
          {
            binding: 4,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
          }
        ]
      });
      this._computePipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [this._computeLayout]
      });
      this._wallsBg0Layout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.uniformStride
            }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d-array" }
          },
          {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: { type: "filtering" }
          }
        ]
      });
      this._wallsBg1Layout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: "read-only-storage" }
          }
        ]
      });
      this._wallsPipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [this._wallsBg0Layout, this._wallsBg1Layout]
      });
      this._capsBg0Layout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.uniformStride
            }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: "uniform",
              hasDynamicOffset: true,
              minBindingSize: this.uniformStride
            }
          },
          {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: { sampleType: "float", viewDimension: "2d-array" }
          },
          {
            binding: 4,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: { type: "filtering" }
          }
        ]
      });
      this._capsBg1Layout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
          }
        ]
      });
      this._capsPipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [this._capsBg0Layout, this._capsBg1Layout]
      });
    }
    /* -------------------------------------------------------------- */
    /*  Pipelines                                                     */
    /* -------------------------------------------------------------- */
    _pipeline(key, creator) {
      let p = this._pipeCache.get(key);
      if (p) return p;
      p = creator();
      this._pipeCache.set(key, p);
      return p;
    }
    _createPipelines() {
      this._wallsComputeModule = this.device.createShaderModule({
        code: fSlabWallsCompute_default
      });
      this._wallsRenderModule = this.device.createShaderModule({
        code: fSlabWallsRender_default
      });
      this._capsRenderModule = this.device.createShaderModule({
        code: fSlabCapsRender_default
      });
      this._computeBuild = this._pipeline(
        "slab_compute_build",
        () => this.device.createComputePipeline({
          layout: this._computePipelineLayout,
          compute: { module: this._wallsComputeModule, entryPoint: "build" }
        })
      );
      this._computeFinalize = this._pipeline(
        "slab_compute_finalize",
        () => this.device.createComputePipeline({
          layout: this._computePipelineLayout,
          compute: { module: this._wallsComputeModule, entryPoint: "finalize" }
        })
      );
      this._wallsPipeline = this._pipeline(
        "slab_walls_render",
        () => this.device.createRenderPipeline({
          layout: this._wallsPipelineLayout,
          vertex: {
            module: this._wallsRenderModule,
            entryPoint: "vs_main",
            buffers: []
          },
          fragment: {
            module: this._wallsRenderModule,
            entryPoint: "fs_main",
            targets: [{ format: this.format }]
          },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
          }
        })
      );
      this._capsPipelineOpaque = this._pipeline(
        "slab_caps_opaque",
        () => this.device.createRenderPipeline({
          layout: this._capsPipelineLayout,
          vertex: {
            module: this._capsRenderModule,
            entryPoint: "vs_main",
            buffers: []
          },
          fragment: {
            module: this._capsRenderModule,
            entryPoint: "fs_main",
            targets: [{ format: this.format }]
          },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less-equal"
          }
        })
      );
      this._capsPipelineBlend = this._pipeline(
        "slab_caps_blend",
        () => this.device.createRenderPipeline({
          layout: this._capsPipelineLayout,
          vertex: {
            module: this._capsRenderModule,
            entryPoint: "vs_main",
            buffers: []
          },
          fragment: {
            module: this._capsRenderModule,
            entryPoint: "fs_main",
            targets: [
              {
                format: this.format,
                blend: {
                  color: {
                    srcFactor: "src-alpha",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add"
                  },
                  alpha: {
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                    operation: "add"
                  }
                },
                writeMask: GPUColorWrite.ALL
              }
            ]
          },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: false,
            depthCompare: "less-equal"
          }
        })
      );
    }
    /* -------------------------------------------------------------- */
    /*  Canvas resize                                                 */
    /* -------------------------------------------------------------- */
    resize(clientWidth, clientHeight) {
      if (this._rendering) {
        this._pendingResize = [clientWidth, clientHeight];
        return;
      }
      this._applyResize(clientWidth, clientHeight);
    }
    _applyResize(clientWidth, clientHeight) {
      const dpr = window.devicePixelRatio || 1;
      const pw = Math.max(1, Math.floor(clientWidth * dpr));
      const ph = Math.max(1, Math.floor(clientHeight * dpr));
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: this.canvasAlphaMode,
        size: [pw, ph]
      });
      if (this.depthTexture) this._deferredDestroy.push(this.depthTexture);
      this.depthTexture = this.device.createTexture({
        size: [pw, ph, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      this._lastCanvasSize = [pw, ph];
    }
    _flushDeferredDestroy() {
      const list = this._deferredDestroy;
      if (!list.length) return;
      this._deferredDestroy = [];
      for (const tex of list) {
        try {
          tex.destroy();
        } catch (e) {
        }
      }
    }
    /* -------------------------------------------------------------- */
    /*  Camera                                                        */
    /* -------------------------------------------------------------- */
    updateCamera(cam, aspect) {
      const proj = perspective(cam.fov, aspect, 0.01, 1e4);
      const view = lookAt(cam.cameraPos, cam.lookTarget, cam.upDir);
      const viewProj = mulMat(proj, view);
      this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);
      const cp = cam.cameraPos || [0, 0, 0];
      this.device.queue.writeBuffer(
        this.cameraBuffer,
        64,
        new Float32Array([cp[0] || 0, cp[1] || 0, cp[2] || 0, 1])
      );
    }
    /* -------------------------------------------------------------- */
    /*  Chunks                                                        */
    /* -------------------------------------------------------------- */
    _destroyChunkResources(c) {
      try {
        if (c._modelBuf) c._modelBuf.destroy();
      } catch (e) {
      }
      try {
        if (c._wallInstances) c._wallInstances.destroy();
      } catch (e) {
      }
      try {
        if (c._wallCount) c._wallCount.destroy();
      } catch (e) {
      }
      try {
        if (c._wallDrawArgs) c._wallDrawArgs.destroy();
      } catch (e) {
      }
      delete c._slabTexViewAll;
      delete c._modelBuf;
      delete c._wallInstances;
      delete c._wallCount;
      delete c._wallDrawArgs;
      delete c._bgCompute;
      delete c._bgWalls0;
      delete c._bgWalls1;
      delete c._bgCaps0;
      delete c._bgCaps1;
      delete c._slabMaxWalls;
    }
    _destroyAllChunks() {
      for (const c of this._chunks) this._destroyChunkResources(c);
      this._chunks.length = 0;
    }
    /**
     * @param {Array<object>} chunks
     * @param {number} layers
     */
    async setChunks(chunks = [], layers = 1) {
      this._destroyAllChunks();
      this._chunks = chunks || [];
      this._layers = Math.max(1, layers | 0);
      this._ensureLayerUniforms(this._layers);
      const N = this._chunks.length;
      try {
        if (this._slabComputeUBO) this._slabComputeUBO.destroy();
      } catch (e) {
      }
      this._slabComputeUBO = this.device.createBuffer({
        size: this.uniformStride * Math.max(1, N),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      for (let i = 0; i < this._chunks.length; ++i) {
        const c = this._chunks[i];
        if (!c || !c.fractalTex) continue;
        c._slabTexViewAll = c.fractalTex.createView({
          dimension: "2d-array",
          baseArrayLayer: 0,
          arrayLayerCount: this._layers
        });
        c._modelBuf = this.device.createBuffer({
          size: 4 * 20,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        const step = 1;
        const approxCells = Math.max(0, (c.width - 1) / step) * Math.max(0, (c.height - 1) / step);
        const approxSegs = Math.min(
          this.maxWallsPerChunk,
          Math.max(1024, Math.floor(approxCells * 0.6))
        );
        c._slabMaxWalls = approxSegs >>> 0;
        c._wallInstances = this.device.createBuffer({
          size: c._slabMaxWalls * 32,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        c._wallCount = this.device.createBuffer({
          size: 4,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        c._wallDrawArgs = this.device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        c._bgCompute = this.device.createBindGroup({
          layout: this._computeLayout,
          entries: [
            { binding: 0, resource: c._slabTexViewAll },
            {
              binding: 1,
              resource: {
                buffer: this._slabComputeUBO,
                size: this.uniformStride
              }
            },
            { binding: 2, resource: { buffer: c._wallInstances } },
            { binding: 3, resource: { buffer: c._wallCount } },
            { binding: 4, resource: { buffer: c._wallDrawArgs } }
          ]
        });
        c._bgWalls0 = this.device.createBindGroup({
          layout: this._wallsBg0Layout,
          entries: [
            { binding: 0, resource: { buffer: this.cameraBuffer } },
            {
              binding: 1,
              resource: { buffer: this._renderUBO, size: this.uniformStride }
            },
            { binding: 2, resource: c._slabTexViewAll },
            { binding: 3, resource: this.sampler }
          ]
        });
        c._bgWalls1 = this.device.createBindGroup({
          layout: this._wallsBg1Layout,
          entries: [
            { binding: 0, resource: { buffer: c._modelBuf } },
            { binding: 1, resource: { buffer: c._wallInstances } }
          ]
        });
        c._bgCaps0 = this.device.createBindGroup({
          layout: this._capsBg0Layout,
          entries: [
            { binding: 0, resource: { buffer: this.cameraBuffer } },
            {
              binding: 1,
              resource: { buffer: this._renderUBO, size: this.uniformStride }
            },
            {
              binding: 2,
              resource: { buffer: this._slabRenderUBO, size: this.uniformStride }
            },
            { binding: 3, resource: c._slabTexViewAll },
            { binding: 4, resource: this.sampler }
          ]
        });
        c._bgCaps1 = this.device.createBindGroup({
          layout: this._capsBg1Layout,
          entries: [{ binding: 0, resource: { buffer: c._modelBuf } }]
        });
      }
    }
    /* -------------------------------------------------------------- */
    /*  Uniform writers                                               */
    /* -------------------------------------------------------------- */
    _writeRenderUniformAt(offsetBytes, paramsState = {}) {
      const defaults = {
        layerIndex: 0,
        scheme: 0,
        dispMode: 0,
        bowlOn: false,
        hueOffset: 0,
        dispAmp: 0.15,
        dispCurve: 3,
        bowlDepth: 0.25,
        quadScale: 1,
        gridSize: 512,
        lightingOn: false,
        dispLimitOn: false,
        lightPos: [0, 0, 5],
        specPower: 32,
        slopeLimit: 0.5,
        wallJump: 0.05,
        alphaMode: 0,
        contourOn: false,
        contourOnly: false,
        contourFront: false,
        worldOffset: 0,
        worldStart: 0,
        thickness: 0.25,
        feather: 0
      };
      const p = Object.assign({}, defaults, paramsState);
      const lp = Array.isArray(p.lightPos) ? p.lightPos : defaults.lightPos;
      let alphaMode = (p.alphaMode ?? 0) >>> 0;
      if (p.contourOn) alphaMode |= 1;
      if (p.contourOnly) alphaMode |= 2;
      if (p.contourFront) alphaMode |= 4;
      const buf = new ArrayBuffer(this.uniformStride);
      const dv = new DataView(buf);
      let o = 0;
      dv.setUint32(o, p.layerIndex >>> 0, true);
      o += 4;
      dv.setUint32(o, p.scheme >>> 0, true);
      o += 4;
      dv.setUint32(o, p.dispMode >>> 0, true);
      o += 4;
      dv.setUint32(o, p.bowlOn ? 1 : 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.hueOffset) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.dispAmp) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.dispCurve) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.bowlDepth) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.quadScale) || 1, true);
      o += 4;
      dv.setFloat32(o, Number(p.gridSize) || 512, true);
      o += 4;
      dv.setUint32(o, p.lightingOn ? 1 : 0, true);
      o += 4;
      dv.setUint32(o, p.dispLimitOn ? 1 : 0, true);
      o += 4;
      dv.setFloat32(o, Number(lp[0] ?? 0), true);
      o += 4;
      dv.setFloat32(o, Number(lp[1] ?? 0), true);
      o += 4;
      dv.setFloat32(o, Number(lp[2] ?? 0), true);
      o += 4;
      dv.setFloat32(o, Number(p.specPower) || 32, true);
      o += 4;
      dv.setFloat32(o, Number(p.slopeLimit) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.wallJump) || 0, true);
      o += 4;
      dv.setUint32(o, alphaMode >>> 0, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.worldOffset) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.worldStart) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.thickness) || 0.25, true);
      o += 4;
      dv.setFloat32(o, Number(p.feather) || 0, true);
      o += 4;
      this.device.queue.writeBuffer(this._renderUBO, offsetBytes >>> 0, buf);
    }
    _writeSlabRenderUniformAt(offsetBytes, paramsState = {}) {
      const defaults = {
        layerIndex: 0,
        fieldMode: 0,
        useBand: 0,
        meshStep: 1,
        iso: 0.5,
        bandLow: 0.25,
        bandHigh: 0.75,
        capBias: 0,
        quadScale: 1,
        dispAmp: 0.15,
        dispCurve: 3,
        dispMode: 1,
        gradScale: 1
      };
      const p = Object.assign({}, defaults, paramsState);
      const buf = new ArrayBuffer(this.uniformStride);
      const dv = new DataView(buf);
      let o = 0;
      dv.setUint32(o, p.layerIndex >>> 0, true);
      o += 4;
      dv.setUint32(o, p.fieldMode >>> 0, true);
      o += 4;
      dv.setUint32(o, p.useBand ? 1 : 0, true);
      o += 4;
      dv.setUint32(o, p.meshStep >>> 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.iso) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.bandLow) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.bandHigh) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.capBias) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.quadScale) || 1, true);
      o += 4;
      dv.setFloat32(o, Number(p.dispAmp) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.dispCurve) || 0, true);
      o += 4;
      dv.setUint32(o, p.dispMode >>> 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.gradScale) || 0, true);
      o += 4;
      this.device.queue.writeBuffer(this._slabRenderUBO, offsetBytes >>> 0, buf);
    }
    _writeSlabComputeUniformAt(offsetBytes, paramsState, layerIndex, maxWalls, offX, offY, chunkW, chunkH) {
      const defaults = {
        fieldMode: 0,
        useBand: 0,
        meshStep: 1,
        iso: 0.5,
        bandLow: 0.25,
        bandHigh: 0.75,
        capBias: 0,
        quadScale: 1,
        dispAmp: 0.15,
        dispCurve: 3,
        dispMode: 1,
        gradScale: 1
      };
      const p = Object.assign({}, defaults, paramsState);
      const buf = new ArrayBuffer(this.uniformStride);
      const dv = new DataView(buf);
      let o = 0;
      dv.setUint32(o, layerIndex >>> 0, true);
      o += 4;
      dv.setUint32(o, p.fieldMode >>> 0, true);
      o += 4;
      dv.setUint32(o, p.useBand ? 1 : 0, true);
      o += 4;
      dv.setUint32(o, (p.meshStep ?? 1) >>> 0, true);
      o += 4;
      dv.setUint32(o, (offX ?? 0) >>> 0, true);
      o += 4;
      dv.setUint32(o, (offY ?? 0) >>> 0, true);
      o += 4;
      dv.setUint32(o, (chunkW ?? 0) >>> 0, true);
      o += 4;
      dv.setUint32(o, (chunkH ?? 0) >>> 0, true);
      o += 4;
      dv.setUint32(o, maxWalls >>> 0, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      dv.setUint32(o, 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.iso) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.bandLow) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.bandHigh) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.capBias) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.quadScale) || 1, true);
      o += 4;
      dv.setFloat32(o, Number(p.dispAmp) || 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.dispCurve) || 0, true);
      o += 4;
      dv.setUint32(o, p.dispMode >>> 0, true);
      o += 4;
      dv.setFloat32(o, Number(p.gradScale) || 0, true);
      o += 4;
      this.device.queue.writeBuffer(this._slabComputeUBO, offsetBytes >>> 0, buf);
    }
    _prepareWallsForLayer(layerIndex, slabParams) {
      const N = this._chunks.length;
      if (!N || !this._slabComputeUBO) return 1;
      const step = Math.max(1, (slabParams.meshStep ?? 1) | 0);
      for (let i = 0; i < N; ++i) {
        const c = this._chunks[i];
        if (!c || !c._bgCompute) continue;
        const offX = (c.offsetX ?? 0) | 0;
        const offY = (c.offsetY ?? 0) | 0;
        const chunkW = (c.width ?? 0) | 0;
        const chunkH = (c.height ?? 0) | 0;
        this._writeSlabComputeUniformAt(
          i * this.uniformStride,
          slabParams,
          layerIndex >>> 0,
          c._slabMaxWalls >>> 0,
          offX >>> 0,
          offY >>> 0,
          chunkW >>> 0,
          chunkH >>> 0
        );
        this.device.queue.writeBuffer(c._wallCount, 0, new Uint32Array([0]));
        this.device.queue.writeBuffer(
          c._wallDrawArgs,
          0,
          new Uint32Array([6, 0, 0, 0])
        );
      }
      return step;
    }
    /* -------------------------------------------------------------- */
    /*  Model buffers                                                 */
    /* -------------------------------------------------------------- */
    _updateModels(paramsState) {
      const quadScale = Number(paramsState.quadScale ?? 1);
      let atlasW = 0;
      let atlasH = 0;
      if (paramsState.atlasW != null || paramsState.atlasH != null) {
        atlasW = Math.max(0, (paramsState.atlasW ?? 0) | 0);
        atlasH = Math.max(0, (paramsState.atlasH ?? 0) | 0);
      } else {
        for (let i = 0; i < this._chunks.length; ++i) {
          const c = this._chunks[i];
          if (!c) continue;
          const offX = (c.offsetX ?? 0) | 0;
          const offY = (c.offsetY ?? 0) | 0;
          const w = (c.width ?? 0) | 0;
          const h = (c.height ?? 0) | 0;
          atlasW = Math.max(atlasW, offX + w);
          atlasH = Math.max(atlasH, offY + h);
        }
      }
      atlasW = Math.max(2, atlasW | 0);
      atlasH = Math.max(2, atlasH | 0);
      const denomX = Math.max(1, atlasW - 1);
      const denomY = Math.max(1, atlasH - 1);
      const texelWorldX = 2 * quadScale / denomX;
      const texelWorldY = 2 * quadScale / denomY;
      for (let i = 0; i < this._chunks.length; ++i) {
        const info = this._chunks[i];
        if (!info || !info._modelBuf) continue;
        const offX = (info.offsetX ?? 0) | 0;
        const offY = (info.offsetY ?? 0) | 0;
        const wPts = Math.max(1, (info.width ?? 0) | 0);
        const hPts = Math.max(1, (info.height ?? 0) | 0);
        const wSpan = Math.max(0, wPts - 1);
        const hSpan = Math.max(0, hPts - 1);
        const w = wSpan * texelWorldX;
        const h = hSpan * texelWorldY;
        const x = -quadScale + offX * texelWorldX;
        const y = -quadScale + offY * texelWorldY;
        const modelMat = new Float32Array([
          w,
          0,
          0,
          0,
          0,
          h,
          0,
          0,
          0,
          0,
          1,
          0,
          x,
          y,
          0,
          1
        ]);
        const u0 = offX / denomX;
        const v0 = offY / denomY;
        const su = wSpan / denomX;
        const sv = hSpan / denomY;
        const uvOS = new Float32Array([u0, v0, su, sv]);
        this.device.queue.writeBuffer(info._modelBuf, 0, modelMat);
        this.device.queue.writeBuffer(info._modelBuf, 64, uvOS);
      }
    }
    /* -------------------------------------------------------------- */
    /*  Compute walls                                                 */
    /* -------------------------------------------------------------- */
    _prepareWallsForLayer(layerIndex, slabParams) {
      const N = this._chunks.length;
      if (!N || !this._slabComputeUBO) return 1;
      const step = Math.max(1, (slabParams.meshStep ?? 1) | 0);
      for (let i = 0; i < N; ++i) {
        const c = this._chunks[i];
        if (!c || !c._bgCompute) continue;
        const offX = (c.offsetX ?? 0) | 0;
        const offY = (c.offsetY ?? 0) | 0;
        const chunkW = (c.width ?? 0) | 0;
        const chunkH = (c.height ?? 0) | 0;
        this._writeSlabComputeUniformAt(
          i * this.uniformStride,
          slabParams,
          layerIndex >>> 0,
          (c._slabMaxWalls ?? 0) >>> 0,
          offX >>> 0,
          offY >>> 0,
          chunkW >>> 0,
          chunkH >>> 0
        );
        this.device.queue.writeBuffer(c._wallCount, 0, new Uint32Array([0]));
        this.device.queue.writeBuffer(
          c._wallDrawArgs,
          0,
          new Uint32Array([6, 0, 0, 0])
        );
      }
      return step;
    }
    _encodeComputeWallsPass(encoder, step) {
      const N = this._chunks.length;
      if (!N) return;
      const pass = encoder.beginComputePass();
      pass.setPipeline(this._computeBuild);
      for (let i = 0; i < N; ++i) {
        const c = this._chunks[i];
        if (!c || !c._bgCompute) continue;
        const w = (c.width ?? 0) | 0;
        const h = (c.height ?? 0) | 0;
        const cellsX = Math.max(0, Math.floor((w - 1) / step));
        const cellsY = Math.max(0, Math.floor((h - 1) / step));
        if (cellsX <= 0 || cellsY <= 0) continue;
        pass.setBindGroup(0, c._bgCompute, [i * this.uniformStride]);
        pass.dispatchWorkgroups(Math.ceil(cellsX / 8), Math.ceil(cellsY / 8), 1);
      }
      pass.setPipeline(this._computeFinalize);
      for (let i = 0; i < N; ++i) {
        const c = this._chunks[i];
        if (!c || !c._bgCompute) continue;
        pass.setBindGroup(0, c._bgCompute, [i * this.uniformStride]);
        pass.dispatchWorkgroups(1, 1, 1);
      }
      pass.end();
    }
    /**
     * @param {number} layerIndex
     * @param {object} slabParams
     */
    async computeWallsForLayer(layerIndex, slabParams = {}) {
      const N = this._chunks.length;
      if (!N) return;
      const step = this._prepareWallsForLayer(layerIndex, slabParams);
      const encoder = this.device.createCommandEncoder();
      this._encodeComputeWallsPass(encoder, step);
      this.device.queue.submit([encoder.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    }
    async compute(layerIndex, slabParams = {}) {
      await this.computeWallsForLayer(layerIndex, slabParams);
    }
    _encodeComputeWallsPass(encoder, step) {
      const N = this._chunks.length;
      if (!N) return;
      const pass = encoder.beginComputePass();
      pass.setPipeline(this._computeBuild);
      for (let i = 0; i < N; ++i) {
        const c = this._chunks[i];
        if (!c || !c._bgCompute) continue;
        const w = c.width | 0;
        const h = c.height | 0;
        const cellsX = Math.max(0, Math.floor((w - 1) / step));
        const cellsY = Math.max(0, Math.floor((h - 1) / step));
        if (cellsX <= 0 || cellsY <= 0) continue;
        pass.setBindGroup(0, c._bgCompute, [i * this.uniformStride]);
        pass.dispatchWorkgroups(Math.ceil(cellsX / 8), Math.ceil(cellsY / 8), 1);
      }
      pass.setPipeline(this._computeFinalize);
      for (let i = 0; i < N; ++i) {
        const c = this._chunks[i];
        if (!c || !c._bgCompute) continue;
        pass.setBindGroup(0, c._bgCompute, [i * this.uniformStride]);
        pass.dispatchWorkgroups(1, 1, 1);
      }
      pass.end();
    }
    /**
     * @param {number} layerIndex
     * @param {object} slabParams
     */
    async computeWallsForLayer(layerIndex, slabParams = {}) {
      const N = this._chunks.length;
      if (!N) return;
      const step = this._prepareWallsForLayer(layerIndex, slabParams);
      const encoder = this.device.createCommandEncoder();
      this._encodeComputeWallsPass(encoder, step);
      this.device.queue.submit([encoder.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    }
    async compute(layerIndex, slabParams = {}) {
      await this.computeWallsForLayer(layerIndex, slabParams);
    }
    /* -------------------------------------------------------------- */
    /*  Render                                                        */
    /* -------------------------------------------------------------- */
    /**
     * @param {object} paramsState
     * @param {object} camState
     * @param {object} [opts]
     * @param {boolean} [opts.runCompute=true]
     * @param {number} [opts.layers]
     */
    async render(paramsState, camState, opts = {}) {
      this._rendering = true;
      try {
        if (this._pendingResize) {
          const [cw2, ch2] = this._pendingResize;
          this._pendingResize = null;
          this._applyResize(cw2, ch2);
        }
        const cw = this._lastCanvasSize[0] | 0;
        const ch = this._lastCanvasSize[1] | 0;
        const aspect = cw > 0 && ch > 0 ? cw / ch : 1;
        this.updateCamera(camState, aspect);
        const nLayers = Math.max(
          1,
          Math.floor(
            opts.layers ?? paramsState.nLayers ?? paramsState.layers ?? this._layers ?? 1
          )
        );
        this._ensureLayerUniforms(nLayers);
        this._updateModels(paramsState);
        const orderedLayers = [];
        for (let l = nLayers - 1; l >= 0; --l) orderedLayers.push(l);
        if (opts.runCompute !== false) {
          for (const layer of orderedLayers) {
            await this.computeWallsForLayer(layer, paramsState);
          }
        }
        for (const layer of orderedLayers) {
          const off = layer * this.uniformStride;
          this._writeRenderUniformAt(
            off,
            Object.assign({}, paramsState, { layerIndex: layer })
          );
          this._writeSlabRenderUniformAt(
            off,
            Object.assign({}, paramsState, { layerIndex: layer })
          );
        }
        const viewTex = this.context.getCurrentTexture().createView();
        const depthView = this.depthTexture.createView();
        const encoder = this.device.createCommandEncoder();
        const rpass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: viewTex,
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }
          ],
          depthStencilAttachment: {
            view: depthView,
            depthLoadOp: "clear",
            depthStoreOp: "store",
            depthClearValue: 1
          }
        });
        for (const layer of orderedLayers) {
          const off = layer * this.uniformStride;
          const feather = Number(paramsState.feather ?? 0);
          const capPipe = feather > 0 ? this._capsPipelineBlend : this._capsPipelineOpaque;
          rpass.setPipeline(capPipe);
          for (let i = 0; i < this._chunks.length; ++i) {
            const c = this._chunks[i];
            if (!c || !c._bgCaps0) continue;
            rpass.setBindGroup(0, c._bgCaps0, [off, off]);
            rpass.setBindGroup(1, c._bgCaps1);
            rpass.draw(6, 2, 0, 0);
          }
          rpass.setPipeline(this._wallsPipeline);
          for (let i = 0; i < this._chunks.length; ++i) {
            const c = this._chunks[i];
            if (!c || !c._bgWalls0) continue;
            rpass.setBindGroup(0, c._bgWalls0, [off]);
            rpass.setBindGroup(1, c._bgWalls1);
            rpass.drawIndirect(c._wallDrawArgs, 0);
          }
        }
        rpass.end();
        this.device.queue.submit([encoder.finish()]);
        await this.device.queue.onSubmittedWorkDone();
        this._flushDeferredDestroy();
      } finally {
        this._rendering = false;
      }
    }
    /* -------------------------------------------------------------- */
    /*  Cleanup                                                       */
    /* -------------------------------------------------------------- */
    destroy() {
      try {
        if (this.depthTexture) this.depthTexture.destroy();
      } catch (e) {
      }
      this.depthTexture = null;
      for (const t of this._deferredDestroy) {
        try {
          t.destroy();
        } catch (e) {
        }
      }
      this._deferredDestroy = [];
      try {
        if (this._slabComputeUBO) this._slabComputeUBO.destroy();
      } catch (e) {
      }
      this._slabComputeUBO = null;
      try {
        if (this._renderUBO) this._renderUBO.destroy();
      } catch (e) {
      }
      this._renderUBO = null;
      try {
        if (this._slabRenderUBO) this._slabRenderUBO.destroy();
      } catch (e) {
      }
      this._slabRenderUBO = null;
      try {
        if (this.cameraBuffer) this.cameraBuffer.destroy();
      } catch (e) {
      }
      this._destroyAllChunks();
      this._pipeCache.clear();
    }
  };
  var fSlabCompute_default = SlabMeshPipelineGPU;

  // render.js
  var RenderPipelineGPU2 = RenderPipelineGPU || fractalRender_default;
  var renderGlobals = {
    computeDirty: true,
    cameraDirty: true,
    displacementDirty: true,
    gridDirty: true,
    paramsState: {
      gridSize: 1542,
      splitCount: 8e6,
      layerIndex: 0,
      layers: 100,
      nLayers: 1,
      renderMode: "fractal",
      layerMode: false,
      maxIter: 150,
      fractalType: 0,
      // scaleOps is the ordered ops list (duplicates allowed). scaleMode is the legacy bitmask union.
      // Default keeps old behavior: Multiply only.
      scaleOps: [1],
      scaleMode: 1,
      zoom: 4,
      dx: 0,
      dy: 0,
      escapeR: 4,
      zMin: 0,
      dz: 0.01,
      gamma: 1,
      // stepped gamma across layers
      // - if layerGammaStep != 0: gamma(li) steps across layers; base gamma is treated as the floor
      // - else if layerGammaRange != 0: gamma ramps by range; base gamma is treated as the floor
      // - else: optional ramp toward layerGammaStart but clamped so base gamma remains the floor
      layerGammaStart: 1,
      layerGammaStep: 1e-3,
      layerGammaRange: 0,
      epsilon: 1e-6,
      convergenceTest: false,
      escapeMode: 0,
      scheme: 0,
      hueOffset: 0,
      gridDivs: 256,
      dispMode: 0,
      dispAmp: 0.15,
      dispCurve: 3,
      dispLimitOn: false,
      slopeLimit: 0.5,
      wallJump: 0.05,
      bowlOn: false,
      bowlDepth: 0.25,
      quadScale: 1,
      worldOffset: 0,
      worldStart: 0,
      lightingOn: false,
      lightPos: [0, 0, 5],
      specPower: 32,
      lowT: 0,
      highT: 1,
      alphaMode: 0,
      basis: 0,
      normalMode: 2,
      // slab renderer knobs (optional, safe defaults)
      fieldMode: 0,
      meshStep: 1,
      capBias: 0,
      gradScale: 1,
      thickness: 0.25,
      feather: 0,
      // slab contour debug toggles (packed into slab alphaMode bits)
      contourOn: true,
      contourOnly: true,
      contourFront: true
    }
  };
  var F = { C: 1, D: 2, R: 4, G: 8 };
  var DIRTY_MAP = {
    gridSize: F.C | F.D,
    splitCount: F.C | F.D,
    layers: F.C,
    nLayers: F.C,
    layerIndex: F.C,
    maxIter: F.C,
    fractalType: F.C,
    // new ordered list (duplicates allowed)
    scaleOps: F.C,
    // legacy union bitmask (still supported for backward compat)
    scaleMode: F.C,
    zoom: F.C,
    dx: F.C,
    dy: F.C,
    escapeR: F.C,
    zMin: F.C,
    dz: F.C,
    gamma: F.C,
    layerGammaStart: F.C,
    layerGammaStep: F.C,
    layerGammaRange: F.C,
    epsilon: F.C,
    convergenceTest: F.C,
    escapeMode: F.C,
    renderMode: F.R | F.D,
    // toggling layerMode must force: recompute (layer count changes), SDF teardown, and render rebind
    layerMode: F.C | F.D | F.R,
    dispAmp: F.D,
    dispMode: F.D,
    dispCurve: F.D,
    wallJump: F.D,
    quadScale: F.D | F.R,
    bowlOn: F.D | F.R,
    bowlDepth: F.D | F.R,
    connectivityMode: F.D,
    normalMode: F.D,
    slopeLimit: F.D,
    // these affect the layer-space sampling and must trigger fractal compute as well
    worldOffset: F.C | F.D | F.R,
    worldStart: F.C | F.D | F.R,
    hueOffset: F.R,
    scheme: F.R,
    colorScheme: F.R,
    lightingOn: F.R | F.D,
    lightPos: F.R,
    specPower: F.R,
    dispLimitOn: F.R,
    gridDivs: F.R | F.G,
    lowT: F.R | F.D,
    highT: F.R | F.D,
    basis: F.R | F.D,
    alphaMode: F.R | F.G,
    // slab renderer knobs
    fieldMode: F.D,
    meshStep: F.D,
    capBias: F.D,
    gradScale: F.D,
    thickness: F.R,
    feather: F.R,
    // slab contour debug toggles
    contourOn: F.R,
    contourOnly: F.R,
    contourFront: F.R
  };
  var pending = { paramsState: {} };
  var dirtyBits = 0;
  var hasPending = false;
  function setState(partial) {
    if (!partial || typeof partial !== "object") return;
    Object.assign(pending.paramsState, partial);
    hasPending = true;
    for (const k in partial) {
      const bits = DIRTY_MAP[k];
      dirtyBits |= bits != null ? bits : F.R;
    }
  }
  var MAX_SCALE_OPS = 16;
  var _SCALE_OP_BITS = [
    1,
    // 1 Multiply
    2,
    // 2 Divide
    4,
    // 3 Sine
    8,
    // 4 Tangent
    16,
    // 5 Cosine
    32,
    // 6 Exp-Zoom
    64,
    // 7 Log-Shrink
    128,
    // 8 Aniso Warp
    256,
    // 9 Rotate
    512,
    // 10 Radial Twist
    1024,
    // 11 HyperWarp
    2048,
    // 12 RadialHyper
    4096,
    // 13 Swirl
    8192,
    // 14 Modular
    16384,
    // 15 AxisSwap
    32768,
    // 16 MixedWarp
    65536,
    // 17 Jitter
    131072,
    // 18 PowerWarp
    262144
    // 19 SmoothFade
  ];
  function _isValidScaleOpCode(n) {
    n = n | 0;
    return n >= 1 && n <= _SCALE_OP_BITS.length;
  }
  function _normScaleOps(raw) {
    if (!raw) return [];
    let a = raw;
    if (typeof raw === "string") {
      const s = raw.trim();
      if (!s) return [];
      a = s.split(",").map((x) => x.trim());
    }
    if (!Array.isArray(a)) return [];
    const out = [];
    for (let i = 0; i < a.length && out.length < MAX_SCALE_OPS; ++i) {
      const v = a[i];
      const n = typeof v === "number" ? v : Number(String(v).trim());
      if (!Number.isFinite(n)) continue;
      const c = n | 0;
      if (_isValidScaleOpCode(c)) out.push(c);
    }
    return out;
  }
  function _scaleModeMaskFromOps(ops) {
    let m = 0;
    for (let i = 0; i < ops.length; ++i) {
      const c = ops[i] | 0;
      if (_isValidScaleOpCode(c)) m |= _SCALE_OP_BITS[c - 1] | 0;
    }
    return m >>> 0;
  }
  function _opsFromScaleModeMask(mask) {
    const m = Number(mask) >>> 0 | 0;
    if (!m) return [];
    const out = [];
    for (let code = 1; code <= _SCALE_OP_BITS.length && out.length < MAX_SCALE_OPS; ++code) {
      const bit = _SCALE_OP_BITS[code - 1] | 0;
      if (m & bit) out.push(code);
    }
    return out;
  }
  function normalizeScaleArgsInParams(ps) {
    if (!ps || typeof ps !== "object") return;
    const hasOps = Array.isArray(ps.scaleOps) || typeof ps.scaleOps === "string";
    const hasMask = ps.scaleMode !== void 0 && ps.scaleMode !== null;
    if (hasOps) {
      const ops = _normScaleOps(ps.scaleOps);
      ps.scaleOps = ops;
      ps.scaleMode = _scaleModeMaskFromOps(ops);
      return;
    }
    if (hasMask) {
      const ops = _opsFromScaleModeMask(ps.scaleMode);
      ps.scaleOps = ops;
      ps.scaleMode = _scaleModeMaskFromOps(ops);
      return;
    }
    ps.scaleOps = [];
    ps.scaleMode = 0;
  }
  function cloneParamsForCompute(baseParams, overrides) {
    const p = Object.assign({}, baseParams || null, overrides || null);
    if (Array.isArray(p.lightPos))
      p.lightPos = [p.lightPos[0] || 0, p.lightPos[1] || 0, p.lightPos[2] || 0];
    normalizeScaleArgsInParams(p);
    if (Array.isArray(p.scaleOps)) p.scaleOps = p.scaleOps.slice(0);
    return p;
  }
  function flushPending() {
    if (!hasPending) return;
    const ps = renderGlobals.paramsState;
    const prevLayerMode = !!ps.layerMode;
    Object.assign(ps, pending.paramsState);
    pending.paramsState = {};
    hasPending = false;
    normalizeScaleArgsInParams(ps);
    const nextLayerMode = !!ps.layerMode;
    if (nextLayerMode && !prevLayerMode) {
      ps.dispMode = 0;
      ps.lightingOn = false;
      const rm = (ps.renderMode == null ? "" : String(ps.renderMode)).trim().toLowerCase();
      if (rm === "slab" || rm === "1") ps.renderMode = "fractal";
      renderGlobals.computeDirty = true;
      renderGlobals.displacementDirty = true;
      renderGlobals.cameraDirty = true;
    }
    renderGlobals.computeDirty ||= !!(dirtyBits & F.C);
    renderGlobals.displacementDirty ||= !!(dirtyBits & F.D);
    renderGlobals.cameraDirty ||= !!(dirtyBits & F.R);
    renderGlobals.gridDirty ||= !!(dirtyBits & F.G);
    dirtyBits = 0;
  }
  function _safeGamma(g) {
    const x = Number.isFinite(+g) ? +g : 1;
    return x;
  }
  function requestedLayersFromParams(params) {
    const p = params || renderGlobals.paramsState;
    if (!p || !p.layerMode) return 1;
    const raw = p.nLayers ?? p.layers ?? 1;
    const n = Math.floor(Number(raw) || 0);
    return Math.max(1, n);
  }
  function resolveGammaSeries(params, count) {
    const p = params || {};
    const baseGamma = _safeGamma(Number.isFinite(+p.gamma) ? +p.gamma : 1);
    if (count <= 1) return { gammaStart: baseGamma, gammaRange: 0 };
    const step = Number.isFinite(+p.layerGammaStep) ? +p.layerGammaStep : 0;
    const rangeExplicit = Number.isFinite(+p.layerGammaRange) ? +p.layerGammaRange : 0;
    const gStartRaw = Number.isFinite(+p.layerGammaStart) ? +p.layerGammaStart : baseGamma;
    if (step !== 0) {
      const total2 = step * (count - 1);
      const gammaStart = total2 >= 0 ? baseGamma : baseGamma - total2;
      return { gammaStart, gammaRange: total2 };
    }
    if (rangeExplicit !== 0) {
      const total2 = rangeExplicit;
      const gammaStart = total2 >= 0 ? baseGamma : baseGamma - total2;
      return { gammaStart, gammaRange: total2 };
    }
    const target = _safeGamma(gStartRaw);
    const clampedTarget = target >= baseGamma ? target : baseGamma;
    const total = clampedTarget - baseGamma;
    return { gammaStart: baseGamma, gammaRange: total };
  }
  function gammaForLayerIndex(gammaStart, gammaRange, li, count) {
    if (count <= 1) return _safeGamma(gammaStart);
    const denom = count - 1;
    const t = denom > 0 ? li / denom : 0;
    return _safeGamma(gammaStart + t * gammaRange);
  }
  function needsSdf(params) {
    const p = params || renderGlobals.paramsState;
    return !!(p.dispMode && p.dispMode !== 0) || !!p.lightingOn;
  }
  async function initWebGPU() {
    if (!navigator.gpu) {
      alert("WebGPU not supported");
      throw new Error("WebGPU not supported");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      alert("No GPU adapter found");
      throw new Error("No GPU adapter");
    }
    const device = await adapter.requestDevice();
    return device;
  }
  function _pickFn(obj, names) {
    for (let i = 0; i < names.length; i++) {
      const k = names[i];
      const fn = obj && obj[k];
      if (typeof fn === "function") return fn.bind(obj);
    }
    return null;
  }
  function _assertPipelineApi(renderPipeline) {
    if (!renderPipeline) throw new Error("Render pipeline missing");
    const hasSetChunks = typeof renderPipeline.setChunks === "function";
    if (!hasSetChunks)
      throw new TypeError("renderPipeline.setChunks is not a function");
    const hasRender = typeof renderPipeline.render === "function" || typeof renderPipeline.renderFrame === "function" || typeof renderPipeline.draw === "function";
    if (!hasRender && typeof renderPipeline.renderBlitToView !== "function") {
      throw new TypeError(
        "renderPipeline has no render/renderFrame/draw/renderBlitToView"
      );
    }
  }
  async function initRender() {
    const canvas = document.getElementById("gpu-canvas");
    const device = await initWebGPU();
    const context = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    function parseAlphaModeToNumeric(mode) {
      if (mode === void 0 || mode === null)
        return Number(renderGlobals.paramsState.alphaMode || 0);
      if (typeof mode === "number" && Number.isFinite(mode)) {
        const n = Math.floor(mode);
        if (n === 0) return 0;
        if (n === 2) return 2;
        return 1;
      }
      if (typeof mode === "string") {
        const t = mode.trim().toLowerCase();
        if (t === "0" || t === "opaque") return 0;
        if (t === "2") return 2;
        if (t === "1" || t === "fade" || t === "premultiplied") return 1;
        const maybe = parseInt(t, 10);
        if (!Number.isNaN(maybe)) {
          if (maybe === 0) return 0;
          if (maybe === 2) return 2;
          return 1;
        }
        return 1;
      }
      return Number(renderGlobals.paramsState.alphaMode || 0);
    }
    function canvasAlphaStringForNumeric(numericMode) {
      return numericMode === 0 ? "opaque" : "premultiplied";
    }
    function slabAlphaBitsFromParams(params) {
      let bits = 0;
      if (params && params.contourOn) bits |= 1;
      if (params && params.contourOnly) bits |= 2;
      if (params && params.contourFront) bits |= 4;
      return bits >>> 0;
    }
    const initialNumeric = typeof window !== "undefined" && window.__pendingAlphaMode !== void 0 ? parseAlphaModeToNumeric(window.__pendingAlphaMode) : parseAlphaModeToNumeric(renderGlobals.paramsState.alphaMode);
    renderGlobals.paramsState.alphaMode = initialNumeric;
    let currentAlphaMode = canvasAlphaStringForNumeric(initialNumeric);
    if (typeof window !== "undefined")
      window.__currentCanvasAlphaMode = currentAlphaMode;
    const uniformStride = 256;
    const MAX_PIXELS_PER_CHUNK = 8e6;
    const MIN_SPLIT = 1024;
    let yaw = 0;
    let pitch = 0;
    const cameraPos = [0, 0, 2.4];
    const lookTarget = [0, 0, 0];
    const upDir = [0, 1, 0];
    let fov = 45 * Math.PI / 180;
    let invertMouseY = true;
    const mouseSens = 2e-3;
    function updateLookTarget() {
      const dx = Math.cos(pitch) * Math.sin(yaw);
      const dy = Math.sin(pitch);
      const dz = -Math.cos(pitch) * Math.cos(yaw);
      lookTarget[0] = cameraPos[0] + dx;
      lookTarget[1] = cameraPos[1] + dy;
      lookTarget[2] = cameraPos[2] + dz;
      renderGlobals.cameraDirty = true;
    }
    const fractalCompute = new FractalTileComputeGPU(
      device,
      void 0,
      void 0,
      uniformStride
    );
    const sdfCompute = new SdfComputeGPU(device, uniformStride);
    const renderPipeline = new RenderPipelineGPU2(
      device,
      context,
      void 0,
      void 0,
      {
        renderUniformStride: 256,
        initialGridDivs: renderGlobals.paramsState.gridDivs,
        quadScale: renderGlobals.paramsState.quadScale,
        canvasAlphaMode: currentAlphaMode,
        invertCameraY: false
      }
    );
    _assertPipelineApi(renderPipeline);
    const slabPipeline = new fSlabCompute_default(device, context, {
      uniformStride,
      canvasAlphaMode: currentAlphaMode
    });
    const queryCompute = new QueryComputeGPU(
      device,
      void 0,
      renderPipeline.sampler,
      renderPipeline.renderUniformBuffer,
      { uniformQuerySize: 16, queryResultBytes: 280 }
    );
    const rpWriteRenderUniform = _pickFn(renderPipeline, [
      "writeRenderUniform",
      "writeRenderUniforms",
      "writeUniforms"
    ]);
    const rpWriteThreshUniform = _pickFn(renderPipeline, [
      "writeThreshUniform",
      "writeThresholdUniform",
      "writeThresh",
      "writeThreshold"
    ]);
    const rpRenderFn = _pickFn(renderPipeline, ["render", "renderFrame", "draw"]);
    const rpBlitFn = _pickFn(renderPipeline, ["renderBlitToView"]);
    const rpRenderToView = _pickFn(renderPipeline, ["renderToView"]);
    let chunkInfos = [];
    let sdfReady = false;
    let slabWallsDirty = true;
    let _slabSetChunksSrc = null;
    let _slabSetChunksLayers = 0;
    let resizeTimer = 0;
    let frameHandle = 0;
    let exporting = false;
    let _noSdfCacheSrc = null;
    let _noSdfCache = null;
    let _withSdfCacheSrc = null;
    let _withSdfCache = null;
    let _sdfAllocEpoch = 0;
    function invalidateChunkCaches() {
      _noSdfCacheSrc = null;
      _noSdfCache = null;
      _withSdfCacheSrc = null;
      _withSdfCache = null;
    }
    function requestedLayers() {
      return requestedLayersFromParams(renderGlobals.paramsState);
    }
    function availableFractalLayers(chunks = []) {
      if (!Array.isArray(chunks) || chunks.length === 0) return 1;
      let maxLayers = 1;
      for (const c of chunks) {
        const a = Array.isArray(c.fractalLayerViews) && c.fractalLayerViews || Array.isArray(c.layerViews) && c.layerViews || Array.isArray(c.fractalViews) && c.fractalViews || null;
        if (a && a.length) maxLayers = Math.max(maxLayers, a.length);
        else if (c.fractalView) maxLayers = Math.max(maxLayers, 1);
      }
      return Math.max(1, maxLayers);
    }
    function clampLayerIndex(li, n) {
      const nn = Math.max(1, n | 0);
      const x = Number.isFinite(+li) ? +li | 0 : 0;
      if (x < 0) return 0;
      if (x >= nn) return nn - 1;
      return x;
    }
    function normalizeFractalChunkLayers(chunks, count) {
      if (!Array.isArray(chunks) || chunks.length === 0) return;
      const n = Math.max(1, count | 0);
      for (const c of chunks) {
        let views = Array.isArray(c.fractalLayerViews) && c.fractalLayerViews || Array.isArray(c.layerViews) && c.layerViews || Array.isArray(c.fractalViews) && c.fractalViews || null;
        if (!views && c.fractalView) views = [c.fractalView];
        if (!Array.isArray(views)) views = views ? [views] : [];
        if (n > 1) {
          const base = views[0] || c.fractalView || null;
          const arr = new Array(n);
          for (let i = 0; i < n; i++) arr[i] = views[i] || base;
          c.fractalLayerViews = arr;
          c.layerViews = arr;
          c.fractalView = c.fractalView || arr[0] || null;
        } else {
          const one = views[0] || c.fractalView || null;
          c.fractalLayerViews = [one].filter((v) => v != null);
          c.layerViews = c.fractalLayerViews;
          c.fractalView = one;
        }
      }
    }
    function effectiveSplitCount(requestedSplit) {
      const req = Math.max(1, Math.floor(requestedSplit || 0));
      const eff = Math.min(req, MAX_PIXELS_PER_CHUNK);
      if (eff !== req)
        console.debug(
          "splitCount clamped: requested=" + req + ", effective=" + eff
        );
      return eff;
    }
    function normRenderMode(v) {
      const s = (v == null ? "" : String(v)).trim().toLowerCase();
      if (s === "slab" || s === "1") return "slab";
      if (s === "raw" || s === "blit" || s === "debug" || s === "2") return "raw";
      return "fractal";
    }
    function modeNeedsSdf(mode, params = renderGlobals.paramsState) {
      return mode === "fractal" && needsSdf(params);
    }
    async function ensureSlabChunks(layersToUse) {
      if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) return;
      layersToUse = Math.max(1, layersToUse | 0);
      if (_slabSetChunksSrc === chunkInfos && _slabSetChunksLayers === layersToUse)
        return;
      await slabPipeline.setChunks(chunkInfos, layersToUse);
      _slabSetChunksSrc = chunkInfos;
      _slabSetChunksLayers = layersToUse;
    }
    function cleanupTempFallbacks(chunks = []) {
      for (const c of chunks) {
        if (c._tmpSdfTex) {
          try {
            c._tmpSdfTex.destroy();
          } catch {
          }
          delete c._tmpSdfTex;
        }
        if (c._tmpFlagTex) {
          try {
            c._tmpFlagTex.destroy();
          } catch {
          }
          delete c._tmpFlagTex;
        }
        if (c._usingTmpSdfFallback) delete c._usingTmpSdfFallback;
      }
    }
    function chunksWithoutSdf(chunks = []) {
      if (_noSdfCacheSrc === chunks && _noSdfCache) return _noSdfCache;
      const out = (chunks || []).map((c) => {
        const clone = Object.assign({}, c);
        delete clone.sdfView;
        delete clone.sdfLayerViews;
        delete clone.sdfViews;
        delete clone.sdfTex;
        delete clone.sdfTexture;
        delete clone.flagView;
        delete clone.flagLayerViews;
        delete clone.flagViews;
        delete clone.flagTex;
        delete clone.flagTexture;
        delete clone._tmpSdfTex;
        delete clone._tmpFlagTex;
        delete clone._usingTmpSdfFallback;
        return clone;
      });
      _noSdfCacheSrc = chunks;
      _noSdfCache = out;
      return out;
    }
    function chunksWithSdf(chunks = []) {
      if (_withSdfCacheSrc === chunks && _withSdfCache) return _withSdfCache;
      const out = (chunks || []).map((c) => Object.assign({}, c));
      _withSdfCacheSrc = chunks;
      _withSdfCache = out;
      return out;
    }
    function freeSdfData(chunks = []) {
      for (const c of chunks) {
        try {
          if (c.sdfTex) {
            try {
              c.sdfTex.destroy();
            } catch {
            }
          }
        } catch {
        }
        try {
          if (c.flagTex) {
            try {
              c.flagTex.destroy();
            } catch {
            }
          }
        } catch {
        }
        try {
          if (c._tmpSdfTex) {
            try {
              c._tmpSdfTex.destroy();
            } catch {
            }
          }
        } catch {
        }
        try {
          if (c._tmpFlagTex) {
            try {
              c._tmpFlagTex.destroy();
            } catch {
            }
          }
        } catch {
        }
        delete c.sdfView;
        delete c.sdfLayerViews;
        delete c.sdfViews;
        delete c.sdfTex;
        delete c.sdfTexture;
        delete c.flagView;
        delete c.flagLayerViews;
        delete c.flagViews;
        delete c.flagTex;
        delete c.flagTexture;
        delete c._tmpSdfTex;
        delete c._tmpFlagTex;
        delete c._usingTmpSdfFallback;
      }
      sdfReady = false;
      _sdfAllocEpoch = 0;
      invalidateChunkCaches();
    }
    async function computeFractalLayer(layerIndex, aspect = 1) {
      let requested = Math.max(
        1,
        Math.floor(renderGlobals.paramsState.splitCount || 0)
      );
      let eff = Math.min(requested, MAX_PIXELS_PER_CHUNK);
      eff = Math.max(eff, MIN_SPLIT);
      while (true) {
        try {
          const params = cloneParamsForCompute(renderGlobals.paramsState, {
            splitCount: eff,
            nLayers: 1,
            layers: 1,
            layerIndex: 0
          });
          const chunks = await fractalCompute.compute(
            params,
            layerIndex,
            aspect,
            "main",
            1,
            params.scaleOps
          );
          chunkInfos = chunks || [];
          for (const c of chunkInfos) {
            if (!c.fractalView && c.layerViews && c.layerViews[0])
              c.fractalView = c.layerViews[0];
            if (!c.layerViews && c.fractalView) c.layerViews = [c.fractalView];
          }
          sdfReady = false;
          slabWallsDirty = true;
          invalidateChunkCaches();
          if (queryCompute._bgCache) queryCompute._bgCache.clear();
          let bad = false;
          for (const c of chunkInfos) {
            if (typeof c.width === "number" && typeof c.height === "number") {
              const pixels = c.width * c.height;
              if (pixels > MAX_PIXELS_PER_CHUNK) {
                bad = true;
                break;
              }
            }
          }
          if (bad) throw new Error("chunk slice too large");
          _slabSetChunksSrc = null;
          _slabSetChunksLayers = 0;
          return chunkInfos;
        } catch (err) {
          console.warn("computeFractalLayer failed:", err);
          if (eff <= MIN_SPLIT) {
            if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) {
              chunkInfos = [
                {
                  offsetX: 0,
                  offsetY: 0,
                  width: 1,
                  height: 1,
                  fractalTex: device.createTexture({
                    size: [1, 1, 1],
                    format: "rgba8unorm",
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
                  })
                }
              ];
              chunkInfos[0].fractalView = chunkInfos[0].fractalTex.createView({
                dimension: "2d"
              });
              chunkInfos[0].layerViews = [chunkInfos[0].fractalView];
            }
            sdfReady = false;
            slabWallsDirty = true;
            invalidateChunkCaches();
            _slabSetChunksSrc = null;
            _slabSetChunksLayers = 0;
            return chunkInfos;
          }
          const next = Math.max(MIN_SPLIT, Math.floor(eff / 2));
          eff = next === eff ? MIN_SPLIT : next;
        }
      }
    }
    async function computeFractalLayerSeries(count, aspect = 1) {
      count = Math.max(1, count >>> 0);
      const base = cloneParamsForCompute(renderGlobals.paramsState, {
        splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
        nLayers: count,
        layers: count
      });
      const { gammaStart, gammaRange } = resolveGammaSeries(base, count);
      const baseParams = cloneParamsForCompute(base, { gamma: gammaStart });
      let seriesChunks;
      if (typeof fractalCompute.computeLayerSeries === "function") {
        seriesChunks = await fractalCompute.computeLayerSeries(
          baseParams,
          gammaStart,
          gammaRange,
          count,
          aspect,
          "main",
          baseParams.scaleOps
        );
      } else {
        const merged = /* @__PURE__ */ new Map();
        for (let li = 0; li < count; ++li) {
          const g = gammaForLayerIndex(gammaStart, gammaRange, li, count);
          const paramsLi = g === baseParams.gamma ? baseParams : cloneParamsForCompute(baseParams, { gamma: g });
          const chunks = await fractalCompute.compute(
            paramsLi,
            li,
            aspect,
            "main",
            count,
            paramsLi.scaleOps
          );
          for (const c of chunks) {
            const key = `${c.offsetX}|${c.offsetY}|${c.width}|${c.height}`;
            let dst = merged.get(key);
            if (!dst) {
              dst = Object.assign({}, c);
              dst.fractalLayerViews = new Array(count);
              merged.set(key, dst);
            }
            const view = c.fractalView || c.layerViews && c.layerViews[0] || null;
            dst.fractalLayerViews[li] = view;
          }
        }
        seriesChunks = Array.from(merged.values());
      }
      chunkInfos = (seriesChunks || []).map((c) => Object.assign({}, c));
      normalizeFractalChunkLayers(chunkInfos, count);
      sdfReady = false;
      slabWallsDirty = true;
      invalidateChunkCaches();
      _slabSetChunksSrc = null;
      _slabSetChunksLayers = 0;
      if (queryCompute._bgCache) queryCompute._bgCache.clear();
      return chunkInfos;
    }
    async function computeSdfLayer(layerIndex, aspect = 1) {
      if (!Array.isArray(chunkInfos) || chunkInfos.length === 0) {
        sdfReady = false;
        return chunkInfos;
      }
      cleanupTempFallbacks(chunkInfos);
      try {
        const params = cloneParamsForCompute(renderGlobals.paramsState, {
          splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount),
          nLayers: 1,
          layers: 1,
          layerIndex: 0
        });
        const wasReady = sdfReady;
        await sdfCompute.compute(
          chunkInfos,
          params,
          layerIndex,
          aspect,
          params.scaleOps
        );
        await device.queue.onSubmittedWorkDone();
        sdfReady = true;
        const epochNow = (sdfCompute && sdfCompute._allocEpoch) | 0;
        const realloc = epochNow !== (_sdfAllocEpoch | 0);
        _sdfAllocEpoch = epochNow;
        if (!wasReady || realloc) invalidateChunkCaches();
        if (queryCompute._bgCache) queryCompute._bgCache.clear();
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        await renderPipeline.setChunks(chunksWithSdf(chunkInfos), 1, {
          layerIndex: layerIndex >>> 0,
          requireSdf: true
        });
        return chunkInfos;
      } catch (err) {
        sdfReady = false;
        invalidateChunkCaches();
        console.warn("computeSdfLayer: SDF compute failed:", err);
        for (const c of chunkInfos) {
          try {
            if ((c.sdfView || c.sdfLayerViews && c.sdfLayerViews[layerIndex]) && (c.flagView || c.flagLayerViews && c.flagLayerViews[layerIndex])) {
              continue;
            }
            if (!c._tmpSdfTex) {
              c._tmpSdfTex = device.createTexture({
                size: [1, 1, 1],
                format: "rgba16float",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
              });
            }
            if (!c._tmpFlagTex) {
              c._tmpFlagTex = device.createTexture({
                size: [1, 1, 1],
                format: "r32uint",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
              });
            }
            c.sdfView = c._tmpSdfTex.createView({
              dimension: "2d-array",
              baseArrayLayer: 0,
              arrayLayerCount: 1
            });
            c.sdfLayerViews = c.sdfLayerViews || [];
            c.sdfLayerViews[layerIndex] = c.sdfView;
            c.flagView = c._tmpFlagTex.createView({
              dimension: "2d-array",
              baseArrayLayer: 0,
              arrayLayerCount: 1
            });
            c.flagLayerViews = c.flagLayerViews || [];
            c.flagLayerViews[layerIndex] = c.flagView;
            c._usingTmpSdfFallback = true;
          } catch (e2) {
            console.warn(
              "computeSdfLayer: temporary fallback creation failed for chunk:",
              c,
              e2
            );
          }
        }
        try {
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          await renderPipeline.setChunks(chunksWithoutSdf(chunkInfos), 1, {
            layerIndex: layerIndex >>> 0,
            requireSdf: false
          });
        } catch (ebg) {
          console.warn(
            "computeSdfLayer: renderPipeline.setChunks failed even with fallbacks:",
            ebg
          );
        }
        return chunkInfos;
      }
    }
    function _configureContextForCanvasSize() {
      try {
        context.configure({
          device,
          format,
          alphaMode: currentAlphaMode,
          size: [canvas.width, canvas.height],
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
      } catch (e) {
        console.warn("context.configure failed:", e);
      }
    }
    window.setAlphaMode = function setAlphaMode(mode) {
      const numeric = parseAlphaModeToNumeric(mode);
      renderGlobals.paramsState.alphaMode = numeric;
      const newCanvasMode = canvasAlphaStringForNumeric(numeric);
      if (newCanvasMode !== currentAlphaMode) {
        currentAlphaMode = newCanvasMode;
        window.__currentCanvasAlphaMode = currentAlphaMode;
        slabPipeline.canvasAlphaMode = currentAlphaMode;
        renderPipeline.canvasAlphaMode = currentAlphaMode;
        _configureContextForCanvasSize();
        try {
          const cw = canvas.clientWidth;
          const ch = canvas.clientHeight;
          slabPipeline.resize(cw, ch);
          renderPipeline.resize(cw, ch);
        } catch {
        }
      }
      renderGlobals.cameraDirty = true;
      renderGlobals.gridDirty = true;
    };
    window.setInvertMouseY = function setInvertMouseY(v) {
      invertMouseY = !!v;
    };
    async function rebuildForCurrentState(aspect, forceFractalRecompute) {
      const ps = renderGlobals.paramsState;
      const mode = normRenderMode(ps.renderMode);
      const req = requestedLayers();
      ps.layerIndex = clampLayerIndex(ps.layerIndex, req);
      const wantSdf = modeNeedsSdf(mode, ps);
      const sdfSrcLayer = req > 1 ? 0 : ps.layerIndex;
      if (forceFractalRecompute) {
        if (req > 1) {
          await computeFractalLayerSeries(req, aspect);
          const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
          if (mode === "slab") {
            freeSdfData(chunkInfos);
            sdfReady = false;
            await ensureSlabChunks(layersToUse);
            slabWallsDirty = true;
            return;
          }
          if (wantSdf) {
            freeSdfData(chunkInfos);
            sdfReady = false;
            await computeSdfLayer(sdfSrcLayer, aspect);
          } else {
            freeSdfData(chunkInfos);
            sdfReady = false;
          }
          renderPipeline.gridDivs = ps.gridDivs;
          const requireSdf3 = wantSdf && sdfReady;
          await renderPipeline.setChunks(
            requireSdf3 ? chunksWithSdf(chunkInfos) : chunksWithoutSdf(chunkInfos),
            layersToUse,
            {
              layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
              requireSdf: requireSdf3
            }
          );
          return;
        }
        await computeFractalLayer(ps.layerIndex, aspect);
        if (mode === "slab") {
          freeSdfData(chunkInfos);
          sdfReady = false;
          await ensureSlabChunks(1);
          slabWallsDirty = true;
          return;
        }
        if (wantSdf) {
          await computeSdfLayer(ps.layerIndex, aspect);
        } else {
          freeSdfData(chunkInfos);
          sdfReady = false;
        }
        renderPipeline.gridDivs = ps.gridDivs;
        const requireSdf2 = wantSdf && sdfReady;
        await renderPipeline.setChunks(
          requireSdf2 ? chunksWithSdf(chunkInfos) : chunksWithoutSdf(chunkInfos),
          1,
          {
            layerIndex: clampLayerIndex(ps.layerIndex, 1),
            requireSdf: requireSdf2
          }
        );
        return;
      }
      if (req > 1) {
        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
        if (mode === "slab") {
          freeSdfData(chunkInfos);
          sdfReady = false;
          await ensureSlabChunks(layersToUse);
          slabWallsDirty = true;
          return;
        }
        if (wantSdf) {
          await computeSdfLayer(sdfSrcLayer, aspect);
        } else {
          freeSdfData(chunkInfos);
          sdfReady = false;
        }
        renderPipeline.gridDivs = ps.gridDivs;
        const requireSdf2 = wantSdf && sdfReady;
        await renderPipeline.setChunks(
          requireSdf2 ? chunksWithSdf(chunkInfos) : chunksWithoutSdf(chunkInfos),
          layersToUse,
          {
            layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
            requireSdf: requireSdf2
          }
        );
        return;
      }
      if (mode === "slab") {
        freeSdfData(chunkInfos);
        sdfReady = false;
        await ensureSlabChunks(1);
        slabWallsDirty = true;
        return;
      }
      if (wantSdf) {
        await computeSdfLayer(ps.layerIndex, aspect);
      } else {
        freeSdfData(chunkInfos);
        sdfReady = false;
      }
      renderPipeline.gridDivs = ps.gridDivs;
      const requireSdf = wantSdf && sdfReady;
      await renderPipeline.setChunks(
        requireSdf ? chunksWithSdf(chunkInfos) : chunksWithoutSdf(chunkInfos),
        1,
        {
          layerIndex: clampLayerIndex(ps.layerIndex, 1),
          requireSdf
        }
      );
    }
    async function renderFrame() {
      const ps = renderGlobals.paramsState;
      const req = requestedLayers();
      ps.layerIndex = clampLayerIndex(ps.layerIndex, req);
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
      const mode = normRenderMode(ps.renderMode);
      const camState = { cameraPos, lookTarget, upDir, fov };
      if (mode === "slab") {
        const slabBits = slabAlphaBitsFromParams(ps);
        const localParams2 = Object.assign({}, ps, {
          nLayers: layersToUse,
          layers: layersToUse,
          layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
          alphaMode: slabBits
        });
        await ensureSlabChunks(layersToUse);
        await slabPipeline.render(localParams2, camState, {
          runCompute: slabWallsDirty,
          layers: layersToUse
        });
        slabWallsDirty = false;
        return;
      }
      const localParams = Object.assign({}, ps, {
        nLayers: layersToUse,
        layers: layersToUse,
        layerIndex: clampLayerIndex(ps.layerIndex, layersToUse)
      });
      if (rpWriteRenderUniform) rpWriteRenderUniform(localParams);
      if (rpWriteThreshUniform) rpWriteThreshUniform(localParams);
      if (renderGlobals.gridDirty) {
        renderPipeline.gridDivs = ps.gridDivs;
        renderPipeline.gridStripes = null;
        renderGlobals.gridDirty = false;
      }
      const requireSdf = modeNeedsSdf(mode, ps) && sdfReady;
      const chunksToUse = requireSdf ? chunksWithSdf(chunkInfos) : chunksWithoutSdf(chunkInfos);
      await renderPipeline.setChunks(chunksToUse, layersToUse, {
        layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
        requireSdf
      });
      if (mode === "raw" && rpBlitFn) {
        const viewTex = context.getCurrentTexture().createView();
        const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 1;
        if (typeof renderPipeline.updateCamera === "function") {
          renderPipeline.updateCamera(camState, aspect);
        }
        await rpBlitFn(localParams, viewTex);
      } else if (rpRenderFn) {
        await rpRenderFn(localParams, camState);
      } else if (rpBlitFn) {
        const viewTex = context.getCurrentTexture().createView();
        const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 1;
        if (typeof renderPipeline.updateCamera === "function") {
          renderPipeline.updateCamera(camState, aspect);
        }
        await rpBlitFn(localParams, viewTex);
      }
    }
    async function handleResizeImmediate() {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      const pw = Math.floor(cw * dpr);
      const ph = Math.floor(ch * dpr);
      canvas.width = pw;
      canvas.height = ph;
      slabPipeline.canvasAlphaMode = currentAlphaMode;
      renderPipeline.canvasAlphaMode = currentAlphaMode;
      _configureContextForCanvasSize();
      slabPipeline.resize(cw, ch);
      renderPipeline.resize(cw, ch);
      renderGlobals.computeDirty = true;
      renderGlobals.displacementDirty = true;
      renderGlobals.cameraDirty = true;
      renderGlobals.gridDirty = true;
      slabWallsDirty = true;
      _slabSetChunksSrc = null;
      _slabSetChunksLayers = 0;
      const aspect = pw / ph || 1;
      try {
        await rebuildForCurrentState(aspect, true);
        cleanupTempFallbacks(chunkInfos);
        await renderFrame();
        renderGlobals.computeDirty = false;
        renderGlobals.displacementDirty = false;
        renderGlobals.cameraDirty = false;
        renderGlobals.gridDirty = false;
      } catch (e) {
        console.error("handleResizeImmediate failed:", e);
        renderGlobals.cameraDirty = true;
      }
    }
    function scheduleResizeDebounced() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = 0;
        handleResizeImmediate().catch(
          (e) => console.error("debounced resize failed:", e)
        );
      }, 150);
    }
    window.addEventListener("resize", scheduleResizeDebounced);
    const keys = /* @__PURE__ */ Object.create(null);
    const _BLOCK_CODES = /* @__PURE__ */ new Set([
      "Space",
      "ShiftLeft",
      "ShiftRight",
      "ControlLeft",
      "ControlRight",
      "AltLeft",
      "AltRight",
      "MetaLeft",
      "MetaRight",
      "Tab",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyC"
    ]);
    function _shouldBlockKey(e) {
      return _BLOCK_CODES.has(e.code) || e.key === " " || e.key === "Spacebar";
    }
    function onKeyDown(e) {
      if (_shouldBlockKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
      keys[e.code] = true;
      if (e.code === "Escape") {
        try {
          document.exitPointerLock();
        } catch {
        }
      }
    }
    function onKeyUp(e) {
      if (_shouldBlockKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
      keys[e.code] = false;
    }
    function onMouseMove(e) {
      yaw += e.movementX * mouseSens;
      const ySign = invertMouseY ? 1 : -1;
      pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pitch + ySign * e.movementY * mouseSens)
      );
      updateLookTarget();
    }
    canvas.addEventListener("click", () => {
      try {
        canvas.requestPointerLock();
      } catch (e) {
        console.warn("requestPointerLock failed:", e);
      }
    });
    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === canvas;
      if (locked) {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("keydown", onKeyDown, { capture: true });
        document.addEventListener("keyup", onKeyUp, { capture: true });
      } else {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown, { capture: true });
        document.removeEventListener("keyup", onKeyUp, { capture: true });
        for (const k in keys) keys[k] = false;
      }
    });
    async function updateMovement(dt) {
      const ps = renderGlobals.paramsState;
      let baseSpeed = 2 * dt * ps.quadScale;
      if (keys["ShiftLeft"] || keys["ShiftRight"]) baseSpeed *= 3;
      if (keys["ControlLeft"] || keys["ControlRight"]) baseSpeed *= 0.35;
      const sy = Math.sin(yaw);
      const cy = Math.cos(yaw);
      const forward = [sy, 0, -cy];
      const right = [cy, 0, sy];
      let dx = 0;
      let dy = 0;
      let dz = 0;
      let moved = false;
      if (keys["KeyW"]) {
        dx += forward[0] * baseSpeed;
        dz += forward[2] * baseSpeed;
        moved = true;
      }
      if (keys["KeyS"]) {
        dx -= forward[0] * baseSpeed;
        dz -= forward[2] * baseSpeed;
        moved = true;
      }
      if (keys["KeyA"]) {
        dx -= right[0] * baseSpeed;
        dz -= right[2] * baseSpeed;
        moved = true;
      }
      if (keys["KeyD"]) {
        dx += right[0] * baseSpeed;
        dz += right[2] * baseSpeed;
        moved = true;
      }
      if (keys["Space"]) {
        dy += baseSpeed;
        moved = true;
      }
      if (keys["KeyC"]) {
        dy -= baseSpeed;
        moved = true;
      }
      if (!moved) return false;
      cameraPos[0] += dx;
      cameraPos[1] += dy;
      cameraPos[2] += dz;
      updateLookTarget();
      return true;
    }
    window.resetViewCamera = () => {
      cameraPos[0] = 0;
      cameraPos[1] = 0;
      cameraPos[2] = 2.4;
      lookTarget[0] = 0;
      lookTarget[1] = 0;
      lookTarget[2] = 0;
      pitch = 0;
      yaw = 0;
      fov = 45 * Math.PI / 180;
      updateLookTarget();
    };
    async function updateComputeAndDisplacement(aspect) {
      if (renderGlobals.computeDirty) {
        await rebuildForCurrentState(aspect, true);
        renderGlobals.computeDirty = false;
        renderGlobals.displacementDirty = false;
        renderGlobals.cameraDirty = true;
        return;
      }
      if (renderGlobals.displacementDirty) {
        await rebuildForCurrentState(aspect, false);
        renderGlobals.displacementDirty = false;
        renderGlobals.cameraDirty = true;
      }
    }
    function downloadBlob(blob, filename) {
      if (!blob) return;
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url2;
      a.download = filename || "download";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url2);
        } catch {
        }
      }, 1e3);
    }
    function canvasToPngBlob(canvasEl) {
      return new Promise((resolve, reject) => {
        try {
          canvasEl.toBlob((blob) => {
            if (!blob) reject(new Error("canvas.toBlob returned null"));
            else resolve(blob);
          }, "image/png");
        } catch (e) {
          reject(e);
        }
      });
    }
    function _alignUp2(v, a) {
      v = v | 0;
      a = a | 0;
      return v + (a - 1) & ~(a - 1);
    }
    let _exportTex = null;
    let _exportTexW = 0;
    let _exportTexH = 0;
    let _exportTexFormat = "";
    let _exportReadback = null;
    let _exportReadbackBytes = 0;
    let _exportBpr = 0;
    let _export2dCanvas = null;
    let _export2dCtx = null;
    function _ensureExport2dCanvas(w, h) {
      if (!_export2dCanvas) {
        _export2dCanvas = document.createElement("canvas");
        _export2dCtx = _export2dCanvas.getContext("2d");
        if (!_export2dCtx) throw new Error("2D context unavailable for export");
      }
      if (_export2dCanvas.width !== w) _export2dCanvas.width = w;
      if (_export2dCanvas.height !== h) _export2dCanvas.height = h;
      return _export2dCtx;
    }
    function _ensureExportGpuTargets(w, h) {
      w = Math.max(1, w | 0);
      h = Math.max(1, h | 0);
      const fmt = renderPipeline && renderPipeline.format || navigator.gpu.getPreferredCanvasFormat();
      const rawBpr = w * 4;
      const bpr = _alignUp2(rawBpr, 256);
      const needBytes = bpr * h;
      if (!_exportTex || _exportTexW !== w || _exportTexH !== h || _exportTexFormat !== fmt) {
        try {
          if (_exportTex) _exportTex.destroy();
        } catch {
        }
        _exportTex = device.createTexture({
          size: [w, h, 1],
          format: fmt,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        _exportTexW = w;
        _exportTexH = h;
        _exportTexFormat = fmt;
      }
      if (!_exportReadback || _exportReadbackBytes < needBytes) {
        try {
          if (_exportReadback) _exportReadback.destroy();
        } catch {
        }
        _exportReadback = device.createBuffer({
          size: needBytes,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        _exportReadbackBytes = needBytes;
      }
      _exportBpr = bpr;
      return { texture: _exportTex, format: fmt, bytesPerRow: bpr };
    }
    async function _renderFractalToExportTexture(w, h) {
      const ps = renderGlobals.paramsState;
      const req = requestedLayers();
      ps.layerIndex = clampLayerIndex(ps.layerIndex, req);
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
      const mode = normRenderMode(ps.renderMode);
      if (mode === "slab") {
        throw new Error("Offscreen export not implemented for slab mode.");
      }
      const aspect = w > 0 && h > 0 ? w / h : 1;
      if (renderGlobals.gridDirty) {
        renderPipeline.gridDivs = ps.gridDivs;
        renderPipeline.gridStripes = null;
        renderGlobals.gridDirty = false;
      }
      const requireSdf = modeNeedsSdf(mode, ps) && sdfReady;
      const chunksToUse = requireSdf ? chunksWithSdf(chunkInfos) : chunksWithoutSdf(chunkInfos);
      await renderPipeline.setChunks(chunksToUse, layersToUse, {
        layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
        requireSdf
      });
      const { texture } = _ensureExportGpuTargets(w, h);
      const view = texture.createView();
      const camState = { cameraPos, lookTarget, upDir, fov };
      const localParams = Object.assign({}, ps, {
        nLayers: layersToUse,
        layers: layersToUse,
        layerIndex: clampLayerIndex(ps.layerIndex, layersToUse),
        waitGPU: true
      });
      if (rpRenderToView) {
        await rpRenderToView(localParams, camState, view, w, h);
        return;
      }
      if (!rpBlitFn) throw new Error("renderPipeline.renderBlitToView missing");
      if (typeof renderPipeline.updateCamera === "function") {
        renderPipeline.updateCamera(camState, aspect);
      }
      await rpBlitFn(localParams, view);
    }
    async function _exportCurrentExportTextureToPngBlob(w, h) {
      const { texture, format: format2, bytesPerRow } = _ensureExportGpuTargets(w, h);
      const encoder = device.createCommandEncoder();
      encoder.copyTextureToBuffer(
        { texture },
        { buffer: _exportReadback, bytesPerRow, rowsPerImage: h },
        { width: w, height: h, depthOrArrayLayers: 1 }
      );
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await _exportReadback.mapAsync(GPUMapMode.READ);
      const src = new Uint8Array(_exportReadback.getMappedRange());
      const ctx2d = _ensureExport2dCanvas(w, h);
      const img = ctx2d.createImageData(w, h);
      const dst = img.data;
      const isBGRA = String(format2).toLowerCase().startsWith("bgra");
      let dstOff = 0;
      let srcRowOff = 0;
      if (!isBGRA) {
        for (let y = 0; y < h; y++) {
          dst.set(src.subarray(srcRowOff, srcRowOff + w * 4), dstOff);
          srcRowOff += bytesPerRow;
          dstOff += w * 4;
        }
      } else {
        for (let y = 0; y < h; y++) {
          let s = srcRowOff;
          for (let x = 0; x < w; x++) {
            const b = src[s + 0];
            const g = src[s + 1];
            const r = src[s + 2];
            const a = src[s + 3];
            dst[dstOff + 0] = r;
            dst[dstOff + 1] = g;
            dst[dstOff + 2] = b;
            dst[dstOff + 3] = a;
            s += 4;
            dstOff += 4;
          }
          srcRowOff += bytesPerRow;
        }
      }
      _exportReadback.unmap();
      ctx2d.putImageData(img, 0, 0);
      return canvasToPngBlob(_export2dCanvas);
    }
    function randomTag() {
      return Math.random().toString(36).slice(2, 8);
    }
    async function exportFractalCanvas() {
      if (exporting) return;
      exporting = true;
      try {
        flushPending();
        const w = canvas.width | 0;
        const h = canvas.height | 0;
        const aspect = w > 0 && h > 0 ? w / h : 1;
        await updateComputeAndDisplacement(aspect);
        await _renderFractalToExportTexture(w, h);
        const blob = await _exportCurrentExportTextureToPngBlob(w, h);
        const tag = randomTag();
        downloadBlob(blob, "fractal-canvas-" + tag + ".png");
      } catch (e) {
        console.error("exportFractalCanvas failed:", e);
      } finally {
        exporting = false;
        renderGlobals.cameraDirty = true;
      }
    }
    async function exportFractalFullRes() {
      if (exporting) return;
      exporting = true;
      try {
        flushPending();
        const targetRes = Math.max(
          64,
          Math.floor(renderGlobals.paramsState.gridSize || 1024)
        );
        const exportAspect = 1;
        await rebuildForCurrentState(exportAspect, true);
        renderGlobals.computeDirty = false;
        renderGlobals.displacementDirty = false;
        await _renderFractalToExportTexture(targetRes, targetRes);
        const blob = await _exportCurrentExportTextureToPngBlob(
          targetRes,
          targetRes
        );
        const tag = randomTag();
        downloadBlob(blob, "fractal-" + targetRes + "-" + tag + ".png");
      } catch (e) {
        console.error("exportFractalFullRes failed:", e);
      } finally {
        exporting = false;
        renderGlobals.cameraDirty = true;
      }
    }
    updateLookTarget();
    {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const pw = Math.floor(cw * (window.devicePixelRatio || 1));
      const ph = Math.floor(ch * (window.devicePixelRatio || 1));
      canvas.width = pw;
      canvas.height = ph;
      slabPipeline.canvasAlphaMode = currentAlphaMode;
      renderPipeline.canvasAlphaMode = currentAlphaMode;
      _configureContextForCanvasSize();
      slabPipeline.resize(cw, ch);
      renderPipeline.resize(cw, ch);
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
      renderPipeline.gridStripes = null;
      const aspect = pw / ph || 1;
      await rebuildForCurrentState(aspect, true);
      cleanupTempFallbacks(chunkInfos);
      await renderFrame();
      renderGlobals.computeDirty = false;
      renderGlobals.cameraDirty = false;
      renderGlobals.displacementDirty = false;
      renderGlobals.gridDirty = false;
    }
    let lastTime = performance.now();
    async function frame(now) {
      const dt = (now - lastTime) * 1e-3;
      lastTime = now;
      flushPending();
      if (exporting) {
        frameHandle = requestAnimationFrame(frame);
        return;
      }
      const aspect = canvas.width > 0 && canvas.height > 0 ? canvas.width / canvas.height : 1;
      await updateComputeAndDisplacement(aspect);
      if (await updateMovement(dt)) renderGlobals.cameraDirty = true;
      if (renderGlobals.cameraDirty) {
        await renderFrame();
        renderGlobals.cameraDirty = false;
      }
      frameHandle = requestAnimationFrame(frame);
    }
    if (typeof window !== "undefined") {
      window.exportFractalCanvas = exportFractalCanvas;
      window.exportFractalFullRes = exportFractalFullRes;
      window.__fractalRuntime = {
        device,
        context,
        renderPipeline,
        slabPipeline,
        fractalCompute,
        sdfCompute,
        queryCompute,
        renderGlobals
      };
    }
    frameHandle = requestAnimationFrame(frame);
    return {
      device,
      fractalCompute,
      sdfCompute,
      slabPipeline,
      renderPipeline,
      queryCompute,
      destroy: () => {
        try {
          cancelAnimationFrame(frameHandle);
        } catch {
        }
        try {
          fractalCompute.destroy();
        } catch {
        }
        try {
          sdfCompute.destroy(chunkInfos || []);
        } catch {
        }
        try {
          slabPipeline.destroy();
        } catch {
        }
        try {
          renderPipeline.destroy();
        } catch {
        }
        try {
          if (_exportTex) _exportTex.destroy();
        } catch {
        }
        _exportTex = null;
        try {
          if (_exportReadback) _exportReadback.destroy();
        } catch {
        }
        _exportReadback = null;
        try {
          if (chunkInfos && chunkInfos.forEach) {
            chunkInfos.forEach((c) => {
              try {
                if (c.fractalTex) c.fractalTex.destroy();
              } catch {
              }
              try {
                if (c.sdfTex) c.sdfTex.destroy();
              } catch {
              }
              try {
                if (c.flagTex) c.flagTex.destroy();
              } catch {
              }
              try {
                if (c._tmpSdfTex) c._tmpSdfTex.destroy();
              } catch {
              }
              try {
                if (c._tmpFlagTex) c._tmpFlagTex.destroy();
              } catch {
              }
            });
          }
        } catch {
        }
      }
    };
  }

  // ui.js
  var initUI = () => {
    document.body.insertAdjacentHTML("afterbegin", fractalComponent_default);
    const ui = document.getElementById("ui");
    const button = document.getElementById("toggle-ui");
    if (button && ui) {
      const setToggleVisual = (collapsed) => {
        button.textContent = collapsed ? "\u25B6" : "\u25C0";
        button.setAttribute("aria-expanded", collapsed ? "false" : "true");
        button.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
      };
      setToggleVisual(ui.classList.contains("collapsed"));
      button.addEventListener("click", () => {
        const isCollapsed = ui.classList.toggle("collapsed");
        setToggleVisual(isCollapsed);
      });
      const hdr = ui.querySelector(".ui-header");
      if (hdr) {
        hdr.addEventListener("click", (e) => {
          if (e.target !== button) button.click();
        });
      }
    }
    const resetCameraBtn = document.getElementById("resetCameraBtn");
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener("click", () => {
        if (typeof window.resetViewCamera === "function") {
          window.resetViewCamera();
        }
      });
    }
    const exportFullBtn = document.getElementById("exportFullBtn");
    if (exportFullBtn) {
      exportFullBtn.addEventListener("click", () => {
        if (typeof window.exportFractalFullRes === "function") {
          window.exportFractalFullRes();
        }
      });
    }
    const exportCanvasBtn = document.getElementById("exportCanvasBtn");
    if (exportCanvasBtn) {
      exportCanvasBtn.addEventListener("click", () => {
        if (typeof window.exportFractalCanvas === "function") {
          window.exportFractalCanvas();
        }
      });
    }
    const presetJson = document.getElementById("presetJson");
    const presetExportBtn = document.getElementById("presetExportBtn");
    const presetCopyBtn = document.getElementById("presetCopyBtn");
    const presetPasteBtn = document.getElementById("presetPasteBtn");
    const presetApplyBtn = document.getElementById("presetApplyBtn");
    const presetStatus = document.getElementById("presetStatus");
    const LIVE_IDS = /* @__PURE__ */ new Set([
      "epsilon",
      "dispAmp",
      "zoom",
      "dx",
      "dy",
      "gamma",
      "layerGammaStep",
      "layerSeparation",
      "hueOffset",
      "dispCurve",
      "bowlDepth",
      "quadScale",
      "lightX",
      "lightY",
      "lightZ",
      "specPower",
      "lowThresh",
      "highThresh",
      "thresholdBasis",
      "slopeLimit",
      "wallJump",
      "nLayers",
      "gridDivs",
      "meshStep",
      "capBias",
      "gradScale",
      "thickness",
      "feather"
    ]);
    const FORMATTERS = {
      epsilon: (v) => Number(v).toExponential(),
      dispAmp: (v) => Number(v).toFixed(2),
      zoom: (v) => Number(v).toFixed(2),
      dx: (v) => Number(v).toFixed(2),
      dy: (v) => Number(v).toFixed(2),
      gamma: (v) => Number(v).toFixed(4),
      layerGammaStep: (v) => Number(v).toFixed(4),
      layerSeparation: (v) => Number(v).toFixed(3),
      hueOffset: (v) => Number(v).toFixed(2),
      dispCurve: (v) => Number(v).toFixed(2),
      bowlDepth: (v) => Number(v).toFixed(2),
      lowThresh: (v) => Number(v).toFixed(2),
      highThresh: (v) => Number(v).toFixed(2),
      thresholdBasis: (v) => String(v),
      wallJump: (v) => Number(v).toFixed(3),
      nLayers: (v) => String(Math.round(Number(v))),
      gridDivs: (v) => String(Math.round(Number(v))),
      meshStep: (v) => String(Math.max(1, Math.round(Number(v)))),
      capBias: (v) => Number(v).toFixed(3),
      gradScale: (v) => Number(v).toFixed(3),
      thickness: (v) => Number(v).toFixed(3),
      feather: (v) => Number(v).toFixed(3)
    };
    const DEFAULT_FORMATTER = (v) => String(Math.round(Number(v)));
    const ID_TO_PARAM = {
      lowThresh: "lowT",
      highThresh: "highT",
      thresholdBasis: "basis",
      lightX: "lightPos",
      lightY: "lightPos",
      lightZ: "lightPos",
      splitCount: "splitCount",
      gridSize: "gridSize",
      maxIter: "maxIter",
      specPower: "specPower",
      dispAmp: "dispAmp",
      dispCurve: "dispCurve",
      bowlDepth: "bowlDepth",
      quadScale: "quadScale",
      wallJump: "wallJump",
      slopeLimit: "slopeLimit",
      zoom: "zoom",
      dx: "dx",
      dy: "dy",
      gamma: "gamma",
      layerGammaStep: "layerGammaStep",
      hueOffset: "hueOffset",
      epsilon: "epsilon",
      gridDivs: "gridDivs",
      nLayers: "nLayers",
      layerSeparation: "worldOffset",
      renderMode: "renderMode",
      colorScheme: "scheme",
      layerMode: "layerMode"
    };
    const S = setState;
    function getParamValueForControl(id) {
      const params = renderGlobals.paramsState;
      const p = ID_TO_PARAM[id] || id;
      if (p === "lightPos") {
        if (id === "lightX") return params.lightPos?.[0] ?? 0;
        if (id === "lightY") return params.lightPos?.[1] ?? 0;
        if (id === "lightZ") return params.lightPos?.[2] ?? 0;
      }
      if (p === "slopeLimit") {
        const rnorm = params.slopeLimit ?? 0;
        const clamped = Math.min(Math.max(rnorm, 0), 1);
        const rad = Math.asin(Math.sqrt(clamped));
        return rad * 180 / Math.PI;
      }
      return params[p];
    }
    function setControlOutput(id, value) {
      const out = document.getElementById(id + "Out");
      if (!out) return;
      const fmt = FORMATTERS[id] || DEFAULT_FORMATTER;
      try {
        out.value = fmt(value);
      } catch {
      }
    }
    function setupSlider(id, onChange) {
      const slider = document.getElementById(id);
      if (!slider) return null;
      const initVal = getParamValueForControl(id);
      if (typeof initVal === "number") {
        try {
          slider.value = String(initVal);
        } catch {
        }
        setControlOutput(id, initVal);
      }
      const evtName = LIVE_IDS.has(id) ? "input" : "change";
      const handle = () => {
        const num = parseFloat(slider.value);
        if (Number.isNaN(num)) return;
        setControlOutput(id, num);
        onChange(num);
      };
      slider.addEventListener(evtName, handle);
      const out = document.getElementById(id + "Out");
      if (out) {
        const outEvt = LIVE_IDS.has(id) ? "input" : "change";
        const handleOut = () => {
          const num = parseFloat(out.value);
          if (Number.isNaN(num)) return;
          try {
            slider.value = String(num);
          } catch {
          }
          setControlOutput(id, num);
          onChange(num);
        };
        out.addEventListener(outEvt, handleOut);
      }
      handle();
      return slider;
    }
    function setupSelect(id, onChange) {
      const sel = document.getElementById(id);
      if (!sel) return null;
      const out = document.getElementById(id + "Out");
      const initVal = getParamValueForControl(id);
      if (initVal !== void 0 && initVal !== null) {
        try {
          sel.value = String(initVal);
        } catch {
        }
      }
      const updateOutput = () => {
        if (out) out.value = sel.value;
      };
      sel.addEventListener("change", () => {
        updateOutput();
        onChange(sel.value);
      });
      if (out) {
        const handleOut = () => {
          const raw = out.value;
          const num = Number(raw);
          if (!Number.isFinite(num)) return;
          const newVal = String(num);
          sel.value = newVal;
          updateOutput();
          onChange(sel.value);
        };
        out.addEventListener("change", handleOut);
      }
      updateOutput();
      onChange(sel.value);
      return sel;
    }
    function setupCheckbox(id, onChange) {
      const cb = document.getElementById(id);
      if (!cb) return null;
      const paramName = ID_TO_PARAM[id] || id;
      const initVal = renderGlobals.paramsState[paramName];
      if (typeof initVal === "boolean") cb.checked = !!initVal;
      cb.addEventListener("change", () => onChange(cb.checked));
      onChange(cb.checked);
      return cb;
    }
    function setDisabled(ids, disabled) {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) el.disabled = !!disabled;
        const out = document.getElementById(id + "Out");
        if (out) out.disabled = !!disabled;
      }
    }
    function normRenderMode(v) {
      const s = (v == null ? "" : String(v)).trim().toLowerCase();
      if (s === "slab" || s === "1") return "slab";
      if (s === "raw" || s === "blit" || s === "debug" || s === "2") return "raw";
      return "fractal";
    }
    function setControlValue(id, value) {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") {
        el.checked = !!value;
        return;
      }
      try {
        el.value = String(value);
      } catch {
      }
      const out = document.getElementById(id + "Out");
      if (out) {
        try {
          out.value = String(value);
        } catch {
        }
      }
    }
    function ensureLayerModeVisibilityDefaults() {
      const ps = renderGlobals.paramsState;
      const patch = {};
      const sep = Number(ps.worldOffset || 0);
      if (!(Math.abs(sep) > 1e-9)) {
        const v = 0.03;
        setControlValue("layerSeparation", v);
        patch.worldOffset = v;
      }
      const am = Number(ps.alphaMode || 0);
      if (am === 0) {
        setControlValue("alphaMode", 1);
        patch.alphaMode = 1;
        if (typeof window.setAlphaMode === "function") {
          try {
            window.setAlphaMode(1);
          } catch {
          }
        } else {
          window.__pendingAlphaMode = "premultiplied";
        }
      }
      if (Object.keys(patch).length) S(patch);
    }
    let uiLayerMode = !!renderGlobals.paramsState.layerMode;
    function autoDisableForLayerMode(forceRenderMode) {
      setControlValue("dispMode", 0);
      setControlValue("lightingOn", false);
      const patch = { dispMode: 0, lightingOn: false };
      if (forceRenderMode) {
        setControlValue("renderMode", "fractal");
        patch.renderMode = "fractal";
      }
      S(patch);
    }
    const SLAB_IDS = [
      "fieldMode",
      "meshStep",
      "capBias",
      "gradScale",
      "thickness",
      "feather",
      "contourOn",
      "contourOnly",
      "contourFront"
    ];
    function setSlabControlsEnabled(enabled) {
      setDisabled(SLAB_IDS, !enabled);
    }
    function applyRenderModeUI(mode) {
      const m = normRenderMode(mode);
      if (uiLayerMode && m === "slab") {
        setControlValue("renderMode", "fractal");
        setSlabControlsEnabled(false);
        S({ renderMode: "fractal" });
        return;
      }
      setSlabControlsEnabled(m === "slab");
      S({ renderMode: m });
    }
    function applyLayerModeUI(isLayerMode) {
      const next = !!isLayerMode;
      const prev = uiLayerMode;
      uiLayerMode = next;
      setDisabled(["nLayers", "layerGammaStep", "layerSeparation"], !next);
      S({ layerMode: next });
      if (next && !prev) {
        autoDisableForLayerMode(true);
        ensureLayerModeVisibilityDefaults();
      }
    }
    function applyAlphaModeUI(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      setControlValue("alphaMode", n);
      S({ alphaMode: n });
      const canvasMode = n === 0 ? "opaque" : "premultiplied";
      if (typeof window.setAlphaMode === "function") {
        try {
          window.setAlphaMode(n);
        } catch {
          try {
            window.setAlphaMode(canvasMode);
          } catch {
          }
        }
      } else {
        window.__pendingAlphaMode = canvasMode;
      }
    }
    const SCALE_OP_DEFS = [
      { code: 1, name: "Multiply", bit: 1 },
      { code: 2, name: "Divide", bit: 2 },
      { code: 3, name: "Sine", bit: 4 },
      { code: 4, name: "Tangent", bit: 8 },
      { code: 5, name: "Cosine", bit: 16 },
      { code: 6, name: "Exp-Zoom", bit: 32 },
      { code: 7, name: "Log-Shrink", bit: 64 },
      { code: 8, name: "Aniso Warp", bit: 128 },
      { code: 9, name: "Rotate", bit: 256 },
      { code: 10, name: "Radial Twist", bit: 512 },
      { code: 11, name: "HyperWarp", bit: 1024 },
      { code: 12, name: "RadialHyper", bit: 2048 },
      { code: 13, name: "Swirl", bit: 4096 },
      { code: 14, name: "Modular", bit: 8192 },
      { code: 15, name: "AxisSwap", bit: 16384 },
      { code: 16, name: "MixedWarp", bit: 32768 },
      { code: 17, name: "Jitter", bit: 65536 },
      { code: 18, name: "PowerWarp", bit: 131072 },
      { code: 19, name: "SmoothFade", bit: 262144 }
    ];
    const _SCALE_OP_BY_CODE = new Map(SCALE_OP_DEFS.map((d) => [d.code, d]));
    const _SCALE_OP_BY_KEY = new Map(
      SCALE_OP_DEFS.map((d) => [String(d.name).trim().toLowerCase(), d])
    );
    function _normOpCode(v) {
      if (typeof v === "number" && Number.isFinite(v)) {
        const n = v | 0;
        return _SCALE_OP_BY_CODE.has(n) ? n : null;
      }
      if (typeof v === "string") {
        const s = v.trim();
        if (!s) return null;
        const n = Number(s);
        if (Number.isFinite(n)) {
          const nn = n | 0;
          return _SCALE_OP_BY_CODE.has(nn) ? nn : null;
        }
        const k = s.toLowerCase();
        const def = _SCALE_OP_BY_KEY.get(k);
        return def ? def.code : null;
      }
      return null;
    }
    function _maskToOps(mask) {
      const m = mask >>> 0 | 0;
      const out = [];
      for (const d of SCALE_OP_DEFS) {
        if (m & d.bit) out.push(d.code);
      }
      return out;
    }
    function _opsToMask(ops) {
      let m = 0;
      for (let i = 0; i < ops.length; ++i) {
        const c = ops[i] | 0;
        const def = _SCALE_OP_BY_CODE.get(c);
        if (def) m |= def.bit;
      }
      return m >>> 0;
    }
    function _deriveInitialOpsFromState(ps) {
      const raw = ps?.scaleOps;
      if (Array.isArray(raw)) {
        const out = [];
        for (let i = 0; i < raw.length; ++i) {
          const c = _normOpCode(raw[i]);
          if (c != null) out.push(c);
        }
        return out;
      }
      const mask = Number(ps?.scaleMode);
      if (Number.isFinite(mask) && mask) {
        return _maskToOps(mask >>> 0);
      }
      return [];
    }
    function setupScaleOpsBuilder() {
      const picker = document.getElementById("scaleOpPicker");
      const addBtn = document.getElementById("scaleOpAdd");
      const clearBtn = document.getElementById("scaleOpClear");
      const list = document.getElementById("scaleOpsList");
      const out = document.getElementById("scaleOpsOut");
      const count = document.getElementById("scaleOpsCount");
      if (!picker || !addBtn || !list) return null;
      picker.innerHTML = "";
      for (const d of SCALE_OP_DEFS) {
        const opt = document.createElement("option");
        opt.value = String(d.code);
        opt.textContent = `${d.code} - ${d.name}`;
        picker.appendChild(opt);
      }
      let ops = _deriveInitialOpsFromState(renderGlobals.paramsState);
      const MAX_OPS = 16;
      function _clampOps(a) {
        const out2 = [];
        for (let i = 0; i < a.length && out2.length < MAX_OPS; ++i) {
          const c = _normOpCode(a[i]);
          if (c != null) out2.push(c);
        }
        return out2;
      }
      function _syncOut() {
        if (out) {
          try {
            out.value = ops.join(",");
          } catch {
          }
        }
        if (count) {
          count.textContent = `${ops.length}/${MAX_OPS}`;
        }
        addBtn.disabled = ops.length >= MAX_OPS;
      }
      function _commit() {
        const mask = _opsToMask(ops);
        S({ scaleOps: ops.slice(), scaleMode: mask });
      }
      function _makeItem(i, code) {
        const def = _SCALE_OP_BY_CODE.get(code);
        const name = def ? def.name : `Op ${code}`;
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "6px";
        row.style.padding = "4px 6px";
        row.style.border = "1px solid rgba(255,255,255,0.15)";
        row.style.borderRadius = "6px";
        const label = document.createElement("div");
        label.style.flex = "1 1 auto";
        label.textContent = `${i + 1}. ${name} (${code})`;
        const up = document.createElement("button");
        up.type = "button";
        up.textContent = "Up";
        up.dataset.act = "up";
        up.dataset.idx = String(i);
        up.disabled = i === 0;
        const down = document.createElement("button");
        down.type = "button";
        down.textContent = "Down";
        down.dataset.act = "down";
        down.dataset.idx = String(i);
        down.disabled = i === ops.length - 1;
        const del = document.createElement("button");
        del.type = "button";
        del.textContent = "Remove";
        del.dataset.act = "del";
        del.dataset.idx = String(i);
        row.appendChild(label);
        row.appendChild(up);
        row.appendChild(down);
        row.appendChild(del);
        return row;
      }
      function _render() {
        list.innerHTML = "";
        const frag = document.createDocumentFragment();
        for (let i = 0; i < ops.length; ++i) {
          frag.appendChild(_makeItem(i, ops[i]));
        }
        list.appendChild(frag);
      }
      function _setOps(nextOps, doCommit = true) {
        ops = _clampOps(nextOps || []);
        _syncOut();
        _render();
        if (doCommit) _commit();
      }
      addBtn.addEventListener("click", () => {
        const c = _normOpCode(picker.value);
        if (c == null) return;
        if (ops.length >= MAX_OPS) return;
        _setOps([...ops, c]);
      });
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          _setOps([]);
        });
      }
      list.addEventListener("click", (e) => {
        const t = e.target;
        if (!t || typeof t !== "object") return;
        const act = t.dataset?.act;
        const idx = Number(t.dataset?.idx);
        if (!act || !Number.isFinite(idx)) return;
        const i = idx | 0;
        if (i < 0 || i >= ops.length) return;
        if (act === "del") {
          const next = ops.slice();
          next.splice(i, 1);
          _setOps(next);
          return;
        }
        if (act === "up" && i > 0) {
          const next = ops.slice();
          const tmp = next[i - 1];
          next[i - 1] = next[i];
          next[i] = tmp;
          _setOps(next);
          return;
        }
        if (act === "down" && i + 1 < ops.length) {
          const next = ops.slice();
          const tmp = next[i + 1];
          next[i + 1] = next[i];
          next[i] = tmp;
          _setOps(next);
        }
      });
      _setOps(ops, true);
      return { getOps: () => ops.slice(), setOps: (a) => _setOps(a) };
    }
    setupSlider("gridSize", (v) => S({ gridSize: Math.floor(v) }));
    setupSlider("splitCount", (v) => {
      const n = Math.floor(v);
      if (n > 0) S({ splitCount: n });
    });
    setupSlider("maxIter", (v) => S({ maxIter: Math.floor(v) }));
    setupSlider("zoom", (v) => S({ zoom: v }));
    setupSlider("dx", (v) => S({ dx: v }));
    setupSlider("dy", (v) => S({ dy: v }));
    setupSlider("escapeR", (v) => S({ escapeR: v }));
    setupSlider("epsilon", (v) => S({ epsilon: v }));
    setupSlider("gamma", (v) => S({ gamma: v }));
    setupSlider("layerGammaStep", (v) => S({ layerGammaStep: v }));
    setupSlider("layerSeparation", (v) => S({ worldOffset: v }));
    setupSlider("hueOffset", (v) => S({ hueOffset: v }));
    let _lastUiNLayers = Math.max(1, Math.floor(renderGlobals.paramsState.nLayers || 1));
    setupSlider("nLayers", (v) => {
      const n = Math.max(1, Math.floor(v));
      S({ nLayers: n });
      if (uiLayerMode && _lastUiNLayers <= 1 && n > 1) {
        autoDisableForLayerMode(false);
        ensureLayerModeVisibilityDefaults();
      }
      _lastUiNLayers = n;
    });
    setupSlider("gridDivs", (v) => {
      const val = Math.max(1, Math.floor(v));
      S({ gridDivs: val });
    });
    setupCheckbox("layerMode", (v) => applyLayerModeUI(v));
    setupSelect("fractalType", (v) => S({ fractalType: +v }));
    setupSelect("escapeMode", (v) => S({ escapeMode: +v }));
    setupCheckbox("convergenceTest", (v) => S({ convergenceTest: v }));
    setupSelect("colorScheme", (v) => S({ scheme: +v }));
    const scaleOpsApi = setupScaleOpsBuilder();
    setupSelect("dispMode", (v) => S({ dispMode: +v }));
    setupSlider("dispAmp", (v) => S({ dispAmp: v }));
    setupSlider("dispCurve", (v) => S({ dispCurve: v }));
    setupCheckbox("dispLimitOn", (v) => S({ dispLimitOn: v }));
    setupCheckbox("bowlOn", (v) => S({ bowlOn: v }));
    setupSlider("bowlDepth", (v) => S({ bowlDepth: v }));
    setupSlider("slopeLimit", (deg) => {
      const rad = deg * Math.PI / 180;
      const rnorm = Math.sin(rad) * Math.sin(rad);
      S({ slopeLimit: rnorm });
    });
    setupSlider("wallJump", (v) => S({ wallJump: v }));
    const setLight = (idx, val) => {
      const lp = [...renderGlobals.paramsState.lightPos || [0, 0, 0]];
      lp[idx] = val;
      S({ lightPos: lp });
    };
    setupCheckbox("lightingOn", (v) => S({ lightingOn: v }));
    setupSlider("lightX", (v) => setLight(0, v));
    setupSlider("lightY", (v) => setLight(1, v));
    setupSlider("lightZ", (v) => setLight(2, v));
    setupSlider("specPower", (v) => S({ specPower: v }));
    setupSlider("lowThresh", (v) => S({ lowT: v }));
    setupSlider("highThresh", (v) => S({ highT: v }));
    setupSelect("thresholdBasis", (v) => S({ basis: +v }));
    setupSelect("alphaMode", (v) => applyAlphaModeUI(v));
    setupSelect("renderMode", (v) => {
      applyRenderModeUI(v);
    });
    setupSelect("fieldMode", (v) => S({ fieldMode: +v }));
    setupSlider("meshStep", (v) => {
      const n = Math.max(1, Math.floor(v));
      S({ meshStep: n });
    });
    setupSlider("capBias", (v) => S({ capBias: v }));
    setupSlider("gradScale", (v) => S({ gradScale: v }));
    setupSlider("thickness", (v) => S({ thickness: v }));
    setupSlider("feather", (v) => S({ feather: v }));
    setupCheckbox("contourOn", (v) => S({ contourOn: v }));
    setupCheckbox("contourOnly", (v) => S({ contourOnly: v }));
    setupCheckbox("contourFront", (v) => S({ contourFront: v }));
    function setPresetStatus(msg) {
      if (!presetStatus) return;
      try {
        presetStatus.textContent = msg || "";
      } catch {
      }
    }
    const PRESET_CONTROL_IDS = [
      "gridSize",
      "renderMode",
      "alphaMode",
      "fractalType",
      "zoom",
      "dx",
      "dy",
      "maxIter",
      "escapeR",
      "convergenceTest",
      "escapeMode",
      "epsilon",
      "colorScheme",
      "hueOffset",
      "gamma",
      "lowThresh",
      "highThresh",
      "thresholdBasis",
      "layerMode",
      "nLayers",
      "layerGammaStep",
      "layerSeparation",
      "dispMode",
      "gridDivs",
      "dispAmp",
      "dispCurve",
      "dispLimitOn",
      "bowlOn",
      "bowlDepth",
      "quadScale",
      "slopeLimit",
      "wallJump",
      "lightingOn",
      "lightX",
      "lightY",
      "lightZ",
      "specPower",
      "fieldMode",
      "meshStep",
      "capBias",
      "gradScale",
      "thickness",
      "feather",
      "contourOn",
      "contourOnly",
      "contourFront"
    ];
    const PRESET_TYPES = {
      gridSize: "int",
      maxIter: "int",
      nLayers: "int",
      gridDivs: "int",
      fractalType: "int",
      escapeMode: "int",
      colorScheme: "int",
      dispMode: "int",
      thresholdBasis: "int",
      alphaMode: "int",
      renderMode: "string",
      convergenceTest: "bool",
      layerMode: "bool",
      dispLimitOn: "bool",
      bowlOn: "bool",
      lightingOn: "bool",
      contourOn: "bool",
      contourOnly: "bool",
      contourFront: "bool",
      zoom: "num",
      dx: "num",
      dy: "num",
      escapeR: "num",
      epsilon: "num",
      hueOffset: "num",
      gamma: "num",
      layerGammaStep: "num",
      layerSeparation: "num",
      dispAmp: "num",
      dispCurve: "num",
      bowlDepth: "num",
      quadScale: "num",
      slopeLimit: "num",
      wallJump: "num",
      lightX: "num",
      lightY: "num",
      lightZ: "num",
      specPower: "num",
      meshStep: "int",
      capBias: "num",
      gradScale: "num",
      thickness: "num",
      feather: "num",
      fieldMode: "int"
    };
    function readPresetValueFromControl(id) {
      const el = document.getElementById(id);
      if (!el) return void 0;
      if (el.type === "checkbox") return !!el.checked;
      const raw = el.value;
      const t = PRESET_TYPES[id] || "num";
      if (t === "string") return String(raw);
      if (t === "bool") return !!raw;
      const n = Number(raw);
      if (!Number.isFinite(n)) return void 0;
      if (t === "int") return Math.round(n) | 0;
      return n;
    }
    function buildPresetObject() {
      const controls = {};
      for (let i = 0; i < PRESET_CONTROL_IDS.length; ++i) {
        const id = PRESET_CONTROL_IDS[i];
        const v = readPresetValueFromControl(id);
        if (v !== void 0) controls[id] = v;
      }
      if (scaleOpsApi && typeof scaleOpsApi.getOps === "function") {
        const ops = scaleOpsApi.getOps();
        if (Array.isArray(ops)) controls.scaleOps = ops.slice();
      } else {
        const rawOps = renderGlobals.paramsState?.scaleOps;
        if (Array.isArray(rawOps)) controls.scaleOps = rawOps.slice();
      }
      return { version: 1, controls };
    }
    function _toNum(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    function _applyNumericControl(id, v) {
      const n = _toNum(v);
      if (n == null) return false;
      setControlValue(id, n);
      setControlOutput(id, n);
      return true;
    }
    function _applyIntControl(id, v) {
      const n = _toNum(v);
      if (n == null) return false;
      const i = Math.round(n) | 0;
      setControlValue(id, i);
      setControlOutput(id, i);
      return true;
    }
    function _applyBoolControl(id, v) {
      const b = !!v;
      setControlValue(id, b);
      return true;
    }
    function applyPresetObject(obj) {
      const root = obj && typeof obj === "object" ? obj : null;
      if (!root) return { ok: false, err: "Preset is not an object" };
      const controls = root.controls && typeof root.controls === "object" ? root.controls : root;
      if (!controls || typeof controls !== "object") return { ok: false, err: "Missing controls" };
      if ("layerMode" in controls) {
        _applyBoolControl("layerMode", controls.layerMode);
        applyLayerModeUI(!!controls.layerMode);
      }
      if ("alphaMode" in controls) {
        applyAlphaModeUI(controls.alphaMode);
      }
      if ("renderMode" in controls) {
        setControlValue("renderMode", controls.renderMode);
        applyRenderModeUI(controls.renderMode);
      }
      const patch = {};
      if ("gridSize" in controls && _applyIntControl("gridSize", controls.gridSize)) {
        patch.gridSize = Math.max(1, Math.floor(_toNum(controls.gridSize) || 1));
      }
      if ("maxIter" in controls && _applyIntControl("maxIter", controls.maxIter)) {
        patch.maxIter = Math.max(1, Math.floor(_toNum(controls.maxIter) || 1));
      }
      if ("fractalType" in controls && _applyIntControl("fractalType", controls.fractalType)) {
        patch.fractalType = Math.max(0, Math.floor(_toNum(controls.fractalType) || 0));
      }
      if ("zoom" in controls && _applyNumericControl("zoom", controls.zoom)) patch.zoom = _toNum(controls.zoom);
      if ("dx" in controls && _applyNumericControl("dx", controls.dx)) patch.dx = _toNum(controls.dx);
      if ("dy" in controls && _applyNumericControl("dy", controls.dy)) patch.dy = _toNum(controls.dy);
      if ("escapeR" in controls && _applyNumericControl("escapeR", controls.escapeR)) patch.escapeR = _toNum(controls.escapeR);
      if ("epsilon" in controls && _applyNumericControl("epsilon", controls.epsilon)) patch.epsilon = _toNum(controls.epsilon);
      if ("gamma" in controls && _applyNumericControl("gamma", controls.gamma)) patch.gamma = _toNum(controls.gamma);
      if ("layerGammaStep" in controls && _applyNumericControl("layerGammaStep", controls.layerGammaStep)) {
        patch.layerGammaStep = _toNum(controls.layerGammaStep);
      }
      if ("layerSeparation" in controls && _applyNumericControl("layerSeparation", controls.layerSeparation)) {
        patch.worldOffset = _toNum(controls.layerSeparation);
      }
      if ("hueOffset" in controls && _applyNumericControl("hueOffset", controls.hueOffset)) patch.hueOffset = _toNum(controls.hueOffset);
      if ("nLayers" in controls && _applyIntControl("nLayers", controls.nLayers)) {
        patch.nLayers = Math.max(1, Math.floor(_toNum(controls.nLayers) || 1));
      }
      if ("gridDivs" in controls && _applyIntControl("gridDivs", controls.gridDivs)) {
        patch.gridDivs = Math.max(1, Math.floor(_toNum(controls.gridDivs) || 1));
      }
      if ("escapeMode" in controls) {
        const n = _toNum(controls.escapeMode);
        if (n != null) {
          setControlValue("escapeMode", Math.round(n) | 0);
          patch.escapeMode = Math.round(n) | 0;
        }
      }
      if ("convergenceTest" in controls) {
        _applyBoolControl("convergenceTest", controls.convergenceTest);
        patch.convergenceTest = !!controls.convergenceTest;
      }
      if ("colorScheme" in controls) {
        const n = _toNum(controls.colorScheme);
        if (n != null) {
          setControlValue("colorScheme", Math.round(n) | 0);
          patch.scheme = Math.round(n) | 0;
        }
      }
      if ("lowThresh" in controls && _applyNumericControl("lowThresh", controls.lowThresh)) patch.lowT = _toNum(controls.lowThresh);
      if ("highThresh" in controls && _applyNumericControl("highThresh", controls.highThresh)) patch.highT = _toNum(controls.highThresh);
      if ("thresholdBasis" in controls) {
        const n = _toNum(controls.thresholdBasis);
        if (n != null) {
          setControlValue("thresholdBasis", Math.round(n) | 0);
          patch.basis = Math.round(n) | 0;
        }
      }
      if ("dispMode" in controls) {
        const n = _toNum(controls.dispMode);
        if (n != null) {
          setControlValue("dispMode", Math.round(n) | 0);
          patch.dispMode = Math.round(n) | 0;
        }
      }
      if ("dispAmp" in controls && _applyNumericControl("dispAmp", controls.dispAmp)) patch.dispAmp = _toNum(controls.dispAmp);
      if ("dispCurve" in controls && _applyNumericControl("dispCurve", controls.dispCurve)) patch.dispCurve = _toNum(controls.dispCurve);
      if ("dispLimitOn" in controls) {
        _applyBoolControl("dispLimitOn", controls.dispLimitOn);
        patch.dispLimitOn = !!controls.dispLimitOn;
      }
      if ("bowlOn" in controls) {
        _applyBoolControl("bowlOn", controls.bowlOn);
        patch.bowlOn = !!controls.bowlOn;
      }
      if ("bowlDepth" in controls && _applyNumericControl("bowlDepth", controls.bowlDepth)) patch.bowlDepth = _toNum(controls.bowlDepth);
      if ("quadScale" in controls && _applyNumericControl("quadScale", controls.quadScale)) patch.quadScale = _toNum(controls.quadScale);
      if ("wallJump" in controls && _applyNumericControl("wallJump", controls.wallJump)) patch.wallJump = _toNum(controls.wallJump);
      if ("slopeLimit" in controls && _applyNumericControl("slopeLimit", controls.slopeLimit)) {
        const deg = _toNum(controls.slopeLimit);
        if (deg != null) {
          const rad = deg * Math.PI / 180;
          const rnorm = Math.sin(rad) * Math.sin(rad);
          patch.slopeLimit = rnorm;
        }
      }
      if ("lightingOn" in controls) {
        _applyBoolControl("lightingOn", controls.lightingOn);
        patch.lightingOn = !!controls.lightingOn;
      }
      const anyLight = "lightX" in controls || "lightY" in controls || "lightZ" in controls;
      if (anyLight) {
        const lp = [...renderGlobals.paramsState.lightPos || [0, 0, 0]];
        if ("lightX" in controls) {
          const n = _toNum(controls.lightX);
          if (n != null) {
            _applyNumericControl("lightX", n);
            lp[0] = n;
          }
        }
        if ("lightY" in controls) {
          const n = _toNum(controls.lightY);
          if (n != null) {
            _applyNumericControl("lightY", n);
            lp[1] = n;
          }
        }
        if ("lightZ" in controls) {
          const n = _toNum(controls.lightZ);
          if (n != null) {
            _applyNumericControl("lightZ", n);
            lp[2] = n;
          }
        }
        patch.lightPos = lp;
      }
      if ("specPower" in controls && _applyNumericControl("specPower", controls.specPower)) {
        patch.specPower = _toNum(controls.specPower);
      }
      if ("fieldMode" in controls) {
        const n = _toNum(controls.fieldMode);
        if (n != null) {
          setControlValue("fieldMode", Math.round(n) | 0);
          patch.fieldMode = Math.round(n) | 0;
        }
      }
      if ("meshStep" in controls && _applyIntControl("meshStep", controls.meshStep)) {
        patch.meshStep = Math.max(1, Math.floor(_toNum(controls.meshStep) || 1));
      }
      if ("capBias" in controls && _applyNumericControl("capBias", controls.capBias)) patch.capBias = _toNum(controls.capBias);
      if ("gradScale" in controls && _applyNumericControl("gradScale", controls.gradScale)) patch.gradScale = _toNum(controls.gradScale);
      if ("thickness" in controls && _applyNumericControl("thickness", controls.thickness)) patch.thickness = _toNum(controls.thickness);
      if ("feather" in controls && _applyNumericControl("feather", controls.feather)) patch.feather = _toNum(controls.feather);
      if ("contourOn" in controls) {
        _applyBoolControl("contourOn", controls.contourOn);
        patch.contourOn = !!controls.contourOn;
      }
      if ("contourOnly" in controls) {
        _applyBoolControl("contourOnly", controls.contourOnly);
        patch.contourOnly = !!controls.contourOnly;
      }
      if ("contourFront" in controls) {
        _applyBoolControl("contourFront", controls.contourFront);
        patch.contourFront = !!controls.contourFront;
      }
      if (Object.keys(patch).length) S(patch);
      if ("scaleOps" in controls) {
        const ops = Array.isArray(controls.scaleOps) ? controls.scaleOps : null;
        if (ops) {
          if (scaleOpsApi && typeof scaleOpsApi.setOps === "function") {
            scaleOpsApi.setOps(ops);
          } else {
            const norm = [];
            for (let i = 0; i < ops.length && norm.length < 16; ++i) {
              const c = _normOpCode(ops[i]);
              if (c != null) norm.push(c);
            }
            S({ scaleOps: norm.slice(), scaleMode: _opsToMask(norm) });
          }
        }
      }
      return { ok: true };
    }
    async function copyTextToClipboard(text) {
      const s = String(text || "");
      if (!s) return false;
      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(s);
          return true;
        } catch {
        }
      }
      try {
        const ta = document.createElement("textarea");
        ta.value = s;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return !!ok;
      } catch {
      }
      return false;
    }
    async function readTextFromClipboard() {
      if (navigator?.clipboard?.readText) {
        try {
          const s = await navigator.clipboard.readText();
          return typeof s === "string" ? s : "";
        } catch {
        }
      }
      return "";
    }
    if (presetExportBtn && presetJson) {
      presetExportBtn.addEventListener("click", () => {
        const obj = buildPresetObject();
        try {
          presetJson.value = JSON.stringify(obj, null, 2);
          setPresetStatus("Exported");
        } catch {
          setPresetStatus("Export failed");
        }
      });
    }
    if (presetCopyBtn && presetJson) {
      presetCopyBtn.addEventListener("click", async () => {
        const ok = await copyTextToClipboard(presetJson.value);
        setPresetStatus(ok ? "Copied" : "Copy failed");
      });
    }
    if (presetPasteBtn && presetJson) {
      presetPasteBtn.addEventListener("click", async () => {
        const s = await readTextFromClipboard();
        if (!s) {
          setPresetStatus("Clipboard empty");
          return;
        }
        presetJson.value = s;
        setPresetStatus("Pasted");
      });
    }
    if (presetApplyBtn && presetJson) {
      presetApplyBtn.addEventListener("click", () => {
        const raw = String(presetJson.value || "").trim();
        if (!raw) {
          setPresetStatus("No JSON to apply");
          return;
        }
        let obj = null;
        try {
          obj = JSON.parse(raw);
        } catch {
          setPresetStatus("Invalid JSON");
          return;
        }
        const res = applyPresetObject(obj);
        setPresetStatus(res.ok ? "Applied" : `Apply failed: ${res.err || "unknown"}`);
      });
    }
    applyLayerModeUI(!!renderGlobals.paramsState.layerMode);
    setSlabControlsEnabled(normRenderMode(renderGlobals.paramsState.renderMode) === "slab");
    applyRenderModeUI(renderGlobals.paramsState.renderMode);
  };

  // index.js
  initUI();
  initRender().catch(console.error);
})();
