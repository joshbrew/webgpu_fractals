## WebGPU Fractals

<p  align="center">
<img width="70%" alt="Screenshot 2025-11-20 224655-min" src="https://github.com/user-attachments/assets/8e010476-165b-4838-bdae-b8727c0085bd" />
</p>

### ----> [Make your own fractals!](https://webgpufractals.netlify.app/) <----

#### [Codepen alt url](https://codepen.io/joshbrew/pen/ByNxqKB)

#### See also: [3D point cloud fractals](https://github.com/joshbrew/3D_Fractals_Scale_Space) (earlier non-WebGPU version)

This is a comprehensive WebGPU fractal rendering system built on compute shaders. It features a lot of well known fractals plus a bunch of custom ones that mostly build off of newton's fractals. It is written in pure javascript and WGSL with zero dependencies.

There are 71 fractal formulas to mess around with plus dozens of modifiers that alter the coordinates per-iteration in combinable ways. There are infinite possibilites, you might be surprised what you find.

You can:
- Control pan, zoom, iteration count, resolution (up to 8K!), escape radius, convergence...
- Modify the per-iteration math with a variety of cumulative effects.
- Add displacement mapping and lighting with flexible mesh resolution.
- Control which parts of the fractal are visible.
- Change color and hue in a very wide range, plus a simple optional lighting and specular model.
- Edit in real time with instantaneous updates to fine tune your favorite images.
- Click on the canvas to get camera control with WASD support. Press esc to quit.
- Download the image at full resolution (use reset camera if you moved so you can get the full image!). 8K images can be up to 50MB raw

Some limits:
- No deep zoom as we rely on base 32 bit float precision. We make up for it with the modifiers. It bottoms out around 7 decimals of precision.
- Julia sets don't work well with the modifiers so they're excluded, but you can still mess with the classic one.

    
## Build and run

With `tinybuild` installed globally (`npm i -g tinybuild`): `npm start`

## Configuration

See [`./tinybuild.config.js`](./tinybuild.config.js) for settings. 

Add build:true for build-only, add serve:true for serve-only, or set bundle or server to false alternatively.

Click to go to youtube:
[![Video1](https://img.youtube.com/vi/3Sco25ak8AA/maxresdefault.jpg)](https://www.youtube.com/watch?v=3Sco25ak8AA)
Click to go to youtube:
[![Video2](https://img.youtube.com/vi/uiNGqn5zEUs/maxresdefault.jpg)](https://www.youtube.com/watch?v=uiNGqn5zEUs)
Click to go to youtube:
[![Video3](https://img.youtube.com/vi/89uVpb0QUw8/maxresdefault.jpg)](https://www.youtube.com/watch?v=89uVpb0QUw8)

#### More screenshots: 

<img width="400" alt="image" src="https://github.com/user-attachments/assets/41be92a9-16f0-448a-8ec8-ffd030594301" />

<img width="400" alt="fractal-2560-kmrb67" src="https://github.com/user-attachments/assets/e64ac17c-4dc7-4ea5-95dc-0cda4715bb80" />

<img width="400" alt="fractal-1536-jltvae-min" src="https://github.com/user-attachments/assets/b6cd592b-284b-4f1f-94c2-69ed1fc73cd5" />
<img width="400" alt="fractal-3968-jjxvep-min" src="https://github.com/user-attachments/assets/9f91ef63-b003-416c-80bc-402b6d4f2e53" />
<img width="400" alt="fractal-3968-vv22hy-min" src="https://github.com/user-attachments/assets/41197fd5-e060-40ef-b19b-5097cd3b3385" />
<img width="400" alt="fractal-2048-6w645p-min" src="https://github.com/user-attachments/assets/d38ae2cf-b1cd-4450-b989-6e9dcc436ca1" />
<img width="400" alt="fractal-4096-pl3iog-min" src="https://github.com/user-attachments/assets/d8a089be-39d4-4d7c-9ea2-e5fe72638cdb" />
<img width="400" alt="fractal-4096-4mfwjr-min" src="https://github.com/user-attachments/assets/058dbf9f-d930-4d6a-911d-8225ce27311a" />
<img width="400" alt="fractal-4096-1xos3i-min" src="https://github.com/user-attachments/assets/7db77a47-1239-4f7b-a375-bce79862c245" />
<img width="400" alt="19image" src="https://github.com/user-attachments/assets/6efc14ab-1ede-4fad-96de-4699b7c04544" />
<img width="400" alt="18image" src="https://github.com/user-attachments/assets/aded6e13-dcbd-4662-ad46-47ac7eb4bb40" />
<img width="400"  alt="17image" src="https://github.com/user-attachments/assets/55da09e0-720e-4836-9196-80695d2a403a" />
<img width="400"  alt="13image" src="https://github.com/user-attachments/assets/27a258f2-4e17-4ed4-ba3e-38ea3bc5e6a0" />
<img width="400" alt="11image" src="https://github.com/user-attachments/assets/eb1e44d5-6176-4a4e-8e23-bfd04f65421f" />
<img width="400" alt="9image" src="https://github.com/user-attachments/assets/dee0e630-a11d-49ff-9063-ab2450d08537" />
<img width="400" alt="7image" src="https://github.com/user-attachments/assets/15404211-e77f-4ee4-a422-9901ad33ca67" />
<img width="400" alt="6image" src="https://github.com/user-attachments/assets/bfb187b4-48c9-41be-9be2-46425c33f575" />
<img width="400"  alt="3image" src="https://github.com/user-attachments/assets/2df131ac-af52-4887-8182-de2d661ac3a9" />
<img width="400" alt="2image" src="https://github.com/user-attachments/assets/d543fa56-2711-4682-a810-de43c91cbbcf" />











