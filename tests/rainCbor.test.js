import * as assert from "assert";
import { decodeRainCBOR_test } from "../build/debug.js";

const result = decodeRainCBOR_test();
assert.equal(result, true, "Failed when decoded a rain cbor sequence");
