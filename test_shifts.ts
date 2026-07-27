const alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const alphabet_upper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

const text1 = "Т ЬБТБЬТ";
const text2 = "ДЮЬЮБ.Ь";

function shiftText(text: string, shift: number): string {
  let result = "";
  for (const char of text) {
    const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
    const idx = isUpper ? alphabet_upper.indexOf(char) : alphabet.indexOf(char);
    if (idx !== -1) {
      const shiftedIdx = (idx + shift + 33) % 33;
      result += isUpper ? alphabet_upper[shiftedIdx] : alphabet[shiftedIdx];
    } else {
      result += char;
    }
  }
  return result;
}

console.log("=== SHIFTS FOR 'Т ЬБТБЬТ' ===");
for (let i = -32; i <= 32; i++) {
  const s = shiftText(text1, i);
  if (s.includes(" ") && s.length > 3) {
    console.log(`Shift ${i}: ${s}`);
  }
}

console.log("\n=== SHIFTS FOR 'ДЮЬЮБ.Ь' ===");
for (let i = -32; i <= 32; i++) {
  console.log(`Shift ${i}: ${shiftText(text2, i)}`);
}

// QWERTY mapping
const ru = "йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,";
const en = "qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?";

function toEn(text: string): string {
  let res = "";
  for (const c of text) {
    const idx = ru.indexOf(c);
    res += idx !== -1 ? en[idx] : c;
  }
  return res;
}

function toRu(text: string): string {
  let res = "";
  for (const c of text) {
    const idx = en.indexOf(c);
    res += idx !== -1 ? ru[idx] : c;
  }
  return res;
}

console.log("\n=== KEYBOARD LAYOUT ===");
console.log(`'Т ЬБТБЬТ' to EN: ${toEn(text1)}`);
console.log(`'ДЮЬЮБ.Ь' to EN: ${toEn(text2)}`);
