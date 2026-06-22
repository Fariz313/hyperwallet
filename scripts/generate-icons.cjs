const fs = require("node:fs");
const { deflateSync } = require("node:zlib");

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeIcon(file, size) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (stride + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      const dx = nx - 0.5;
      const dy = ny - 0.5;
      const inCircle = dx * dx + dy * dy <= 0.47 * 0.47;
      const offset = row + 1 + x * 4;
      if (!inCircle) {
        raw[offset + 0] = 2;
        raw[offset + 1] = 6;
        raw[offset + 2] = 23;
        raw[offset + 3] = 255;
        continue;
      }
      const r = Math.round(56 + (1 - ny) * 20);
      const g = Math.round(189 - ny * 40);
      const b = Math.round(248 - ny * 90);
      raw[offset + 0] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = 255;
    }
  }

  const letter = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (stride + 1);
    letter[row] = 0;
    for (let x = 0; x < size; x++) {
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      const left = nx > 0.27 && nx < 0.39;
      const right = nx > 0.61 && nx < 0.73;
      const top = ny > 0.25 && ny < 0.37;
      const mid = ny > 0.46 && ny < 0.58;
      const bottom = ny > 0.63 && ny < 0.75;
      const isLetter = (left || right) && ny > 0.24 && ny < 0.77;
      const isBar = (top || mid || bottom) && nx > 0.25 && nx < 0.76;
      const offset = row + 1 + x * 4;
      if (isLetter || isBar) {
        letter[offset + 0] = 0;
        letter[offset + 1] = 17;
        letter[offset + 2] = 31;
        letter[offset + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat([raw, letter]))),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.mkdirSync("static/icons", { recursive: true });
  fs.writeFileSync(file, png);
}

writeIcon("static/icons/icon-192.png", 192);
writeIcon("static/icons/icon-512.png", 512);
console.log("Generated valid PNG icons");
