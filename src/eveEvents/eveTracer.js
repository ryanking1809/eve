export const tracerCallbacks = new Set();
export const emitTracer = eId => {
  tracerCallbacks.size && [...tracerCallbacks].forEach((tc) => tc(eId));
};
