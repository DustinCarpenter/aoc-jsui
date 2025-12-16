const ranges = input.split(',').map(range => {
    const [min, max] = range.split('-').map(Number);
    return [min, max];
});

let totalSum = 0;
for (const [min, max] of ranges) {
    totalSum += sumInvalidIdsInRange(min, max);
}

return totalSum;

function sumInvalidIdsInRange(min, max) {
    let sum = 0;
    for (let i = min; i <= max; i++) {
        if (isInvalidId(i)) {
            sum += i;
        }
    }
    return sum;
}

function isInvalidId(sequence) {
    const str = sequence.toString();
    const len = str.length;

    for (let sequenceLen = 1; sequenceLen <= Math.floor(len / 2); sequenceLen++) {
        if (str[0] === '0') return false;

        const seq = str.slice(0, sequenceLen);
        const times = len / sequenceLen;

        if (!Number.isInteger(times)) continue;
        if (seq.repeat(times) === str) return true;
    }

    return false;
}