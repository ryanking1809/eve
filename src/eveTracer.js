export const tracerCallbacks = new Set();
export const fireTracerCallbacks = path => {
  tracerCallbacks.size && [...tracerCallbacks].forEach(gc => gc(path));
};
