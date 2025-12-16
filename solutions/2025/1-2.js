let dial = 50;
let password = 0;

const instructions = input.trim().split(/\r?\n/);

for (const line of instructions) {
    const dir = line[0];
    const num = Number(line.slice(1));

    for (let i = 0; i < num; i++) {
        if (dir === "R") {
            dial = (dial + 1) % 100;
        } else {
            dial = (dial - 1 + 100) % 100;
        }

        if (dial === 0) {
            password++;
        }
    }
}

return password;
