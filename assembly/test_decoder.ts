import { CBORDecoder } from "./decoder";
import {
  Arr,
  Bytes,
  Bool,
  Float,
  Integer,
  Null,
  Obj,
  Str,
  Undefined,
  Value,
  Err,
  Sequence,
  Unsigned,
} from "./types";

export function stringToArrayBuffer(val: string): ArrayBuffer {
  const buff = new ArrayBuffer(val.length / 2);
  const view = new DataView(buff);
  for (let i = 0, j = 0; i < val.length; i = i + 2, j++) {
    view.setUint8(j, u8(Number.parseInt(`${val.at(i)}${val.at(i + 1)}`, 16)));
  }
  return buff;
}

export function decode_assertError(data: string): boolean {
  const buff = stringToArrayBuffer(data);
  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  return res.isError;
}

export function decode(data: string): Value {
  const buff = stringToArrayBuffer(data);
  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  return res;
}

export function decodeRainCBOR_test(): bool {
  // Use: https://cbor.me/
  const rainSequenceEncoded =
    "A3004411223344011BFFC21BBF86CC199B02706170706C69636174696F6E2F63626F72A3004412345678011BFFE5FFB4A3FF2CDE02706170706C69636174696F6E2F6A736F6E";
  const buff = stringToArrayBuffer(rainSequenceEncoded);
  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  // Something wrong happened
  if (!res.isSequence) return false;

  // The CBOR sequence is decoded into Item. Each CBOR item is an Item into an "array"
  const seqArray = (<Sequence>res).valueOf();

  // Maps - With 3 keys [0-2]
  const firstMapValue = seqArray[0];
  const secondMapValue = seqArray[1];

  // Something wrong happened
  if (!firstMapValue.isObj) return false;
  if (!secondMapValue.isObj) return false;

  // Checking first MAP
  const firstMap = (<Obj>firstMapValue).valueOf();
  const payload_1 = firstMap.get("0");
  const magicNumber_1 = firstMap.get("1");
  const contentType_1 = firstMap.get("2");

  if (!payload_1.isBytes || payload_1.toString() !== "h'11223344'") {
    console.log("Wrong bytes or bad payload");
    return false;
  }

  if (
    !magicNumber_1.isUnsigned ||
    magicNumber_1.toString() !== "18429323134567717275"
  ) {
    console.log("Wrong unsigned or bad magic number");
    return false;
  }

  if (
    !contentType_1.isString ||
    contentType_1.toString() !== "application/cbor"
  ) {
    console.log("Wrong string or bad content type");
    return false;
  }

  // Checking second MAP
  const secondtMap = (<Obj>secondMapValue).valueOf();
  const payload_2 = secondtMap.get("0");
  const magicNumber_2 = secondtMap.get("1");
  const contentType_2 = secondtMap.get("2");

  if (!payload_2.isBytes || payload_2.toString() !== "h'12345678'") {
    console.log("Wrong bytes or bad payload");
    return false;
  }

  if (
    !magicNumber_2.isUnsigned ||
    magicNumber_2.toString() !== "18439425400648969438"
  ) {
    console.log("Wrong unsigned or bad magic number");
    return false;
  }

  if (
    !contentType_2.isString ||
    contentType_2.toString() !== "application/json"
  ) {
    console.log("Wrong string or bad content type");
    return false;
  }

  return true;
}

export function decodeFalse(): bool {
  const buff = stringToArrayBuffer("f4");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const num = (<Bool>res).valueOf();
  return num;
}

export function decodeTrue(): bool {
  const buff = stringToArrayBuffer("f5");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const num = (<Bool>res).valueOf();
  return num;
}

export function decodeNull(): boolean {
  const buff = stringToArrayBuffer("f6");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  return res.isNull;
}

export function decodeInteger(): i64 {
  const buff = stringToArrayBuffer("01");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const num = (<Unsigned>res).valueOf();
  return num;
}

