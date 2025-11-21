import { initUI } from "./ui";
import { initRender } from "./render";

initUI();
initRender().catch(console.error);

// import './shaders/noiseComputeTest'
// import './shaders/cloudTestThreaded.js'
// import './shaders/cloudsTest.js'

// import { planResources } from './shaders/helpers/wgslResourcePlanner'
// import noiseComputeWGSL from './shaders/noiseCompute.wgsl'


// console.log(
//     planResources(noiseComputeWGSL)
// );


// import './shaders/marchingCubesComputeExample'

// import './shaders/noiseTexToPointsTest'