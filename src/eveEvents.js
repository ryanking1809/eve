import tuple from "immutable-tuple";

export const getEventIds = (event, type) => {
  let ids = [];
  for (let pathIndex = 0; pathIndex <= event.path.length; pathIndex++) {
    const path = event.path.slice(0, pathIndex);
    ids.push(eventId(event.op, path, false, type));
    ids.push(eventId(undefined, path, false, type));
    if (pathIndex === event.path.length) {
      ids.push(eventId(event.op, path, true, type));
      ids.push(eventId(undefined, path, true, type));
    }
  }
  return ids;
};

export const eventId = (op, path, exactMatch = false, type="react") => {
  return tuple(op, tuple(...path), exactMatch, type);
};
