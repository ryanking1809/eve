import tuple from "immutable-tuple";
import { eveStores } from "../eveStores/decorators/eveStore";

export const getEventIds = (
			{ op, store, storeId, prop } = {},
			type = "listen"
		) => {
			const ids = new Set([
				eventId({ type }),
				eventId({ op, type }),
				eventId({ prop, type }),

				eventId({ store, type }),
				eventId({ store, prop, type }),
				eventId({ store, storeId, type }),
				eventId({ store, storeId, prop, type }),

				eventId({ op, store, type }),
				eventId({ op, store, prop, type }),
				eventId({ op, store, storeId, type }),
				eventId({ op, store, storeId, prop, type }),
				eventId({ op, store, storeId, prop, type, exactMatch: true }),
			]);
			return ids;
		};

export const eventId = ({
			op,
			store,
			storeId,
			prop,
			type = "listen",
			exactMatch = false,
		} = {}) => {
			return tuple(op, store, storeId, prop, type, exactMatch);
		};

export const eventIdToObject = ([
			op,
			store,
			storeId,
			prop,
			type = "listen",
			exactMatch = false,
		]) => {
	return { op, store, storeId, prop, type, exactMatch };
}

export const storeIdFromPath = path => {
  let id = { store: undefined, storeId: undefined, prop: undefined };
  if (path[0] !== "stores") return id;
  id.store = path[1]
  const singleton = eveStores[id.store]?._singleton
  id.storeId = singleton ? undefined : path[2];
  id.prop = singleton ? path[2] : path[3]
  return id;
}

export const storeFromId = eId => {
	const cls = eveStores[eId.store];
	if (!cls) return undefined;
	const singleton = cls?._singleton;
	if (singleton) return cls.instance;
	if (!eId.storeId) return cls;
	return cls.get(eId.storeId);
}