export function decodeFloat32(): f64 {
  const buff = stringToArrayBuffer("fa47f0798e");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const num = (<Float>res).valueOf();
  return num;
}

export function decodeFloat64(): f64 {
  const buff = stringToArrayBuffer("fb4204eb792310e38e");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const num = (<Float>res).valueOf();
  return num;
}

export function decodeString(): string {
  const buff = stringToArrayBuffer("6a746573742076616c7565");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const str = (<Str>res).valueOf();
  return str;
}

export function decodeStringWithWeirdChar(): string {
  const buff = stringToArrayBuffer("647A6FC3A9");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const str = (<Str>res).valueOf();
  return str;
}

export function decodeArrayU8(): boolean {
  const fixArray: u8[] = [1, 43, 66, 234, 111];
  const buff = stringToArrayBuffer("8501182b184218ea186f");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();
  const arr = (<Arr>res).valueOf();

  let result = arr.length == fixArray.length;
  for (let i = 0; i < fixArray.length; i++) {
    result = result && (<Unsigned>arr.at(i)).valueOf() == fixArray[i];
  }

  return result;
}

export function decodeArray(): boolean {
  const buff = stringToArrayBuffer("84646b65793101646b6579321864");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();
  const arr = (<Arr>res).valueOf();

  let result = arr.length == 4;
  const val1 = (arr.at(0) as Str).valueOf();
  const val2 = (arr.at(1) as Unsigned).valueOf();
  const val3 = (arr.at(2) as Str).valueOf();
  const val4 = (arr.at(3) as Unsigned).valueOf();

  return result && val1 == "key1" && val2 == 1 && val3 == "key2" && val4 == 100;
}

export function decodeBytes(): boolean {
  const dataBuf: Uint8Array = new Uint8Array(2);
  dataBuf.set([1, 2]);

  const buff = stringToArrayBuffer("420102");

  const decoder = new CBORDecoder(buff);

  const res = decoder.parse();
  const bytes = (<Bytes>res).valueOf();

  let ok = true;
  for (let i = 0; i < dataBuf.length; i++) {
    ok = ok && bytes[i] == dataBuf[i];
  }

  return ok;
}

export function decodeArrayInArray(): Array<u64> {
  const buff = stringToArrayBuffer("81811864");

  const decoder = new CBORDecoder(buff);

  const res = decoder.parse();
  let state = (res as Arr).valueOf();
  let participants_raw = (state.at(0) as Arr).valueOf();
  let participants = new Array<u64>();
  for (let b = 0; b < participants_raw.length; b++) {
    participants.push(u64((participants_raw.at(b) as Unsigned).valueOf()));
  }

  return participants;
}

export function decodeObject(): boolean {
  const buff = stringToArrayBuffer("a2646b65793101646b6579321864");

  const decoder = new CBORDecoder(buff);
  const res = decoder.parse();

  const obj = (<Obj>res).valueOf();
  const val1 = (<Unsigned>obj.get("key1")).valueOf();
  const val2 = (<Unsigned>obj.get("key2")).valueOf();

  return val1 == 1 && val2 == 100;
}

