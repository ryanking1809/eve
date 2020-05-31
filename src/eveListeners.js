import { getEventIds, eventId } from "./eveEvents";
import { tracerCallbacks } from "./eveTracer";

export const eventListeners = new WeakMap();

export const fireListeners = event => {
  getEventIds(event).forEach(eventId => {
    eventListeners[eventId] &&
      eventListeners[eventId].size &&
      [...eventListeners[eventId]].forEach(reaction => reaction(event));
  });
};

export const addListener = (
  { op, path, exactPathMatch = false } = {},
  reaction
) => {
  const event = eventId(op, path, exactPathMatch);
  eventListeners[event] = eventListeners[event] || new Set();
  eventListeners[event].add(reaction);
  return createListenerRef([{op, path, exactPathMatch}], reaction);
};

export const addListeners = (events, reaction) => {
  events.forEach(event => addListener(event, reaction));
  return createListenerRef(events, reaction);
};

export const removeListener = (
	{ op, path, exactPathMatch = false } = {},
	reaction
) => {
	const event = eventId(op, path, exactPathMatch);
	eventListeners[event].delete(reaction);
  return createListenerRef([{op, path, exactPathMatch}], reaction);
};

export const removeListeners = (events, reaction) => {
	events.forEach((event) => removeListener(event, reaction));
  return createListenerRef(events, reaction);
};

export const listenTo = (getListenerPaths, reaction) => {
  let listenerPaths = new Set();
  const addPaths = path => listenerPaths.add(path);
  tracerCallbacks.add(addPaths);
  getListenerPaths();
  tracerCallbacks.delete(addPaths);
  listenerPaths = [...listenerPaths].map(path => ({path}));
  addListeners(listenerPaths, reaction)
  return createListenerRef(listenerPaths, reaction);
};

const createListenerRef = (ids, reaction) => {
  return {
		ids,
		reaction,
		listen: () => addListeners(ids, reaction),
		destroy: () => removeListeners(ids, reaction),
  };
}
