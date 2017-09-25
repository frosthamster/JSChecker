function getEntropy(input) {
    let valuesCounts = [];
    let i;
    for (i = 0; i < input.length; i++) {
        let currentSymbol = input.charAt(i);

        if (valuesCounts[currentSymbol] === undefined)
            valuesCounts[currentSymbol] = 0;

        valuesCounts[currentSymbol]++;
    }

    let alphabetPower = 0;
    for (i in valuesCounts)
        alphabetPower++;

    let entropy = 0;
    if (alphabetPower > 1)
        for (i in valuesCounts) {
            let probability = valuesCounts[i] / input.length;
            entropy += probability * Math.log(probability) / Math.log(alphabetPower);
        }

    entropy *= -1;
    return entropy;
}

console.log(getEntropy(process.argv[2]));