export function decodeAllInObj(): boolean {
  const fixArray: u8[] = [1, 43, 66, 234, 111];
  const bytesArray: u8[] = [1, 2];
  const buff = stringToArrayBuffer(
    "b06575696e743818846675696e74313619199a6675696e7433321a006401906675696e7436341b0000006792a7f0fa64696e7438387e65696e743136397b0b65696e7433323a0064018f65696e7436343b0000006792a7f0f967617272617955388501182b184218ea186f6a747275652d76616c7565f56b66616c73652d76616c7565f46a6e756c6c2d76616c7565f66f756e646566696e65642d76616c7565f763663634fb41a3de39df19999a63663332fa4799d029656279746573420102"
  );

  const decoder = new CBORDecoder(buff);

  const res = decoder.parse();
  const obj = (<Obj>res).valueOf();

  const uint8 = (<Integer>obj.get("uint8")).valueOf();
  const uint16 = (<Integer>obj.get("uint16")).valueOf();
  const uint32 = (<Integer>obj.get("uint32")).valueOf();
  const uint64 = (<Integer>obj.get("uint64")).valueOf();
  const int8 = (<Integer>obj.get("int8")).valueOf();
  const int16 = (<Integer>obj.get("int16")).valueOf();
  const int32 = (<Integer>obj.get("int32")).valueOf();
  const int64 = (<Integer>obj.get("int64")).valueOf();
  const trueVal = (<Bool>obj.get("true-value")).valueOf();
  const falseVal = (<Bool>obj.get("false-value")).valueOf();
  const nullVal = (<Null>obj.get("null-value")).valueOf();
  const undefinedVal = (<Undefined>obj.get("undefined-value")).valueOf();
  const f64 = (<Float>obj.get("f64")).valueOf();
  const f32 = (<Float>obj.get("f32")).valueOf();
  const arrayU8 = (<Arr>obj.get("arrayU8")).valueOf();
  const bytes = (<Bytes>obj.get("bytes")).valueOf();

  let arrayResult = arrayU8.length == fixArray.length;
  for (let i = 0; i < fixArray.length; i++) {
    arrayResult =
      arrayResult && (<Integer>arrayU8.at(i)).valueOf() == fixArray[i];
  }

  let bytesResult = bytes.length == bytesArray.length;
  for (let i = 0; i < bytesArray.length; i++) {
    bytesResult = bytesResult && bytes[i] == bytesArray[i];
  }

  return (
    uint8 == 132 &&
    uint16 == 6554 &&
    uint32 == 6554000 &&
    uint64 == 444842111226 &&
    int8 == -127 &&
    int16 == -31500 &&
    int32 == -6554000 &&
    int64 == -444842111226 &&
    !!trueVal &&
    !falseVal &&
    !nullVal &&
    !undefinedVal &&
    f64 == 166665455.55 &&
    f32 == 78752.3203125 &&
    arrayResult &&
    bytesResult
  );
}

export function decodeNestedObjs(): bool {
  const buff = stringToArrayBuffer(
    "a1646c766c31a1646c766c32a1646c766c33a1646c766c34a1646c766c351884"
  );
  const decoder = new CBORDecoder(buff);

  const res = decoder.parse();
  const obj = (<Obj>res).valueOf();

  return (
    obj.has("lvl1") &&
    (obj.get("lvl1") as Obj).has("lvl2") &&
    ((obj.get("lvl1") as Obj).get("lvl2") as Obj).has("lvl3") &&
    (((obj.get("lvl1") as Obj).get("lvl2") as Obj).get("lvl3") as Obj).has(
      "lvl4"
    ) &&
    (
      (((obj.get("lvl1") as Obj).get("lvl2") as Obj).get("lvl3") as Obj).get(
        "lvl4"
      ) as Obj
    ).has("lvl5") &&
    (
      (
        (((obj.get("lvl1") as Obj).get("lvl2") as Obj).get("lvl3") as Obj).get(
          "lvl4"
        ) as Obj
      ).get("lvl5") as Integer
    ).valueOf() == 132
  );
}

