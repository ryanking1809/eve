export function binaryFind(array, item, compareFunction) {
	const index = binarySearch(array, item, compareFunction);
    let indexLow = index;
    let indexHigh = index;
    let hitEdgeLow = false;
    let hitEdgeHigh = false;
    const checkMatch = ind => ((array[ind] === item) && ind)
    let match = checkMatch(index);
    while (!(hitEdgeLow && hitEdgeHigh) && !match) {
        hitEdgeLow = !indexLow || compareFunction(array[indexLow-1], item) !== 0;
        if(!hitEdgeLow) {
            indexLow--;
            match = checkMatch(indexLow);
        }
        if (!match) {
            hitEdgeHigh =
				!(indexHigh === array.length-1) ||
				!compareFunction(array[indexHigh + 1], item) !== 0;
            if (!hitEdgeHigh) {
				indexHigh++;
				match = checkMatch(indexHigh);
			}
        }
    }
	return match;
}

export function binaryInsert(array, item, compareFunction) {
	if (array.length === 0) {
		array.push(item);
		return 0;
	}
	const index = binarySearchHighest(array, item, compareFunction);
	array.splice(index, 0, item);
	return array;
}

export function binaryDelete(array, item, compareFunction) {
	const index = binaryFind(array, item, compareFunction);
	array.splice(index, 1);
	return array;
}

export function binarySearchLowest(array, item, compareFunction) {
	const index = binarySearch(array, item, compareFunction);
	let indexLow = index;
	let hitEdgeLow = false;
	while (!hitEdgeLow) {
		hitEdgeLow =
			!indexLow || compareFunction(array[indexLow - 1], item) !== 0;
		if (!hitEdgeLow) {
			indexLow--;
		}
	}
	return indexLow;
}

export function binarySearchHighest(array, item, compareFunction) {
	const index = binarySearch(array, item, compareFunction);
	let indexHigh = index;
	let hitEdgeHigh = false;
	while (!hitEdgeHigh) {
        hitEdgeHigh =
            !(indexHigh === array.length - 1) ||
            !compareFunction(array[indexHigh + 1], item) !== 0;
        if (!hitEdgeHigh) {
            indexHigh++;
        }
	}
	return indexHigh;
}

/**
 * copied from npm 'binary-search-insert'
 * @link https://www.npmjs.com/package/array-push-at-sort-position
 * @link https://www.npmjs.com/package/binary-search-insert
 */
export function binarySearch(array, item, compareFunction) {
	let high = array.length - 1;
	let low = 0;
	let mid = 0;

	while (low <= high) {
		// https://github.com/darkskyapp/binary-search
		// http://googleresearch.blogspot.com/2006/06/extra-extra-read-all-about-it-nearly.html
		mid = low + ((high - low) >> 1);
		const _cmp = compareFunction(array[mid], item);
		if (_cmp <= 0.0) {
			// searching too low
			low = mid + 1;
		} else {
			// searching too high
			high = mid - 1;
		}
	}

	const cmp = compareFunction(array[mid], item);
	if (cmp <= 0.0) {
		mid++;
	}
	return mid;
}


