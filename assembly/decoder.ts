import { Arr, Handler, JSONHandler, Sequence, Value } from "./types";
const POW_2_24 = 5.960464477539063e-8;
const POW_2_32 = 4294967296;
const POW_2_53 = 9007199254740992;

/**
 * Message error when the data is empty
 */
const DATA_EMPTY = "DATA_EMPTY";

/**
 * Message error when the data is bad formed on some point
 */
const BAD_FORMED = "DATA_BAD_FORMED";

/**
 * Message error for not supporting keys differente than Unsigned (major type 0)
 */
const TYPE_KEY_NOT_SUPPORTED = "TYPE_KEY_NOT_SUPPORTED";

/**
 * Message error for not supporting deeps Array or Maps inside a Map or Array
 */
const NOT_SUPDEEP_ARR_MAP = "NOT_SUP_DEEP_ARR_MAP";

export class CBORDecoder {
  private readonly data: ArrayBuffer;
  private readonly dataView: DataView;
  private readonly handler: Handler;
  private readonly dataLength: u32;
  private offset: u32;
  private isError: boolean = false;
  private errorMessage: string = "";
  private isSequence: boolean = false;
  private sequence: Sequence = new Sequence();

  constructor(serializedData: ArrayBuffer) {
    this.data = serializedData;
    this.dataView = new DataView(serializedData);
    this.handler = new Handler();
    this.dataLength = this.dataView.byteLength;
    this.offset = 0;
  }

  private setError(message: string): Value {
    this.errorMessage = message;
    this.isError = true;
    this.handler.reset();
    return Value.Error(message);
  }

  private commitRead(length: u32): void {
    this.offset += length;
  }

  private readArrayBuffer(length: u32): Uint8Array {
    const value = Uint8Array.wrap(this.data, this.offset, length);
    this.commitRead(length);
    return value;
  }

  private readFloat16(): f32 {
    const tempArrayBuffer = new ArrayBuffer(4);
    const tempDataView = new DataView(tempArrayBuffer);
    const value = this.readUint16();

    const sign = value & 0x8000;
    let exponent = value & 0x7c00;
    const fraction = value & 0x03ff;

    if (exponent === 0x7c00) exponent = 0xff << 10;
    else if (exponent !== 0) exponent += (127 - 15) << 10;
    else if (fraction !== 0) return f32((sign ? -1 : 1) * fraction * POW_2_24);

    tempDataView.setUint32(
      0,
      (sign << 16) | (exponent << 13) | (fraction << 13)
    );
    return tempDataView.getFloat32(0);
  }

  private readFloat32(): f32 {
    const value = this.dataView.getFloat32(this.offset);
    this.commitRead(4);
    return value;
  }
  private readFloat64(): f64 {
    const value = this.dataView.getFloat64(this.offset);
    this.commitRead(8);
    return value;
  }

  private readUint8(): u8 {
    const value = this.dataView.getUint8(this.offset);
    this.commitRead(1);
    return value;
  }

  private readUint16(): u16 {
    const value = this.dataView.getUint16(this.offset);
    this.commitRead(2);
    return value;
  }

  private readUint32(): u32 {
    const value = this.dataView.getUint32(this.offset);
    this.commitRead(4);
    return value;
  }

  private readUint64(): u64 {
    const hi = this.readUint32();
    const lo = this.readUint32();
    return hi * POW_2_32 + lo;
  }

  private readBreak(): boolean {
    if (this.dataView.getUint8(this.offset) !== 0xff) return false;
    this.offset += 1;
    return true;
  }

  private readLength(additionalInformation: u64): u64 {
    if (additionalInformation < 24) {
      return u64(additionalInformation);
    }
    if (additionalInformation === 24 && this.availableData(1)) {
      return u64(this.readUint8());
    }
    if (additionalInformation === 25 && this.availableData(2)) {
      return u64(this.readUint16());
    }
    if (additionalInformation === 26 && this.availableData(4)) {
      return u64(this.readUint32());
    }
    if (additionalInformation === 27 && this.availableData(8)) {
      return u64(this.readUint64());
    }
    if (additionalInformation === 31) {
      return -1;
    }

    this.setError(BAD_FORMED);

    return -1;
  }

  private readIndefiniteStringLength(majorType: u64): i64 {
    const initialByte = this.readUint8();
    if (initialByte === 0xff) return -1;
    let length = this.readLength(initialByte & 0x1f);
    if (length < 0 || initialByte >> 5 !== majorType) {
      this.setError(BAD_FORMED);

      return -1;
    }
    return length;
  }

