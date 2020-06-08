import { silentUpdateEveState } from "../../eveState";
import { addListener } from "../../eveEvents/eveListeners";

export let eveStores = {}

export function eveStore(name, singleton = false) {
	return function decorator(Class) {
		return extendClass(Class, name, singleton);
	};
}

const extendClass = (Class, name, singleton) => {
    Class._path = ["stores", name];
    Class._tracer = {store: name};
    Class._name = name;
    Class._singleton = singleton
    if (singleton) {
        Class.instance = null;
        Class.get = () => Class.instance
    } else {
        Class.instances = {};
        Class.get = (instanceId) => Class.instances[instanceId];
	    silentUpdateEveState((state) => (state.stores[name] = {}));
    }
    eveStores[name] = Class;
    addListener({ op: "add", store: name }, event => {
        if (!Class._singleton && event.storeId && !event.prop && !Class.instances[event.storeId]) {
			const newInst = new Class({ id: event.storeId });
			Class.instances[event.storeId] = newInst;
		} else if (Class._singleton && !event.prop && !Class.instance) {
            const newInst = new Class();
            Class.instance = newInst;
        }
    }, "listen");
	return Class;
};