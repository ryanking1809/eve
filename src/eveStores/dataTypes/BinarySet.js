import { binaryDelete, binaryInsert } from "./binarySearch";

export class BinarySet extends Set {
	constructor(vals = [], comparitor, presorted = false) {
		super(vals);
		this.comparitor = comparitor;
		this.sortedList = presorted ? [...vals] : [...vals].sort(comparitor);
	}
	add(item) {
		if (this.has(item)) {
			this.sortedList &&
				binaryDelete(this.sortedList, item, this.comparitor);
		}
		this.sortedList && binaryInsert(this.sortedList, item, this.comparitor);
		super.add(item);
	}
	delete(item) {
		if (this.has(item)) {
			binaryDelete(this.sortedList, item, this.comparitor);
			super.delete(item);
		}
	}
	clear() {
		this.sortedList = [];
		super.clear();
	}
	*entries() {
		for (let key of this.sortedList) {
			yield [key, key];
		}
	}
	values() {
		return this.sortedList[Symbol.iterator]();
	}
	keys() {
		return this.sortedList[Symbol.iterator]();
	}
	forEach(f, that) {
		for (let key of this.sortedList) {
			f.call(that, key, key, this);
		}
	}
}

BinarySet.prototype[Symbol.iterator] = BinarySet.prototype.entries;
