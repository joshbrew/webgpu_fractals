(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // shaders/fractalComponent.html
  var fractalComponent_default = '<div id="canvas-container">\r\n  <canvas id="gpu-canvas"></canvas>\r\n  <div id="ui">\r\n    <div class="ui-header">\r\n      <span>\u2630 Menu</span>\r\n      <button id="toggle-ui" aria-label="Toggle Menu">\u2013</button>\r\n    </div>\r\n    <div id="ui-content">\r\n      <!-- Resolution slider -->\r\n      <div class="row">\r\n        <label\r\n          title="Internal render resolution (GPU grid size). Higher values cost more GPU time."\r\n        >\r\n          Resolution:\r\n          <input\r\n            id="gridSize"\r\n            type="range"\r\n            min="64"\r\n            max="8192"\r\n            step="64"\r\n            value="1024"\r\n            title="Internal GPU grid resolution: 64\u20138192"\r\n          />\r\n          <input\r\n            id="gridSizeOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="64"\r\n            max="8192"\r\n            step="64"\r\n            value="1024"\r\n            title="Exact numeric grid resolution"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row button-row">\r\n        <button id="resetCameraBtn" type="button" title="Reset pan and zoom">\r\n          Reset Camera\r\n        </button>\r\n        <button\r\n          id="exportFullBtn"\r\n          type="button"\r\n          title="Save a full-resolution PNG render"\r\n        >\r\n          Save Full-Res PNG\r\n        </button>\r\n      </div>\r\n\r\n      <!-- zMin and dz (hidden) -->\r\n      <div class="row" style="display: none">\r\n        <label>\r\n          zMin:\r\n          <input id="zMin" type="number" step="0.1" value="0.0" />\r\n          <input\r\n            id="zMinOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            step="0.1"\r\n            value="0.0"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row" style="display: none">\r\n        <label>\r\n          dz:\r\n          <input id="dz" type="number" step="0.01" value="0.2" />\r\n          <input\r\n            id="dzOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            step="0.01"\r\n            value="0.2"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Fractal type -->\r\n      <div class="row">\r\n        <label title="Select the fractal equation family">\r\n          Fractal:\r\n          <select id="fractalType" title="Choose the fractal formula (0-100)">\r\n            <option value="0">Mandelbrot</option>\r\n            <option value="1">Tricorn</option>\r\n            <option value="2">Burning Ship</option>\r\n            <option value="3">Perpendicular Mandelbrot</option>\r\n            <option value="4">Celtic</option>\r\n            <option value="5">Buffalo</option>\r\n            <option value="6">Phoenix</option>\r\n            <option value="7">Cubic Multibrot (z\xB3 + c)</option>\r\n            <option value="8">Quartic Multibrot (z\u2074 + c)</option>\r\n            <option value="9">Cosine</option>\r\n            <option value="10">Sine</option>\r\n            <option value="11">Heart</option>\r\n            <option value="12">Perpendicular Buffalo</option>\r\n            <option value="13">Spiral Mandelbrot</option>\r\n            <option value="14">Quintic Multibrot (z\u2075 + c)</option>\r\n            <option value="15">Sextic Multibrot (z\u2076 + c)</option>\r\n            <option value="16">Tangent fractal (tan z + c)</option>\r\n            <option value="17">Exponential fractal (exp z + c)</option>\r\n            <option value="18">Septic Multibrot (z\u2077 + c)</option>\r\n            <option value="19">Octic Multibrot (z\u2078 + c)</option>\r\n            <option value="20">Inverse Mandelbrot (1/z\xB2 + c)</option>\r\n            <option value="21">Burning Ship Deep Zoom</option>\r\n            <option value="22">Cubic Burning Ship (|z|\xB3 + c)</option>\r\n            <option value="23">Quartic Burning Ship (|z|\u2074 + c)</option>\r\n            <option value="24">Quintic Burning Ship (|z|\u2075 + c)</option>\r\n            <option value="25">Hexic Burning Ship (|z|\u2076 + c)</option>\r\n            <option value="26">Nova (Newton z\xB3\u22121)</option>\r\n            <option value="27">Man-o-War</option>\r\n            <option value="28">Stretched Celtic Spiral</option>\r\n            <option value="29">Polar-Flame fractal</option>\r\n            <option value="30">Inverse Cubic (1/z\xB3 + c)</option>\r\n            <option value="31">Inverse Quartic (1/z\u2074 + c)</option>\r\n            <option value="32">Inverse Quintic (1/z\u2075 + c)</option>\r\n            <option value="33">Inverse Sextic (1/z\u2076 + c)</option>\r\n            <option value="34">Inverse Septic (1/z\u2077 + c)</option>\r\n            <option value="35">Inverse Octic (1/z\u2078 + c)</option>\r\n            <option value="36">Inverse Burning Ship</option>\r\n            <option value="37">Inverse Tricorn</option>\r\n            <option value="38">Inverse Celtic</option>\r\n            <option value="39">Inverse Phoenix</option>\r\n            <option value="40">Tri-Nova</option>\r\n            <option value="41">Nova-Mandelbrot</option>\r\n            <option value="42">Nova 2 (inverse)</option>\r\n            <option value="43">Nova 2 variant</option>\r\n            <option value="44">Quartic-Nova</option>\r\n            <option value="45">Flower Nova</option>\r\n            <option value="46">Scatter-Nova</option>\r\n            <option value="47">Twisted-Flower Nova</option>\r\n            <option value="48">Lobed-Scatter Nova</option>\r\n            <option value="49">Hybrid-FlScatter Nova</option>\r\n            <option value="50">Fractional-Nova (p\u22483.7)</option>\r\n            <option value="51">Kaleido-Nova</option>\r\n            <option value="52">Cross-Nova</option>\r\n            <option value="53">Mirror-Nova</option>\r\n            <option value="54">Spiro-Nova</option>\r\n            <option value="55">Vibrant-Nova</option>\r\n            <option value="56">Julia-Nova Hybrid</option>\r\n            <option value="57">Inverse-Spiral Nova</option>\r\n            <option value="58">Wavefront Nova</option>\r\n            <option value="59">Vortex Nova</option>\r\n            <option value="60">Sine Ring Nova</option>\r\n            <option value="61">Inverse-Spiral Nova 2</option>\r\n            <option value="62">Inverse-Vortex Nova</option>\r\n            <option value="63">Inverse Sine Ring Nova</option>\r\n            <option value="64">Inverse-Mirror Nova</option>\r\n            <option value="65">Inverse-Vibrant Nova</option>\r\n            <option value="66">Golden-Ratio Rational</option>\r\n            <option value="67">SinCos-Kernel</option>\r\n            <option value="68">Golden-Push-Pull</option>\r\n            <option value="69">Sinc-Kernel</option>\r\n            <option value="70">Bizarre Grid (set x/y to 1)</option>\r\n            <option value="71">Julia (use pan x/y sliders)</option>\r\n          </select>\r\n\r\n          <input\r\n            id="fractalTypeOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0"\r\n            max="69"\r\n            step="1"\r\n            value="0"\r\n            title="Numeric fractal type index"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label\r\n          title="Choose the color palette used for mapping iterations to RGB"\r\n        >\r\n          \u{1F3A8}:\r\n          <select\r\n            id="colorScheme"\r\n            title="Choose the color palette used for mapping iterations to RGB"\r\n          >\r\n            <option value="0">Violet-Cyan-White</option>\r\n            <option value="6">Grayscale</option>\r\n            <option value="1">Fire</option>\r\n            <option value="2">Ice</option>\r\n            <option value="3">Sunset</option>\r\n            <option value="4">Forest</option>\r\n            <option value="5">Neon</option>\r\n            <option value="7">Inferno</option>\r\n            <option value="8">Rainbow 360 \xB0</option>\r\n            <option value="9">Rainbow 720 \xB0</option>\r\n            <option value="10">Pastel Loop</option>\r\n            <option value="11">Viridis-ish</option>\r\n            <option value="12">Magma</option>\r\n            <option value="13">Plasma</option>\r\n            <option value="14">Cividis</option>\r\n            <option value="15">Ocean</option>\r\n            <option value="16">Midnight Blue</option>\r\n            <option value="17">Cool-Warm Diverge</option>\r\n            <option value="18">Rainbow 1080\xB0 (3 loops)</option>\r\n            <option value="19">Rainbow 1440\xB0 (4 loops)</option>\r\n            <option value="20">Pastel 5-loop</option>\r\n            <option value="21">Thermal</option>\r\n            <option value="22">Turbulent Wave</option>\r\n            <option value="23">Autumn</option>\r\n            <option value="24">Spring</option>\r\n            <option value="25">Summer</option>\r\n            <option value="26">Mono-loop (10\xD7 grayscale flicker)</option>\r\n            <option value="27">High-contrast Diverging</option>\r\n            <option value="28">Sine-wave Hue</option>\r\n            <option value="29">Sawtooth Loop (3 loops)</option>\r\n            <option value="30">Rainbow 2160\xB0 (6 loops)</option>\r\n            <option value="31">Triangle-wave 8 loops</option>\r\n            <option value="32">Exponential 12 loops</option>\r\n            <option value="33">Sawtooth 10 loops + offset</option>\r\n          </select>\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Global hue offset -->\r\n      <div class="row">\r\n        <label\r\n          title="Shift the global hue of the palette (wraps the color wheel)"\r\n        >\r\n          Hue Offset:\r\n          <input\r\n            id="hueOffset"\r\n            type="range"\r\n            min="-1"\r\n            max="1"\r\n            step="0.001"\r\n            value="0"\r\n            title="Hue offset (-1 to +1)"\r\n          />\r\n          <input\r\n            id="hueOffsetOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-1"\r\n            max="1"\r\n            step="0.001"\r\n            value="0.00"\r\n            title="Exact numeric hue offset"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Zoom -->\r\n      <div class="row">\r\n        <label title="Control zoom scale (size of the complex plane window)">\r\n          Zoom:\r\n          <input\r\n            id="zoom"\r\n            type="range"\r\n            min="0.00000001"\r\n            max="10"\r\n            step="0.000001"\r\n            value="4.0"\r\n            title="Zoom factor (lower values zoom in deeper)"\r\n          />\r\n          <input\r\n            id="zoomOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0.00000001"\r\n            max="10"\r\n            step="0.000001"\r\n            value="4.00"\r\n            title="Exact numeric zoom"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Pan X -->\r\n      <div class="row">\r\n        <label title="Shift the view left/right in the complex plane">\r\n          Pan X:\r\n          <input\r\n            id="dx"\r\n            type="range"\r\n            min="-2"\r\n            max="2"\r\n            step="0.00001"\r\n            value="0.0"\r\n            title="Horizontal pan"\r\n          />\r\n          <input\r\n            id="dxOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-2"\r\n            max="2"\r\n            step="0.00001"\r\n            value="0.00"\r\n            title="Exact numeric pan X"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Pan Y -->\r\n      <div class="row">\r\n        <label title="Shift the view up/down in the complex plane">\r\n          Pan Y:\r\n          <input\r\n            id="dy"\r\n            type="range"\r\n            min="-2"\r\n            max="2"\r\n            step="0.00001"\r\n            value="0.0"\r\n            title="Vertical pan"\r\n          />\r\n          <input\r\n            id="dyOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-2"\r\n            max="2"\r\n            step="0.00001"\r\n            value="0.00"\r\n            title="Exact numeric pan Y"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Max Iter -->\r\n      <div class="row">\r\n        <label\r\n          title="Higher values reveal more detail but increase render time"\r\n        >\r\n          Max Iter:\r\n          <input\r\n            id="maxIter"\r\n            type="range"\r\n            min="50"\r\n            max="5000"\r\n            step="50"\r\n            value="150"\r\n            title="Max escape/convergence iterations"\r\n          />\r\n          <input\r\n            id="maxIterOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="50"\r\n            max="5000"\r\n            step="50"\r\n            value="150"\r\n            title="Exact numeric iteration count"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Escape radius -->\r\n      <div class="row">\r\n        <label\r\n          title="Escape threshold (distance where the orbit is considered divergent)"\r\n        >\r\n          Escape R:\r\n          <input\r\n            id="escapeR"\r\n            type="range"\r\n            min="1"\r\n            max="20"\r\n            step="0.1"\r\n            value="4.0"\r\n            title="Escape radius"\r\n          />\r\n          <input\r\n            id="escapeROut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="1"\r\n            max="20"\r\n            step="0.1"\r\n            value="4.0"\r\n            title="Exact numeric escape radius"\r\n          />\r\n        </label>\r\n      </div>\r\n      <hr />\r\n      <!-- Scale Mode bitmask -->\r\n      <div class="row">\r\n        <label\r\n          title="Enable optional iterative coordinate warps, toggled as a bitmask"\r\n          >Scale Mode:</label\r\n        >\r\n        <div class="scale-group">\r\n          <label title="Multiply coordinates by s">\r\n            <input type="checkbox" name="scaleMode" value="1" /> Multiply</label\r\n          >\r\n          <label title="Divide coordinates by s"\r\n            ><input type="checkbox" name="scaleMode" value="2" /> Divide</label\r\n          >\r\n          <label title="Apply sin(s) warp"\r\n            ><input type="checkbox" name="scaleMode" value="4" /> Sine</label\r\n          >\r\n          <label title="Apply tan(s) warp"\r\n            ><input type="checkbox" name="scaleMode" value="8" /> Tangent</label\r\n          >\r\n          <label title="Apply cos(s) warp"\r\n            ><input type="checkbox" name="scaleMode" value="16" /> Cosine</label\r\n          >\r\n          <label title="Exponential scaling"\r\n            ><input type="checkbox" name="scaleMode" value="32" />\r\n            Exp-Zoom</label\r\n          >\r\n          <label title="Logarithmic shrink"\r\n            ><input type="checkbox" name="scaleMode" value="64" />\r\n            Log-Shrink</label\r\n          >\r\n          <label title="Stretch X and squash Y"\r\n            ><input type="checkbox" name="scaleMode" value="128" /> Aniso\r\n            Warp</label\r\n          >\r\n          <label title="Rotate coordinates by s radians"\r\n            ><input type="checkbox" name="scaleMode" value="256" />\r\n            Rotate</label\r\n          >\r\n          <label title="Twist radius/angle by s"\r\n            ><input type="checkbox" name="scaleMode" value="512" /> Radial\r\n            Twist</label\r\n          >\r\n          <label title="Hyperbolic warp"\r\n            ><input type="checkbox" name="scaleMode" value="1024" />\r\n            HyperWarp</label\r\n          >\r\n          <label title="Hyperbolic radial warp"\r\n            ><input type="checkbox" name="scaleMode" value="2048" />\r\n            RadialHyper</label\r\n          >\r\n          <label title="Add swirl proportional to s"\r\n            ><input type="checkbox" name="scaleMode" value="4096" />\r\n            Swirl</label\r\n          >\r\n          <label title="Modular wrap"\r\n            ><input type="checkbox" name="scaleMode" value="8192" />\r\n            Modular</label\r\n          >\r\n          <label title="Swap axes with scaling"\r\n            ><input type="checkbox" name="scaleMode" value="16384" />\r\n            AxisSwap</label\r\n          >\r\n          <label title="Blend sin and multiply warps"\r\n            ><input type="checkbox" name="scaleMode" value="32768" />\r\n            MixedWarp</label\r\n          >\r\n          <label title="Add jitter noise"\r\n            ><input type="checkbox" name="scaleMode" value="65536" />\r\n            Jitter</label\r\n          >\r\n          <label title="Apply signed power warp"\r\n            ><input type="checkbox" name="scaleMode" value="131072" />\r\n            PowerWarp</label\r\n          >\r\n          <label title="Smoothstep fade warp"\r\n            ><input type="checkbox" name="scaleMode" value="262144" />\r\n            SmoothFade</label\r\n          >\r\n        </div>\r\n      </div>\r\n\r\n      <!-- Gamma -->\r\n      <div class="row">\r\n        <label title="Iteration-based parameter used by warp modes">\r\n          Gamma:\r\n          <input\r\n            id="gamma"\r\n            type="range"\r\n            min="-50"\r\n            max="50.0"\r\n            step="0.0001"\r\n            value="1.0"\r\n            title="Gamma modifier"\r\n          />\r\n          <input\r\n            id="gammaOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-50"\r\n            max="50.0"\r\n            step="0.0001"\r\n            value="1.0"\r\n            title="Exact numeric gamma"\r\n          />\r\n        </label>\r\n      </div>\r\n      <hr />\r\n      <!-- Epsilon -->\r\n      <div class="row">\r\n        <label title="Convergence tolerance for Newton-like fractals">\r\n          Epsilon:\r\n          <input\r\n            id="epsilon"\r\n            type="range"\r\n            min="0.000001"\r\n            max="0.01"\r\n            step="0.000001"\r\n            value="0.000001"\r\n            title="Convergence epsilon"\r\n          />\r\n          <input\r\n            id="epsilonOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0.000001"\r\n            max="0.01"\r\n            step="0.000001"\r\n            value="0.000001"\r\n            title="Exact numeric epsilon"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label\r\n          for="thresholdBasis"\r\n          title="What field the threshold masking operates on"\r\n        >\r\n          Threshold basis\r\n          <select id="thresholdBasis" title="Choose threshold basis">\r\n            <option value="0">Inner</option>\r\n            <option value="1">Outer</option>\r\n            <option value="1">Height (normalized)</option>\r\n          </select>\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label for="lowThresh" title="Lower clamp for threshold mask">\r\n          low\r\n          <input\r\n            id="lowThresh"\r\n            type="range"\r\n            min="0"\r\n            max="1"\r\n            step="0.01"\r\n            value="0.00"\r\n            title="Lower threshold"\r\n          />\r\n          <input\r\n            id="lowVal"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0"\r\n            max="1"\r\n            step="0.01"\r\n            value="0.00"\r\n            title="Exact numeric lower threshold"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label for="highThresh" title="Upper clamp for threshold mask">\r\n          high\r\n          <input\r\n            id="highThresh"\r\n            type="range"\r\n            min="0"\r\n            max="1"\r\n            step="0.01"\r\n            value="1.00"\r\n            title="Upper threshold"\r\n          />\r\n          <input\r\n            id="highVal"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0"\r\n            max="1"\r\n            step="0.01"\r\n            value="1.00"\r\n            title="Exact numeric upper threshold"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Controls final canvas alpha compositing mode">\r\n          Alpha mode:\r\n          <select\r\n            id="alphaMode"\r\n            title="How transparency is applied to rendered pixels"\r\n          >\r\n            <option value="0">0 - Opaque (no transparency)</option>\r\n            <option value="1">1 - Fade out</option>\r\n            <option value="2">2 - Reverse fade out</option>\r\n          </select>\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label\r\n          title="Toggle convergence-based termination for Newton or hybrid maps"\r\n        >\r\n          <input id="convergenceTest" type="checkbox" />\r\n          Convergence Test\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label\r\n          title="Whether the iteration should escape when diverging or converge toward a root"\r\n        >\r\n          Escape Mode:\r\n          <select id="escapeMode" title="Divergence or convergence mode">\r\n            <option value="0">Converge</option>\r\n            <option value="1">Diverge</option>\r\n          </select>\r\n          <input\r\n            id="escapeModeOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0"\r\n            max="1"\r\n            step="1"\r\n            value="0"\r\n            title="Exact numeric escape mode"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <hr />\r\n      <!-- Hidden layer controls -->\r\n      <div class="row" style="display: none">\r\n        <label>\r\n          <input type="checkbox" id="layerMode" />\r\n          Render Gamma Steps (disables Displacement/Lighting)\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row" style="display: none">\r\n        <label>\r\n          Layers:\r\n          <input\r\n            id="nLayers"\r\n            type="range"\r\n            min="1"\r\n            max="128"\r\n            step="1"\r\n            value="1"\r\n          />\r\n          <input\r\n            id="nLayersOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="1"\r\n            max="128"\r\n            step="1"\r\n            value="1"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Bowl -->\r\n      <div class="row">\r\n        <label title="Enable radial bowl displacement for lighting/extrusion">\r\n          <input type="checkbox" id="bowlOn" />\r\n          Enable bowl\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Depth of the bowl displacement curve">\r\n          Bowl depth\r\n          <input\r\n            type="range"\r\n            id="bowlDepth"\r\n            min="0"\r\n            max="3.14"\r\n            step="0.01"\r\n            value="0.25"\r\n            title="Bowl depth"\r\n          />\r\n          <input\r\n            id="bowlDepthOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0"\r\n            max="3.14"\r\n            step="0.01"\r\n            value="0.25"\r\n            title="Exact numeric bowl depth"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Quad scale -->\r\n      <div class="row">\r\n        <label\r\n          title="Scale the on-screen quad used for rendering (for multi-pass / stacked zoom modes)"\r\n        >\r\n          Quad Scale\r\n          <input\r\n            id="quadScale"\r\n            type="range"\r\n            min="1"\r\n            max="1000"\r\n            step="1"\r\n            value="1"\r\n            title="Quad scale factor"\r\n          />\r\n          <input\r\n            id="quadScaleOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="1"\r\n            max="1000"\r\n            step="1"\r\n            value="1.00"\r\n            title="Exact numeric quad scale"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Displacement -->\r\n      <div class="row">\r\n        <label\r\n          title="Choose the type of height displacement applied to lighting / extrusion"\r\n        >\r\n          Displacement mode\r\n          <select id="dispMode" title="Displacement height mapping mode">\r\n            <option value="0">None</option>\r\n            <option value="1">Max Peak</option>\r\n            <option value="2">Min Peak</option>\r\n            <option value="3">Max Peak Log</option>\r\n            <option value="4">Min Peak Log</option>\r\n            <option value="5">Max Peak Pow</option>\r\n            <option value="6">Min Peak Pow</option>\r\n          </select>\r\n        </label>\r\n      </div>\r\n\r\n      <hr />\r\n      <div class="row">\r\n        <label title="Resolution of the displacement sampling grid">\r\n          Grid Divs:\r\n          <input\r\n            id="gridDivs"\r\n            type="range"\r\n            min="64"\r\n            max="4096"\r\n            step="64"\r\n            value="256"\r\n            title="Displacement sampling grid resolution"\r\n          />\r\n          <input\r\n            id="gridDivsOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="64"\r\n            max="4096"\r\n            step="64"\r\n            value="256"\r\n            title="Exact numeric grid divs"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Amplitude of displacement applied to lighting">\r\n          Displacement amp\r\n          <input\r\n            type="range"\r\n            id="dispAmp"\r\n            min="0"\r\n            max="2"\r\n            step="0.01"\r\n            value="0.15"\r\n            title="Displacement amplitude"\r\n          />\r\n          <input\r\n            id="dispAmpOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0"\r\n            max="2"\r\n            step="0.01"\r\n            value="0.15"\r\n            title="Exact numeric displacement amplitude"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Curve shaping for displacement height response">\r\n          Disp curve\r\n          <input\r\n            type="range"\r\n            id="dispCurve"\r\n            min="0.001"\r\n            max="100"\r\n            step="0.001"\r\n            value="3"\r\n            title="Displacement curve exponent"\r\n          />\r\n          <input\r\n            id="dispCurveOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0.001"\r\n            max="100"\r\n            step="0.001"\r\n            value="3.0"\r\n            title="Exact numeric curve exponent"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <hr />\r\n      <div class="row">\r\n        <label\r\n          class="slider-row"\r\n          title="Enable a max-slope clamp to prevent artifacts"\r\n        >\r\n          <span>Disp limit ON</span>\r\n          <input id="dispLimitOn" type="checkbox" />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label\r\n          class="slider-row"\r\n          title="Maximum surface slope allowed (degrees)"\r\n        >\r\n          <span>Max Slope (deg)</span>\r\n          <input\r\n            id="slopeLimit"\r\n            type="range"\r\n            min="0.0"\r\n            max="91"\r\n            step="0.001"\r\n            value="45"\r\n            title="Maximum allowed displacement slope"\r\n          />\r\n          <input\r\n            id="slopeLimitOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0.0"\r\n            max="91"\r\n            step="0.001"\r\n            value="45"\r\n            title="Exact numeric slope limit"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label\r\n          class="slider-row"\r\n          title="Maximum height discontinuity allowed (normalized units)"\r\n        >\r\n          <span>Max Wall Height (norm)</span>\r\n          <input\r\n            id="wallJump"\r\n            type="range"\r\n            min="0.0"\r\n            max="1"\r\n            step="0.001"\r\n            value="0.05"\r\n            title="Wall height clamp"\r\n          />\r\n          <input\r\n            id="wallJumpOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="0.0"\r\n            max="1"\r\n            step="0.001"\r\n            value="0.05"\r\n            title="Exact numeric height clamp"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <hr />\r\n      <!-- Lighting -->\r\n      <div class="row">\r\n        <label title="Enable Phong-style shading based on displacement height">\r\n          Lighting ON\r\n          <input id="lightingOn" type="checkbox" />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Light position X coordinate">\r\n          Light X\r\n          <input\r\n            id="lightX"\r\n            type="range"\r\n            min="-50"\r\n            max="50"\r\n            step="0.1"\r\n            value="0"\r\n            title="Light X coordinate"\r\n          />\r\n          <input\r\n            id="lightXOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-50"\r\n            max="50"\r\n            step="0.1"\r\n            value="0.0"\r\n            title="Numeric light X"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Light position Y coordinate">\r\n          Light Y\r\n          <input\r\n            id="lightY"\r\n            type="range"\r\n            min="-50"\r\n            max="50"\r\n            step="0.1"\r\n            value="0"\r\n            title="Light Y coordinate"\r\n          />\r\n          <input\r\n            id="lightYOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-50"\r\n            max="50"\r\n            step="0.1"\r\n            value="0.0"\r\n            title="Numeric light Y"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Light position Z coordinate (height)">\r\n          Light Z\r\n          <input\r\n            id="lightZ"\r\n            type="range"\r\n            min="-50"\r\n            max="50"\r\n            step="0.1"\r\n            value="50"\r\n            title="Light Z coordinate"\r\n          />\r\n          <input\r\n            id="lightZOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="-50"\r\n            max="50"\r\n            step="0.1"\r\n            value="50.0"\r\n            title="Numeric light Z"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <div class="row">\r\n        <label title="Specular exponent controlling shininess">\r\n          Spec Power (shininess)\r\n          <input\r\n            id="specPower"\r\n            type="range"\r\n            min="1"\r\n            max="128"\r\n            step="1"\r\n            value="32"\r\n            title="Specular highlight power"\r\n          />\r\n          <input\r\n            id="specPowerOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            min="1"\r\n            max="128"\r\n            step="1"\r\n            value="32"\r\n            title="Exact numeric specular power"\r\n          />\r\n        </label>\r\n      </div>\r\n\r\n      <!-- Hidden split values -->\r\n      <div class="row" style="display: none">\r\n        <label>\r\n          Max Pixels/Split:\r\n          <input\r\n            id="splitCount"\r\n            type="number"\r\n            step="100000"\r\n            min="100000"\r\n            value="8000000"\r\n          />\r\n          <input\r\n            id="splitCountOut"\r\n            class="numeric-input"\r\n            type="number"\r\n            step="100000"\r\n            min="100000"\r\n            value="8000000"\r\n          />\r\n        </label>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n';

  // shaders/fractalCompute.wgsl
  var fractalCompute_default = `// Compute WGSL (entry point: main)\r
struct Params {\r
  gridSize: u32,\r
  maxIter: u32,\r
  fractalType: u32,\r
  scaleMode: u32,\r
  zoom: f32,\r
  dx: f32,\r
  dy: f32,\r
  escapeR: f32,\r
  gamma: f32,\r
  layerIndex: u32,\r
  epsilon: f32,\r
  convergenceTest: u32,\r
  escapeMode: u32,\r
  tileOffsetX: u32,\r
  tileOffsetY: u32,\r
  tileWidth: u32,\r
  tileHeight: u32,\r
  aspect: f32,       \r
  _pad0: u32,\r
  _pad1: u32,\r
  _pad2: u32,        // adjust so struct size remains multiple of 16 (or fits your uniformBufferSize)\r
};\r
@group(0) @binding(0) var<uniform> params: Params;\r
@group(1) @binding(0) var storageTex: texture_storage_2d_array<rgba8unorm, write>;\r
\r
// Helpers:\r
fn shipPower(ax: f32, ay: f32, p: f32) -> vec2<f32> {\r
  // r = sqrt(ax^2 + ay^2)^p ; \u03B8 = atan2(ay,ax)*p\r
  let r2 = ax*ax + ay*ay;\r
  // avoid negative or zero? r2>=0\r
  let r = pow(r2, 0.5 * p);\r
  let theta = atan2(ay, ax) * p;\r
  return vec2<f32>(r * cos(theta), r * sin(theta));\r
}\r
\r
fn invPower(qx: f32, qy: f32, p: f32) -> vec2<f32> {\r
  // 1/(qx+ i qy)^p via polar\r
  let r2 = qx*qx + qy*qy + 1e-9;\r
  let rp = pow(r2, 0.5 * p);\r
  let th = atan2(qy, qx) * p;\r
  let inv = 1.0 / rp;\r
  return vec2<f32>(inv * cos(th), -inv * sin(th));\r
}\r
\r
struct InitialZ { qx: f32, qy: f32, px: f32, py: f32 };\r
\r
fn getInitialZ(typ: u32, x0: f32, y0: f32) -> InitialZ {\r
  // Newton-typ indices: 26,40-46\r
  let isNewton =\r
      (typ == 26u) || (typ == 40u) || (typ == 41u) || (typ == 42u)\r
      || (typ == 43u) || (typ == 44u) || (typ == 45u) || (typ == 46u);\r
  if (isNewton) {\r
    return InitialZ(1.0, 0.0, 0.0, 0.0);\r
  }\r
  // inverse families 30-39 start at c\r
  if (typ >= 30u && typ <= 39u) {\r
    return InitialZ(x0, y0, 0.0, 0.0);\r
  }\r
\r
  // Basic Julia starts at the pixel's complex coordinate c = (x0,y0)\r
  if (typ == 71u) {\r
    return InitialZ(x0, y0, 0.0, 0.0);\r
  }\r
\r
  // default start at 0\r
  return InitialZ(0.0, 0.0, 0.0, 0.0);\r
}\r
\r
// Main fractal step returning new z and new px,py:\r
struct FractalResult { nx: f32, ny: f32, npx: f32, npy: f32 };\r
\r
fn computeFractal(typ: u32, qx: f32, qy: f32, px: f32, py: f32,\r
                  cx: f32, cy: f32, gamma: f32, iter: u32, scaleMode: u32) -> FractalResult {\r
                    \r
  let s = 1.0 + f32(iter) * (gamma - 1.0);\r
  var ccx = cx;\r
  var ccy = cy;\r
  let mask = scaleMode;\r
\r
// bit 0 \u2192 Multiply\r
if ((mask & 1u) != 0u) {\r
    ccx = ccx * s;\r
    ccy = ccy * s;\r
}\r
\r
// bit 1 \u2192 Divide\r
if ((mask & 2u) != 0u) {\r
    ccx = ccx / s;\r
    ccy = ccy / s;\r
}\r
\r
// bit 2 \u2192 Sine warp\r
if ((mask & 4u) != 0u) {\r
    let m = sin(s);\r
    ccx = ccx * m;\r
    ccy = ccy * m;\r
}\r
\r
// bit 3 \u2192 Tangent warp\r
if ((mask & 8u) != 0u) {\r
    let m = tan(s);\r
    ccx = ccx * m;\r
    ccy = ccy * m;\r
}\r
\r
// bit 4 \u2192 Cosine warp\r
if ((mask & 16u) != 0u) {\r
    let m = cos(s);\r
    ccx = ccx * m;\r
    ccy = ccy * m;\r
}\r
\r
// bit 5 \u2192 Exponential zoom\r
if ((mask & 32u) != 0u) {\r
    let m = exp(s);\r
    ccx = ccx * m;\r
    ccy = ccy * m;\r
}\r
\r
// bit 6 \u2192 Logarithmic shrink\r
if ((mask & 64u) != 0u) {\r
    let m = log(s + 1e-3);\r
    ccx = ccx * m;\r
    ccy = ccy * m;\r
}\r
\r
// bit 7 \u2192 Anisotropic warp (x\xB7s, y\xF7s)\r
if ((mask & 128u) != 0u) {\r
    ccx = ccx * s;\r
    ccy = ccy / s;\r
}\r
\r
// bit 8 \u2192 Rotate by s radians\r
if ((mask & 256u) != 0u) {\r
    let \u03B8 = s;\r
    let x0 = ccx * cos(\u03B8) - ccy * sin(\u03B8);\r
    let y0 = ccx * sin(\u03B8) + ccy * cos(\u03B8);\r
    ccx = x0;\r
    ccy = y0;\r
}\r
\r
// bit 9 \u2192 Radial twist (r^s, \u03B8\xB7s)\r
if ((mask & 512u) != 0u) {\r
    let r0  = sqrt(ccx*ccx + ccy*ccy);\r
    let \u03B80  = atan2(ccy, ccx);\r
    let rp  = pow(r0, s);\r
    let \u03B8p  = \u03B80 * s;\r
    ccx = rp * cos(\u03B8p);\r
    ccy = rp * sin(\u03B8p);\r
}\r
\r
// bit 10 \u2192 Hyperbolic warp (sinh, cosh)\r
if ((mask & 1024u) != 0u) {\r
    ccx = ccx * sinh(s);\r
    ccy = ccy * cosh(s);\r
}\r
\r
// bit 11 \u2192 Radial hyperbolic (sinh(r*s))\r
if ((mask & 2048u) != 0u) {\r
    let r0  = sqrt(ccx*ccx + ccy*ccy);\r
    let \u03B80  = atan2(ccy, ccx);\r
    let rp  = sinh(r0 * s);\r
    ccx = rp * cos(\u03B80);\r
    ccy = rp * sin(\u03B80);\r
}\r
\r
// bit 12 \u2192 Swirl (\u03B8 + r*s)\r
if ((mask & 4096u) != 0u) {\r
    let r0  = sqrt(ccx*ccx + ccy*ccy);\r
    let \u03B80  = atan2(ccy, ccx);\r
    let \u03B8p  = \u03B80 + r0 * s;\r
    ccx = r0 * cos(\u03B8p);\r
    ccy = r0 * sin(\u03B8p);\r
}\r
\r
// bit 13 \u2192 Modular wrap\r
if ((mask & 8192u) != 0u) {\r
    let m0 = fract(s * 0.5) * 2.0;      // s mod 2\r
    let ux = ccx * m0 + 1.0;\r
    let uy = ccy * m0 + 1.0;\r
    ccx = fract(ux * 0.5) * 2.0 - 1.0;\r
    ccy = fract(uy * 0.5) * 2.0 - 1.0;\r
}\r
\r
// bit 14 \u2192 Axis swap & scale\r
if ((mask & 16384u) != 0u) {\r
    let tx = ccy * s;\r
    let ty = ccx * s;\r
    ccx = tx;\r
    ccy = ty;\r
}\r
\r
// bit 15 \u2192 Mixed warp (blend multiply & sine)\r
if ((mask & 32768u) != 0u) {\r
    let \u03B1   = fract(s * 0.1);\r
    let m1x = ccx * s;\r
    let m2x = ccx * sin(s);\r
    let m1y = ccy * s;\r
    let m2y = ccy * sin(s);\r
    ccx = mix(m1x, m2x, \u03B1);\r
    ccy = mix(m1y, m2y, \u03B1);\r
}\r
\r
// bit 16 \u2192 Jitter noise\r
if ((mask & 65536u) != 0u) {\r
    let jx = fract(sin(ccx * s) * 43758.5453) - 0.5;\r
    let jy = fract(sin(ccy * s) * 97531.2468) - 0.5;\r
    ccx = ccx + jx * s * 0.2;\r
    ccy = ccy + jy * s * 0.2;\r
}\r
\r
// bit 17 \u2192 Signed power warp\r
if ((mask & 131072u) != 0u) {\r
    ccx = sign(ccx) * pow(abs(ccx), s);\r
    ccy = sign(ccy) * pow(abs(ccy), s);\r
}\r
\r
// bit 18 \u2192 Smoothstep fade\r
if ((mask & 262144u) != 0u) {\r
    let t0 = smoothstep(0.0, 1.0, s);\r
    ccx = ccx * t0;\r
    ccy = ccy * t0;\r
}\r
  let a = abs(qx);\r
  let b = abs(qy);\r
  var nx: f32 = 0.0;\r
  var ny: f32 = 0.0;\r
  var npx = px;\r
  var npy = py;\r
\r
  switch(typ) {\r
    case 1u: { // Tricorn\r
      nx = qx*qx - qy*qy + ccx;\r
      ny = -2.0*qx*qy + ccy;\r
    }\r
    case 2u: { // Burning Ship\r
      nx = a*a - b*b + ccx;\r
      ny = 2.0*a*b + ccy;\r
    }\r
    case 3u: { // Perpendicular Mandelbrot\r
      nx = qx*qx - qy*qy + ccx;\r
      ny = -2.0*a*qy + ccy;\r
    }\r
    case 4u: { // Celtic\r
      nx = abs(qx*qx - qy*qy) + ccx;\r
      ny = 2.0*qx*qy + ccy;\r
    }\r
    case 5u: { // Buffalo\r
      nx = abs(qx*qx - qy*qy) + ccx;\r
      ny = -2.0*qx*qy + ccy;\r
    }\r
    case 6u: { // Phoenix (\u03BB = -0.5)\r
      nx = qx*qx - qy*qy + ccx - 0.5*px;\r
      ny = 2.0*qx*qy + ccy - 0.5*py;\r
      npx = qx;\r
      npy = qy;\r
    }\r
    case 7u: { // Cubic Multibrot z^3 + c\r
      let r2 = qx*qx + qy*qy;\r
      let theta = atan2(qy, qx);\r
      let r3 = pow(r2, 1.5);\r
      nx = r3 * cos(3.0 * theta) + ccx;\r
      ny = r3 * sin(3.0 * theta) + ccy;\r
    }\r
    case 8u: { // Quartic Multibrot z^4 + c\r
      let r2 = qx*qx + qy*qy;\r
      let theta = atan2(qy, qx);\r
      let r4 = r2*r2;\r
      nx = r4 * cos(4.0 * theta) + ccx;\r
      ny = r4 * sin(4.0 * theta) + ccy;\r
    }\r
    case 9u: { // Cosine\r
      nx = cos(qx)*cosh(qy) + ccx;\r
      ny = -sin(qx)*sinh(qy) + ccy;\r
    }\r
    case 10u: { // Sine\r
      nx = sin(qx)*cosh(qy) + ccx;\r
      ny = cos(qx)*sinh(qy) + ccy;\r
    }\r
    case 11u: { // Heart\r
      let rx = abs(qx);\r
      nx = rx*rx - qy*qy + ccx;\r
      ny = 2.0*rx*qy + ccy;\r
    }\r
    case 12u: { // Perpendicular Buffalo\r
      nx = abs(qx*qx - qy*qy) + ccx;\r
      ny = -2.0*a*qy + ccy;\r
    }\r
    case 13u: { // Spiral Mandelbrot with twist\r
      let THETA = 0.35 + 2.0*gamma;\r
      let wRe = cos(THETA);\r
      let wIm = sin(THETA);\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
      let tx = wRe*zx2 - wIm*zy2;\r
      let ty = wRe*zy2 + wIm*zx2;\r
      nx = tx + ccx;\r
      ny = ty + ccy;\r
    }\r
    case 14u: { // Quintic z^5 + c\r
      let r2 = qx*qx + qy*qy;\r
      let theta = atan2(qy, qx);\r
      let r5 = pow(r2, 2.5);\r
      nx = r5*cos(5.0*theta) + ccx;\r
      ny = r5*sin(5.0*theta) + ccy;\r
    }\r
    case 15u: { // Sextic z^6 + c\r
      let r2 = qx*qx + qy*qy;\r
      let theta = atan2(qy, qx);\r
      let r6 = r2*r2*r2;\r
      nx = r6*cos(6.0*theta) + ccx;\r
      ny = r6*sin(6.0*theta) + ccy;\r
    }\r
    case 16u: { // Tangent fractal tan(z)+c\r
      let sin2x = sin(2.0*qx);\r
      let sinh2y = sinh(2.0*qy);\r
      let denom = cos(2.0*qx) + cosh(2.0*qy) + 1e-9;\r
      nx = sin2x/denom + ccx;\r
      ny = sinh2y/denom + ccy;\r
    }\r
    case 17u: { // Exponential fractal exp(z)+c\r
      let ex = exp(qx);\r
      nx = ex*cos(qy) + ccx;\r
      ny = ex*sin(qy) + ccy;\r
    }\r
    case 18u: { // Septic z^7 + c\r
      let r2 = qx*qx + qy*qy;\r
      let theta = atan2(qy, qx);\r
      let r7 = pow(r2, 3.5);\r
      nx = r7*cos(7.0*theta) + ccx;\r
      ny = r7*sin(7.0*theta) + ccy;\r
    }\r
    case 19u: { // Octic z^8 + c\r
      let r2 = qx*qx + qy*qy;\r
      let theta = atan2(qy, qx);\r
      let r8 = r2*r2*r2*r2;\r
      nx = r8*cos(8.0*theta) + ccx;\r
      ny = r8*sin(8.0*theta) + ccy;\r
    }\r
    case 20u: { // Inverse Mandelbrot 1/z^2 + c\r
      let r2 = qx*qx + qy*qy + 1e-9;\r
      let invv = 1.0/(r2*r2);\r
      nx = (qx*qx - qy*qy)*invv + ccx;\r
      ny = (2.0*qx*qy)*invv + ccy;\r
    }\r
    case 21u: { // Burning Ship deep zoom\r
      // specific centre and sub; here we replicate JS: but needs cx,cy or ccx,ccy\r
      // Example:\r
      let centerRe = -1.7443359375;\r
      let centerIm = -0.017451171875;\r
      let sub = 0.04;\r
      let dx2 = ccx*sub + centerRe;\r
      let dy2 = ccy*sub + centerIm;\r
      nx = a*a - b*b + dx2;\r
      ny = 2.0*a*b + dy2;\r
    }\r
    case 22u: { // Cubic Burning Ship |z|^3 + c\r
      let pr = shipPower(a, b, 3.0);\r
      nx = pr.x + ccx;\r
      ny = pr.y + ccy;\r
    }\r
    case 23u: { // Quartic Burning Ship |z|^4 + c\r
      let pr = shipPower(a, b, 4.0);\r
      nx = pr.x + ccx;\r
      ny = pr.y + ccy;\r
    }\r
    case 24u: { // Quintic Burning Ship |z|^5 + c\r
      let pr = shipPower(a, b, 5.0);\r
      nx = pr.x + ccx;\r
      ny = pr.y + ccy;\r
    }\r
    case 25u: { // Hexic Burning Ship |z|^6 + c\r
      let pr = shipPower(a, b, 6.0);\r
      nx = pr.x + ccx;\r
      ny = pr.y + ccy;\r
    }\r
    case 26u: { // Nova: z - (z^3-1)/(3 z^2) + c\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
      let zx3 = zx2*qx - zy2*qy;\r
      let zy3 = zx2*qy + zy2*qx;\r
      let numx = zx3 - 1.0;\r
      let numy = zy3;\r
      let denx = 3.0*zx2;\r
      let deny = 3.0*zy2;\r
      let den2 = denx*denx + deny*deny + 1e-9;\r
      let qxDiv = (numx*denx + numy*deny)/den2;\r
      let qyDiv = (numy*denx - numx*deny)/den2;\r
      nx = qx - qxDiv + ccx;\r
      ny = qy - qyDiv + ccy;\r
    }\r
    case 27u: { // Man-o-War: z^2 + c + prev\r
      nx = qx*qx - qy*qy + ccx + px;\r
      ny = 2.0*qx*qy + ccy + py;\r
      npx = qx;\r
      npy = qy;\r
    }\r
    /* =============================================================== */\r
    /* 28 \u2013  Stretched\u2011Celtic\u2011Spiral                                   */\r
    /*     A perpendicular\u2011Celtic variant with an anisotropic          */\r
    /*     stretch and an iteration\u2011driven spiral twist.               */\r
    /* =============================================================== */\r
    case 28u: {\r
        let k = 1.5;                    /* stretch factor              */\r
        let sx = qx * k;\r
        let sy = qy / k;\r
\r
        /* perpendicular\u2011Celtic core                                   */\r
        var tx = abs(sx*sx - sy*sy);\r
        var ty = -2.0*abs(sx)*sy;\r
\r
        /* gentle spiral twist using gamma & iteration #               */\r
        let \u03C1   = length(vec2<f32>(tx, ty));\r
        let \u03B8   = atan2(ty, tx)\r
                + gamma * 6.2831853 * 0.1\r
                + f32(iter) * 0.03;\r
\r
        nx = \u03C1 * cos(\u03B8) + cx;\r
        ny = \u03C1 * sin(\u03B8) + cy;\r
    }\r
\r
    /* =============================================================== */\r
    /* 29 \u2013  Polar\u2011Flame fractal                                       */\r
    /*     A simple \u201Cflame\u201D\u2011style map in polar coordinates:            */\r
    /*         r  \u2190 r\xB2 + c\u2080,   \u03B8 \u2190 2\u03B8 + c\u2081                             */\r
    /* =============================================================== */\r
    case 29u: {\r
        let r      = length(vec2<f32>(qx, qy)) + 1e-9;\r
        let theta  = atan2(qy, qx);\r
\r
        /* flame parameters modulated by gamma                         */\r
        let c0 = 0.25 + 0.15*gamma;\r
        let c1 = 0.5  + 0.5 *gamma;\r
\r
        let r2    = r*r + c0;\r
        let theta2= 2.0*theta + c1;\r
\r
        nx = r2 * cos(theta2) + cx;\r
        ny = r2 * sin(theta2) + cy;\r
    }\r
    case 30u, 31u, 32u, 33u, 34u, 35u: { // inv 3..8\r
      // p = type-27 maybe? but in JS they had invPowerP\r
      // Here assume mapping typ->p: e.g. 30->3,31->4,... so p = f32(typ-27)?\r
      let p = f32(typ - 27u); // 30->3, 31->4, ..., 35->8\r
      let pr = invPower(qx, qy, p);\r
      nx = pr.x + ccx;\r
      ny = pr.y + ccy;\r
    }\r
    case 36u: { // Inverse Burning-Ship\r
      let a2 = abs(qx);\r
      let b2 = abs(qy);\r
      let r2 = qx*qx + qy*qy + 1e-9;\r
      let invv = 1.0/(r2*r2);\r
      nx = (a2*a2 - b2*b2)*invv + ccx;\r
      ny = (2.0*a2*b2)*invv + ccy;\r
    }\r
    case 37u: { // Inverse Tricorn\r
      let r2 = qx*qx + qy*qy + 1e-9;\r
      let invv = 1.0/(r2*r2);\r
      nx = (qx*qx - qy*qy)*invv + ccx;\r
      ny = (-2.0*qx*qy)*invv + ccy;\r
    }\r
    case 38u: { // Inverse Celtic\r
      let r2 = qx*qx + qy*qy + 1e-9;\r
      let invv = 1.0/(r2*r2);\r
      let rx = abs(qx*qx - qy*qy);\r
      nx = rx*invv + ccx;\r
      ny = (2.0*qx*qy)*invv + ccy;\r
    }\r
    case 39u: { // Inverse Phoenix\r
      let r2 = qx*qx + qy*qy + 1e-9;\r
      let invv = 1.0/(r2*r2);\r
      let zx2 = (qx*qx - qy*qy)*invv;\r
      let zy2 = (2.0*qx*qy)*invv;\r
      nx = zx2 + ccx - 0.5*px;\r
      ny = zy2 + ccy - 0.5*py;\r
      npx = qx;\r
      npy = qy;\r
    }\r
    case 40u: { // Tri-Nova\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
      let zx4 = zx2*zx2 - zy2*zy2;\r
      let zy4 = 2.0*zx2*zy2;\r
      nx = 1.3333333*qx - 0.3333333*zx4 + ccx;\r
      ny = 1.3333333*qy - 0.3333333*zy4 + ccy;\r
    }\r
    case 41u: { // Nova-Mandelbrot\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
      let zx3 = zx2*qx - zy2*qy;\r
      let zy3 = zx2*qy + zy2*qx;\r
      let denx = 3.0*zx2;\r
      let deny = 3.0*zy2;\r
      let den2 = denx*denx + deny*deny + 1e-9;\r
      let numx = zx3 - 1.0;\r
      let numy = zy3;\r
      let divx = (numx*denx + numy*deny)/den2;\r
      let divy = (numy*denx - numx*deny)/den2;\r
      nx = qx - divx + ccx;\r
      ny = qy - divy + ccy;\r
    }\r
    case 42u: { // Nova 2 (inverse variant)\r
      // 1) 1/z\r
      let r2_inv = 1.0/(qx*qx + qy*qy + 1e-9);\r
      let izRe = qx * r2_inv;\r
      let izIm = -qy * r2_inv;\r
      // 2) (1/z)^2, (1/z)^4\r
      let zx2 = izRe*izRe - izIm*izIm;\r
      let zy2 = 2.0*izRe*izIm;\r
      let zx4 = zx2*zx2 - zy2*zy2;\r
      let zy4 = 2.0*zx2*zy2;\r
      // 3) forward Quad-Nova step on 1/z\r
      let fRe = 1.3333333*izRe - 0.3333333*zx4 + ccx;\r
      let fIm = 1.3333333*izIm - 0.3333333*zy4 + ccy;\r
      // 4) invert back\r
      let den = 1.0/(fRe*fRe + fIm*fIm + 1e-9);\r
      nx = fRe*den;\r
      ny = -fIm*den;\r
    }\r
    case 43u: { // Nova 2 variant\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
      let zx4 = zx2*zx2 - zy2*zy2;\r
      let zy4 = 2.0*zx2*zy2;\r
      let fRe = 1.3333333*qx - 0.3333333*zx4 + ccx;\r
      let fIm = 1.3333333*qy - 0.3333333*zy4 + ccy;\r
      let invR2 = 1.0/(fRe*fRe + fIm*fIm + 1e-9);\r
      nx = fRe*invR2;\r
      ny = -fIm*invR2;\r
    }\r
    case 44u: { // Quartic-Nova\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
      let zx3 = zx2*qx - zy2*qy;\r
      let zy3 = zx2*qy + zy2*qx;\r
      let zx4 = zx3*qx - zy3*qy;\r
      let zy4 = zx3*qy + zy3*qx;\r
      let numx = zx4 - 1.0;\r
      let numy = zy4;\r
      let denx = 4.0*(zx2*qx - zy2*qy);\r
      let deny = 4.0*(zx2*qy + zy2*qx);\r
      let den2 = denx*denx + deny*deny + 1e-9;\r
      let divx = (numx*denx + numy*deny)/den2;\r
      let divy = (numy*denx - numx*deny)/den2;\r
      nx = qx - divx + ccx;\r
      ny = qy - divy + ccy;\r
    }\r
case 45u: { // Flower Nova\r
  // seed z0 = c on first iteration\r
  var zx0 = qx;\r
  var zy0 = qy;\r
  if (iter == 0u) {\r
    zx0 = cx;\r
    zy0 = cy;\r
  }\r
  // build z^2\r
  let zx2 = zx0*zx0 - zy0*zy0;\r
  let zy2 = 2.0*zx0*zy0;\r
  // build z^3 and z^4\r
  let zx3 = zx2*zx0 - zy2*zy0;\r
  let zy3 = zx2*zy0 + zy2*zx0;\r
  let zx4 = zx3*zx0 - zy3*zy0;\r
  let zy4 = zx3*zy0 + zy3*zx0;\r
  // Newton-style divisor = 4*z^3\r
  let denx = 4.0*zx3;\r
  let deny = 4.0*zy3;\r
  let den2 = denx*denx + deny*deny + 1e-9;\r
  // numerator = z^4 \u2013 1\r
  let numx = zx4 - 1.0;\r
  let numy = zy4;\r
  // (z^4\u20131)/(4z^3)\r
  let divx = (numx*denx + numy*deny) / den2;\r
  let divy = (numy*denx - numx*deny) / den2;\r
  // forward candidate: z \u2013 (...) + c\xB7s\r
  let fx = zx0 - divx + ccx;\r
  let fy = zy0 - divy + ccy;\r
  // NEGATE the result\r
  nx = -fx;\r
  ny = -fy;\r
  break;\r
}\r
case 46u: { // Scatter-Nova\r
  // seed z0 = c on first iteration\r
  var zx0 = qx;\r
  var zy0 = qy;\r
  if (iter == 0u) {\r
    zx0 = cx;\r
    zy0 = cy;\r
  }\r
  // build z^2\r
  let zx2 = zx0*zx0 - zy0*zy0;\r
  let zy2 = 2.0*zx0*zy0;\r
  // build z^3 and z^4\r
  let zx3 = zx2*zx0 - zy2*zy0;\r
  let zy3 = zx2*zy0 + zy2*zx0;\r
  let zx4 = zx3*zx0 - zy3*zy0;\r
  let zy4 = zx3*zy0 + zy3*zx0;\r
  // denominator = 4*z^3\r
  let denx = 4.0*zx3;\r
  let deny = 4.0*zy3;\r
  let den2 = denx*denx + deny*deny + 1e-9;\r
  // numerator = z^4 \u2013 1\r
  let numx = zx4 - 1.0;\r
  let numy = zy4;\r
  // (z^4\u20131)/(4z^3)\r
  let divx = (numx*denx + numy*deny) / den2;\r
  let divy = (numy*denx - numx*deny) / den2;\r
  // forward Newton candidate: z \u2013 (...) + c\xB7s\r
  let fx = zx0 - divx + ccx;\r
  let fy = zy0 - divy + ccy;\r
  // invert: z_{n+1} = 1 / f\r
  let invR2 = 1.0 / (fx*fx + fy*fy + 1e-9);\r
  nx = fx * invR2;\r
  ny = -fy * invR2;\r
  break;\r
}\r
\r
\r
// 47: Twisted-Flower Nova \u2014 flower nova with an iteration-dependent angular twist\r
case 47u: {\r
    // seed exactly like Flower-Nova\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx; zy0 = cy;\r
    }\r
    // compute z^2, z^3, z^4\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    // Newton-style divisor and numerator\r
    let denx = 4.0*zx3;\r
    let deny = 4.0*zy3;\r
    let den2 = denx*denx + deny*deny + 1e-9;\r
    let numx = zx4 - 1.0;\r
    let numy = zy4;\r
    let divx = (numx*denx + numy*deny) / den2;\r
    let divy = (numy*denx - numx*deny) / den2;\r
    // forward candidate\r
    let fx = zx0 - divx + ccx;\r
    let fy = zy0 - divy + ccy;\r
    // twist it: convert to polar, add a sin-based perturbation\r
    let r = length(vec2<f32>(fx, fy));\r
    let theta = atan2(fy, fx);\r
    let twist = theta + gamma * 2.0 * 3.14159265 * sin(f32(iter) * 0.2);\r
    nx = r * cos(twist);\r
    ny = r * sin(twist);\r
    npx = qx;\r
    npy = qy;\r
    break;\r
}\r
\r
// 48: Lobed-Scatter Nova \u2014 scatter nova with petal-like lobes\r
case 48u: {\r
    // seed like Scatter-Nova\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
    // same numerator/denominator as case 46\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numx = zx4 - 1.0;\r
    let numy = zy4;\r
    let denx = 4.0*zx3;\r
    let deny = 4.0*zy3;\r
    let den2 = denx*denx + deny*deny + 1e-9;\r
    let divx = (numx*denx + numy*deny) / den2;\r
    let divy = (numy*denx - numx*deny) / den2;\r
    let fx = zx0 - divx + ccx;\r
    let fy = zy0 - divy + ccy;\r
    // invert (scatter nova core)\r
    let invR2 = 1.0 / (fx*fx + fy*fy + 1e-9);\r
    var sx = fx * invR2;\r
    var sy = -fy * invR2;\r
    // petal lobes: modulate radius by cos(lobes*angle)\r
    let ang = atan2(sy, sx);\r
    let r0  = length(vec2<f32>(sx, sy));\r
    let lobes = 5.0 + sin(gamma * 10.0);  // 5\u201315 lobes\r
    let petal = 1.0 + 0.3 * cos(ang * lobes + f32(iter) * 0.15);\r
    nx = sx * petal;\r
    ny = sy * petal;\r
    npx = qx;\r
    npy = qy;\r
    break;\r
}\r
// 49: Hybrid-FlScatter Nova\r
case 49u: {\r
    // seed exactly like Flower/Scatter\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // Flower part\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invDenF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fxF = zx0 - ((numxF*denxF + numyF*denyF) * invDenF) + ccx;\r
    let fyF = zy0 - ((numyF*denxF - numxF*denyF) * invDenF) + ccy;\r
    // Scatter part\r
    let invR2 = 1.0 / (fxF*fxF + fyF*fyF + 1e-9);\r
    let sx    = fxF * invR2;\r
    let sy    = -fyF * invR2;\r
    // blend\r
    let blend = 0.5 + 0.5 * sin(gamma * 3.14159265 + f32(iter) * 0.05);\r
    nx = mix(fxF, sx, blend);\r
    ny = mix(fyF, sy, blend);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 50: Fractional-Nova (p \u2248 3.7)\r
case 50u: {\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    let p   = 3.7;\r
    let r0  = length(vec2<f32>(zx0, zy0));\r
    let theta0 = atan2(zy0, zx0);\r
    // z^p\r
    let rp  = pow(r0, p);\r
    let xp  = rp * cos(p * theta0);\r
    let yp  = rp * sin(p * theta0);\r
    // z^(p-1)\r
    let rm1 = pow(r0, p - 1.0);\r
    let xm1 = rm1 * cos((p - 1.0) * theta0);\r
    let ym1 = rm1 * sin((p - 1.0) * theta0);\r
    // Newton step\r
    let denx = p * xm1;\r
    let deny = p * ym1;\r
    let d2   = denx*denx + deny*deny + 1e-9;\r
    let divx = ((xp - 1.0) * denx + yp * deny) / d2;\r
    let divy = ( yp * denx - (xp - 1.0) * deny) / d2;\r
    nx = zx0 - divx + ccx;\r
    ny = zy0 - divy + ccy;\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 51: Kaleido-Nova (n-fold mirrored petals)\r
case 51u: {\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // Flower-Nova base\r
    let zx2   = zx0*zx0 - zy0*zy0;\r
    let zy2   = 2.0*zx0*zy0;\r
    let zx3   = zx2*zx0 - zy2*zy0;\r
    let zy3   = zx2*zy0 + zy2*zx0;\r
    let zx4   = zx3*zx0 - zy3*zy0;\r
    let zy4   = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invDen = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invDen) + ccx;\r
    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invDen) + ccy;\r
\r
    // kaleidoscope mirror\r
    let sect   = 7.0;\r
    let slice  = 2.0 * 3.14159265 / sect;\r
    let angle  = atan2(fy, fx);\r
    // manual mod: a2 = angle % slice\r
    let aDiv  = floor(angle / slice);\r
    let a2    = angle - aDiv * slice;\r
    // reflect\r
    var aMir: f32;\r
    if (a2 < slice * 0.5) {\r
        aMir = a2;\r
    } else {\r
        aMir = slice - a2;\r
    }\r
    let angK  = aDiv * slice + aMir;\r
    let rad0  = length(vec2<f32>(fx, fy));\r
    nx = rad0 * cos(angK);\r
    ny = rad0 * sin(angK);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 52: Cross-Nova (alternate seeds between c and dx,dy)\r
case 52u: {\r
    // seed exactly like the others\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // pick sx, sy without select\r
    var sx = cx;\r
    var sy = cy;\r
    if ((iter & 1u) == 1u) {\r
        sx = params.dx;\r
        sy = params.dy;\r
    }\r
    // shift z by the difference\r
    let ux0 = zx0 + (sx - cx);\r
    let uy0 = zy0 + (sy - cy);\r
    // build powers\r
    let ux2 = ux0*ux0 - uy0*uy0;\r
    let uy2 = 2.0*ux0*uy0;\r
    let ux3 = ux2*ux0 - uy2*uy0;\r
    let uy3 = ux2*uy0 + uy2*ux0;\r
    let ux4 = ux3*ux0 - uy3*uy0;\r
    let uy4 = ux3*uy0 + uy3*ux0;\r
    // Newton numerator/denominator\r
    let numx = ux4 - 1.0;\r
    let numy = uy4;\r
    let denx = 4.0*ux3;\r
    let deny = 4.0*uy3;\r
    let invD = 1.0 / (denx*denx + deny*deny + 1e-9);\r
    let divx = (numx*denx + numy*deny) * invD;\r
    let divy = (numy*denx - numx*deny) * invD;\r
    // next z\r
    let fx = ux0 - divx + ccx;\r
    let fy = uy0 - divy + ccy;\r
    nx = fx;\r
    ny = fy;\r
    npx = qx;\r
    npy = qy;\r
    break;\r
}\r
\r
// 53: Mirror-Nova (flip axes each step)\r
case 53u: {\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // Flower-Nova base\r
    let zx2   = zx0*zx0 - zy0*zy0;\r
    let zy2   = 2.0*zx0*zy0;\r
    let zx3   = zx2*zx0 - zy2*zy0;\r
    let zy3   = zx2*zy0 + zy2*zx0;\r
    let zx4   = zx3*zx0 - zy3*zy0;\r
    let zy4   = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invD  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r
    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r
\r
    if ((iter & 1u) == 0u) {\r
        nx = -fx; ny = fy;\r
    } else {\r
        nx = fx;  ny = -fy;\r
    }\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 54: Spiro-Nova (Lissajous perturb)\r
case 54u: {\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // Flower-Nova base\r
    let zx2   = zx0*zx0 - zy0*zy0;\r
    let zy2   = 2.0*zx0*zy0;\r
    let zx3   = zx2*zx0 - zy2*zy0;\r
    let zy3   = zx2*zy0 + zy2*zx0;\r
    let zx4   = zx3*zx0 - zy3*zy0;\r
    let zy4   = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invD  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r
    let fy    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r
\r
    // spiro perturb\r
    let theta   = atan2(fy, fx);\r
    let r0      = length(vec2<f32>(fx, fy));\r
    // manual "mod" for gamma*5.0 % 4.0\r
    let tmpA    = gamma * 5.0;\r
    let aDiv    = floor(tmpA / 4.0);\r
    let freqA   = tmpA - aDiv * 4.0;\r
    let aFreq   = 3.0 + freqA;\r
    // manual "mod" for gamma*7.0 % 5.0\r
    let tmpB    = gamma * 7.0;\r
    let bDiv    = floor(tmpB / 5.0);\r
    let freqB   = tmpB - bDiv * 5.0;\r
    let bFreq   = 4.0 + freqB;\r
    let amp     = 0.2 + 0.1 * sin(f32(iter) * 0.1);\r
\r
    nx = (r0 + amp * sin(aFreq * theta)) * cos(theta + amp * cos(bFreq * theta));\r
    ny = (r0 + amp * sin(aFreq * theta)) * sin(theta + amp * cos(bFreq * theta));\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 55: Vibrant-Nova (radial wave bloom)\r
case 55u: {\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // Flower-Nova base\r
    let zx2   = zx0*zx0 - zy0*zy0;\r
    let zy2   = 2.0*zx0*zy0;\r
    let zx3   = zx2*zx0 - zy2*zy0;\r
    let zy3   = zx2*zy0 + zy2*zx0;\r
    let zx4   = zx3*zx0 - zy3*zy0;\r
    let zy4   = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invD   = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx     = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r
    let fy     = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r
\r
    let r0      = length(vec2<f32>(fx, fy));\r
    let theta   = atan2(fy, fx);\r
    let wave    = 1.0 + 0.3 * sin(6.0*theta + f32(iter)*0.2 + gamma*10.0);\r
\r
    nx = r0 * wave * cos(theta);\r
    ny = r0 * wave * sin(theta);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
// 56: Julia-Nova Hybrid \u2014 blends a fixed Julia seed with Newton steps\r
case 56u: {\r
    // julia constant from pan (dx,dy)\r
    let jx = params.dx;\r
    let jy = params.dy;\r
    // seed z\u2080 = c for iter 0, else previous z\r
    var zx0 = qx;\r
    var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx;\r
        zy0 = cy;\r
    }\r
    // apply Newton on z, then add julia twist\r
    // build z^2, z^3\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    // numerator/denominator for z^3\u22121 / (3\xB7z\xB2)\r
    let numx = zx3 - 1.0;\r
    let numy = zy3;\r
    let denx = 3.0*zx2;\r
    let deny = 3.0*zy2;\r
    let invD = 1.0 / (denx*denx + deny*deny + 1e-9);\r
    let divx = (numx*denx + numy*deny) * invD;\r
    let divy = (numy*denx - numx*deny) * invD;\r
    let fx = zx0 - divx + ccx;\r
    let fy = zy0 - divy + ccy;\r
    // julia twist: z \u2190 z + \u03B1\xB7(z\u2080 - j)\r
    let alpha = 0.3 + 0.2 * sin(gamma * 6.28);\r
    nx = fx + alpha * (fx - jx);\r
    ny = fy + alpha * (fy - jy);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 57: Inverse-Spiral Nova \u2014 scatter-nova with a logarithmic spiral warp\r
case 57u: {\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
    // do scatter-nova core (case 46)\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numx = zx4 - 1.0; let numy = zy4;\r
    let denx = 4.0*zx3; let deny = 4.0*zy3;\r
    let invD = 1.0/(denx*denx + deny*deny + 1e-9);\r
    let fx   = zx0 - (numx*denx + numy*deny)*invD + ccx;\r
    let fy   = zy0 - (numy*denx - numx*deny)*invD + ccy;\r
    let invR2= 1.0/(fx*fx + fy*fy + 1e-9);\r
    var sx   = fx * invR2; var sy = -fy * invR2;\r
    // warp into logarithmic spiral: radius \u2190 r\xB7exp(\u03B2\xB7\u03B8)\r
    let \u03B8 = atan2(sy, sx);\r
    let r = length(vec2<f32>(sx, sy));\r
    let beta = 0.1 + 0.05*sin(f32(iter)*0.2);\r
    let rw = r * exp(beta * \u03B8);\r
    nx = rw * cos(\u03B8);\r
    ny = rw * sin(\u03B8);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 58: Wavefront Nova \u2014 introduces a radial sine-wave front each few iterations\r
case 58u: {\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
    // build z^2, z^3, z^4\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    // Newton step divisor/numerator\r
    let denx = 4.0*zx3; let deny = 4.0*zy3;\r
    let numx = zx4 - 1.0; let numy = zy4;\r
    let invD = 1.0/(denx*denx + deny*deny + 1e-9);\r
    let fx   = zx0 - (numx*denx + numy*deny)*invD + ccx;\r
    let fy   = zy0 - (numy*denx - numx*deny)*invD + ccy;\r
    // apply a circular wavefront that pulses every N steps\r
    let r0    = length(vec2<f32>(fx, fy));\r
    let phase = sin(f32(iter) * 0.3 + gamma * 12.0);\r
    let offset= 0.2 * phase * sin(8.0 * r0);\r
    let r1    = max(0.0, r0 + offset);\r
    let \u03B8     = atan2(fy, fx);\r
    nx = r1 * cos(\u03B8);\r
    ny = r1 * sin(\u03B8);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 59: Vortex-Nova \u2014 a smooth swirl after a Flower-Nova iteration\r
case 59u: {\r
    // seed like Flower-Nova\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx; zy0 = cy;\r
    }\r
    // Flower-Nova forward step\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invD = 1.0/(denxF*denxF + denyF*denyF + 1e-9);\r
    let fx = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r
    let fy = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r
\r
    // apply a vortex swirl: rotate by angle \u221D exp(-r)\r
    let r   = length(vec2<f32>(fx, fy));\r
    let baseAngle = atan2(fy, fx);\r
    let swirlAmt  = 1.5 * exp(-r * 2.0);      // adjust decay\r
    let angle2    = baseAngle + swirlAmt;\r
    nx = r * cos(angle2);\r
    ny = r * sin(angle2);\r
\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 60: Sine-Ring Nova \u2014 Flower-Nova + smooth sinusoidal rings\r
case 60u: {\r
    // seed like Flower-Nova\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx; zy0 = cy;\r
    }\r
    // Flower-Nova forward step\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invD   = 1.0/(denxF*denxF + denyF*denyF + 1e-9);\r
    let fx0    = zx0 - ((numxF*denxF + numyF*denyF) * invD) + ccx;\r
    let fy0    = zy0 - ((numyF*denxF - numxF*denyF) * invD) + ccy;\r
\r
    // radial sine rings\r
    let r0    = length(vec2<f32>(fx0, fy0));\r
    let \u03B8     = atan2(fy0, fx0);\r
    let freq  = 10.0 + 5.0 * sin(gamma * 6.2831853);  // 5\u201315 rings\r
    let amp   = 0.1 + 0.05 * cos(f32(iter) * 0.1);\r
    let ring  = r0 + amp * sin(freq * r0);\r
    nx = ring * cos(\u03B8);\r
    ny = ring * sin(\u03B8);\r
\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 57: Inverse-Spiral Nova \u2014 less jumpy, gentler spiral warp\r
case 61u: {\r
    // seed\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) {\r
        zx0 = cx; zy0 = cy;\r
    }\r
    // do the \u201Cscatter\u201D core (same as case 46) to get sx, sy:\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numx = zx4 - 1.0;   let numy = zy4;\r
    let denx = 4.0*zx3;     let deny = 4.0*zy3;\r
    let invD = 1.0/(denx*denx + deny*deny + 1e-9);\r
    let fx0  = zx0 - (numx*denx + numy*deny)*invD + ccx;\r
    let fy0  = zy0 - (numy*denx - numx*deny)*invD + ccy;\r
    let invR2= 1.0/(fx0*fx0 + fy0*fy0 + 1e-9);\r
    let sx   = fx0 * invR2;\r
    let sy   = -fy0 * invR2;\r
\r
    // smooth spiral warp\r
    let \u03B8    = atan2(sy, sx);\r
    let r    = length(vec2<f32>(sx, sy));\r
    // normalize \u03B8 to [\u20131,1]\r
    let t    = \u03B8 / 3.14159265;\r
    // gentle exponent factor in [0.8,1.2]\r
    let beta = 1.0 + 0.2 * t;\r
    let rw   = pow(r, beta);\r
\r
    nx = rw * cos(\u03B8);\r
    ny = rw * sin(\u03B8);\r
    npx = qx; npy = qy;\r
    break;\r
}\r
// 62: Inverse-Vortex Nova \u2014 swirl first, then invert\r
case 62u: {\r
    // same seed + Flower\u2010Nova forward as case 59\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
    // Flower\u2010Nova step\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invDF  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx0    = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r
    let fy0    = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r
\r
    // swirl warp\r
    let r   = length(vec2<f32>(fx0, fy0));\r
    let \u03B8   = atan2(fy0, fx0);\r
    let swirlAmt = 1.5 * exp(-r * 2.0);\r
    let \u03B82  = \u03B8 + swirlAmt;\r
    var vx  = r * cos(\u03B82);\r
    var vy  = r * sin(\u03B82);\r
\r
    // inverse 1/z\r
    let invR2 = 1.0 / (vx*vx + vy*vy + 1e-9);\r
    nx = vx * invR2;\r
    ny = -vy * invR2;\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 63: Inverse\u2010Sine\u2010Ring Nova \u2014 ring warp then invert\r
case 63u: {\r
    // seed + Flower\u2010Nova forward as case 60\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
    let zx2 = zx0*zx0 - zy0*zy0;\r
    let zy2 = 2.0*zx0*zy0;\r
    let zx3 = zx2*zx0 - zy2*zy0;\r
    let zy3 = zx2*zy0 + zy2*zx0;\r
    let zx4 = zx3*zx0 - zy3*zy0;\r
    let zy4 = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invDF  = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx0    = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r
    let fy0    = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r
\r
    // sine\u2010ring warp\r
    let r0   = length(vec2<f32>(fx0, fy0));\r
    let \u03B8    = atan2(fy0, fx0);\r
    let freq = 10.0 + 5.0 * sin(gamma * 6.2831853);\r
    let amp  = 0.1 + 0.05 * cos(f32(iter) * 0.1);\r
    var rx  = r0 + amp * sin(freq * r0);\r
    var ry  = \u03B8;\r
\r
    let sx = rx * cos(ry);\r
    let sy = rx * sin(ry);\r
\r
    // inverse 1/z\r
    let invR2 = 1.0 / (sx*sx + sy*sy + 1e-9);\r
    nx = sx * invR2;\r
    ny = -sy * invR2;\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 64: Inverse-Mirror Nova \u2014 flip axes then 1/z\r
case 64u: {\r
    // seed like Mirror-Nova\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
\r
    // Flower-Nova base\r
    let zx2   = zx0*zx0 - zy0*zy0;\r
    let zy2   = 2.0*zx0*zy0;\r
    let zx3   = zx2*zx0 - zy2*zy0;\r
    let zy3   = zx2*zy0 + zy2*zx0;\r
    let zx4   = zx3*zx0 - zy3*zy0;\r
    let zy4   = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invDF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx0   = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r
    let fy0   = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r
\r
    // mirror flip\r
    var mx: f32; var my: f32;\r
    if ((iter & 1u) == 0u) {\r
        mx = -fx0; my = fy0;\r
    } else {\r
        mx =  fx0; my = -fy0;\r
    }\r
\r
    // invert\r
    let invR2 = 1.0 / (mx*mx + my*my + 1e-9);\r
    nx = mx * invR2;\r
    ny = -my * invR2;\r
    npx = qx; npy = qy;\r
    break;\r
}\r
\r
// 65: Inverse-Vibrant Nova \u2014 wave bloom then 1/z\r
case 65u: {\r
    // seed like Vibrant-Nova\r
    var zx0 = qx; var zy0 = qy;\r
    if (iter == 0u) { zx0 = cx; zy0 = cy; }\r
\r
    // Flower-Nova base\r
    let zx2   = zx0*zx0 - zy0*zy0;\r
    let zy2   = 2.0*zx0*zy0;\r
    let zx3   = zx2*zx0 - zy2*zy0;\r
    let zy3   = zx2*zy0 + zy2*zx0;\r
    let zx4   = zx3*zx0 - zy3*zy0;\r
    let zy4   = zx3*zy0 + zy3*zx0;\r
    let numxF = zx4 - 1.0;\r
    let numyF = zy4;\r
    let denxF = 4.0*zx3;\r
    let denyF = 4.0*zy3;\r
    let invDF = 1.0 / (denxF*denxF + denyF*denyF + 1e-9);\r
    let fx0   = zx0 - ((numxF*denxF + numyF*denyF)*invDF) + ccx;\r
    let fy0   = zy0 - ((numyF*denxF - numxF*denyF)*invDF) + ccy;\r
\r
    // radial wave bloom\r
    let r0     = length(vec2<f32>(fx0, fy0));\r
    let theta  = atan2(fy0, fx0);\r
    let wave   = 1.0 + 0.3 * sin(6.0*theta + f32(iter)*0.2 + gamma*10.0);\r
    let vx     = r0 * wave * cos(theta);\r
    let vy     = r0 * wave * sin(theta);\r
\r
    // invert\r
    let invR2  = 1.0 / (vx*vx + vy*vy + 1e-9);\r
    nx = vx * invR2;\r
    ny = -vy * invR2;\r
    npx = qx; npy = qy;\r
    break;\r
}\r
case 66u: {                // Golden\u2011Ratio Rational\r
    let phi  = 1.61803398875;\r
    //  c_repulsive  = (\u2212\u03C6  ,  +\u03C6)\r
    //  c_attractive = ( \u03C6\u22121,  0.5\u202F\u03C6)\r
    let crx = -phi;\r
    let cry =  phi;\r
    let cax =  phi - 1.0;\r
    let cay =  0.5 * phi;\r
\r
    // z\xB2 = (qx\xB2 \u2212 qy\xB2)  +  i(2\u202Fqx\u202Fqy)\r
    let zx2 = qx*qx - qy*qy;\r
    let zy2 = 2.0 * qx * qy;\r
\r
    // (z\xB2 + c_rep) / (z\xB2 + c_att)\r
    let numx = zx2 + crx;\r
    let numy = zy2 + cry;\r
    let denx = zx2 + cax;\r
    let deny = zy2 + cay;\r
    let den2 = denx*denx + deny*deny + 1e-9;\r
\r
    let divx = (numx*denx + numy*deny) / den2;\r
    let divy = (numy*denx - numx*deny) / den2;\r
\r
    nx = divx + ccx;\r
    ny = divy + ccy;\r
}\r
\r
case 67u: {                // SinCos\u2011Kernel\r
    /* sin(z) = sin(x)cosh(y)  +  i cos(x)sinh(y)\r
       cos(z) = cos(x)cosh(y)  \u2212  i sin(x)sinh(y)                        */\r
    let sinx = sin(qx) * cosh(qy);\r
    let siny =  cos(qx) * sinh(qy);\r
    let cosx = cos(qx) * cosh(qy);\r
    let cosy = -sin(qx) * sinh(qy);\r
\r
    // product: sin(z) * cos(z)\r
    let prodx = sinx*cosx - siny*cosy;\r
    let prody = sinx*cosy + siny*cosx;\r
\r
    nx = prodx + ccx;\r
    ny = prody + ccy;\r
}\r
/* 68 : Golden\u2011Push\u2011Pull  (blend of attractive & repulsive constants)\r
         z\u1D62\u208A\u2081 =  (z\xB2 + c_rep) / (z\xB2 + c_att)  +  mix(c_att , c_rep , \u03B2)\r
         where  \u03B2 = 0.5 + 0.5\xB7sin(iter\xB70.25) gives a gentle breathing  */\r
case 68u: {\r
    let phi  = 1.61803398875;\r
    let crex = -phi;  let crey =  phi;           // c_repulsive\r
    let caex =  phi-1.0; let caey = 0.5*phi;      // c_attractive\r
\r
    /* z\xB2 */\r
    let zx2 = qx*qx - qy*qy;\r
    let zy2 = 2.0*qx*qy;\r
\r
    /* (z\xB2 + c_rep) / (z\xB2 + c_att) */\r
    let numx = zx2 + crex;\r
    let numy = zy2 + crey;\r
    let denx = zx2 + caex;\r
    let deny = zy2 + caey;\r
    let den2 = denx*denx + deny*deny + 1e-9;\r
    let divx = (numx*denx + numy*deny) / den2;\r
    let divy = (numy*denx - numx*deny) / den2;\r
\r
    /* breathing blend between constants */\r
    let beta = 0.5 + 0.5 * sin(f32(iter) * 0.25);\r
    let mixx = caex * (1.0-beta) + crex * beta;\r
    let mixy = caey * (1.0-beta) + crey * beta;\r
\r
    nx = divx + mixx + ccx;\r
    ny = divy + mixy + ccy;\r
}\r
\r
/* 69 : Sinc\u2011Kernel   z\u1D62\u208A\u2081 = sinc(\u03C0\xB7z) + c   (sinc\u202Fz = sin\u202Fz / z)      */\r
case 69u: {\r
    let pi  = 3.14159265359;\r
    /* sin(\u03C0 z) \u2003\u2192 (a,b) */\r
    let sinX =  sin(pi*qx) * cosh(pi*qy);\r
    let sinY =  cos(pi*qx) * sinh(pi*qy);\r
\r
    /* denominator  \u03C0 z  = (c,d) */\r
    let denX = pi * qx;\r
    let denY = pi * qy;\r
    let den2 = denX*denX + denY*denY + 1e-9;\r
\r
    /* (a+ib)/(c+id) */\r
    let sincX = ( sinX*denX + sinY*denY) / den2;\r
    let sincY = ( sinY*denX - sinX*denY) / den2;\r
\r
    nx = sincX + ccx;\r
    ny = sincY + ccy;\r
  }\r
   \r
    // 70: Bizarre Grid\r
    case 70u: {\r
      var zx = qx;\r
      var zy = qy;\r
      if (iter == 0u) {\r
        zx = cx;\r
        zy = cy;\r
      }\r
\r
      if (zx > 1.0) {\r
        zx = 2.0 - zx;\r
      }\r
      if (zx < -1.0) {\r
        zx = -2.0 - zx;\r
      }\r
      if (zy > 1.0) {\r
        zy = 2.0 - zy;\r
      }\r
      if (zy < -1.0) {\r
        zy = -2.0 - zy;\r
      }\r
\r
      let r2 = zx*zx + zy*zy;\r
      var scale = 1.0;\r
      let Rmin2 = 0.25;\r
      let Rmax2 = 2.25;\r
\r
      if (r2 < Rmin2) {\r
        scale = Rmax2 / Rmin2;\r
      } else if (r2 < Rmax2) {\r
        scale = Rmax2 / r2;\r
      }\r
\r
      zx = zx * scale * 1.5;\r
      zy = zy * scale * 1.5;\r
\r
      let kx = params.dx;\r
      let ky = params.dy;\r
\r
      nx = zx + kx;\r
      ny = zy + ky;\r
    }\r
\r
    // 71: Julia (z\xB2 + k, z\u2080 = c, k = dx + i dy)\r
    case 71u: {\r
      let kx = params.dx;\r
      let ky = params.dy;\r
\r
      let zx2 = qx*qx - qy*qy;\r
      let zy2 = 2.0*qx*qy;\r
\r
      nx = zx2 + kx + 0.3; //offset to not get a perfect circle\r
      ny = zy2 + ky + 0.5;\r
    }\r
\r
\r
\r
\r
    default: { // Mandelbrot\r
      nx = qx*qx - qy*qy + ccx;\r
      ny = 2.0*qx*qy + ccy;\r
    }\r
  }\r
  return FractalResult(nx, ny, npx, npy);\r
}\r
\r
@compute @workgroup_size(8,8,1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  // Local index within this strip texture\r
  let lx = gid.x;\r
  let ly = gid.y;\r
\r
  // Skip threads that fall outside the strip bounds for this dispatch\r
  if (lx >= params.tileWidth || ly >= params.tileHeight) {\r
    return;\r
  }\r
\r
  // Global index within the *full* fractal grid (e.g. 8192\xD78192)\r
  let gx = params.tileOffsetX + lx;\r
  let gy = params.tileOffsetY + ly;\r
\r
  // Skip anything that lies outside the global grid\r
  if (gx >= params.gridSize || gy >= params.gridSize) {\r
    return;\r
  }\r
\r
  // Normalized coordinates across the full grid [0,1]\r
  // gridSize should be the full resolution (8192), not the strip size.\r
  let invF = 1.0 / f32(params.gridSize - 1u);\r
  let nxFull = f32(gx) * invF;\r
  let nyFull = f32(gy) * invF;\r
\r
  // Center at zero, maintain aspect so it is not stretched\r
  let centeredX = (nxFull - 0.5) * params.aspect;\r
  let centeredY = (nyFull - 0.5);\r
\r
  // Zoom + pan \u2013 zoom is the size of the window in complex space\r
  let cx = centeredX * params.zoom + params.dx;\r
  let cy = centeredY * params.zoom + params.dy;\r
\r
  var init = getInitialZ(params.fractalType, cx, cy);\r
  var qx = init.qx;\r
  var qy = init.qy;\r
  var px = init.px;\r
  var py = init.py;\r
\r
  var iter: u32 = 0u;\r
  let escapeR2 = params.escapeR * params.escapeR;\r
\r
  loop {\r
    if (iter >= params.maxIter) {\r
      break;\r
    }\r
    if (qx*qx + qy*qy > escapeR2) {\r
      break;\r
    }\r
\r
    let res = computeFractal(\r
      params.fractalType, qx, qy, px, py,\r
      cx, cy, params.gamma, iter, params.scaleMode\r
    );\r
\r
    let nxz = res.nx;\r
    let nyz = res.ny;\r
    let npx = res.npx;\r
    let npy = res.npy;\r
\r
    if (params.convergenceTest == 1u) {\r
      if (params.escapeMode == 1u) {\r
        if (nxz*nxz + nyz*nyz > escapeR2) {\r
          iter = iter + 1u;\r
          break;\r
        }\r
      } else {\r
        let dx_ = nxz - qx;\r
        let dy_ = nyz - qy;\r
        if (dx_*dx_ + dy_*dy_ < params.epsilon * params.epsilon) {\r
          iter = iter + 1u;\r
          break;\r
        }\r
      }\r
    } else {\r
      if (nxz*nxz + nyz*nyz > escapeR2) {\r
        iter = iter + 1u;\r
        break;\r
      }\r
    }\r
\r
    px = npx; py = npy;\r
    qx = nxz; qy = nyz;\r
    iter = iter + 1u;\r
  }\r
\r
  let ratio = f32(iter) / f32(params.maxIter);\r
  let col = vec4<f32>(ratio, ratio, ratio, 1.0);\r
\r
  // IMPORTANT: write into the strip texture at local coords\r
  textureStore(\r
    storageTex,\r
    vec2<i32>(i32(lx), i32(ly)),\r
    i32(params.layerIndex),\r
    col\r
  );\r
}\r
\r
\r
`;

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
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform", hasDynamicOffset: true, minBindingSize: this.uniformStride }
        }]
      });
      this._storageLayout = storageLayout ?? device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: "rgba8unorm", viewDimension: "2d-array" }
        }]
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
     * Textures are allocated as 2D-array where each array layer represents a fractal 'layer'.
     *
     * @param {number} gridSize
     * @param {number} splitCount
     * @param {number} layers
     * @returns {FractalChunk[]}
     */
    _ensureTextures(gridSize, splitCount, layers = 1) {
      if (this._layout.gridSize === gridSize && this._layout.splitCount === splitCount && this._layout.layers === layers && Array.isArray(this.chunks) && this.chunks.length > 0) {
        return this.chunks;
      }
      for (const c of this.chunks) {
        try {
          if (c.fractalTex) c.fractalTex.destroy();
        } catch (e) {
        }
      }
      this.chunks.length = 0;
      const G = gridSize;
      const tileH = G;
      const tileW = Math.min(G, Math.max(1, Math.floor(splitCount / tileH)));
      const numX = Math.ceil(G / tileW);
      for (let tx = 0; tx < numX; ++tx) {
        const offX = tx * tileW;
        const w = Math.min(tileW, G - offX);
        if (!w) continue;
        const fractalTex = this.device.createTexture({
          size: [w, tileH, layers],
          format: "rgba8unorm",
          usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
        });
        const layerViews = new Array(layers);
        for (let L = 0; L < layers; ++L) {
          layerViews[L] = fractalTex.createView({
            dimension: "2d-array",
            baseArrayLayer: L,
            arrayLayerCount: 1
          });
        }
        this.chunks.push({
          offsetX: offX,
          offsetY: 0,
          width: w,
          height: tileH,
          fractalTex,
          layerViews,
          layerBindGroups: /* @__PURE__ */ new Map()
        });
      }
      this._layout = { gridSize, splitCount, layers };
      return this.chunks;
    }
    /**
     * Pack the dynamic uniform block for a tile.
     * Field order must match the WGSL struct.
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
      dv.setUint32(o, params.gridSize, true);
      o += 4;
      dv.setUint32(o, params.maxIter, true);
      o += 4;
      dv.setUint32(o, params.fractalType ?? FRACTALS.Mandelbrot, true);
      o += 4;
      dv.setUint32(o, params.scaleMode ?? 0, true);
      o += 4;
      dv.setFloat32(o, params.zoom ?? 1, true);
      o += 4;
      dv.setFloat32(o, params.dx ?? 0, true);
      o += 4;
      dv.setFloat32(o, params.dy ?? 0, true);
      o += 4;
      dv.setFloat32(o, params.escapeR ?? 4, true);
      o += 4;
      dv.setFloat32(o, params.gamma ?? 1, true);
      o += 4;
      dv.setUint32(o, layerIdx >>> 0, true);
      o += 4;
      dv.setFloat32(o, params.epsilon ?? 1e-6, true);
      o += 4;
      dv.setUint32(o, params.convergenceTest ? 1 : 0, true);
      o += 4;
      dv.setUint32(o, params.escapeMode ?? 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.offsetX >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.offsetY >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.width >>> 0, true);
      o += 4;
      dv.setUint32(o, tileInfo.height >>> 0, true);
      o += 4;
      dv.setFloat32(o, aspect, true);
      o += 4;
      return buf;
    }
    /**
     * Compute a single layer (writes to each chunk's corresponding array-layer).
     *
     * Note: callers can pass `requestedLayers` to ensure textures are allocated
     *       with enough array-layers before the write (useful when generating
     *       series of layers or a layered texture).
     *
     * @param {FractalParams} paramsState
     * @param {number} layerIndex
     * @param {number} [aspect=1]
     * @param {string} [entryPoint='main']
     * @param {number} [requestedLayers=1]
     * @returns {Promise<FractalChunk[]>}
     */
    async compute(paramsState, layerIndex, aspect = 1, entryPoint = "main", requestedLayers = 1) {
      const chunks = this._ensureTextures(paramsState.gridSize, paramsState.splitCount, Math.max(1, requestedLayers | 0));
      const N = chunks.length;
      if (N === 0) return chunks;
      const bigUBO = this.device.createBuffer({
        size: this.uniformStride * N,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      for (let i = 0; i < N; ++i) {
        const block = this._pack(paramsState, chunks[i], layerIndex >>> 0, aspect);
        this.device.queue.writeBuffer(bigUBO, i * this.uniformStride, block);
      }
      const uBG = this.device.createBindGroup({
        layout: this._uniformsLayout,
        entries: [{ binding: 0, resource: { buffer: bigUBO, size: this.uniformStride } }]
      });
      const pipeline = this._pipeline(entryPoint);
      const enc = this.device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(pipeline);
      for (let i = 0; i < N; ++i) {
        const c = chunks[i];
        const key = layerIndex >>> 0;
        let bg = c.layerBindGroups.get(key);
        if (!bg) {
          const view = c.layerViews[key];
          bg = this.device.createBindGroup({
            layout: this._storageLayout,
            entries: [{ binding: 0, resource: view }]
          });
          c.layerBindGroups.set(key, bg);
        }
        pass.setBindGroup(0, uBG, [i * this.uniformStride]);
        pass.setBindGroup(1, bg);
        pass.dispatchWorkgroups(Math.ceil(c.width / 8), Math.ceil(c.height / 8), 1);
      }
      pass.end();
      try {
        this.device.queue.submit([enc.finish()]);
        await this.device.queue.onSubmittedWorkDone();
      } catch (err) {
        console.error("FractalTileComputeGPU.compute: GPU submit failed", err);
        throw err;
      }
      return chunks;
    }
    /**
     * Compute `count` layers consecutively into the texture array, interpolating
     * gamma across the range [gammaStart .. gammaStart+gammaRange].
     *
     * This convenience method ensures the internal textures have `count` layers.
     *
     * @param {FractalParams} paramsState
     * @param {number} gammaStart
     * @param {number} gammaRange
     * @param {number} count
     * @param {number} [aspect=1]
     * @param {string} [entryPoint='main']
     * @returns {Promise<FractalChunk[]>}
     */
    async computeLayerSeries(paramsState, gammaStart, gammaRange, count, aspect = 1, entryPoint = "main") {
      const requestedLayers = Math.max(1, count >>> 0);
      this._ensureTextures(paramsState.gridSize, paramsState.splitCount, requestedLayers);
      const originalGamma = paramsState.gamma;
      try {
        for (let i = 0; i < requestedLayers; ++i) {
          const t = requestedLayers === 1 ? 0 : i / (requestedLayers - 1);
          paramsState.gamma = gammaStart + t * gammaRange;
          await this.compute(paramsState, i, aspect, entryPoint, requestedLayers);
        }
      } finally {
        paramsState.gamma = originalGamma;
      }
      return this.chunks;
    }
    /** Return chunks array (read-only-ish) */
    getChunks() {
      return this.chunks;
    }
    /** Destroy owned GPU resources */
    destroy() {
      for (const c of this.chunks) {
        try {
          if (c.fractalTex) c.fractalTex.destroy();
        } catch (e) {
        }
        if (c.layerBindGroups) c.layerBindGroups.clear();
        c.layerViews = null;
      }
      this.chunks.length = 0;
      this._layout = { gridSize: 0, splitCount: 0, layers: 0 };
      this._pipeCache.clear();
    }
    /** Clear pipeline cache (useful when shader module is replaced) */
    clearPipelineCache() {
      this._pipeCache.clear();
    }
  };

  // shaders/fsdfCompute.wgsl
  var fsdfCompute_default = "// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\r\n//  SDF + Normal + Connectivity   (compute entry: main)\r\n//  \u2013 works with horizontal strip tiling \u2013\r\n// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\r\n\r\nstruct SDFParams {\r\n    gridSize        : u32,   // full fractal resolution (square)\r\n    layerIndex      : u32,\r\n    tileOffsetX     : u32,   // unused once we switch to local coords\r\n    tileOffsetY     : u32,\r\n    tileWidth       : u32,   // local X range of this texture view\r\n    tileHeight      : u32,   // = gridSize in current layout (full height)\r\n    dispAmp         : f32,\r\n    quadScale       : f32,\r\n    slopeLimit      : f32,\r\n    wallJump        : f32,\r\n    connectivityMode: u32,   // 0=2-way , 1=4-way , 2=8-way\r\n    dispMode        : u32,\r\n    dispCurve       : f32,\r\n    normalMode      : u32,   // 0=2-sample , 1=4-sample , 2=8-sample\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> sdfParams : SDFParams;\r\n\r\n@group(1) @binding(0) var fractalTex : texture_storage_2d_array<rgba8unorm , read >;\r\n@group(1) @binding(1) var sdfTex     : texture_storage_2d_array<rgba16float, write>;\r\n@group(1) @binding(2) var flagTex    : texture_storage_2d_array<r32uint   , write>;\r\n\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 helper functions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nfn computeHnorm(v: f32) -> f32 {\r\n    switch (sdfParams.dispMode) {\r\n        case 1u  { return v; }\r\n        case 2u  { return 1.0 - v; }\r\n        case 3u, 4u {\r\n            let k = sdfParams.dispCurve;\r\n            let x = select(v, 1.0 - v, sdfParams.dispMode == 4u);\r\n            return log(1.0 + k * x) / log(1.0 + k);\r\n        }\r\n        case 5u, 6u {\r\n            let p = max(sdfParams.dispCurve, 1e-4);\r\n            let x = select(v, 1.0 - v, sdfParams.dispMode == 6u);\r\n            return pow(x, p);\r\n        }\r\n        default  { return 0.0; }\r\n    }\r\n}\r\n\r\n/*  Clamp X to tile-width (local) and Y to full grid (global). */\r\nfn clampLocal(px: i32, py: i32, w: i32, h: i32) -> vec2<i32> {\r\n    return vec2<i32>(clamp(px, 0, w - 1),\r\n                     clamp(py, 0, h - 1));\r\n}\r\n\r\n/*  4-sample normal (cross) */\r\nfn normal4(px: i32, py: i32, L: i32,\r\n           w: i32, h: i32, ws: f32, dScalar: f32) -> vec3<f32> {\r\n\r\n    let uvL = clampLocal(px - 1, py,     w, h);\r\n    let uvR = clampLocal(px + 1, py,     w, h);\r\n    let uvD = clampLocal(px,     py - 1, w, h);\r\n    let uvU = clampLocal(px,     py + 1, w, h);\r\n\r\n    let hL = computeHnorm(textureLoad(fractalTex, uvL, L).r) * dScalar;\r\n    let hR = computeHnorm(textureLoad(fractalTex, uvR, L).r) * dScalar;\r\n    let hD = computeHnorm(textureLoad(fractalTex, uvD, L).r) * dScalar;\r\n    let hU = computeHnorm(textureLoad(fractalTex, uvU, L).r) * dScalar;\r\n\r\n    let dx = (hR - hL) * 0.5;\r\n    let dy = (hU - hD) * 0.5;\r\n    return normalize(vec3<f32>(dx, dy, ws));\r\n}\r\n\r\n/*  8-sample normal (cross + diagonals) */\r\nfn normal8(px: i32, py: i32, L: i32,\r\n           w: i32, h: i32, ws: f32, dScalar: f32) -> vec3<f32> {\r\n\r\n    let uv  = array<vec2<i32>, 8>(\r\n        clampLocal(px + 1, py,     w, h), // R\r\n        clampLocal(px - 1, py,     w, h), // L\r\n        clampLocal(px,     py + 1, w, h), // U\r\n        clampLocal(px,     py - 1, w, h), // D\r\n        clampLocal(px + 1, py + 1, w, h), // UR\r\n        clampLocal(px - 1, py + 1, w, h), // UL\r\n        clampLocal(px + 1, py - 1, w, h), // DR\r\n        clampLocal(px - 1, py - 1, w, h)  // DL\r\n    );\r\n\r\n    let hVal = array<f32, 8>(\r\n        computeHnorm(textureLoad(fractalTex, uv[0], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[1], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[2], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[3], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[4], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[5], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[6], L).r) * dScalar,\r\n        computeHnorm(textureLoad(fractalTex, uv[7], L).r) * dScalar\r\n    );\r\n\r\n    let dx = ((hVal[0] + 0.5 * (hVal[4] + hVal[6])) -\r\n              (hVal[1] + 0.5 * (hVal[5] + hVal[7]))) * 0.5;\r\n    let dy = ((hVal[2] + 0.5 * (hVal[4] + hVal[5])) -\r\n              (hVal[3] + 0.5 * (hVal[6] + hVal[7]))) * 0.5;\r\n\r\n    return normalize(vec3<f32>(dx, dy, ws));\r\n}\r\n\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 compute entry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n@compute @workgroup_size(8, 8)\r\nfn main(@builtin(global_invocation_id) gid : vec3<u32>) {\r\n\r\n    /* 1) guard: stay inside this tile view */\r\n    if (gid.x >= sdfParams.tileWidth || gid.y >= sdfParams.tileHeight) {\r\n        return;\r\n    }\r\n\r\n    /* 2) constants */\r\n    let px = i32(gid.x);\r\n    let py = i32(gid.y);\r\n    let w  = i32(sdfParams.tileWidth);   // local clamp (X)\r\n    let h  = i32(sdfParams.gridSize);    // global clamp (Y)\r\n    let L  = i32(sdfParams.layerIndex);\r\n    let ws = 2.0 * sdfParams.quadScale / f32(sdfParams.gridSize);\r\n\r\n    /* 3) height at centre */\r\n    let vC     = textureLoad(fractalTex, clampLocal(px, py, w, h), L).r;\r\n    let hNormC = computeHnorm(vC);\r\n    let dScalar = sdfParams.dispAmp * sdfParams.quadScale;\r\n    let hC     = hNormC * dScalar;\r\n    let wallJump = sdfParams.wallJump * dScalar;\r\n \r\n    /* \u2500\u2500 4) decide once which neighbours we need \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r\n    let needLDU  = (sdfParams.normalMode >= 1u) ||\r\n                (sdfParams.connectivityMode >= 1u);\r\n\r\n    let needDiag = (sdfParams.normalMode == 2u) ||\r\n                (sdfParams.connectivityMode == 2u);\r\n\r\n    /* always R + U -------------------------------------------------- */\r\n    let hR = computeHnorm(textureLoad(\r\n            fractalTex, clampLocal(px + 1, py    , w, h), L).r)\r\n            * dScalar;\r\n\r\n    let hU = computeHnorm(textureLoad(\r\n            fractalTex, clampLocal(px    , py + 1, w, h), L).r)\r\n            * dScalar;\r\n\r\n    /* optional L + D ------------------------------------------------ */\r\n    var hL : f32 = 0.0;\r\n    var hD : f32 = 0.0;\r\n\r\n    if (needLDU) {\r\n        hL = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px - 1, py    , w, h), L).r)\r\n            * dScalar;\r\n\r\n        hD = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px    , py - 1, w, h), L).r)\r\n            * dScalar;\r\n    }\r\n\r\n    /* optional diagonals ------------------------------------------- */\r\n    var hUR : f32 = 0.0;\r\n    var hUL : f32 = 0.0;\r\n    var hDR : f32 = 0.0;\r\n    var hDL : f32 = 0.0;\r\n\r\n    if (needDiag) {\r\n        hUR = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px + 1, py + 1, w, h), L).r)\r\n            * dScalar;\r\n        hUL = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px - 1, py + 1, w, h), L).r)\r\n            * dScalar;\r\n        hDR = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px + 1, py - 1, w, h), L).r)\r\n            * dScalar;\r\n        hDL = computeHnorm(textureLoad(\r\n                fractalTex, clampLocal(px - 1, py - 1, w, h), L).r)\r\n            * dScalar;\r\n    }\r\n\r\n   \r\n    /* 5) normal + gradient ----------------------------------------- */\r\n    var n      : vec3<f32>;\r\n    var grad2  : f32;          // (rise)\xB2  =  dx\xB2 + dy\xB2\r\n\r\n    switch (sdfParams.normalMode) {\r\n        // ---------- 2-sample ---------------------------------------\r\n        case 0u {\r\n            let dx =  hR - hC;\r\n            let dy =  hU - hC;\r\n            grad2 = dx*dx + dy*dy;\r\n            n     = normalize(vec3<f32>(dx, dy, ws));\r\n        }\r\n\r\n        // ---------- 4-sample ---------------------------------------\r\n        case 1u {\r\n            let dx = (hR - hL) * 0.5;\r\n            let dy = (hU - hD) * 0.5;\r\n            grad2 = dx*dx + dy*dy;\r\n            n     = normalize(vec3<f32>(dx, dy, ws));\r\n        }\r\n\r\n        // ---------- 8-sample ---------------------------------------\r\n        default {\r\n            let dx = ((hR + 0.5*(hUR+hDR)) -\r\n                    (hL + 0.5*(hUL+hDL))) * 0.5;\r\n            let dy = ((hU + 0.5*(hUR+hUL)) -\r\n                    (hD + 0.5*(hDR+hDL))) * 0.5;\r\n            grad2 = dx*dx + dy*dy;\r\n            n     = normalize(vec3<f32>(dx, dy, ws));\r\n        }\r\n    }\r\n\r\n    /* ---- 6) wall flags ------------------------------------------- */\r\n    /* bit layout: 0 R,1 U,2 L,3 D,4-7 diagonals, 8 = steep slope   */\r\n    var flags : u32 = 0u;\r\n\r\n    /* always test R & U ------------------------------------------- */\r\n    if (abs(hR - hC) > wallJump) { flags |= 1u << 0; }   // R\r\n    if (abs(hU - hC) > wallJump) { flags |= 1u << 1; }   // U\r\n\r\n    /* 4-way adds L & D -------------------------------------------- */\r\n    if (sdfParams.connectivityMode >= 1u) {\r\n        if (abs(hL - hC) > wallJump) { flags |= 1u << 2; } // L\r\n        if (abs(hD - hC) > wallJump) { flags |= 1u << 3; } // D\r\n    }\r\n\r\n    /* 8-way adds diagonals ---------------------------------------- */\r\n    if (sdfParams.connectivityMode == 2u) {\r\n        if (abs(hUR - hC) > wallJump) { flags |= 1u << 4; } // UR\r\n        if (abs(hUL - hC) > wallJump) { flags |= 1u << 5; } // UL\r\n        if (abs(hDR - hC) > wallJump) { flags |= 1u << 6; } // DR\r\n        if (abs(hDL - hC) > wallJump) { flags |= 1u << 7; } // DL\r\n    }\r\n\r\n    let invRun2 =            // ( gridSize / 2\xB7quadScale )\xB2\r\n        (f32(sdfParams.gridSize) *\r\n        f32(sdfParams.gridSize)) /\r\n        (4.0 * sdfParams.quadScale * sdfParams.quadScale);\r\n\r\n    // (rise / run)\xB2   =   grad2 \xB7 invRun2\r\n    if (grad2 * invRun2 > sdfParams.slopeLimit) {\r\n        flags |= 1u << 8;\r\n    }\r\n\r\n    /* \u2500\u2500 7) store height, normal & flags ---------------- */\r\n    textureStore(sdfTex , vec2<i32>(px, py), L,\r\n                vec4<f32>(hC, n.x, n.y, n.z));\r\n\r\n    textureStore(flagTex, vec2<i32>(px, py), L,\r\n                vec4<u32>(flags, 0u, 0u, 0u));\r\n}\r\n";

  // shaders/fsdfCompute.js
  var SdfComputeGPU = class {
    constructor(device, uniformStride = 256, group0 = null, group1 = null) {
      this.device = device;
      this.uniformStride = uniformStride;
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
     * Always allocates **1 layer** (arrayLayerCount=1).
     */
    ensureSdfForChunks(chunks) {
      if (!Array.isArray(chunks)) {
        throw new Error("ensureSdfForChunks: chunks must be an array");
      }
      for (const c of chunks) {
        if (typeof c.width !== "number" || typeof c.height !== "number") {
          throw new Error(
            "ensureSdfForChunks: each chunk must have numeric width and height"
          );
        }
        const needRecreate = !c.sdfTex || !c.sdfTex.size || c.sdfTex.size[0] !== c.width || c.sdfTex.size[1] !== c.height || c.sdfTex.size[2] !== 1;
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
            size: [c.width, c.height, 1],
            format: "rgba16float",
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
          });
          const flagTex = this.device.createTexture({
            size: [c.width, c.height, 1],
            format: "r32uint",
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
          });
          const sdfLayerViews = [
            sdfTex.createView({
              dimension: "2d-array",
              baseArrayLayer: 0,
              arrayLayerCount: 1
            })
          ];
          const flagLayerViews = [
            flagTex.createView({
              dimension: "2d-array",
              baseArrayLayer: 0,
              arrayLayerCount: 1
            })
          ];
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
          c.sdfLayerViews = sdfLayerViews;
          c.flagLayerViews = flagLayerViews;
          c.sdfView = sdfView;
          c.flagView = flagView;
          c._sdfLayerBgs = /* @__PURE__ */ new Map();
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
          try {
            c.sdfView = c.sdfTex.createView({
              dimension: "2d-array",
              arrayLayerCount: 1
            });
          } catch (_) {
          }
          try {
            c.flagView = c.flagTex.createView({
              dimension: "2d-array",
              arrayLayerCount: 1
            });
          } catch (_) {
          }
          if (!c._sdfLayerBgs) c._sdfLayerBgs = /* @__PURE__ */ new Map();
        }
      }
    }
    /**
     * Resolve a fractal source view for a chunk.
     * We *prefer* layer 0 (since fractal is also single-layer in the real-time path),
     * but fall back gracefully if chunk carries per-layer views.
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
      throw new Error(
        "SdfComputeGPU: chunk has no fractal view/texture to read from"
      );
    }
    /**
     * Pack one dynamic UBO block for a tile. Matches WGSL layout.
     * Note: we still send `layerIndex` for shader logic, but we always write to layer 0.
     */
    _pack(paramsState, chunk, layerIndex, aspect = 1) {
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
     * Compute SDFs for chunks into **layer 0**.
     * We recompute per requested `layerIndex`, but outputs are always targeted at array layer 0.
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
        const cacheKey = 0;
        let bg = c._sdfLayerBgs.get(cacheKey);
        if (!bg) {
          const fractalView = this._getFractalView(c);
          const sdfView = c.sdfLayerViews[0];
          const flagView = c.flagLayerViews[0];
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
      for (const c of chunks) {
        try {
          if (!c.sdfView)
            c.sdfView = c.sdfTex.createView({
              dimension: "2d-array",
              arrayLayerCount: 1
            });
        } catch (_) {
        }
        try {
          if (!c.flagView)
            c.flagView = c.flagTex.createView({
              dimension: "2d-array",
              arrayLayerCount: 1
            });
        } catch (_) {
        }
      }
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
  var fractalFragment_default = `// \u2500\u2500 camera & sampler (group 0) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
struct Camera { viewProj : mat4x4<f32> };\r
@group(0) @binding(3) var<uniform> camera : Camera;\r
\r
@group(0) @binding(1) var mySamp : sampler;\r
\r
// render params (group 0 / binding 2)\r
struct RenderParams {\r
    layerIndex  : u32,\r
    scheme      : u32,\r
    dispMode    : u32,\r
    bowlOn      : u32,\r
\r
    hueOffset   : f32,\r
    dispAmp     : f32,\r
    dispCurve   : f32,\r
    bowlDepth   : f32,\r
\r
    quadScale   : f32,\r
    gridSize    : f32,\r
    lightingOn  : u32,\r
    dispLimitOn : u32,\r
\r
    lightPos    : vec3<f32>,\r
    specPower   : f32,\r
\r
    slopeLimit  : f32,\r
    wallJump    : f32,\r
    alphaMode   : u32,\r
    _pad2       : vec2<u32>,\r
};\r
@group(0) @binding(2) var<uniform> render : RenderParams;\r
\r
struct Threshold {\r
    lowT   : f32,\r
    highT  : f32,\r
    basis  : f32,\r
    _pad0  : f32,\r
};\r
@group(0) @binding(4) var<uniform> thr : Threshold;\r
\r
// group 0 / binding 0 -> color array texture (fractal source)\r
@group(0) @binding(0) var myTex : texture_2d_array<f32>;\r
\r
// group 1: model + sdf + flag + sampler\r
struct Model {\r
    world         : mat4x4<f32>,\r
    uvOffsetScale : vec4<f32>,\r
};\r
@group(1) @binding(0) var<uniform> model : Model;\r
\r
@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;\r
@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r
@group(1) @binding(3) var samp : sampler;\r
\r
// vertex -> fragment IO (must match your vertex shader)\r
struct FSIn {\r
  @builtin(position)              pos    : vec4<f32>,\r
  @location(0)                    uv     : vec2<f32>,\r
  @location(1)                    wPos   : vec3<f32>,\r
  @location(2)                    s      : vec4<f32>,    // sdf-derived data (and normals)\r
  @location(3) @interpolate(flat) flag   : u32,\r
};\r
\r
// helper \u2013 HSL \u2192 RGB\r
fn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {\r
    let H = hsl.x;\r
    let S = hsl.y;\r
    let L = hsl.z;\r
\r
    let C  = (1.0 - abs(2.0 * L - 1.0)) * S;\r
    let Hp = H * 6.0;\r
\r
    let X  = C * (1.0 - abs(fract(Hp) * 2.0 - 1.0));\r
    var rgb = vec3<f32>(0.0);\r
\r
    if      (Hp < 1.0) { rgb = vec3(C, X, 0.0); }\r
    else if (Hp < 2.0) { rgb = vec3(X, C, 0.0); }\r
    else if (Hp < 3.0) { rgb = vec3(0.0, C, X); }\r
    else if (Hp < 4.0) { rgb = vec3(0.0, X, C); }\r
    else if (Hp < 5.0) { rgb = vec3(X, 0.0, C); }\r
    else               { rgb = vec3(C, 0.0, X); }\r
\r
    let m = L - 0.5 * C;\r
    return rgb + m;\r
}\r
\r
// small utility to compute integer texel coords inside the tile (if you still use it)\r
fn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {\r
    let dims = vec2<i32>(textureDimensions(sdfTex).xy);\r
    let ix  = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);\r
    let iy  = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);\r
    return vec2<i32>(ix, iy);\r
}\r
\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
// Gate result returned from gating helper\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
struct GateResult {\r
  passed : bool,\r
  alpha  : f32,\r
};\r
\r
// Shared gating logic: compute final alpha based on alphaMode and run threshold/flag gating.\r
// Returns GateResult.passed==true if fragment should be shaded; GateResult.alpha contains final alpha.\r
// We accept a minimal set of inputs (r, a_in, s_r, flagVal) so this remains cheap.\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
fn shouldPassAndComputeAlpha(r: f32, a_in: f32, s_r: f32, flagVal: u32) -> GateResult {\r
  var res : GateResult;\r
  var a = a_in;\r
\r
  // apply alphaMode\r
  if (render.alphaMode == 1u) {\r
      a = r;\r
  } else if (render.alphaMode == 2u) {\r
      a = 1.0 - r;\r
  }\r
\r
  // threshold gating (three modes)\r
  if (thr.basis < 2.0) {\r
    let inside = (r >= thr.lowT) && (r <= thr.highT);\r
    if (thr.basis == 0.0 && !inside) {\r
      res.passed = false;\r
      res.alpha = a;\r
      return res;\r
    } else if (thr.basis == 1.0 && inside) {\r
      res.passed = false;\r
      res.alpha = a;\r
      return res;\r
    }\r
  } else {\r
    // basis >= 2.0 -> use SDF's channel (s.r) as gating\r
    let hC = s_r;\r
    if (hC < thr.lowT || hC > thr.highT) {\r
      res.passed = false;\r
      res.alpha = a;\r
      return res;\r
    }\r
  }\r
\r
  // dispLimitOn / flag gating: if flag indicates "cull" then reject\r
  if (render.dispLimitOn != 0u && flagVal != 0u) {\r
      res.passed = false;\r
      res.alpha = a;\r
      return res;\r
  }\r
\r
  // early alpha cutoff: prevent tiny-alpha fragments writing depth in prepass\r
  if (a < 0.01) {\r
    res.passed = false;\r
    res.alpha = a;\r
    return res;\r
  }\r
\r
  res.passed = true;\r
  res.alpha = a;\r
  return res;\r
}\r
\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
// Depth-only prepass \u2013 sample base texture + run gating logic.\r
// Returns a vec4 but color write is disabled by the pipeline (writeMask=0).\r
// Uses the same gating helper as fs_main so results match exactly.\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
@fragment\r
fn fs_prepass(input : FSIn) -> @location(0) vec4<f32> {\r
  // sample base texture (grayscale in .r, alpha in .a)\r
  // note: textureSample(array, sampler, coord, layerIndex) is used elsewhere; keep same usage\r
  let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));\r
  let r = texel.r;\r
  let a = texel.a;\r
\r
  // use SDF / flag values provided by the vertex stage (cheap \u2014 already computed in vertex)\r
  let s_r = input.s.r;\r
  let flagVal = input.flag;\r
\r
  // run same gating helper; obtain computed alpha\r
  let g = shouldPassAndComputeAlpha(r, a, s_r, flagVal);\r
  if (!g.passed) {\r
    // discard -> no depth or color write in prepass\r
    discard;\r
  }\r
\r
  // Depth-only prepass doesn't write colour (pipeline uses writeMask = 0).\r
  // returning any vec4 is fine; we still get the depth written because we didn't discard.\r
  return vec4<f32>(0.0, 0.0, 0.0, 0.0);\r
}\r
\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
// Full shading pass: uses same gating helper then computes palette + lighting\r
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r
@fragment\r
fn fs_main(input : FSIn) -> @location(0) vec4<f32> {\r
\r
  // 1. sample greyscale & alpha\r
  let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));\r
  let r     = texel.r;\r
  let a_in  = texel.a;\r
\r
  // use the SDF/flag values provided by the vertex stage\r
  let s_r = input.s.r;\r
  let flagVal = input.flag;\r
\r
  // apply the same gating helper (ensures prepass & main align), and get final alpha\r
  let g = shouldPassAndComputeAlpha(r, a_in, s_r, flagVal);\r
  if (!g.passed) {\r
    discard;\r
  }\r
  var a = g.alpha; // final alpha after alphaMode\r
\r
  // 2. palette selection\r
  var H : f32;\r
  var L : f32;\r
\r
  switch (render.scheme) {\r
    case 0u: { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }\r
    case 1u: { H = (0.0 + 60.0 * r) / 360.0; L = 0.50 + 0.50 * r; }\r
    case 2u: { H = (200.0 - 100.0 * r) / 360.0; L = 0.30 + 0.70 * r; }\r
    case 3u: { H = (30.0 + 270.0 * r) / 360.0; L = 0.30 + 0.40 * r; }\r
    case 4u: { H = (120.0 -  90.0 * r) / 360.0; L = 0.20 + 0.50 * r; }\r
    case 5u: { H = (300.0 - 240.0 * r) / 360.0; L = 0.55 + 0.20 * sin(r * 3.14159); }\r
    case 6u: { return vec4<f32>(vec3<f32>(r), a); }\r
    case 7u: { H = (10.0 + 60.0 * pow(r, 1.2)) / 360.0; L = 0.15 + 0.75 * pow(r, 1.5); }\r
    case 8u: { H = r; L = 0.45 + 0.25 * (1.0 - r); }\r
    case 9u: { H = fract(2.0 * r); L = 0.50; }\r
    case 10u: { H = fract(3.0 * r + 0.1); L = 0.65; }\r
    case 11u: { H = 0.75 - 0.55 * r; L = 0.25 + 0.55 * r * r; }\r
    case 12u: { H = (5.0 + 70.0 * r) / 360.0; L = 0.10 + 0.80 * pow(r, 1.4); }\r
    case 13u: { H = (260.0 - 260.0 * r) / 360.0; L = 0.30 + 0.60 * pow(r, 0.8); }\r
    case 14u: { H = (230.0 - 160.0 * r) / 360.0; L = 0.25 + 0.60 * r; }\r
    case 15u: { H = (200.0 + 40.0 * r) / 360.0; L = 0.20 + 0.50 * r; }\r
    case 16u: { H = 0.60; L = 0.15 + 0.35 * r; }\r
    case 17u: {\r
      if (r < 0.5) { H = 0.55 + (0.75 - 0.55) * (r * 2.0); }\r
      else { H = 0.02 + (0.11 - 0.02) * ((r - 0.5) * 2.0); }\r
      L = 0.25 + 0.55 * abs(r - 0.5);\r
    }\r
    case 18u: { H = fract(3.0 * r); L = 0.50 + 0.25 * (1.0 - r); }\r
    case 19u: { H = fract(4.0 * r); L = 0.50; }\r
    case 20u: { H = fract(5.0 * r + 0.2); L = 0.65; }\r
    case 21u: { H = (240.0 - 240.0 * r) / 360.0; L = 0.30 + 0.40 * r; }\r
    case 22u: { H = fract(r * 6.0 + sin(r * 10.0)); L = 0.40 + 0.30 * sin(r * 20.0); }\r
    case 23u: { H = (30.0 + 50.0 * r) / 360.0; L = 0.45 + 0.30 * r; }\r
    case 24u: { H = (90.0 - 80.0 * r) / 360.0; L = 0.50 + 0.40 * r; }\r
    case 25u: { H = (100.0 - 100.0 * r) / 360.0; L = 0.40 + 0.50 * r; }\r
    case 26u: {\r
      let loopVal = fract(r * 10.0);\r
      let Lmono   = loopVal * 0.8;\r
      return vec4<f32>(vec3<f32>(Lmono), a);\r
    }\r
    case 27u: {\r
      if (r < 0.5) { H = 0.80 + (0.40 - 0.80) * (r * 2.0); }\r
      else { H = 0.10 + (0.00 - 0.10) * ((r - 0.5) * 2.0); }\r
      L = 0.20 + 0.60 * abs(r - 0.5);\r
    }\r
    case 28u: { H = fract(sin(r * 6.28318) * 0.5 + 0.5); L = 0.50; }\r
    case 29u: { H = fract(r * 3.0); L = fract(r * 3.0); }\r
    case 30u: { H = fract(r * 6.0); L = 0.45 + 0.40 * abs(sin(r * 6.0 * 3.14159)); }\r
    case 31u: {\r
      let t = fract(r * 8.0);\r
      if (t < 0.5) { H = t * 2.0; } else { H = (1.0 - t) * 2.0; }\r
      L = 0.60 - 0.30 * abs(t - 0.5);\r
    }\r
    case 32u: { H = fract(pow(r, 0.7) * 12.0); L = 0.50 + 0.30 * pow(r, 1.2); }\r
    case 33u: { H = fract(r * 10.0 + 0.3); L = 0.40 + 0.50 * r; }\r
    default: { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }\r
  }\r
\r
  // final colour\r
  H = fract(H + render.hueOffset);\r
  var rgb = hsl2rgb(vec3<f32>(H, 1.0, L));\r
\r
  // lighting (apply if enabled)\r
  if (render.lightingOn != 0u) {\r
    let n      = normalize(input.s.gba);\r
    let lightWS = render.lightPos * render.quadScale;\r
    let Ldir    = normalize(lightWS - input.wPos);\r
    let Vdir    = normalize(-input.wPos);\r
    let hVec    = normalize(Ldir + Vdir);\r
\r
    let diff    = max(dot(n, Ldir), 0.0);\r
    var spec    = pow(max(dot(n, hVec), 0.0), render.specPower)\r
                    * smoothstep(0.0, 0.1, diff);\r
\r
    let ambient    = 0.15;\r
    let diffWeight = 1.0;\r
    let specWeight = 1.25;\r
\r
    rgb = clamp(\r
        rgb * (ambient + diffWeight * diff) +\r
        specWeight * spec,\r
        vec3<f32>(0.0), vec3<f32>(1.0)\r
    );\r
  }\r
\r
  // NOTE: blending expects non-premultiplied src alpha (src-alpha, one-minus-src-alpha).\r
  // If you switch blending or canvas alpha settings, consider premultiplying rgb by a.\r
\r
  return vec4<f32>(rgb, a);\r
}\r
`;

  // shaders/fractalVertex.wgsl
  var fractalVertex_default = "// \u2500\u2500 camera & sampler (group 0) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct Camera { viewProj : mat4x4<f32> };\r\n@group(0) @binding(3) var<uniform> camera : Camera;\r\n\r\n@group(0) @binding(1) var mySamp : sampler;\r\n\r\n// \u2500\u2500 render\u2010wide parameters (group 0 / binding 2) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct RenderParams {\r\n    layerIndex  : u32,\r\n    scheme      : u32,\r\n    dispMode    : u32,\r\n    bowlOn      : u32,\r\n\r\n    hueOffset   : f32,\r\n    dispAmp     : f32,\r\n    dispCurve   : f32,\r\n    bowlDepth   : f32,\r\n\r\n    quadScale   : f32,\r\n    gridSize    : f32,\r\n    lightingOn  : u32,\r\n    dispLimitOn : u32,\r\n\r\n    lightPos    : vec3<f32>,\r\n    specPower   : f32,\r\n\r\n    slopeLimit  : f32,\r\n    wallJump    : f32,\r\n    alphaMode   : u32,\r\n    worldOffset : f32, // base world offset per layer\r\n    worldStart  : f32,\r\n};\r\n@group(0) @binding(2) var<uniform> render : RenderParams;\r\n\r\n// \u2500\u2500 group 1: per\u2010tile model + precomputed textures + sampler \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct Model {\r\n    world         : mat4x4<f32>,\r\n    uvOffsetScale : vec4<f32>,\r\n};\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\n@group(1) @binding(1) var sdfTex : texture_2d_array<f32>;\r\n@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r\n@group(1) @binding(3) var samp : sampler;\r\n\r\n// \u2500\u2500 vertex I/O \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\nstruct VertexIn {\r\n    @location(0) position : vec3<f32>,\r\n    @location(1) uv       : vec2<f32>,\r\n};\r\n\r\nstruct VSOut {\r\n    @builtin(position)              pos    : vec4<f32>,\r\n    @location(0)                    uv     : vec2<f32>,   \r\n    @location(1)                    wPos   : vec3<f32>,\r\n    @location(2)                    s      : vec4<f32>,    // sdf-derived data (and normals)\r\n    @location(3) @interpolate(flat) flag   : u32,\r\n};\r\n\r\n// helper \u2013 returns integer pixel coords inside *this* texture view\r\nfn texelIJ(tileUV : vec2<f32>) -> vec2<i32> {\r\n    let dims = vec2<i32>(textureDimensions(sdfTex).xy);   // (tileW , tileH)\r\n    // NB:   tileH == gridSize because we only split horizontally\r\n    let ix  = clamp(i32(tileUV.x * f32(dims.x)), 0, dims.x - 1);\r\n    let iy  = clamp(i32(tileUV.y * f32(dims.y)), 0, dims.y - 1);\r\n    return vec2<i32>(ix, iy);\r\n}\r\n\r\n// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n@vertex\r\nfn vs_main(in: VertexIn) -> VSOut {\r\n    var out: VSOut;\r\n\r\n    // 1. model\u2010space \u2192 world\u2010space (XY plane)\r\n    var worldPos = model.world * vec4<f32>(in.position, 1.0);\r\n\r\n    // 2. optional bowl deformation\r\n    if (render.bowlOn != 0u && render.bowlDepth > 0.00001) {\r\n        let globalUV = model.uvOffsetScale.xy + in.uv * model.uvOffsetScale.zw;\r\n        let offset   = globalUV - vec2<f32>(0.5, 0.5);\r\n        let r2       = dot(offset, offset);\r\n        let maxR2    = 0.5;\r\n        let t        = 1.0 - clamp(r2 / maxR2, 0.0, 1.0);\r\n        worldPos.z += -render.bowlDepth * t * render.quadScale;\r\n    }\r\n\r\n    // 3. sample precomputed SDF (height + normal)\r\n    var s : vec4<f32> = vec4<f32>(0.0);    // default: no height/normal\r\n    var maskVal : u32 = 0u;               // default mask\r\n\r\n    if (render.dispMode != 0u || render.lightingOn != 0u) {\r\n        // safe to call texelIJ() and sample textures\r\n        let ij = texelIJ(in.uv);\r\n        s = textureLoad(sdfTex, ij, i32(render.layerIndex), 0);\r\n        worldPos.z += s.r;                 // apply height displacement only when computed\r\n\r\n        // connectivity mask lookup (only when SDF/flags are expected)\r\n        maskVal = textureLoad(flagTex, ij, i32(render.layerIndex), 0).r;\r\n    }\r\n\r\n    // 4. Apply world offset based on layerIndex (accumulating across layers)\r\n    worldPos.z += render.worldStart + render.worldOffset * f32(render.layerIndex);\r\n\r\n    // 5. write outputs\r\n    out.pos  = camera.viewProj * worldPos;\r\n    out.uv   = in.uv;\r\n    out.wPos = worldPos.xyz;\r\n    out.s    = s;\r\n    out.flag = maskVal;\r\n    return out;\r\n}\r\n";

  // shaders/fBlitFragment.wgsl
  var fBlitFragment_default = "// fBlitFragment.wgsl\r\n\r\nstruct RenderParams {\r\n    layerIndex  : u32,\r\n    scheme      : u32,\r\n    dispMode    : u32,\r\n    bowlOn      : u32,\r\n\r\n    hueOffset   : f32,\r\n    dispAmp     : f32,\r\n    dispCurve   : f32,\r\n    bowlDepth   : f32,\r\n\r\n    quadScale   : f32,\r\n    gridSize    : f32,\r\n    lightingOn  : u32,\r\n    dispLimitOn : u32,\r\n\r\n    lightPos    : vec3<f32>,\r\n    specPower   : f32,\r\n\r\n    slopeLimit  : f32,\r\n    wallJump    : f32,\r\n    alphaMode   : u32,\r\n    _pad2       : vec2<u32>,\r\n};\r\n\r\nstruct Threshold {\r\n    lowT   : f32,\r\n    highT  : f32,\r\n    basis  : f32,\r\n    _pad0  : f32,\r\n};\r\n\r\nstruct Model {\r\n    world         : mat4x4<f32>,\r\n    uvOffsetScale : vec4<f32>,\r\n};\r\n\r\n@group(0) @binding(0) var myTex  : texture_2d_array<f32>;\r\n@group(0) @binding(1) var mySamp : sampler;\r\n@group(0) @binding(2) var<uniform> render : RenderParams;\r\n@group(0) @binding(4) var<uniform> thr    : Threshold;\r\n\r\n@group(1) @binding(0) var<uniform> model   : Model;\r\n@group(1) @binding(1) var sdfTex  : texture_2d_array<f32>;\r\n@group(1) @binding(2) var flagTex : texture_2d_array<u32>;\r\n@group(1) @binding(3) var samp    : sampler;\r\n\r\nstruct VSOut {\r\n    @builtin(position)              pos  : vec4<f32>,\r\n    @location(0)                    uv   : vec2<f32>,\r\n    @location(1)                    wPos : vec3<f32>,\r\n    @location(2)                    s    : vec4<f32>,\r\n    @location(3) @interpolate(flat) flag : u32,\r\n};\r\n\r\nfn hsl2rgb(hsl : vec3<f32>) -> vec3<f32> {\r\n    let H = hsl.x;\r\n    let S = hsl.y;\r\n    let L = hsl.z;\r\n\r\n    let C  = (1.0 - abs(2.0 * L - 1.0)) * S;\r\n    let Hp = H * 6.0;\r\n\r\n    let X  = C * (1.0 - abs(fract(Hp) * 2.0 - 1.0));\r\n    var rgb = vec3<f32>(0.0);\r\n\r\n    if      (Hp < 1.0) { rgb = vec3<f32>(C, X, 0.0); }\r\n    else if (Hp < 2.0) { rgb = vec3<f32>(X, C, 0.0); }\r\n    else if (Hp < 3.0) { rgb = vec3<f32>(0.0, C, X); }\r\n    else if (Hp < 4.0) { rgb = vec3<f32>(0.0, X, C); }\r\n    else if (Hp < 5.0) { rgb = vec3<f32>(C, 0.0, X); }\r\n    else               { rgb = vec3<f32>(C, 0.0, X); }\r\n\r\n    let m = L - 0.5 * C;\r\n    return rgb + m;\r\n}\r\n\r\nstruct GateResult {\r\n    passed : bool,\r\n    alpha  : f32,\r\n};\r\n\r\nfn shouldPassAndComputeAlpha(r : f32, a_in : f32, s_r : f32, flagVal : u32) -> GateResult {\r\n    var res : GateResult;\r\n    var a = a_in;\r\n\r\n    if (render.alphaMode == 1u) {\r\n        a = r;\r\n    } else if (render.alphaMode == 2u) {\r\n        a = 1.0 - r;\r\n    }\r\n\r\n    if (thr.basis < 2.0) {\r\n        let inside = (r >= thr.lowT) && (r <= thr.highT);\r\n        if (thr.basis == 0.0 && !inside) {\r\n            res.passed = false;\r\n            res.alpha  = a;\r\n            return res;\r\n        } else if (thr.basis == 1.0 && inside) {\r\n            res.passed = false;\r\n            res.alpha  = a;\r\n            return res;\r\n        }\r\n    } else {\r\n        let hC = s_r;\r\n        if (hC < thr.lowT || hC > thr.highT) {\r\n            res.passed = false;\r\n            res.alpha  = a;\r\n            return res;\r\n        }\r\n    }\r\n\r\n    if (render.dispLimitOn != 0u && flagVal != 0u) {\r\n        res.passed = false;\r\n        res.alpha  = a;\r\n        return res;\r\n    }\r\n\r\n    if (a < 0.01) {\r\n        res.passed = false;\r\n        res.alpha  = a;\r\n        return res;\r\n    }\r\n\r\n    res.passed = true;\r\n    res.alpha  = a;\r\n    return res;\r\n}\r\n\r\n@fragment\r\nfn fs_blit(input : VSOut) -> @location(0) vec4<f32> {\r\n    let texel = textureSample(myTex, mySamp, input.uv, i32(render.layerIndex));\r\n    let r     = texel.r;\r\n    let a_in  = texel.a;\r\n\r\n    let g = shouldPassAndComputeAlpha(r, a_in, input.s.r, input.flag);\r\n    if (!g.passed) {\r\n        discard;\r\n    }\r\n    var a = g.alpha;\r\n\r\n    var H : f32;\r\n    var L : f32;\r\n\r\n    switch (render.scheme) {\r\n        case 0u:  { H = (260.0 - 260.0 * pow(r, 0.9)) / 360.0; L = (10.0  + 65.0  * pow(r, 1.2)) / 100.0; }\r\n        case 1u:  { H = (0.0   + 60.0 * r) / 360.0;           L = 0.50 + 0.50 * r; }\r\n        case 2u:  { H = (200.0 - 100.0 * r) / 360.0;          L = 0.30 + 0.70 * r; }\r\n        case 3u:  { H = (30.0  + 270.0 * r) / 360.0;          L = 0.30 + 0.40 * r; }\r\n        case 4u:  { H = (120.0 -  90.0 * r) / 360.0;          L = 0.20 + 0.50 * r; }\r\n        case 5u:  { H = (300.0 - 240.0 * r) / 360.0;          L = 0.55 + 0.20 * sin(r * 3.14159); }\r\n        case 6u:  { return vec4<f32>(vec3<f32>(r), a); }\r\n        case 7u:  { H = (10.0  + 60.0 * pow(r, 1.2)) / 360.0; L = 0.15 + 0.75 * pow(r, 1.5); }\r\n        case 8u:  { H = r;                                    L = 0.45 + 0.25 * (1.0 - r); }\r\n        case 9u:  { H = fract(2.0 * r);                       L = 0.50; }\r\n        case 10u: { H = fract(3.0 * r + 0.1);                 L = 0.65; }\r\n        case 11u: { H = 0.75 - 0.55 * r;                      L = 0.25 + 0.55 * r * r; }\r\n        case 12u: { H = (5.0  + 70.0 * r) / 360.0;            L = 0.10 + 0.80 * pow(r, 1.4); }\r\n        case 13u: { H = (260.0 - 260.0 * r) / 360.0;          L = 0.30 + 0.60 * pow(r, 0.8); }\r\n        case 14u: { H = (230.0 - 160.0 * r) / 360.0;          L = 0.25 + 0.60 * r; }\r\n        case 15u: { H = (200.0 + 40.0 * r) / 360.0;           L = 0.20 + 0.50 * r; }\r\n        case 16u: { H = 0.60;                                L = 0.15 + 0.35 * r; }\r\n        case 17u: {\r\n            if (r < 0.5) {\r\n                H = 0.55 + (0.75 - 0.55) * (r * 2.0);\r\n            } else {\r\n                H = 0.02 + (0.11 - 0.02) * ((r - 0.5) * 2.0);\r\n            }\r\n            L = 0.25 + 0.55 * abs(r - 0.5);\r\n        }\r\n        case 18u: { H = fract(3.0 * r);                      L = 0.50 + 0.25 * (1.0 - r); }\r\n        case 19u: { H = fract(4.0 * r);                      L = 0.50; }\r\n        case 20u: { H = fract(5.0 * r + 0.2);                L = 0.65; }\r\n        case 21u: { H = (240.0 - 240.0 * r) / 360.0;         L = 0.30 + 0.40 * r; }\r\n        case 22u: { H = fract(r * 6.0 + sin(r * 10.0));      L = 0.40 + 0.30 * sin(r * 20.0); }\r\n        case 23u: { H = (30.0 + 50.0 * r) / 360.0;           L = 0.45 + 0.30 * r; }\r\n        case 24u: { H = (90.0 - 80.0 * r) / 360.0;           L = 0.50 + 0.40 * r; }\r\n        case 25u: { H = (100.0 - 100.0 * r) / 360.0;         L = 0.40 + 0.50 * r; }\r\n        case 26u: {\r\n            let loopVal = fract(r * 10.0);\r\n            let Lmono   = loopVal * 0.8;\r\n            return vec4<f32>(vec3<f32>(Lmono), a);\r\n        }\r\n        case 27u: {\r\n            if (r < 0.5) {\r\n                H = 0.80 + (0.40 - 0.80) * (r * 2.0);\r\n            } else {\r\n                H = 0.10 + (0.00 - 0.10) * ((r - 0.5) * 2.0);\r\n            }\r\n            L = 0.20 + 0.60 * abs(r - 0.5);\r\n        }\r\n        case 28u: { H = fract(sin(r * 6.28318) * 0.5 + 0.5); L = 0.50; }\r\n        case 29u: { H = fract(r * 3.0);                      L = fract(r * 3.0); }\r\n        case 30u: { H = fract(r * 6.0);                      L = 0.45 + 0.40 * abs(sin(r * 6.0 * 3.14159)); }\r\n        case 31u: {\r\n            let t = fract(r * 8.0);\r\n            if (t < 0.5) {\r\n                H = t * 2.0;\r\n            } else {\r\n                H = (1.0 - t) * 2.0;\r\n            }\r\n            L = 0.60 - 0.30 * abs(t - 0.5);\r\n        }\r\n        case 32u: { H = fract(pow(r, 0.7) * 12.0);           L = 0.50 + 0.30 * pow(r, 1.2); }\r\n        case 33u: { H = fract(r * 10.0 + 0.3);               L = 0.40 + 0.50 * r; }\r\n        default:  { H = (40.0 + 310.0 * pow(r, 1.3)) / 360.0; L = 0.20 + 0.50 * pow(r, 0.8); }\r\n    }\r\n\r\n    H = fract(H + render.hueOffset);\r\n    var rgb = hsl2rgb(vec3<f32>(H, 1.0, L));\r\n\r\n    if (render.lightingOn != 0u) {\r\n        let n       = normalize(input.s.gba);\r\n        let lightWS = render.lightPos * render.quadScale;\r\n        let Ldir    = normalize(lightWS - input.wPos);\r\n        let Vdir    = normalize(-input.wPos);\r\n        let hVec    = normalize(Ldir + Vdir);\r\n\r\n        let diff    = max(dot(n, Ldir), 0.0);\r\n        var spec    = pow(max(dot(n, hVec), 0.0), render.specPower)\r\n                      * smoothstep(0.0, 0.1, diff);\r\n\r\n        let ambient    = 0.15;\r\n        let diffWeight = 1.0;\r\n        let specWeight = 1.25;\r\n\r\n        rgb = clamp(\r\n            rgb * (ambient + diffWeight * diff) +\r\n            specWeight * spec,\r\n            vec3<f32>(0.0, 0.0, 0.0),\r\n            vec3<f32>(1.0, 1.0, 1.0),\r\n        );\r\n    }\r\n\r\n    return vec4<f32>(rgb, a);\r\n}\r\n";

  // shaders/fBlitVertex.wgsl
  var fBlitVertex_default = "// fBlitVertex.wgsl\r\n\r\nstruct Model {\r\n    world         : mat4x4<f32>,\r\n    uvOffsetScale : vec4<f32>,\r\n};\r\n\r\n@group(1) @binding(0) var<uniform> model : Model;\r\n\r\nstruct VSIn {\r\n    @location(0) position : vec3<f32>,\r\n    @location(1) uv       : vec2<f32>,\r\n};\r\n\r\nstruct VSOut {\r\n    @builtin(position)              pos  : vec4<f32>,\r\n    @location(0)                    uv   : vec2<f32>,\r\n    @location(1)                    wPos : vec3<f32>,\r\n    @location(2)                    s    : vec4<f32>,\r\n    @location(3) @interpolate(flat) flag : u32,\r\n};\r\n\r\n@vertex\r\nfn vs_blit(input : VSIn) -> VSOut {\r\n    var out : VSOut;\r\n\r\n    let globalUV = model.uvOffsetScale.xy + input.uv * model.uvOffsetScale.zw;\r\n\r\n    let clipX = globalUV.x * 2.0 - 1.0;\r\n    let clipY = 1.0 - globalUV.y * 2.0;\r\n\r\n    out.pos  = vec4<f32>(clipX, clipY, 0.0, 1.0);\r\n    out.uv   = globalUV;\r\n\r\n    out.wPos = vec3<f32>(clipX, clipY, 0.0);\r\n    out.s    = vec4<f32>(0.0, 0.0, 0.0, 1.0);\r\n    out.flag = 0u;\r\n\r\n    return out;\r\n}\r\n";

  // shaders/fractalRender.js
  var RenderPipelineGPU = class {
    /**
     * opts:
     *  - renderUniformStride (default 256)
     *  - initialGridDivs (default 256)
     *  - quadScale (default 1.0)
     *  - canvasAlphaMode (default "premultiplied") -> used by resize()
     */
    constructor(device, context, vsCode = fractalVertex_default, fsCode = fractalFragment_default, opts = {}) {
      this.device = device;
      this.context = context;
      this.vsCode = vsCode;
      this.fsCode = fsCode;
      this.renderUniformStride = opts.renderUniformStride ?? 256;
      this.gridDivs = opts.initialGridDivs ?? 256;
      this.quadScale = opts.quadScale ?? 1;
      this.canvasAlphaMode = opts.canvasAlphaMode ?? "premultiplied";
      this.format = navigator.gpu.getPreferredCanvasFormat();
      this._createSharedLayouts();
      this._createRenderPipelines();
      this._createBlitPipelines();
      this.sampler = device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
      });
      this.renderUniformBuffer = device.createBuffer({
        size: this.renderUniformStride,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
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
      this.depthTexture = null;
      this._createFallbackTextures();
      this._lastCanvasSize = [0, 0];
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
            buffer: { type: "uniform" }
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
      this.renderPipelineDepth = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: {
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
        },
        fragment: {
          module: fsModule,
          entryPoint: "fs_prepass",
          targets: [{ format: this.format, writeMask: 0 }]
        },
        primitive: { topology: "triangle-list" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less"
        }
      });
      this.renderPipelineOpaque = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: {
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
        },
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
      this.renderPipelineTransparent = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: {
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
        },
        fragment: {
          module: fsModule,
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
        primitive: { topology: "triangle-list" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: false,
          depthCompare: "less-equal"
        }
      });
    }
    _createBlitPipelines() {
      const vsBlitModule = this.device.createShaderModule({ code: fBlitVertex_default });
      const fsBlitModule = this.device.createShaderModule({ code: fBlitFragment_default });
      this.renderPipelineBlitOpaque = this.device.createRenderPipeline({
        layout: this._pipelineLayout,
        vertex: {
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
        },
        fragment: {
          module: fsBlitModule,
          entryPoint: "fs_blit",
          targets: [{ format: this.format, writeMask: GPUColorWrite.ALL }]
        },
        primitive: { topology: "triangle-list" },
        depthStencil: void 0
      });
    }
    resize(clientWidth, clientHeight) {
      const pw = Math.floor(clientWidth * (window.devicePixelRatio || 1));
      const ph = Math.floor(clientHeight * (window.devicePixelRatio || 1));
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: this.canvasAlphaMode,
        size: [pw, ph]
      });
      try {
        if (this.depthTexture) this.depthTexture.destroy();
      } catch (e) {
      }
      this.depthTexture = this.device.createTexture({
        size: [pw, ph, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      this._lastCanvasSize = [pw, ph];
      this.gridStripes = null;
    }
    _makeArrayLayerViews(tex, maxLayers) {
      if (!tex) return null;
      const views = [];
      for (let L = 0; L < maxLayers; ++L) {
        try {
          const v = tex.createView({
            dimension: "2d-array",
            baseArrayLayer: L,
            arrayLayerCount: 1
          });
          views.push(v);
        } catch (e) {
          if (L === 0) {
            try {
              const v2 = tex.createView({ dimension: "2d" });
              views.push(v2);
              break;
            } catch (e2) {
              console.warn(
                "_makeArrayLayerViews: texture.createView failed for 2d fallback:",
                e2
              );
              return null;
            }
          } else {
            break;
          }
        }
      }
      return views.length > 0 ? views : null;
    }
    _normalizeChunkViews(info, layers) {
      info.fractalLayerViews = info.fractalLayerViews || [];
      if ((!info.fractalLayerViews || info.fractalLayerViews.length === 0) && Array.isArray(info.layerViews) && info.layerViews.length > 0) {
        info.fractalLayerViews = info.layerViews.slice();
      }
      if ((!info.fractalLayerViews || info.fractalLayerViews.length < layers) && info.fractalTex) {
        try {
          const made = this._makeArrayLayerViews(info.fractalTex, layers);
          if (made && made.length > 0) {
            info.fractalLayerViews = made;
            info.fractalView = info.fractalLayerViews[0];
          }
        } catch (e) {
          console.warn(
            "normalizeChunkViews: fractalTex -> per-layer createView failed:",
            e,
            info
          );
        }
      }
      if ((!info.fractalLayerViews || info.fractalLayerViews.length === 0) && info.fractalView) {
        info.fractalLayerViews = [info.fractalView];
      }
      info.sdfLayerViews = info.sdfLayerViews || [];
      if ((!info.sdfLayerViews || info.sdfLayerViews.length === 0) && info.sdfView) {
        info.sdfLayerViews = [info.sdfView];
      }
      if ((!info.sdfLayerViews || info.sdfLayerViews.length < layers) && info.sdfTex) {
        try {
          const made = this._makeArrayLayerViews(info.sdfTex, layers);
          if (made && made.length > 0) {
            info.sdfLayerViews = made;
            info.sdfView = info.sdfLayerViews[0];
          }
        } catch (e) {
          console.warn(
            "normalizeChunkViews: sdfTex -> per-layer createView failed:",
            e,
            info
          );
        }
      }
      info.flagLayerViews = info.flagLayerViews || [];
      if ((!info.flagLayerViews || info.flagLayerViews.length === 0) && info.flagView) {
        info.flagLayerViews = [info.flagView];
      }
      if ((!info.flagLayerViews || info.flagLayerViews.length < layers) && info.flagTex) {
        try {
          const made = this._makeArrayLayerViews(info.flagTex, layers);
          if (made && made.length > 0) {
            info.flagLayerViews = made;
            info.flagView = info.flagLayerViews[0];
          }
        } catch (e) {
          console.warn(
            "normalizeChunkViews: flagTex -> per-layer createView failed:",
            e,
            info
          );
        }
      }
    }
    _getLayerView(info, candidateNames, layerIndex = 0, opts = {}) {
      const preferArrayView = !!opts.preferArrayView;
      for (const name of candidateNames) {
        const v = info[name];
        if (v == null) continue;
        if (Array.isArray(v)) {
          if (v[layerIndex]) {
            const x = v[layerIndex];
            if (x && typeof x.createView === "function") {
              try {
                return x.createView({
                  dimension: "2d-array",
                  baseArrayLayer: layerIndex,
                  arrayLayerCount: 1
                });
              } catch (e) {
                try {
                  return x.createView({ dimension: "2d" });
                } catch (e2) {
                }
              }
            } else {
              return x;
            }
          }
          if (v.length > 0 && v[0]) {
            const first = v[0];
            if (first && typeof first.createView !== "function") return first;
            if (first && typeof first.createView === "function") {
              try {
                if (preferArrayView) {
                  try {
                    return first.createView({ dimension: "2d-array" });
                  } catch (e3) {
                  }
                }
                return first.createView({
                  dimension: "2d-array",
                  baseArrayLayer: layerIndex,
                  arrayLayerCount: 1
                });
              } catch (e) {
                try {
                  return first.createView({ dimension: "2d" });
                } catch (e2) {
                }
              }
            }
          }
          continue;
        }
        if (typeof v.createView !== "function") {
          return v;
        }
        if (preferArrayView) {
          try {
            return v.createView({ dimension: "2d-array" });
          } catch (e) {
          }
        }
        try {
          return v.createView({
            dimension: "2d-array",
            baseArrayLayer: layerIndex,
            arrayLayerCount: 1
          });
        } catch (e) {
          try {
            return v.createView({ dimension: "2d" });
          } catch (e2) {
          }
        }
      }
      return null;
    }
    async setChunks(chunks = [], layers = 1, opts = {}) {
      const { layerIndex = 0, requireSdf = false } = opts;
      for (const c of this.chunks) {
        if (c._renderBg1PerLayer) {
          c._renderBg1PerLayer.clear();
          c._renderBg1PerLayer = null;
        }
        if (c._renderBg0PerLayer) {
          c._renderBg0PerLayer.clear();
          c._renderBg0PerLayer = null;
        }
        delete c._renderBg0;
        delete c._renderBg1;
        delete c._modelBufIdx;
      }
      this.chunks = chunks || [];
      for (const b of this.modelBuffers) {
        try {
          b.destroy();
        } catch (e) {
        }
      }
      this.modelBuffers = this.chunks.map(
        () => this.device.createBuffer({
          size: 4 * 20,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
      );
      const fractalNames = [
        "fractalView",
        "fractalViews",
        "fractalLayerViews",
        "fractalTex",
        "fractalTexture",
        "fractalTextureView",
        "fractal"
      ];
      const sdfNames = [
        "sdfView",
        "sdfLayerViews",
        "sdfViews",
        "sdfTex",
        "sdfTexture",
        "sdf"
      ];
      const flagNames = [
        "flagView",
        "flagLayerViews",
        "flagViews",
        "flagTex",
        "flagTexture",
        "flag"
      ];
      const bgLayout0 = this._bgLayout0;
      const bgLayout1 = this._bgLayout1;
      const layersCount = Math.max(1, Math.floor(layers || 1));
      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];
        info._renderBg0PerLayer = null;
        info._renderBg0 = null;
        const desiredLayerIndex = layerIndex >>> 0;
        try {
          this._normalizeChunkViews(info, layersCount);
        } catch (e) {
          console.warn("setChunks: _normalizeChunkViews failed for chunk", i, e);
        }
        const hasPerLayerColor = Array.isArray(info.fractalLayerViews) && info.fractalLayerViews.length > 1 || Array.isArray(info.layerViews) && info.layerViews.length > 1;
        if (layersCount > 1 && hasPerLayerColor) {
          info._renderBg0PerLayer = /* @__PURE__ */ new Map();
          let anyFail = false;
          for (let L = 0; L < layersCount; ++L) {
            const fractalViewForL = this._getLayerView(info, fractalNames, L, {
              preferArrayView: true
            }) || this._getLayerView(info, fractalNames, 0, {
              preferArrayView: true
            });
            if (!fractalViewForL) continue;
            try {
              const perBg0 = this.device.createBindGroup({
                layout: bgLayout0,
                entries: [
                  { binding: 0, resource: fractalViewForL },
                  { binding: 1, resource: this.sampler },
                  { binding: 2, resource: { buffer: this.renderUniformBuffer } },
                  { binding: 3, resource: { buffer: this.cameraBuffer } },
                  { binding: 4, resource: { buffer: this.threshBuf } }
                ]
              });
              info._renderBg0PerLayer.set(L, perBg0);
            } catch (e) {
              console.warn(
                "setChunks: per-layer bg0 creation failed for chunk",
                i,
                "layer",
                L,
                e
              );
              info._renderBg0PerLayer.clear();
              info._renderBg0PerLayer = null;
              anyFail = true;
              break;
            }
          }
          if (anyFail) {
            info._renderBg0PerLayer = null;
          }
        }
        if (!info._renderBg0PerLayer) {
          const fractalView = this._getLayerView(
            info,
            fractalNames,
            desiredLayerIndex,
            { preferArrayView: true }
          );
          if (!fractalView) {
            const keys = Object.keys(info);
            const msg = `RenderPipelineGPU.setChunks: chunk[${i}] missing fractal view (tried: ${fractalNames.join(
              ", "
            )}). chunk keys: ${keys.join(",")}`;
            console.error(msg, info);
            throw new Error(msg);
          }
          try {
            const bg0 = this.device.createBindGroup({
              layout: bgLayout0,
              entries: [
                { binding: 0, resource: fractalView },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: { buffer: this.renderUniformBuffer } },
                { binding: 3, resource: { buffer: this.cameraBuffer } },
                { binding: 4, resource: { buffer: this.threshBuf } }
              ]
            });
            info._renderBg0 = bg0;
          } catch (e) {
            console.error(
              "setChunks: createBindGroup(bg0) failed for chunk",
              i,
              e
            );
            throw e;
          }
        }
        let sdfView0 = this._getLayerView(info, sdfNames, desiredLayerIndex);
        let flagView0 = this._getLayerView(info, flagNames, desiredLayerIndex);
        if (requireSdf && (!sdfView0 || !flagView0)) {
          throw new Error(
            `RenderPipelineGPU.setChunks: chunk[${i}] missing SDF or flag view and requireSdf=true.`
          );
        }
        if (!sdfView0) {
          sdfView0 = this._fallbackSdfView;
          info._usingFallbackSdf = Boolean(sdfView0);
        } else {
          info._usingFallbackSdf = false;
        }
        if (!flagView0) {
          flagView0 = this._fallbackFlagView;
          info._usingFallbackFlag = Boolean(flagView0);
        } else {
          info._usingFallbackFlag = false;
        }
        try {
          const bg1 = this.device.createBindGroup({
            layout: bgLayout1,
            entries: [
              { binding: 0, resource: { buffer: this.modelBuffers[i] } },
              { binding: 1, resource: sdfView0 },
              { binding: 2, resource: flagView0 },
              { binding: 3, resource: this.sampler }
            ]
          });
          info._renderBg1 = bg1;
        } catch (e) {
          console.error("setChunks: createBindGroup(bg1) failed for chunk", i, e);
          info._renderBg1 = null;
        }
        info._modelBufIdx = i;
        info._renderBg1PerLayer = /* @__PURE__ */ new Map();
      }
    }
    updateCamera(cam, aspect) {
      const proj = perspective(cam.fov, aspect, 0.01, 1e4);
      const view = lookAt(cam.cameraPos, cam.lookTarget, cam.upDir);
      const viewProj = mulMat(proj, view);
      this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProj);
    }
    writeRenderUniform(paramsState = {}) {
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
        worldOffset: 0,
        worldStart: 0
      };
      const p = Object.assign({}, defaults, paramsState);
      const lp = Array.isArray(p.lightPos) ? p.lightPos : defaults.lightPos;
      const buf = new ArrayBuffer(96);
      const dv = new DataView(buf);
      let off = 0;
      dv.setUint32(off, p.layerIndex >>> 0, true);
      off += 4;
      dv.setUint32(off, p.scheme >>> 0, true);
      off += 4;
      dv.setUint32(off, p.dispMode >>> 0, true);
      off += 4;
      dv.setUint32(off, p.bowlOn ? 1 : 0, true);
      off += 4;
      dv.setFloat32(off, p.hueOffset, true);
      off += 4;
      dv.setFloat32(off, p.dispAmp, true);
      off += 4;
      dv.setFloat32(off, p.dispCurve, true);
      off += 4;
      dv.setFloat32(off, p.bowlDepth, true);
      off += 4;
      dv.setFloat32(off, p.quadScale, true);
      off += 4;
      dv.setFloat32(off, p.gridSize, true);
      off += 4;
      dv.setUint32(off, p.lightingOn ? 1 : 0, true);
      off += 4;
      dv.setUint32(off, p.dispLimitOn ? 1 : 0, true);
      off += 4;
      dv.setFloat32(off, lp[0] ?? 0, true);
      off += 4;
      dv.setFloat32(off, lp[1] ?? 0, true);
      off += 4;
      dv.setFloat32(off, lp[2] ?? 0, true);
      off += 4;
      dv.setFloat32(off, p.specPower, true);
      off += 4;
      dv.setFloat32(off, p.slopeLimit, true);
      off += 4;
      dv.setFloat32(off, p.wallJump, true);
      off += 4;
      dv.setUint32(off, p.alphaMode >>> 0, true);
      off += 4;
      dv.setFloat32(off, p.worldOffset, true);
      off += 4;
      dv.setFloat32(off, p.worldStart, true);
      off += 4;
      dv.setUint32(off, 0, true);
      off += 4;
      dv.setUint32(off, 0, true);
      off += 4;
      dv.setUint32(off, 0, true);
      off += 4;
      this.device.queue.writeBuffer(this.renderUniformBuffer, 0, buf);
    }
    writeThreshUniform(paramsState = {}) {
      const defaults = { lowT: 0, highT: 1, basis: 0 };
      const p = Object.assign({}, defaults, paramsState);
      this.device.queue.writeBuffer(
        this.threshBuf,
        0,
        new Float32Array([p.lowT, p.highT, p.basis, 0])
      );
    }
    async render(paramsState, camState) {
      const aspect = this._lastCanvasSize[0] && this._lastCanvasSize[1] ? this._lastCanvasSize[0] / this._lastCanvasSize[1] : 1;
      this.updateCamera(camState, aspect);
      const nLayers = Math.max(
        1,
        Math.floor(paramsState.nLayers ?? paramsState.layers ?? 1)
      );
      const LOG_BINDINGS = false;
      this.writeThreshUniform(paramsState);
      if (!this.gridStripes) {
        this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
      }
      const encoder = this.device.createCommandEncoder();
      const viewTex = this.context.getCurrentTexture().createView();
      const alphaMode = paramsState.alphaMode ?? 0;
      const texelWorld = 2 * paramsState.quadScale / paramsState.gridSize;
      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];
        const modelBuf = this.modelBuffers[i];
        const w = info.width * texelWorld;
        const h = info.height * texelWorld;
        const x = -paramsState.quadScale + info.offsetX * texelWorld;
        const y = -paramsState.quadScale + (info.offsetY ?? 0) * texelWorld;
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
        const u0 = info.offsetX / paramsState.gridSize;
        const v0 = 0;
        const su = info.width / paramsState.gridSize;
        const sv = 1;
        const uvOS = new Float32Array([u0, v0, su, sv]);
        this.device.queue.writeBuffer(modelBuf, 0, modelMat);
        this.device.queue.writeBuffer(modelBuf, 64, uvOS);
      }
      const getBg0ForLayer = (info, layer) => {
        if (info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)) {
          return info._renderBg0PerLayer.get(layer);
        }
        return info._renderBg0;
      };
      const getBg1 = (info) => info._renderBg1;
      const orderedLayers = (() => {
        const arr = [];
        for (let l = nLayers - 1; l >= 0; --l) arr.push(l);
        return arr;
      })();
      if (alphaMode === 1 || alphaMode === 2) {
        const prepass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: viewTex,
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }
          ],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthLoadOp: "clear",
            depthStoreOp: "store",
            depthClearValue: 1
          }
        });
        prepass.setPipeline(this.renderPipelineDepth);
        for (const layer of orderedLayers) {
          this.writeRenderUniform(
            Object.assign({}, paramsState, { layerIndex: layer })
          );
          for (let i = 0; i < this.chunks.length; ++i) {
            const info = this.chunks[i];
            const bg0 = getBg0ForLayer(info, layer);
            if (!bg0) continue;
            prepass.setBindGroup(0, bg0);
            const bg1 = getBg1(info);
            if (!bg1) continue;
            prepass.setBindGroup(1, bg1);
            if (LOG_BINDINGS) {
              console.log(
                `prepass L${layer} C${i} bg0PerLayer=${Boolean(
                  info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)
                )}`
              );
            }
            for (const stripe of this.gridStripes) {
              prepass.setVertexBuffer(0, stripe.vbuf);
              prepass.setIndexBuffer(stripe.ibuf, "uint32");
              prepass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
            }
          }
        }
        prepass.end();
        const blendPass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: viewTex,
              loadOp: "load",
              storeOp: "store"
            }
          ],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthLoadOp: "load",
            depthStoreOp: "store"
          }
        });
        blendPass.setPipeline(this.renderPipelineTransparent);
        for (const layer of orderedLayers) {
          this.writeRenderUniform(
            Object.assign({}, paramsState, { layerIndex: layer })
          );
          for (let i = 0; i < this.chunks.length; ++i) {
            const info = this.chunks[i];
            const bg0 = getBg0ForLayer(info, layer);
            if (!bg0) continue;
            blendPass.setBindGroup(0, bg0);
            const bg1 = getBg1(info);
            if (!bg1) continue;
            blendPass.setBindGroup(1, bg1);
            if (LOG_BINDINGS) {
              console.log(
                `blend L${layer} C${i} bg0PerLayer=${Boolean(
                  info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)
                )}`
              );
            }
            for (const stripe of this.gridStripes) {
              blendPass.setVertexBuffer(0, stripe.vbuf);
              blendPass.setIndexBuffer(stripe.ibuf, "uint32");
              blendPass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
            }
          }
        }
        blendPass.end();
      } else {
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
            view: this.depthTexture.createView(),
            depthLoadOp: "clear",
            depthStoreOp: "store",
            depthClearValue: 1
          }
        });
        rpass.setPipeline(this.renderPipelineOpaque);
        for (const layer of orderedLayers) {
          this.writeRenderUniform(
            Object.assign({}, paramsState, { layerIndex: layer })
          );
          for (let i = 0; i < this.chunks.length; ++i) {
            const info = this.chunks[i];
            const bg0 = getBg0ForLayer(info, layer);
            if (!bg0) continue;
            rpass.setBindGroup(0, bg0);
            const bg1 = getBg1(info);
            if (!bg1) continue;
            rpass.setBindGroup(1, bg1);
            for (const stripe of this.gridStripes) {
              rpass.setVertexBuffer(0, stripe.vbuf);
              rpass.setIndexBuffer(stripe.ibuf, "uint32");
              rpass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
            }
          }
        }
        rpass.end();
      }
      this.device.queue.submit([encoder.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    }
    async renderBlitToView(paramsState, colorView) {
      const texelWorld = 2 * paramsState.quadScale / paramsState.gridSize;
      this.writeRenderUniform(paramsState);
      this.writeThreshUniform(paramsState);
      if (!this.gridStripes) {
        this.gridStripes = await buildPlaneGridChunks(this.device, this.gridDivs);
      }
      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];
        const modelBuf = this.modelBuffers[i];
        const w = info.width * texelWorld;
        const h = info.height * texelWorld;
        const x = -paramsState.quadScale + info.offsetX * texelWorld;
        const y = -paramsState.quadScale + (info.offsetY ?? 0) * texelWorld;
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
        const u0 = info.offsetX / paramsState.gridSize;
        const v0 = 0;
        const su = info.width / paramsState.gridSize;
        const sv = 1;
        const uvOS = new Float32Array([u0, v0, su, sv]);
        this.device.queue.writeBuffer(modelBuf, 0, modelMat);
        this.device.queue.writeBuffer(modelBuf, 64, uvOS);
      }
      const encoder = this.device.createCommandEncoder();
      const rpass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: colorView,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }
        ]
      });
      const getBg0 = (info) => info._renderBg0PerLayer && info._renderBg0PerLayer.size ? info._renderBg0PerLayer.get(paramsState.layerIndex >>> 0) || info._renderBg0 : info._renderBg0;
      const getBg1 = (info) => info._renderBg1;
      rpass.setPipeline(this.renderPipelineBlitOpaque);
      for (let i = 0; i < this.chunks.length; ++i) {
        const info = this.chunks[i];
        const bg0 = getBg0(info);
        if (!bg0) continue;
        rpass.setBindGroup(0, bg0);
        const bg1 = getBg1(info);
        if (!bg1) continue;
        rpass.setBindGroup(1, bg1);
        for (const stripe of this.gridStripes) {
          rpass.setVertexBuffer(0, stripe.vbuf);
          rpass.setIndexBuffer(stripe.ibuf, "uint32");
          rpass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
        }
      }
      rpass.end();
      this.device.queue.submit([encoder.finish()]);
      await this.device.queue.onSubmittedWorkDone();
    }
    async renderBlitToTexture(paramsState, targetTexture) {
      const view = targetTexture.createView();
      await this.renderBlitToView(paramsState, view);
    }
    idxForWorldX(worldX, paramsState) {
      const half = paramsState.quadScale;
      const uGlobal = (worldX + half) / (2 * half);
      const pixelX = Math.floor(uGlobal * paramsState.gridSize);
      for (let i = 0; i < this.chunks.length; ++i) {
        const c = this.chunks[i];
        if (pixelX >= c.offsetX && pixelX < c.offsetX + c.width) return i;
      }
      return 0;
    }
    destroy() {
      for (const b of this.modelBuffers) {
        try {
          b.destroy();
        } catch (e) {
        }
      }
      this.modelBuffers.length = 0;
      if (this.gridStripes) {
        for (const s of this.gridStripes) {
          try {
            s.vbuf.destroy();
          } catch (e) {
          }
          try {
            s.ibuf.destroy();
          } catch (e) {
          }
        }
        this.gridStripes = null;
      }
      try {
        if (this.depthTexture) this.depthTexture.destroy();
      } catch (e) {
      }
      this.depthTexture = null;
      try {
        if (this._fallbackSdfTex) this._fallbackSdfTex.destroy();
      } catch (e) {
      }
      this._fallbackSdfTex = null;
      this._fallbackSdfView = null;
      try {
        if (this._fallbackFlagTex) this._fallbackFlagTex.destroy();
      } catch (e) {
      }
      this._fallbackFlagTex = null;
      this._fallbackFlagView = null;
    }
  };

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

  // render.js
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
      nLayers: void 0,
      maxIter: 150,
      fractalType: 0,
      scaleMode: 1,
      zoom: 4,
      dx: 0,
      dy: 0,
      escapeR: 4,
      zMin: 0,
      dz: 0.01,
      gamma: 1,
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
      lightingOn: false,
      lightPos: [0, 0, 5],
      specPower: 32,
      lowT: 0,
      highT: 1,
      alphaMode: 0,
      basis: 0,
      normalMode: 2
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
    scaleMode: F.C,
    zoom: F.C,
    dx: F.C,
    dy: F.C,
    escapeR: F.C,
    gamma: F.C,
    epsilon: F.C,
    convergenceTest: F.C,
    escapeMode: F.C,
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
    hueOffset: F.R,
    scheme: F.R,
    colorScheme: F.R,
    lightingOn: F.R | F.D,
    lightPos: F.R,
    specPower: F.R,
    dispLimitOn: F.R,
    gridDivs: F.R | F.G,
    lowT: F.R,
    highT: F.R,
    basis: F.R
  };
  var pending = { paramsState: {} };
  var dirtyBits = 0;
  function setState(partial) {
    Object.assign(pending.paramsState, partial);
    for (const k in partial) dirtyBits |= DIRTY_MAP[k] || 0;
  }
  function flushPending() {
    if (!dirtyBits) return;
    Object.assign(renderGlobals.paramsState, pending.paramsState);
    pending.paramsState = {};
    renderGlobals.computeDirty ||= !!(dirtyBits & F.C);
    renderGlobals.displacementDirty ||= !!(dirtyBits & F.D);
    renderGlobals.cameraDirty ||= !!(dirtyBits & F.R);
    renderGlobals.gridDirty ||= !!(dirtyBits & F.G);
    dirtyBits = 0;
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
  function randomTag() {
    return Math.random().toString(36).slice(2, 8);
  }
  async function initRender() {
    const canvas = document.getElementById("gpu-canvas");
    const device = await initWebGPU();
    const context = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    function parseAlphaModeToNumeric(mode) {
      if (mode === void 0 || mode === null) {
        return Number(renderGlobals.paramsState.alphaMode || 0);
      }
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
    const initialNumeric = typeof window !== "undefined" && window.__pendingAlphaMode !== void 0 ? parseAlphaModeToNumeric(window.__pendingAlphaMode) : parseAlphaModeToNumeric(renderGlobals.paramsState.alphaMode);
    renderGlobals.paramsState.alphaMode = initialNumeric;
    let currentAlphaMode = canvasAlphaStringForNumeric(initialNumeric);
    window.setAlphaMode = function setAlphaMode(mode) {
      const numeric = parseAlphaModeToNumeric(mode);
      renderGlobals.paramsState.alphaMode = numeric;
      const newCanvasMode = canvasAlphaStringForNumeric(numeric);
      if (newCanvasMode !== currentAlphaMode) {
        currentAlphaMode = newCanvasMode;
        window.__currentCanvasAlphaMode = currentAlphaMode;
        try {
          context.configure({
            device,
            format,
            alphaMode: currentAlphaMode,
            size: [canvas.width, canvas.height]
          });
        } catch (e) {
          console.warn("setAlphaMode: context.configure failed:", e);
        }
      }
      renderGlobals.cameraDirty = true;
      renderGlobals.gridDirty = true;
    };
    const uniformStride = 256;
    const MAX_PIXELS_PER_CHUNK = 8e6;
    const MIN_SPLIT = 1024;
    let yaw = 0;
    let pitch = 0;
    const cameraPos = [0, 0, 2.4];
    const lookTarget = [0, 0, 0];
    const upDir = [0, 1, 0];
    let fov = 45 * Math.PI / 180;
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
    const renderPipeline = new RenderPipelineGPU(
      device,
      context,
      void 0,
      void 0,
      {
        renderUniformStride: 256,
        initialGridDivs: renderGlobals.paramsState.gridDivs,
        quadScale: renderGlobals.paramsState.quadScale
      }
    );
    const queryCompute = new QueryComputeGPU(
      device,
      void 0,
      renderPipeline.sampler,
      renderPipeline.renderUniformBuffer,
      {
        uniformQuerySize: 16,
        queryResultBytes: 280
      }
    );
    let chunkInfos = [];
    let sdfReady = false;
    let resizeTimer = 0;
    let frameHandle = 0;
    let exporting = false;
    function requestedLayers() {
      return Math.max(
        1,
        Math.floor(
          renderGlobals.paramsState.nLayers ?? renderGlobals.paramsState.layers ?? 1
        )
      );
    }
    function availableFractalLayers(chunks = []) {
      if (!Array.isArray(chunks) || chunks.length === 0) return 1;
      let maxLayers = 1;
      for (const c of chunks) {
        if (Array.isArray(c.fractalLayerViews) && c.fractalLayerViews.length) {
          maxLayers = Math.max(maxLayers, c.fractalLayerViews.length);
        } else if (Array.isArray(c.layerViews) && c.layerViews.length) {
          maxLayers = Math.max(maxLayers, c.layerViews.length);
        } else if (c.fractalView) {
          maxLayers = Math.max(maxLayers, 1);
        }
      }
      return Math.max(1, maxLayers);
    }
    function effectiveSplitCount(requestedSplit) {
      const req = Math.max(1, Math.floor(requestedSplit || 0));
      const eff = Math.min(req, MAX_PIXELS_PER_CHUNK);
      if (eff !== req) {
        console.debug(
          "splitCount clamped: requested=" + req + ", effective=" + eff
        );
      }
      return eff;
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
          const params = Object.assign({}, renderGlobals.paramsState, {
            splitCount: eff
          });
          const chunks = await fractalCompute.compute(params, layerIndex, aspect);
          chunkInfos = chunks || [];
          for (const c of chunkInfos) {
            if (!c.fractalView && c.layerViews && c.layerViews[0]) {
              c.fractalView = c.layerViews[0];
            }
          }
          sdfReady = false;
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
            }
            return chunkInfos;
          }
          const next = Math.max(MIN_SPLIT, Math.floor(eff / 2));
          eff = next === eff ? MIN_SPLIT : next;
        }
      }
    }
    async function computeFractalLayerSeries(count, aspect = 1) {
      count = Math.max(1, count >>> 0);
      const params = Object.assign({}, renderGlobals.paramsState, {
        splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount)
      });
      let seriesChunks;
      if (typeof fractalCompute.computeLayerSeries === "function") {
        const gammaStart = 1;
        const gammaRange = 0;
        seriesChunks = await fractalCompute.computeLayerSeries(
          params,
          gammaStart,
          gammaRange,
          count,
          aspect,
          "main"
        );
      } else {
        const merged = /* @__PURE__ */ new Map();
        for (let li = 0; li < count; ++li) {
          const chunks = await fractalCompute.compute(
            params,
            li,
            aspect,
            "main",
            count
          );
          for (const c of chunks) {
            const key = `${c.offsetX}|${c.offsetY}|${c.width}|${c.height}`;
            let dst = merged.get(key);
            if (!dst) {
              dst = Object.assign({}, c);
              dst.fractalLayerViews = [];
              merged.set(key, dst);
            }
            const view = c.fractalView || c.layerViews && c.layerViews[0] || null;
            dst.fractalLayerViews[li] = view;
          }
        }
        seriesChunks = Array.from(merged.values());
      }
      chunkInfos = (seriesChunks || []).map((c) => {
        const out = Object.assign({}, c);
        out.fractalLayerViews = out.fractalLayerViews || out.layerViews || [];
        if (!out.fractalView) out.fractalView = out.fractalLayerViews[0] || null;
        return out;
      });
      sdfReady = false;
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
        const params = Object.assign({}, renderGlobals.paramsState, {
          splitCount: effectiveSplitCount(renderGlobals.paramsState.splitCount)
        });
        await sdfCompute.compute(chunkInfos, params, layerIndex, aspect);
        await device.queue.onSubmittedWorkDone();
        sdfReady = true;
        if (queryCompute._bgCache) queryCompute._bgCache.clear();
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const req = requestedLayers();
        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
        await renderPipeline.setChunks(chunkInfos, layersToUse);
        return chunkInfos;
      } catch (err) {
        sdfReady = false;
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
          const req = requestedLayers();
          const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
          await renderPipeline.setChunks(chunkInfos, layersToUse);
        } catch (ebg) {
          console.warn(
            "computeSdfLayer: renderPipeline.setChunks failed even with fallbacks:",
            ebg
          );
        }
        return chunkInfos;
      }
    }
    function cleanupTempFallbacks(chunks = []) {
      for (const c of chunks) {
        if (c._tmpSdfTex) {
          try {
            c._tmpSdfTex.destroy();
          } catch (e) {
          }
          delete c._tmpSdfTex;
        }
        if (c._tmpFlagTex) {
          try {
            c._tmpFlagTex.destroy();
          } catch (e) {
          }
          delete c._tmpFlagTex;
        }
        if (c._usingTmpSdfFallback) delete c._usingTmpSdfFallback;
      }
    }
    function needsSdf(params = renderGlobals.paramsState) {
      return !!(params.dispMode && params.dispMode !== 0) || !!params.lightingOn;
    }
    function chunksWithoutSdf(chunks = []) {
      return (chunks || []).map((c) => {
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
    }
    function freeSdfData(chunks = []) {
      for (const c of chunks) {
        try {
          if (c.sdfTex) {
            try {
              c.sdfTex.destroy();
            } catch (e) {
            }
          }
        } catch (e) {
        }
        try {
          if (c.flagTex) {
            try {
              c.flagTex.destroy();
            } catch (e) {
            }
          }
        } catch (e) {
        }
        try {
          if (c._tmpSdfTex) {
            try {
              c._tmpSdfTex.destroy();
            } catch (e) {
            }
          }
        } catch (e) {
        }
        try {
          if (c._tmpFlagTex) {
            try {
              c._tmpFlagTex.destroy();
            } catch (e) {
            }
          }
        } catch (e) {
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
    }
    async function handleResizeImmediate() {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const pw = Math.floor(cw * (window.devicePixelRatio || 1));
      const ph = Math.floor(ch * (window.devicePixelRatio || 1));
      canvas.width = pw;
      canvas.height = ph;
      context.configure({
        device,
        format,
        alphaMode: currentAlphaMode,
        size: [pw, ph]
      });
      renderPipeline.resize(cw, ch);
      renderGlobals.computeDirty = true;
      renderGlobals.displacementDirty = true;
      renderGlobals.cameraDirty = true;
      renderGlobals.gridDirty = true;
      const aspect = pw / ph || 1;
      try {
        const req = requestedLayers();
        if (req > 1) {
          await computeFractalLayerSeries(req, aspect);
          freeSdfData(chunkInfos);
          const layersToUse = Math.min(
            req,
            availableFractalLayers(chunkInfos)
          );
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const chunksToUse = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(chunksToUse, layersToUse);
          sdfReady = false;
          renderGlobals.displacementDirty = false;
        } else {
          await computeFractalLayer(renderGlobals.paramsState.layerIndex, aspect);
          if (needsSdf(renderGlobals.paramsState)) {
            await computeSdfLayer(renderGlobals.paramsState.layerIndex, aspect);
          } else {
            freeSdfData(chunkInfos);
            renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
            const noSdfChunks = chunksWithoutSdf(chunkInfos);
            await renderPipeline.setChunks(noSdfChunks, 1);
            sdfReady = false;
          }
        }
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
    const keys = {};
    function onKeyDown(e) {
      keys[e.code] = true;
      if (e.code === "Escape") document.exitPointerLock();
    }
    function onKeyUp(e) {
      keys[e.code] = false;
    }
    function onMouseMove(e) {
      yaw += e.movementX * 2e-3;
      pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pitch - e.movementY * 2e-3)
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
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
      } else {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
      }
    });
    async function renderFrame() {
      const req = requestedLayers();
      const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
      const localParams = Object.assign({}, renderGlobals.paramsState, {
        nLayers: layersToUse
      });
      renderPipeline.writeRenderUniform(localParams);
      renderPipeline.writeThreshUniform(localParams);
      if (renderGlobals.gridDirty) {
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        renderPipeline.gridStripes = null;
        renderGlobals.gridDirty = false;
      }
      const chunksToUse = sdfReady ? chunkInfos : chunksWithoutSdf(chunkInfos);
      await renderPipeline.setChunks(chunksToUse, layersToUse);
      const camState = { cameraPos, lookTarget, upDir, fov };
      await renderPipeline.render(localParams, camState);
      await device.queue.onSubmittedWorkDone();
    }
    async function updateMovement(dt) {
      const ps = renderGlobals.paramsState;
      const speed = 2 * dt * ps.quadScale;
      const fx = lookTarget[0] - cameraPos[0];
      const fy = lookTarget[1] - cameraPos[1];
      const fz = lookTarget[2] - cameraPos[2];
      const fl = Math.hypot(fx, fy, fz) || 1;
      const forward = [fx / fl, fy / fl, fz / fl];
      const right = [
        forward[1] * upDir[2] - forward[2] * upDir[1],
        forward[2] * upDir[0] - forward[0] * upDir[2],
        forward[0] * upDir[1] - forward[1] * upDir[0]
      ];
      const rl = Math.hypot(...right) || 1;
      right[0] /= rl;
      right[1] /= rl;
      right[2] /= rl;
      let dx = 0;
      let dy = 0;
      let dz = 0;
      let moved = false;
      if (keys["KeyW"]) {
        dx += forward[0] * speed;
        dy += forward[1] * speed;
        dz += forward[2] * speed;
        moved = true;
      }
      if (keys["KeyS"]) {
        dx -= forward[0] * speed;
        dy -= forward[1] * speed;
        dz -= forward[2] * speed;
        moved = true;
      }
      if (keys["KeyA"]) {
        dx -= right[0] * speed;
        dy -= right[1] * speed;
        dz -= right[2] * speed;
        moved = true;
      }
      if (keys["KeyD"]) {
        dx += right[0] * speed;
        dy += right[1] * speed;
        dz += right[2] * speed;
        moved = true;
      }
      if (keys["Space"]) {
        dz += speed;
        moved = true;
      }
      if (keys["ShiftLeft"] || keys["ShiftRight"]) {
        dz -= speed;
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
        const req = requestedLayers();
        if (req > 1) {
          await computeFractalLayerSeries(req, aspect);
          freeSdfData(chunkInfos);
          const layersToUse = Math.min(
            req,
            availableFractalLayers(chunkInfos)
          );
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const chunksToUse = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(chunksToUse, layersToUse);
          sdfReady = false;
        } else {
          await computeFractalLayer(renderGlobals.paramsState.layerIndex, aspect);
          if (needsSdf(renderGlobals.paramsState)) {
            await computeSdfLayer(renderGlobals.paramsState.layerIndex, aspect);
          } else {
            freeSdfData(chunkInfos);
            renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
            const noSdfChunks = chunksWithoutSdf(chunkInfos);
            await renderPipeline.setChunks(noSdfChunks, 1);
            sdfReady = false;
          }
        }
        renderGlobals.computeDirty = false;
        renderGlobals.displacementDirty = false;
        renderGlobals.cameraDirty = true;
      } else if (renderGlobals.displacementDirty) {
        const req = requestedLayers();
        if (req > 1) {
          freeSdfData(chunkInfos);
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const layersToUse = Math.min(
            req,
            availableFractalLayers(chunkInfos)
          );
          const chunksToUse = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(chunksToUse, layersToUse);
          sdfReady = false;
        } else {
          if (needsSdf(renderGlobals.paramsState)) {
            await computeSdfLayer(
              renderGlobals.paramsState.layerIndex,
              aspect
            );
          } else {
            freeSdfData(chunkInfos);
            renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
            const noSdfChunks = chunksWithoutSdf(chunkInfos);
            await renderPipeline.setChunks(noSdfChunks, 1);
            sdfReady = false;
          }
        }
        renderGlobals.displacementDirty = false;
        renderGlobals.cameraDirty = true;
      }
    }
    let lastTime = performance.now();
    async function frame(now) {
      const dt = (now - lastTime) * 1e-3;
      lastTime = now;
      await device.queue.onSubmittedWorkDone();
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
    function downloadBlob(blob, filename) {
      if (!blob) return;
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url2;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url2);
    }
    function canvasToPngBlob(canvasEl) {
      return new Promise((resolve, reject) => {
        try {
          canvasEl.toBlob((blob) => {
            if (!blob) {
              reject(new Error("canvas.toBlob returned null"));
            } else {
              resolve(blob);
            }
          }, "image/png");
        } catch (e) {
          reject(e);
        }
      });
    }
    function copyWebGPUTo2D(canvasEl) {
      return (async () => {
        await device.queue.onSubmittedWorkDone();
        const w = canvasEl.width;
        const h = canvasEl.height;
        const tmp = document.createElement("canvas");
        tmp.width = w;
        tmp.height = h;
        const ctx2d = tmp.getContext("2d");
        if (!ctx2d) throw new Error("2D context unavailable for export");
        ctx2d.drawImage(canvasEl, 0, 0, w, h);
        return canvasToPngBlob(tmp);
      })();
    }
    async function renderFullResToTexture(targetTexture, paramsState, targetSize) {
      await device.queue.onSubmittedWorkDone();
      const camState = { cameraPos, lookTarget, upDir, fov };
      const aspect = 1;
      if (typeof renderPipeline.updateCamera === "function") {
        renderPipeline.updateCamera(camState, aspect);
      }
      const nLayers = Math.max(
        1,
        Math.floor(paramsState.nLayers ?? paramsState.layers ?? 1)
      );
      if (!renderPipeline.gridStripes) {
        const req = requestedLayers();
        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
        const localParams = Object.assign({}, renderGlobals.paramsState, {
          nLayers: layersToUse
        });
        renderPipeline.writeRenderUniform(localParams);
        renderPipeline.writeThreshUniform(localParams);
        const chunksToUse = sdfReady ? chunkInfos : chunksWithoutSdf(chunkInfos);
        await renderPipeline.setChunks(chunksToUse, layersToUse);
        await renderPipeline.render(localParams, camState);
        await device.queue.onSubmittedWorkDone();
      }
      const encoder = device.createCommandEncoder();
      const viewTex = targetTexture.createView();
      const depthTex = device.createTexture({
        size: [targetSize, targetSize, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      const depthView = depthTex.createView();
      const texelWorld = 2 * paramsState.quadScale / paramsState.gridSize;
      for (let i = 0; i < renderPipeline.chunks.length; ++i) {
        const info = renderPipeline.chunks[i];
        const modelBuf = renderPipeline.modelBuffers[i];
        if (!info || !modelBuf) continue;
        const w = info.width * texelWorld;
        const h = info.height * texelWorld;
        const x = -paramsState.quadScale + info.offsetX * texelWorld;
        const y = -paramsState.quadScale + (info.offsetY ?? 0) * texelWorld;
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
        const u0 = info.offsetX / paramsState.gridSize;
        const v0 = 0;
        const su = info.width / paramsState.gridSize;
        const sv = 1;
        const uvOS = new Float32Array([u0, v0, su, sv]);
        device.queue.writeBuffer(modelBuf, 0, modelMat);
        device.queue.writeBuffer(modelBuf, 64, uvOS);
      }
      const getBg0ForLayer = (info, layer) => {
        if (info._renderBg0PerLayer && info._renderBg0PerLayer.has(layer)) {
          return info._renderBg0PerLayer.get(layer);
        }
        return info._renderBg0;
      };
      const getBg1 = (info) => info._renderBg1;
      const orderedLayers = [];
      for (let l = nLayers - 1; l >= 0; --l) orderedLayers.push(l);
      renderPipeline.writeThreshUniform(paramsState);
      const alphaMode = paramsState.alphaMode ?? 0;
      if (alphaMode === 1 || alphaMode === 2) {
        const prepass = encoder.beginRenderPass({
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
        prepass.setPipeline(renderPipeline.renderPipelineDepth);
        for (const layer of orderedLayers) {
          const layerParams = Object.assign({}, paramsState, {
            layerIndex: layer
          });
          renderPipeline.writeRenderUniform(layerParams);
          for (let i = 0; i < renderPipeline.chunks.length; ++i) {
            const info = renderPipeline.chunks[i];
            const bg0 = getBg0ForLayer(info, layer);
            const bg1 = getBg1(info);
            if (!bg0 || !bg1) continue;
            prepass.setBindGroup(0, bg0);
            prepass.setBindGroup(1, bg1);
            for (const stripe of renderPipeline.gridStripes) {
              prepass.setVertexBuffer(0, stripe.vbuf);
              prepass.setIndexBuffer(stripe.ibuf, "uint32");
              prepass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
            }
          }
        }
        prepass.end();
        const blendPass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: viewTex,
              loadOp: "load",
              storeOp: "store"
            }
          ],
          depthStencilAttachment: {
            view: depthView,
            depthLoadOp: "load",
            depthStoreOp: "store"
          }
        });
        blendPass.setPipeline(renderPipeline.renderPipelineTransparent);
        for (const layer of orderedLayers) {
          const layerParams = Object.assign({}, paramsState, {
            layerIndex: layer
          });
          renderPipeline.writeRenderUniform(layerParams);
          for (let i = 0; i < renderPipeline.chunks.length; ++i) {
            const info = renderPipeline.chunks[i];
            const bg0 = getBg0ForLayer(info, layer);
            const bg1 = getBg1(info);
            if (!bg0 || !bg1) continue;
            blendPass.setBindGroup(0, bg0);
            blendPass.setBindGroup(1, bg1);
            for (const stripe of renderPipeline.gridStripes) {
              blendPass.setVertexBuffer(0, stripe.vbuf);
              blendPass.setIndexBuffer(stripe.ibuf, "uint32");
              blendPass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
            }
          }
        }
        blendPass.end();
      } else {
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
        rpass.setPipeline(renderPipeline.renderPipelineOpaque);
        for (const layer of orderedLayers) {
          const layerParams = Object.assign({}, paramsState, {
            layerIndex: layer
          });
          renderPipeline.writeRenderUniform(layerParams);
          for (let i = 0; i < renderPipeline.chunks.length; ++i) {
            const info = renderPipeline.chunks[i];
            const bg0 = getBg0ForLayer(info, layer);
            const bg1 = getBg1(info);
            if (!bg0 || !bg1) continue;
            rpass.setBindGroup(0, bg0);
            rpass.setBindGroup(1, bg1);
            for (const stripe of renderPipeline.gridStripes) {
              rpass.setVertexBuffer(0, stripe.vbuf);
              rpass.setIndexBuffer(stripe.ibuf, "uint32");
              rpass.drawIndexed(stripe.indexCount, 1, 0, 0, 0);
            }
          }
        }
        rpass.end();
      }
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      try {
        depthTex.destroy();
      } catch (e) {
      }
    }
    async function exportFractalCanvas() {
      try {
        const canvasEl = document.getElementById("gpu-canvas");
        if (!canvasEl) return;
        const blob = await copyWebGPUTo2D(canvasEl);
        const tag = randomTag();
        downloadBlob(blob, "fractal-canvas-" + tag + ".png");
      } catch (e) {
        console.error("exportFractalCanvas failed:", e);
      }
    }
    async function exportFractalFullRes() {
      try {
        exporting = true;
        await device.queue.onSubmittedWorkDone();
        flushPending();
        const targetRes = Math.max(
          64,
          Math.floor(renderGlobals.paramsState.gridSize || 1024)
        );
        const exportAspect = 1;
        await updateComputeAndDisplacement(exportAspect);
        const captureTexture = device.createTexture({
          size: [targetRes, targetRes, 1],
          format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        const reqLayers = requestedLayers();
        const layersToUse = Math.min(
          reqLayers,
          availableFractalLayers(chunkInfos)
        );
        const paramsForExport = Object.assign({}, renderGlobals.paramsState, {
          nLayers: layersToUse
        });
        await renderFullResToTexture(captureTexture, paramsForExport, targetRes);
        const bytesPerPixel = 4;
        const bytesPerRow = targetRes * bytesPerPixel + 255 & ~255;
        const bufferSize = bytesPerRow * targetRes;
        const readBuffer = device.createBuffer({
          size: bufferSize,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToBuffer(
          { texture: captureTexture },
          {
            buffer: readBuffer,
            bytesPerRow,
            rowsPerImage: targetRes
          },
          { width: targetRes, height: targetRes, depthOrArrayLayers: 1 }
        );
        device.queue.submit([encoder.finish()]);
        await device.queue.onSubmittedWorkDone();
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mapped = readBuffer.getMappedRange();
        const src = new Uint8Array(mapped);
        const pixels = new Uint8ClampedArray(
          targetRes * targetRes * bytesPerPixel
        );
        const isBGRA = format === "bgra8unorm";
        let dst = 0;
        for (let y = 0; y < targetRes; y++) {
          const rowStart = y * bytesPerRow;
          for (let x = 0; x < targetRes; x++) {
            const si = rowStart + x * 4;
            if (isBGRA) {
              pixels[dst++] = src[si + 2];
              pixels[dst++] = src[si + 1];
              pixels[dst++] = src[si + 0];
              pixels[dst++] = src[si + 3];
            } else {
              pixels[dst++] = src[si + 0];
              pixels[dst++] = src[si + 1];
              pixels[dst++] = src[si + 2];
              pixels[dst++] = src[si + 3];
            }
          }
        }
        readBuffer.unmap();
        readBuffer.destroy();
        captureTexture.destroy();
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = targetRes;
        tmpCanvas.height = targetRes;
        const ctx2d = tmpCanvas.getContext("2d");
        if (!ctx2d) throw new Error("No 2D context for full-res capture");
        const imageData = new ImageData(pixels, targetRes, targetRes);
        ctx2d.putImageData(imageData, 0, 0);
        const blob = await canvasToPngBlob(tmpCanvas);
        const tag = randomTag();
        downloadBlob(blob, "fractal-" + targetRes + "-" + tag + ".png");
      } catch (e) {
        console.error("exportFractalFullRes failed:", e);
      } finally {
        exporting = false;
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
      context.configure({
        device,
        format,
        alphaMode: currentAlphaMode,
        size: [pw, ph]
      });
      renderPipeline.resize(cw, ch);
      renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
      renderPipeline.gridStripes = null;
      const aspect = pw / ph || 1;
      const req = requestedLayers();
      if (req > 1) {
        await computeFractalLayerSeries(req, aspect);
        freeSdfData(chunkInfos);
        const layersToUse = Math.min(req, availableFractalLayers(chunkInfos));
        renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
        const chunksToUse = chunksWithoutSdf(chunkInfos);
        await renderPipeline.setChunks(chunksToUse, layersToUse);
        sdfReady = false;
        renderGlobals.displacementDirty = false;
      } else {
        await computeFractalLayer(renderGlobals.paramsState.layerIndex, aspect);
        if (needsSdf(renderGlobals.paramsState)) {
          await computeSdfLayer(renderGlobals.paramsState.layerIndex, aspect);
          renderGlobals.displacementDirty = false;
        } else {
          freeSdfData(chunkInfos);
          renderPipeline.gridDivs = renderGlobals.paramsState.gridDivs;
          const noSdfChunks = chunksWithoutSdf(chunkInfos);
          await renderPipeline.setChunks(noSdfChunks, 1);
          sdfReady = false;
        }
      }
      cleanupTempFallbacks(chunkInfos);
      await renderFrame();
      renderGlobals.computeDirty = false;
      renderGlobals.cameraDirty = false;
      renderGlobals.displacementDirty = false;
    }
    if (typeof window !== "undefined") {
      window.exportFractalCanvas = exportFractalCanvas;
      window.exportFractalFullRes = exportFractalFullRes;
      window.__fractalRuntime = {
        device,
        context,
        renderPipeline,
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
      renderPipeline,
      queryCompute,
      destroy: () => {
        try {
          cancelAnimationFrame(frameHandle);
        } catch (e) {
        }
        try {
          fractalCompute.destroy();
        } catch (e) {
        }
        try {
          sdfCompute.destroy(chunkInfos || []);
        } catch (e) {
        }
        try {
          renderPipeline.destroy();
        } catch (e) {
        }
        try {
          if (chunkInfos && chunkInfos.forEach) {
            chunkInfos.forEach((c) => {
              try {
                if (c.fractalTex) c.fractalTex.destroy();
              } catch (e) {
              }
              try {
                if (c.sdfTex) c.sdfTex.destroy();
              } catch (e) {
              }
              try {
                if (c.flagTex) c.flagTex.destroy();
              } catch (e) {
              }
              try {
                if (c._tmpSdfTex) c._tmpSdfTex.destroy();
              } catch (e) {
              }
              try {
                if (c._tmpFlagTex) c._tmpFlagTex.destroy();
              } catch (e) {
              }
            });
          }
        } catch (e) {
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
      button.addEventListener("click", () => {
        const isCollapsed = ui.classList.toggle("collapsed");
        button.textContent = isCollapsed ? "+" : "-";
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
    const LIVE_IDS = /* @__PURE__ */ new Set([
      "epsilon",
      "dispAmp",
      "zoom",
      "dx",
      "dy",
      "gamma",
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
      "worldOffset",
      "worldStart",
      "gridDivs"
    ]);
    const FORMATTERS = {
      epsilon: (v) => v.toExponential(),
      dispAmp: (v) => v.toFixed(2),
      zoom: (v) => v.toFixed(2),
      dx: (v) => v.toFixed(2),
      dy: (v) => v.toFixed(2),
      gamma: (v) => v.toFixed(2),
      hueOffset: (v) => v.toFixed(2),
      dispCurve: (v) => v.toFixed(2),
      bowlDepth: (v) => v.toFixed(2),
      lowThresh: (v) => v.toFixed(2),
      highThresh: (v) => v.toFixed(2),
      thresholdBasis: (v) => String(v),
      wallJump: (v) => v.toFixed(2),
      nLayers: (v) => v.toFixed(0),
      worldOffset: (v) => v.toFixed(2),
      worldStart: (v) => v.toFixed(2),
      gridDivs: (v) => String(Math.round(v))
    };
    const DEFAULT_FORMATTER = (v) => String(Math.round(v));
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
      hueOffset: "hueOffset",
      epsilon: "epsilon",
      gridDivs: "gridDivs",
      nLayers: "nLayers",
      worldOffset: "worldOffset",
      worldStart: "worldStart",
      scaleMode: "scaleMode"
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
        const rad = Math.asin(Math.sqrt(Math.min(Math.max(rnorm, 0), 1)));
        return rad * 180 / Math.PI;
      }
      return params[p];
    }
    function setupSlider(id, onChange) {
      const slider = document.getElementById(id);
      if (!slider) {
        console.warn("No slider element for id:", id);
        return null;
      }
      const out = document.getElementById(id + "Out");
      const initVal = getParamValueForControl(id);
      if (typeof initVal === "number") {
        try {
          slider.value = String(initVal);
          if (out) out.value = (FORMATTERS[id] || DEFAULT_FORMATTER)(initVal);
        } catch (e) {
        }
      }
      const evtName = LIVE_IDS.has(id) ? "input" : "change";
      const formatFn = FORMATTERS[id] || DEFAULT_FORMATTER;
      function handle() {
        const num = parseFloat(slider.value);
        if (!Number.isNaN(num)) {
          if (out) out.value = formatFn(num);
          onChange(num);
        }
      }
      slider.addEventListener(evtName, handle);
      if (out) {
        const outEvt = LIVE_IDS.has(id) ? "input" : "change";
        const handleOut = () => {
          const num = parseFloat(out.value);
          if (Number.isNaN(num)) return;
          onChange(num);
        };
        out.addEventListener(outEvt, handleOut);
      }
      handle();
      return slider;
    }
    function setupSelect(id, onChange) {
      const sel = document.getElementById(id);
      if (!sel) {
        console.warn("No select element for id:", id);
        return null;
      }
      const out = document.getElementById(id + "Out");
      const initVal = getParamValueForControl(id);
      if (initVal !== void 0 && initVal !== null) {
        try {
          sel.value = String(initVal);
        } catch (e) {
        }
      }
      function updateOutput() {
        if (out) out.value = sel.value;
      }
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
        const outEvt = "change";
        out.addEventListener(outEvt, handleOut);
      }
      updateOutput();
      onChange(sel.value);
      return sel;
    }
    function setupCheckbox(id, onChange) {
      const cb = document.getElementById(id);
      if (!cb) {
        console.warn("No checkbox element for id:", id);
        return null;
      }
      const paramName = ID_TO_PARAM[id] || id;
      const initVal = renderGlobals.paramsState[paramName];
      if (typeof initVal === "boolean") cb.checked = !!initVal;
      cb.addEventListener("change", () => onChange(cb.checked));
      onChange(cb.checked);
      return cb;
    }
    function setupMaskGroup(name, initialMask, onChange) {
      const boxes = Array.from(
        document.querySelectorAll(`input[name="${name}"]`)
      );
      if (!boxes.length) return null;
      function readMask() {
        let m = 0;
        for (const b of boxes) {
          if (b.checked) m |= parseInt(b.value, 10) || 0;
        }
        return m >>> 0;
      }
      function writeMask(mask) {
        for (const b of boxes) {
          const bit = parseInt(b.value, 10) || 0;
          b.checked = !!(mask & bit);
        }
      }
      writeMask(Number(initialMask) >>> 0);
      const handler = () => onChange(readMask());
      for (const b of boxes) b.addEventListener("change", handler);
      onChange(readMask());
      return { readMask, writeMask, elements: boxes };
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
    setupSlider("hueOffset", (v) => S({ hueOffset: v }));
    setupSlider(
      "nLayers",
      (v) => S({ nLayers: Math.max(1, Math.floor(v)) })
    );
    setupSlider("gridDivs", (v) => {
      const val = Math.max(1, Math.floor(v));
      S({ gridDivs: val });
    });
    const layerModeEl = document.getElementById("layerMode");
    function applyLayerModeUI(isLayerMode) {
      const disable = !!isLayerMode;
      const idsToToggle = [
        "dispMode",
        "dispAmp",
        "dispCurve",
        "dispLimitOn",
        "lightingOn",
        "lightX",
        "lightY",
        "lightZ",
        "specPower"
      ];
      for (const id of idsToToggle) {
        const el = document.getElementById(id);
        if (el) el.disabled = disable;
      }
      if (isLayerMode) {
        S({ layerMode: true, dispMode: 0, lightingOn: false });
      } else {
        S({ layerMode: false });
      }
    }
    if (layerModeEl) {
      const initialLayerMode = Boolean(renderGlobals.paramsState.layerMode);
      layerModeEl.checked = initialLayerMode;
      applyLayerModeUI(initialLayerMode);
      layerModeEl.addEventListener("change", () => {
        const v = !!layerModeEl.checked;
        applyLayerModeUI(v);
      });
      setupCheckbox("layerMode", (v) => applyLayerModeUI(v));
    } else {
      setupCheckbox("layerMode", (v) => applyLayerModeUI(v));
    }
    setupSelect("fractalType", (v) => S({ fractalType: +v }));
    setupSelect("escapeMode", (v) => S({ escapeMode: +v }));
    setupCheckbox("convergenceTest", (v) => S({ convergenceTest: v }));
    setupSelect("colorScheme", (v) => S({ scheme: +v }));
    setupSelect("dispMode", (v) => S({ dispMode: +v }));
    setupSlider("dispAmp", (v) => S({ dispAmp: v }));
    setupSlider("dispCurve", (v) => S({ dispCurve: v }));
    setupCheckbox("dispLimitOn", (v) => S({ dispLimitOn: v }));
    setupSlider("slopeLimit", (deg) => {
      const rad = deg * Math.PI / 180;
      const rnorm = Math.sin(rad) * Math.sin(rad);
      S({ slopeLimit: rnorm });
    });
    setupSlider("wallJump", (v) => S({ wallJump: v }));
    setupCheckbox("bowlOn", (v) => S({ bowlOn: v }));
    setupSlider("bowlDepth", (v) => S({ bowlDepth: v }));
    setupSlider("quadScale", (v) => S({ quadScale: v }));
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
    setupSelect("alphaMode", (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      S({ alphaMode: n });
      const canvasMode = n === 0 ? "opaque" : "premultiplied";
      if (typeof window.setAlphaMode === "function") {
        try {
          window.setAlphaMode(n);
        } catch (e) {
          try {
            window.setAlphaMode(canvasMode);
          } catch (e2) {
          }
        }
      } else {
        window.__pendingAlphaMode = canvasMode;
      }
    });
    setupMaskGroup(
      "scaleMode",
      renderGlobals.paramsState.scaleMode ?? 0,
      (mask) => {
        S({ scaleMode: mask >>> 0 });
      }
    );
  };

  // index.js
  initUI();
  initRender().catch(console.error);
})();
