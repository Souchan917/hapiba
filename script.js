const assetVersion = "20260711-1655";

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
  {
    src: "hapiba-05.webp",
    caption: "画像 5",
  },
];

const correctCode = "6N8Y5ABXAAMI2BR";
const successImageSrc = "clear.webp";

const puzzleGrid = document.getElementById("puzzleGrid");
const answerForm = document.getElementById("answerForm");
const codeGrid = document.getElementById("codeGrid");
const clearModal = document.getElementById("clearModal");
const clearModalClose = document.getElementById("clearModalClose");
const clearImage = document.getElementById("clearImage");
const clearFallback = document.getElementById("clearFallback");

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
  input.autocapitalize = "characters";
  input.spellcheck = false;
  input.maxLength = 1;
  input.pattern = "[A-Za-z0-9]";
  input.setAttribute("aria-label", `${index + 1}文字目`);

  input.addEventListener("beforeinput", handleCodeBeforeInput);
  input.addEventListener("input", (event) => handleCodeInput(event, index));
  input.addEventListener("compositionend", (event) => handleCodeInput(event, index));
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
  img.src = assetUrl(src);
  img.alt = alt;
  return img;
}

function createPlaceholder(number) {
  const placeholder = document.createElement("div");
  placeholder.className = "puzzle-card__placeholder";
  placeholder.textContent = `画像 ${number} を追加`;
  return placeholder;
}

function handleCodeBeforeInput(event) {
  if (!event.data || event.inputType === "insertFromPaste" || event.isComposing) {
    return;
  }

  if (!normalizeCode(event.data)) {
    event.preventDefault();
  }
}

function handleCodeInput(event, index) {
  if (event.isComposing) {
    return;
  }

  const normalized = normalizeCode(event.target.value);
  event.target.value = normalized.slice(0, 1);
  event.target.classList.remove("is-correct", "is-wrong");

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

  if (isPerfect) {
    showSuccessImage();
  }
}

function showSuccessImage() {
  clearImage.hidden = true;
  clearFallback.hidden = true;
  clearModal.hidden = false;

  const image = new Image();
  image.onload = () => {
    clearImage.src = assetUrl(successImageSrc);
    clearImage.hidden = false;
  };
  image.onerror = () => {
    clearFallback.hidden = false;
  };
  image.src = assetUrl(successImageSrc);
}

clearModalClose.addEventListener("click", closeClearModal);

clearModal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) {
    closeClearModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !clearModal.hidden) {
    closeClearModal();
  }
});

function closeClearModal() {
  clearModal.hidden = true;
}

function normalizeCode(value) {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function assetUrl(src) {
  return `${src}?v=${assetVersion}`;
}
