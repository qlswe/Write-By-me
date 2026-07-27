const text = "Мькиькрбкрбкобок";

// Standard Russian alphabet (33 letters)
const alphabet33 = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const alphabet33_upper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

// Standard Russian alphabet without ё (32 letters)
const alphabet32 = "абвгдежзийклмнопрстуфхцчшщъыьэюя";
const alphabet32_upper = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

console.log("=== 33 letters (with ё) ===");
for (let shift = 1; shift < 33; shift++) {
  let shifted = "";
  for (const char of text) {
    const idxLower = alphabet33.indexOf(char.toLowerCase());
    if (idxLower !== -1) {
      const shiftedChar = alphabet33[(idxLower + shift) % 33];
      shifted += char === char.toUpperCase() ? shiftedChar.toUpperCase() : shiftedChar;
    } else {
      shifted += char;
    }
  }
  console.log(`Shift ${shift}: ${shifted}`);
}

console.log("\n=== 32 letters (without ё) ===");
for (let shift = 1; shift < 32; shift++) {
  let shifted = "";
  for (const char of text) {
    const idxLower = alphabet32.indexOf(char.toLowerCase());
    if (idxLower !== -1) {
      const shiftedChar = alphabet32[(idxLower + shift) % 32];
      shifted += char === char.toUpperCase() ? shiftedChar.toUpperCase() : shiftedChar;
    } else {
      shifted += char;
    }
  }
  console.log(`Shift ${shift}: ${shifted}`);
}