  private availableData(amount: u64): bool {
    return this.offset + amount <= this.dataLength;
  }

  /**
   * Only support Unsigned/Number keys. TODO: Add more support for other key (like strings)
   */
  private getKey(): Value {
    const initialByte = this.readUint8();

    const majorType = initialByte >> 5;

    const additionalInformation = initialByte & 0x1f;

    let argumentValue = this.readLength(additionalInformation);

    if (argumentValue === -1) {
      // Error found when reading length
      return this.setError(BAD_FORMED);
    }

    switch (majorType) {
      case 0: {
        // The argument value obtained by `readLength` in major types 0, it is
        // already the unsigned number.
        return Value.Unsigned(argumentValue);
      }

      case 3: {
        // The argument value obtained by `readLength` in major types 3, it is
        // the next bytes to read (that contains the bytes text).
        const valueString = this.readString(argumentValue);

        if (!this.isError) {
          // this.handler.setString("", valueString);
          return Value.String(valueString);
        }

        // If the above conditional is not met, means that the data is bad
        // encoded. The error is already set when  this.readString was called
        return Value.Error(BAD_FORMED);
      }

      default:
        return this.setError(TYPE_KEY_NOT_SUPPORTED);
    }
  }

  private getValue(): Value {
    const initialByte = this.readUint8();
    const majorType = initialByte >> 5;
    const additionalInformation = initialByte & 0x1f;
    let length = this.readLength(additionalInformation);

    if (length === -1) {
      return this.setError(BAD_FORMED);
    }

    switch (majorType) {
      case 0: {
        return Value.Unsigned(length);
      }

      case 1: {
        return Value.Integer(-1 - length);
      }

      case 2: {
        if (length < 0) {
          // Support for Indefinite Lengths for Byte string.
          const elements = new Array<Uint8Array>();
          let fullArrayLength = 0;

          // Update and check new length
          length = this.readIndefiniteStringLength(majorType);
          if (length === -1) return this.setError(BAD_FORMED);

          while (length >= 0) {
            fullArrayLength += i32(length);
            elements.push(this.readArrayBuffer(u32(length)));

            // Update and check new length
            length = this.readIndefiniteStringLength(majorType);
            if (length === -1) return this.setError(BAD_FORMED);
          }
          const fullArray = new Uint8Array(fullArrayLength);
          let fullArrayOffset = 0;
          for (let i = 0; i < elements.length; ++i) {
            fullArray.set(elements[i], fullArrayOffset);
            fullArrayOffset += elements[i].length;
          }
          const obj = Value.Bytes(fullArray);
          return obj;
        } else {
          // Get the bytes string data from the know length
          const arr = this.readArrayBuffer(u32(length));
          const obj = Value.Bytes(arr);

          return obj;
        }
      }

      case 3: {
        // Text string
        //
        let data: Uint8Array = new Uint8Array(0);
        if (length < 0) {
          // Support for Indefinite Lengths for Text string.

          // Update and check new length
          length = this.readIndefiniteStringLength(majorType);
          if (length === -1) return this.setError(BAD_FORMED);

          while (length >= 0) {
            let tmp = new Uint8Array((data.byteLength + length) as u32);
            tmp.set(data);
            tmp.set(this.readArrayBuffer(length as u32), data.byteLength);
            data = tmp;

            // Update and check new length
            length = this.readIndefiniteStringLength(majorType);
            if (length === -1) return this.setError(BAD_FORMED);
          }
        } else {
          // Get the text string from the know length
          let tmp = new Uint8Array(length as u32);
          tmp.set(this.readArrayBuffer(length as u32));
          data = tmp;
        }

        const stringParsed = String.UTF8.decode(data.buffer);
        const obj = Value.String(stringParsed);

        return obj;
      }

      default:
        return this.setError(NOT_SUPDEEP_ARR_MAP);
    }
  }

  private readString(length_: u64): string {
    const majorType_ = 3;
    let data: Uint8Array = new Uint8Array(0);
    if (length_ < 0) {
      // Update and check new length_____*
      length_ = this.readIndefiniteStringLength(majorType_);
      if (length_ === -1) {
        this.setError(BAD_FORMED);
        return "";
      }

      while (length_ >= 0) {
        let tmp = new Uint8Array((data.byteLength + length_) as u32);
        tmp.set(data);
        tmp.set(this.readArrayBuffer(length_ as u32), data.byteLength);
        data = tmp;

        // Update and check new length_
        length_ = this.readIndefiniteStringLength(majorType_);
        if (length_ === -1) {
          this.setError(BAD_FORMED);
          return "";
        }
      }
    } else {
      if (!this.availableData(length_)) {
        this.setError(BAD_FORMED);
        return "";
      }

      let tmp = new Uint8Array(length_ as u32);
      tmp.set(this.readArrayBuffer(length_ as u32));
      data = tmp;
    }

    return String.UTF8.decode(data.buffer);
  }

