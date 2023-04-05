import * as assert from "assert";
import { decodeRainCBOR_test, decode } from "../build/debug.js";

const result = decodeRainCBOR_test();
assert.equal(result, true, "Failed when decoded a rain cbor sequence");

decode("A3004412345678011BFFE5FFB4A3FF2CDE026474657874");
decode("4f726465725f41");
