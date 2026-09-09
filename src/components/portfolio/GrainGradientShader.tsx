import { GrainGradient } from "@paper-design/shaders-react";

/**
 * Thin re-export wrapper so React.lazy() can load the GrainGradient shader —
 * the library has no default export, and lazy() requires one.
 */
export default GrainGradient;
