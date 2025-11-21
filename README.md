## WebGPU Fractals

This is a comprehensive WebGPU fractal rendering system built on compute shaders. It features a lot of well known fractals plus a bunch of custom ones that mostly build off of newton's fractals.

There are 71 fractal formulas to mess around with plus dozens of modifiers that alter the coordinates per-iteration in combinable ways. There are infinite possibilites, you might be surprised what you find.

Some limits:

    - No deep zoom as we rely on base 32 bit float precision. We make up for it with the modifiers. It bottoms out around 7 decimals of precision.
    - Julia sets don't work well with the modifiers so they're excluded, but you can still mess with the classic one.


## Build and run

With `tinybuild` installed globally (`npm i -g tinybuild`): `npm start`

## Configuration

See [`./tinybuild.config.js`](./tinybuild.config.js) for settings. 

Add build:true for build-only, add serve:true for serve-only, or set bundle or server to false alternatively.

