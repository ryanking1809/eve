import { traceListenerIds } from "../../eveEvents/eveListeners";
import { eventIdToObject } from "../../eveEvents/eveEvents";
import { emitTracer } from "../../eveEvents/eveTracer";

export function derivative(...args) {
    if (args.length === 3) {
        return decorator(...args);
    }
    return (target, prop, descriptor) => decorator(target, prop, descriptor, args[0]);
}


function decorator(target, prop, descriptor, listenTo) {
    let cachedVal = null;
    let needsUpdate = true;
    const setNeedsUpdate = () => (needsUpdate = true);
    const updateCache = (self) => {
        // if listeners aren't specified
        // we need to recalculate every run
        // in case of missed listeners via if statements
        if (!listenTo) {
            const [val, listenerIds] = traceListenerIds(
                descriptor.get.bind(self),
                null,
                true
            );
            cachedVal = val;
            listenerIds.forEach(eId => {
                self._addListener(
                    prop,
                    setNeedsUpdate,
                    eId,
                    "listen"
                );
            });
        } else {
            cachedVal = descriptor.get.bind(self)();
        }
        needsUpdate = false;
    };
    
    !target.listenTo && (target.listenTo = {})
    !target.listenTo[prop] && (target.listenTo[prop] = []);
    target.listenTo[prop].push({
        targets: (listenTo || descriptor.get),
        action: setNeedsUpdate,
        type: "listen"
    });


    Object.defineProperty(target.constructor, prop, {
		get() {
			return (listenTo || descriptor.get).bind(target.constructor)(
				target.constructor
			);
		},
	});

    return {
        ...descriptor,
        get() {
            this._listeners.get(prop).forEach(eId => {
                emitTracer(eventIdToObject(eId))
            });
            needsUpdate && updateCache(this);
            return cachedVal;
        }
    };
};