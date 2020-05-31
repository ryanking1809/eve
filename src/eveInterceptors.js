import { tracerCallbacks } from "./eveTracer";
import { getEventIds, eventId } from "./eveEvents";

export const eventInterceptors = new WeakMap();

export const fireInterceptors = event => {
  return [...getEventIds(event)].every(eventId => {
    if (eventInterceptors[eventId] && eventInterceptors[eventId].size) {
      return [...eventInterceptors[eventId]].every(
        reaction => reaction(event) ?? true
      );
    }
    return true;
  });
};

export const addInterceptor = (
  { op, path, exactPathMatch = false } = {},
  retroaction
) => {
  const event = eventId(op, path, exactPathMatch);
  eventInterceptors[event] = eventInterceptors[event] || new Set();
  eventInterceptors[event].add(retroaction);
  return createInterceptorRef([{ op, path, exactPathMatch }], retroaction);
};

export const addInterceptors = (interceptors, retroaction) => {
  interceptors.forEach(int => addInterceptor(int, retroaction));
  return createInterceptorRef(interceptors, retroaction);
};

export const removeInterceptor = (
	{ op, path, exactPathMatch = false } = {},
	retroaction
) => {
	const event = eventId(op, path, exactPathMatch);
	eventInterceptors[event].delete(retroaction);
  return createInterceptorRef([{ op, path, exactPathMatch }], retroaction);
};

export const removeInterceptors = (interceptors, retroaction) => {
	interceptors.forEach((int) => removeInterceptor(int, retroaction));
  return createInterceptorRef(interceptors, retroaction);
};

export const intercept = (getListenerPaths, retroaction) => {
  let listenerPaths = new Set();
  const addPaths = path => listenerPaths.add(path);
  tracerCallbacks.add(addPaths);
  getListenerPaths();
  tracerCallbacks.delete(addPaths);
  listenerPaths = [...listenerPaths].map((path) => ({ path }));
  addInterceptors(listenerPaths, retroaction);
  return createInterceptorRef(listenerPaths, retroaction);
};

const createInterceptorRef = (ids, retroaction) => {
	return {
		ids,
		retroaction,
		listen: () => addInterceptors(ids, retroaction),
		destroy: () => removeInterceptors(ids, retroaction),
	};
};