export function decodeAllInArray(): boolean {
  const fixArray: u8[] = [1, 43, 66, 234, 111];
  const bytesArray: u8[] = [1, 2];
  const buff = stringToArrayBuffer(
    "98216575696e743818846675696e74313619199a6675696e7433321a006401906675696e7436341b0000006792a7f0fa64696e7438387e65696e743136397b0b65696e7433323a0064018f65696e7436343b0000006792a7f0f96a747275652d76616c7565f56b66616c73652d76616c7565f46a6e756c6c2d76616c7565f66f756e646566696e65642d76616c7565f763663634fb41a3de39df19999a63663332fa4799d02967617272617955388501182b184218ea186fa165696e743136397b0b656279746573420102"
  );

  const decoder = new CBORDecoder(buff);

  const res = decoder.parse();
  const arr = (<Arr>res).valueOf();

  const uint8Str = (<Str>arr.at(0)).valueOf();
  const uint16Str = (<Str>arr.at(2)).valueOf();
  const uint32Str = (<Str>arr.at(4)).valueOf();
  const uint64Str = (<Str>arr.at(6)).valueOf();
  const int8Str = (<Str>arr.at(8)).valueOf();
  const int16Str = (<Str>arr.at(10)).valueOf();
  const int32Str = (<Str>arr.at(12)).valueOf();
  const int64Str = (<Str>arr.at(14)).valueOf();
  const trueValStr = (<Str>arr.at(16)).valueOf();
  const falseValStr = (<Str>arr.at(18)).valueOf();
  const nullValStr = (<Str>arr.at(20)).valueOf();
  const undefinedValStr = (<Str>arr.at(22)).valueOf();
  const f64Str = (<Str>arr.at(24)).valueOf();
  const f32Str = (<Str>arr.at(26)).valueOf();
  const arrayU8Str = (<Str>arr.at(28)).valueOf();
  const bytesStr = (<Str>arr.at(31)).valueOf();

  const uint8 = (<Integer>arr.at(1)).valueOf();
  const uint16 = (<Integer>arr.at(3)).valueOf();
  const uint32 = (<Integer>arr.at(5)).valueOf();
  const uint64 = (<Integer>arr.at(7)).valueOf();
  const int8 = (<Integer>arr.at(9)).valueOf();
  const int16 = (<Integer>arr.at(11)).valueOf();
  const int32 = (<Integer>arr.at(13)).valueOf();
  const int64 = (<Integer>arr.at(15)).valueOf();
  const trueVal = (<Bool>arr.at(17)).valueOf();
  const falseVal = (<Bool>arr.at(19)).valueOf();
  const nullVal = (<Null>arr.at(21)).valueOf();
  const undefinedVal = (<Undefined>arr.at(23)).valueOf();
  const f64 = (<Float>arr.at(25)).valueOf();
  const f32 = (<Float>arr.at(27)).valueOf();
  const arrayU8 = (<Arr>arr.at(29)).valueOf();
  const obj = (<Obj>arr.at(30)).valueOf();
  const bytes = (<Bytes>arr.at(32)).valueOf();

  let arrayResult = arrayU8.length == fixArray.length;
  for (let i = 0; i < fixArray.length; i++) {
    arrayResult =
      arrayResult && (<Integer>arrayU8.at(i)).valueOf() == fixArray[i];
  }

  let bytesResult = bytesArray.length == bytes.length;
  for (let i = 0; i < bytesArray.length; i++) {
    bytesResult = bytesResult && bytesArray[i] == bytes[i];
  }

  const strResult =
    uint8Str == "uint8" &&
    uint16Str == "uint16" &&
    uint32Str == "uint32" &&
    uint64Str == "uint64" &&
    int8Str == "int8" &&
    int16Str == "int16" &&
    int32Str == "int32" &&
    int64Str == "int64" &&
    trueValStr == "true-value" &&
    falseValStr == "false-value" &&
    nullValStr == "null-value" &&
    undefinedValStr == "undefined-value" &&
    f64Str == "f64" &&
    f32Str == "f32" &&
    arrayU8Str == "arrayU8" &&
    bytesStr == "bytes";

  return (
    strResult &&
    uint8 == 132 &&
    uint16 == 6554 &&
    uint32 == 6554000 &&
    uint64 == 444842111226 &&
    int8 == -127 &&
    int16 == -31500 &&
    int32 == -6554000 &&
    int64 == -444842111226 &&
    !!trueVal &&
    !falseVal &&
    !nullVal &&
    !undefinedVal &&
    f64 == 166665455.55 &&
    f32 == 78752.3203125 &&
    arrayResult &&
    bytesResult
  );
}
