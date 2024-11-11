import { writeFileSync } from "fs";

function generateClarityList() {
  let output =
    "(define-data-var value-used-read-length (list 5000 uint)\n  (list\n    ";

  for (let i = 0; i < 5000; i++) {
    // Add newline and indent every 20 numbers
    if (i > 0 && i % 20 === 0) {
      output += "\n    ";
    }

    // Add the number with 'u' prefix
    output += `u${i}`;

    // Add space or nothing if it's the last number
    output += i === 4999 ? "" : " ";
  }

  output += "))\n";
  return output;
}

// Generate and write to file
const content = generateClarityList();

writeFileSync("clarity-list.clar", content, "utf8");
