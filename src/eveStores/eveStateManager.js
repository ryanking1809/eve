import cuid from "cuid";
import { updateEveState, eveState } from "../eveState";
import { traceListenerIds, addListener, removeListener } from "../eveEvents/eveListeners";
import tuple from "immutable-tuple";

export class eveStateManager {
			_listeners = new Map();
			_updating = false;
			constructor(props = {}) {
				this._path = [...this._store._path];
				this._tracer = { ...this._store._tracer };
				this._name = this._store._name;
				if (!this._store._singleton) {
					this.id = props.id || cuid();
					this._path.push(this.id);
					this._tracer.storeId = this.id;
				}
				if (!this._store._singleton) {
					this._store.instances[this.id] = this;
				} else {
					this._store.instance = this;
				}
				this._initializeState();
				Object.keys(props).forEach((propName) => {
					this[propName] = props[propName];
				});
				this._applyListeners();
			}
			get _store() {
				return this.__proto__.constructor;
			}
			get _stateInitializers() {
				return this.__proto__.stateInitializers;
			}
			get _listenTo() {
				return this.__proto__.listenTo;
			}
			_initializeState() {
				if (!this._stateInitializers || this._getState()) return;
				let storeState = {};
				Object.keys(this._stateInitializers).forEach(
					(prop) =>
						(storeState[prop] = this._stateInitializers[prop]())
				);
				updateEveState((state) => {
					if (this.id) {
						state.stores[this._store._name][this.id] = storeState;
					} else {
						state.stores[this._store._name] = storeState;
					}
				});
			}
			_applyListeners() {
				if (!this._listenTo) return;
				Object.keys(this._listenTo).forEach((prop) =>
					this._listenTo[prop].forEach((l) => {
						const oldAction = l.action;
						l.action = (e) => oldAction({ self: this, event: e });
						if (typeof l.targets === "function") {
							traceListenerIds(() =>
								l.targets.bind(this)(this)
							).forEach((eId) => {
								this._addListener(prop, l.action, eId, l.type);
							});
						} else if (typeof l.targets === "object") {
							["add", "replace", "remove"].forEach((op) => {
								l.targets[op] &&
									traceListenerIds(
										() => l.targets[op].bind(this)(this),
										op
									).forEach((eId) => {
										this._addListener(
											prop,
											l.action,
											eId,
											l.type
										);
									});
							});
						}
					})
				);
				this._addListener("destroy", this._stateRemoved.bind(this), {
					...this._tracer,
					op: "remove",
					exactMatch: true,
				});
			}
			_addListener(
				selfProp,
				action,
				{ op, store, storeId, prop, exactMatch = false },
				type
			) {
				!this._listeners.get(selfProp) &&
					this._listeners.set(selfProp, new Set());
				const eId = tuple(
					op,
					store,
					storeId,
					prop,
					type,
					exactMatch,
					action
				);
				this._listeners.get(selfProp).add(eId);
				addListener(
					{ op, store, storeId, prop, exactMatch },
					action,
					type
				);
			}
			_removeListeners() {
				this._listeners.forEach(([key, listeners]) => {
					if (listeners) {
						const [
							op,
							store,
							storeId,
							prop,
							type,
							exactMatch,
							action,
						] = listeners;
						removeListener(
							{ op, store, storeId, prop, exactMatch },
							action,
							type
						);
					}
				});
			}
			_stateRemoved({ self, event }) {
				this._removeListeners();
				if (!this._store._singleton) {
					delete this._store.instances[this.id];
				} else {
					this._store.instance = null;
				}
			}
			_getSource() {
				return eveState;
			}
			_getState() {
				let source = this._getSource();
				this._path.forEach((path) => {
					source = source[path];
				});
				return source;
			}
			update(updater) {
				if (this._updating) {
					updater();
				} else {
					updateEveState((state) => {
						this._updating = true;
						this._getSource = () => state;
						updater();
						this._getSource = () => eveState;
						this._updating = false;
					});
				}
			}
		}