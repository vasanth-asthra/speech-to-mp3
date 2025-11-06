declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(buffer: Int16Array): number[];
    flush(): number[];
  }
  export default Mp3Encoder;
}
