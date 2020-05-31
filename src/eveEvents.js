import tuple from "immutable-tuple";

export const getEventIds = event => {
  let ids = [];
  for (let pathIndex = 0; pathIndex <= event.path.length; pathIndex++) {
    const path = event.path.slice(0, pathIndex);
    ids.push(eventId(event.op, path, false));
    ids.push(eventId(undefined, path, false));
    if (pathIndex === event.path.length) {
      ids.push(eventId(event.op, path, true));
      ids.push(eventId(undefined, path, true));
    }
  }
  return ids;
};

export const eventId = (op, path, exactMatch = false) => {
  return tuple(op, tuple(...path), exactMatch);
};