  private deserialize(): void {
    const initialByte = this.readUint8();
    const majorType = initialByte >> 5;
    const additionalInformation = initialByte & 0x1f;

    if (majorType === 7) {
      switch (additionalInformation) {
        case 25:
          this.handler.setFloat("", this.readFloat16());
          return;
        case 26:
          this.handler.setFloat("", this.readFloat32());
          return;
        case 27:
          this.handler.setFloat("", this.readFloat64());
          return;
      }
    }

    let length = this.readLength(additionalInformation);

    if (length === -1) {
      this.setError(BAD_FORMED);
      return;
    }

    switch (majorType) {
      case 0: {
        this.handler.setUnsigned("", length);
        break;
      }
      case 1: {
        this.handler.setInteger("", -1 - length);
        break;
      }
      case 2: {
        if (length < 0) {
          const elements = new Array<Uint8Array>();
          let fullArrayLength = 0;

          // Update and check new length
          length = this.readIndefiniteStringLength(majorType);
          if (length === -1) {
            this.setError(BAD_FORMED);
            return;
          }

          while (length >= 0) {
            fullArrayLength += i32(length);
            elements.push(this.readArrayBuffer(u32(length)));

            // Update and check new length
            length = this.readIndefiniteStringLength(majorType);
            if (length === -1) {
              this.setError(BAD_FORMED);
              return;
            }
          }
          const fullArray = new Uint8Array(fullArrayLength);
          let fullArrayOffset = 0;
          for (let i = 0; i < elements.length; ++i) {
            fullArray.set(elements[i], fullArrayOffset);
            fullArrayOffset += elements[i].length;
          }

          this.handler.setBytes("", fullArray);
          break;
        }

        const dataAvailable = this.dataLength - this.offset;
        if (dataAvailable < length) {
          this.setError(BAD_FORMED);
          return;
        }

        const arr = this.readArrayBuffer(u32(length));
        arr.length == 0;
        this.handler.setBytes("", arr);

        break;
      }
      case 3: {
        const valueString = this.readString(length);

        if (!this.isError) {
          this.handler.setString("", valueString);
        }
        // If the above conditional is not met, means that the data is bad
        // encoded. The error is already set when  this.readString was called
        break;
      }
      case 4: {
        this.handler.pushArray("");

        if (length < 0) {
          while (!this.readBreak()) this.deserialize();
        } else {
          for (let i = u64(0); i < length; ++i) this.deserialize();
        }
        this.handler.popArray();
        return;
      }
      case 5: {
        this.handler.pushObject("");

        for (
          let i = u64(0);
          i < length || (length < 0 && !this.readBreak());
          ++i
        ) {
          // Deserialize key
          const key = this.getKey();
          if (key.isError) return;

          // Deserialize value
          const value = this.getValue();
          if (value.isError) return;

          this.handler.addValue(key.toString(), value);
        }
        this.handler.popObject();

        return;
      }
      case 6: {
        this.setError("Tags not implemented");
        return;
      }

      case 7:
        switch (u32(length)) {
          case 20:
            this.handler.setBoolean("", false);
            return;
          case 21:
            this.handler.setBoolean("", true);
            return;
          case 22:
            this.handler.setNull("");
            return;
          case 23:
            this.handler.setUndefined("");
            return;
          default: {
            this.setError("simple values not implemented");
            return;
          }
        }
    }
  }

  parse(): Value {
    if (this.dataLength <= 0) {
      return Value.Error(DATA_EMPTY);
    }

    this.deserialize();

    if (this.isError) {
      // It has an error on running
      return Value.Error(this.errorMessage);
    }

    if (this.offset < this.dataLength) {
      this.isSequence = true;
      this.sequence.push(this.handler.peek);
      this.handler.reset();
      while (this.offset < this.dataLength) {
        this.deserialize();
        this.sequence.push(this.handler.peek);
        this.handler.reset();
      }
    }

    if (this.isSequence) {
      return this.sequence;
    }

    return this.handler.peek;
  }
}
