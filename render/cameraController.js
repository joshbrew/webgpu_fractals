// render/cameraController.js
const _BLOCK_CODES = new Set([
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
  "KeyC",
]);

function _shouldBlockKey(e) {
  return _BLOCK_CODES.has(e.code) || e.key === " " || e.key === "Spacebar";
}

export function createCameraController({
  canvas,
  onDirty = null,

  initialPos = [0, 0, 2.4],
  initialYaw = 0,
  initialPitch = 0,
  initialFov = (45 * Math.PI) / 180,

  invertMouseY = true,
  mouseSens = 0.002,

  moveSpeed = 2.0,
  shiftMult = 3.0,
  ctrlMult = 0.35,
} = {}) {
  if (!canvas) throw new Error("createCameraController: canvas is required");

  const keys = Object.create(null);

  let yaw = +initialYaw || 0;
  let pitch = +initialPitch || 0;
  let fov = Number.isFinite(+initialFov) ? +initialFov : (45 * Math.PI) / 180;

  const cameraPos = [
    Number(initialPos?.[0] || 0),
    Number(initialPos?.[1] || 0),
    Number(initialPos?.[2] || 2.4),
  ];

  const lookTarget = [0, 0, 0];
  const upDir = [0, 1, 0];

  let _invertMouseY = !!invertMouseY;
  let _attached = false;

  function _markDirty() {
    if (onDirty) onDirty();
  }

  function updateLookTarget() {
    const dx = Math.cos(pitch) * Math.sin(yaw);
    const dy = Math.sin(pitch);
    const dz = -Math.cos(pitch) * Math.cos(yaw);
    lookTarget[0] = cameraPos[0] + dx;
    lookTarget[1] = cameraPos[1] + dy;
    lookTarget[2] = cameraPos[2] + dz;
    _markDirty();
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
      } catch {}
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

    const ySign = _invertMouseY ? 1 : -1;
    pitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, pitch + ySign * e.movementY * mouseSens),
    );

    updateLookTarget();
  }

  function onPointerLockChange() {
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
  }

  function onCanvasClick() {
    try {
      canvas.requestPointerLock();
    } catch {}
  }

  function attach() {
    if (_attached) return;
    _attached = true;

    canvas.addEventListener("click", onCanvasClick);
    document.addEventListener("pointerlockchange", onPointerLockChange);

    updateLookTarget();
  }

  function dispose() {
    if (!_attached) return;
    _attached = false;

    canvas.removeEventListener("click", onCanvasClick);
    document.removeEventListener("pointerlockchange", onPointerLockChange);

    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("keydown", onKeyDown, { capture: true });
    document.removeEventListener("keyup", onKeyUp, { capture: true });
  }

  function setInvertMouseY(v) {
    _invertMouseY = !!v;
  }

  function reset() {
    cameraPos[0] = 0;
    cameraPos[1] = 0;
    cameraPos[2] = 2.4;
    lookTarget[0] = 0;
    lookTarget[1] = 0;
    lookTarget[2] = 0;
    pitch = 0;
    yaw = 0;
    fov = (45 * Math.PI) / 180;
    updateLookTarget();
  }

  function setFovRadians(v) {
    if (!Number.isFinite(+v)) return;
    fov = +v;
    _markDirty();
  }

  function updateMovement(dt, quadScale = 1) {
    const dtt = Number.isFinite(+dt) ? +dt : 0;
    if (dtt <= 0) return false;

    let baseSpeed =
      moveSpeed *
      dtt *
      (Number.isFinite(+quadScale) ? +quadScale : 1);

    if (keys["ShiftLeft"] || keys["ShiftRight"]) baseSpeed *= shiftMult;
    if (keys["ControlLeft"] || keys["ControlRight"]) baseSpeed *= ctrlMult;

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

  const camState = {
    cameraPos,
    lookTarget,
    upDir,
    get fov() {
      return fov;
    },
    set fov(v) {
      setFovRadians(v);
    },
  };

  return {
    camState,
    attach,
    dispose,
    reset,
    setInvertMouseY,
    updateMovement,
  };
}