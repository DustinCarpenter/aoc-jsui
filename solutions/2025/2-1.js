const ranges = input.split(',').map(range => {
    const [min, max] = range.split('-').map(Number);
    return [min, max];
});

let totalSum = 0;
for (const [min, max] of ranges) {
    let sum = 0;
    const minLength = min.toString().length;
    const maxLength = max.toString().length;

    // Only even length numbers can be repeated sequences
    for (let len = 2; len <= maxLength; len += 2) {
        const half = len / 2;

        // Smallest and largest possible first half
        const start = Math.pow(10, half - 1);
        const end = Math.pow(10, half) - 1;

        for (let x = start; x <= end; x++) {
            const num = parseInt(x.toString() + x.toString(), 10);

            if (num > max) break;
            if (num < min) continue;

            totalSum += num;
        }
    }
}

return totalSum;
