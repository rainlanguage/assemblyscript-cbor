import {strict as assert} from "assert";
import {
    decodeRainCBOR_test,
    decode_assertError,
    decodeRandomString
} from "../build/debug.js";

describe("Rain Cbor", () => {
    it("Test rain cbor", () => {

        const result = decodeRainCBOR_test("A3004411223344011BFFC21BBF86CC199B02706170706C69636174696F6E2F63626F72A3004412345678011BFFE5FFB4A3FF2CDE02706170706C69636174696F6E2F6A736F6E");
        assert.equal(result, true, "Failed when decoded a rain cbor sequence");

    });

    it("Should return false for an invalid encoded rain sequence", () => {

        const resultError = decode_assertError(
            "ffe5ffb4a3ff2cdea50058d08d91c10e82300c86df65672e9ae8c177c083315e8c31454a32031dd93ae34278778b828006f1b6a6fffeff6b7bac94a6d2b3539be793d112e4fb50a2daa824303a152982a2293d15c820350fdbf5e92dd81ade81a658548745af436b8d557554292043a1305ed232c81d46e3f014ef980e5a231848538b6e80e3503ed83ea6133441335e5eeae56a3df0f2c9152fdc9b758a3fcc3eb634b3a3afe5dc90b88d99bac314ee798a778eeffc03100bcdf16b06e3b94592b663608c3d43a273cd419472cc12022439f67699a70b6b43e2f800011bffe5ffb4a3ff2cde02706170706c69636174696f6e2f6a736f6e03676465666c6174650462656e"
        );
        assert.equal(resultError, true);

    });

    it('should return false for an empty input string', () => {
        const result = decodeRainCBOR_test("");
        assert.equal(result, false);
    });

    it('should return false for a non-CBOR encoded string', () => {
        const result = decodeRainCBOR_test('this is not CBOR encoded');
        assert.equal(result, false);
    });

    it('should return "Data_Empty" if passed empty string', () => {
        const result = decodeRandomString('');
        assert.equal(result, 'DATA_EMPTY');
    });
});