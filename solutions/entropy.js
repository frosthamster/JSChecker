var chunk = process.argv[2];

var valuesCounts = [];
var i;
for (i = 0; i < chunk.length; i++) {
    var currentSymbol = chunk.charAt(i);

    if (valuesCounts[currentSymbol] == undefined)
        valuesCounts[currentSymbol] = 0;

    valuesCounts[currentSymbol]++;
}

var alphabetPower = 0;
for (i in valuesCounts)
    alphabetPower++;

var enthropy = 0;
if (alphabetPower > 1)
    for (i in valuesCounts) {
        var probability = valuesCounts[i] / chunk.length;
        //брал логарифм по основанию мощности алфавита, а не 2
        enthropy += probability * Math.log(probability) / Math.log(alphabetPower);
    }

enthropy *= -1;
console.log(enthropy);