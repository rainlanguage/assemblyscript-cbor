import {strict as assert} from "assert";
import {
    decodeFalse,
    decodeTrue,
    decodeString,
    decodeStringWithWeirdChar,
    decodeInteger,
    decodeNull,
    decodeFloat32,
    decodeFloat64,
    decodeObject,
    decodeArrayU8,
    decodeArray,
    decodeAllInArray,
    decodeBytes,
    decodeAllInObj,
    decodeNestedObjs,
    decodeArrayInArray,
    decode
} from "../build/debug.js";

let result;

describe("Decoding", () => {
    it("Test decodeFalse function", () => {
        result = decodeFalse();
        assert.equal(result, false);
    })
    it("Test decodeTrue function", () => {
        result = decodeTrue();
        assert.equal(result, true);
    })
    it("Test decodeNull function", () => {
        result = decodeNull();
        assert.equal(result, true);
    })
    it("Test decodeInteger function", () => {
        result = decodeInteger()
        assert.equal(result, 1n);
    })
    it("Test decodeFloat32 function", () => {
        result = decodeFloat32()
        assert.equal(result, 123123.109375);
    })
    it("Test decodeFloat64 function", () => {
        result = decodeFloat64()
        assert.equal(result, 11231241314.11111);
    })
    it("Test decodeString function", () => {
        result = decodeString()
        assert.equal(result, "test value");
    })
    it("Test decodeStringWithWeirdChar function", () => {
        result = decodeStringWithWeirdChar()
        assert.equal(result, "zoé");
    })
    it("Test decodeArrayU8 function", () => {
        result = decodeArrayU8()
        assert.equal(result, true);
    })
    it("Test decodeArray function", () => {
        result = decodeArray()
        assert.equal(result, true);
    })
    it("Test decodeBytes function", () => {
        result = decodeBytes()
        assert.equal(result, true);
    })
    it("Test decodeArrayInArray function", () => {
        result = decodeArrayInArray()
        assert.deepEqual(result, [ 100n ]);
    })
    it("Test decodeObject function", () => {
        result = decodeObject()
        assert.equal(result, true);
    })
    it("Test decode function", () => {
        result = decode("0x010101")
        assert.deepEqual(result, {});
    })
})

//
// // TODO: Support deeps Array or Maps inside a Map or Array
// // result = decodeAllInObj();
// // assert.equal(result, true);
//
// // result = decodeNestedObjs();
// // assert.equal(result, true);
//
// // result = decodeAllInArray();
// // assert.equal(result, true);
