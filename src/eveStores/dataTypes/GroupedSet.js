export class GroupedSet extends Map {
	constructor(vals = [], grouper) {
		const groupedMap = new Map();
		const keyLookup = new Map();
		vals.forEach((item) => {
			const key = grouper(item);
			if (!groupedMap.get(key)) groupedMap.set(key, new Set());
			if (keyLookup.has(item)) {
				const oldKey = keyLookup.get(item);
				groupedMap.get(oldKey).delete(item);
			}
			keyLookup.set(item, key);
			groupedMap.get(key).add(item);
		});
		super(groupedMap);
		this.grouper = grouper;
		this.keyLookup = keyLookup;
	}
	get(key) {
		return super.get(key);
	}
	set(key, item) {
		if (!this.get(key)) super.set(key, new Set());
		if (this.keyLookup.has(item)) {
			const oldKey = this.keyLookup.get(item);
			this.get(oldKey).delete(item);
		}
		this.keyLookup.set(item, key);
		this.get(key).add(item);
	}
	add(item) {
		const key = this.grouper(item);
		this.set(key, item);
	}
	delete(item) {
		if (this.keyLookup.has(item)) {
			const key = this.keyLookup.get(item);
			this.get(key).delete(item);
			this.keyLookup.delete(item);
			!this.get(key).size && super.delete(key);
		}
	}
	clear() {
		this.keyLookup.clear();
		super.clear();
	}
	forEach(f, that) {
		for (let key of this.sortedList) {
			f.call(that, this.get(key), key, this);
		}
	}
}

GroupedSet.prototype[Symbol.iterator] = GroupedSet.prototype.entries;
