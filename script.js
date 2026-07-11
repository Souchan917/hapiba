const puzzleImages = [
  {
    src: "hapiba-01.webp",
    caption: "画像 1",
  },
  {
    src: "hapiba-02.webp",
    caption: "画像 2",
  },
  {
    src: "hapiba-03.webp",
    caption: "画像 3",
  },
  {
    src: "hapiba-04.webp",
    caption: "画像 4",
  },
];

const correctCode = "6N8Y5ABXAAMI2BR";
const successImageSrc = "clear-kaijin.webp";

const puzzleGrid = document.getElementById("puzzleGrid");
const answerForm = document.getElementById("answerForm");
const codeGrid = document.getElementById("codeGrid");
const resultPanel = document.getElementById("resultPanel");
const resultImage = document.getElementById("resultImage");
const resultText = document.getElementById("resultText");

puzzleImages.forEach((item, index) => {
  const card = document.createElement("article");
  card.className = "puzzle-card";

  const media = item.src
    ? createImage(item.src, item.caption)
    : createPlaceholder(index + 1);

  card.append(media);
  puzzleGrid.append(card);
});

const codeInputs = Array.from({ length: correctCode.length }, (_, index) => {
  const input = document.createElement("input");
  input.className = "code-input";
  input.type = "text";
  input.inputMode = "text";
  input.autocomplete = "off";
  input.maxLength = 1;
  input.setAttribute("aria-label", `${index + 1}文字目`);

  input.addEventListener("input", (event) => handleCodeInput(event, index));
  input.addEventListener("keydown", (event) => handleCodeKeydown(event, index));
  input.addEventListener("paste", (event) => handleCodePaste(event, index));

  codeGrid.append(input);
  return input;
});

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  judgeAnswer();
});

function createImage(src, alt) {
  const img = document.createElement("img");
  img.className = "puzzle-card__image";
  img.src = src;
  img.alt = alt;
  return img;
}

function createPlaceholder(number) {
  const placeholder = document.createElement("div");
  placeholder.className = "puzzle-card__placeholder";
  placeholder.textContent = `画像 ${number} を追加`;
  return placeholder;
}

function handleCodeInput(event, index) {
  const normalized = normalizeCode(event.target.value);
  event.target.value = normalized.slice(0, 1);
  event.target.classList.remove("is-correct", "is-wrong");
  resultPanel.hidden = true;

  if (normalized.length > 1) {
    fillCode(normalized, index);
    return;
  }

  if (normalized && index < codeInputs.length - 1) {
    codeInputs[index + 1].focus();
  }
}

function handleCodeKeydown(event, index) {
  if (event.key === "Backspace" && !event.target.value && index > 0) {
    codeInputs[index - 1].focus();
  }
}

function handleCodePaste(event, index) {
  event.preventDefault();
  const pasted = normalizeCode(event.clipboardData.getData("text"));
  fillCode(pasted, index);
}

function fillCode(value, startIndex) {
  value
    .slice(0, codeInputs.length - startIndex)
    .split("")
    .forEach((character, offset) => {
      const input = codeInputs[startIndex + offset];
      input.value = character;
      input.classList.remove("is-correct", "is-wrong");
    });

  const nextIndex = Math.min(startIndex + value.length, codeInputs.length - 1);
  codeInputs[nextIndex].focus();
}

function judgeAnswer() {
  const answer = codeInputs.map((input) => normalizeCode(input.value)).join("");
  const isPerfect = answer === correctCode;

  codeInputs.forEach((input, index) => {
    const isCorrect = normalizeCode(input.value) === correctCode[index];
    input.classList.toggle("is-correct", isCorrect);
    input.classList.toggle("is-wrong", !isCorrect);
  });

  resultPanel.hidden = !isPerfect;

  if (isPerfect) {
    showSuccessImage();
  }
}

function showSuccessImage() {
  resultText.textContent = "正解です。";
  resultImage.hidden = true;

  const image = new Image();
  image.onload = () => {
    resultImage.src = successImageSrc;
    resultImage.hidden = false;
    resultText.textContent = "";
  };
  image.onerror = () => {
    resultText.textContent = "正解です。正解用の画像を追加するとここに表示されます。";
  };
  image.src = successImageSrc;
}

function normalizeCode(value) {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
