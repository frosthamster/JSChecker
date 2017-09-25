'use strict';

class FloatComparer {
    static parse(input){
        return parseFloat(input);
    }

    static equals(a, b){
        return Math.abs(a - b) < Number.EPSILON;
    }
}

module.exports = FloatComparer;