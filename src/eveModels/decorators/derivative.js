import { traceListenerIdsFromFunction } from "../../eveListeners";

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
            const [val, listenerIds] = traceListenerIdsFromFunction(
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
                    "react"
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
        action: self => setNeedsUpdate,
        type: "react"
    });

    return {
        ...descriptor,
        get() {
            needsUpdate && updateCache(this);
            return cachedVal;
        }
    };
};