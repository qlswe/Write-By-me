const text = "Мькиькрбкрбкобок";

const alphabetLower = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const alphabetUpper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

for (let shift = 1; shift < 33; shift++) {
  let shifted = "";
  for (const char of text) {
    const idxLower = alphabetLower.indexOf(char);
    const idxUpper = alphabetUpper.indexOf(char);
    if (idxLower !== -1) {
      shifted += alphabetLower[(idxLower + shift) % 33];
    } else if (idxUpper !== -1) {
      shifted += alphabetUpper[(idxUpper + shift) % 33];
    } else {
      shifted += char;
    }
  }
  console.log(`Shift ${shift}: ${shifted}`);
}
