const assetVersion = "20260711-1730";

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
const answerSection = document.getElementById("answerSection");
const answerPlaceholder = document.getElementById("answerPlaceholder");
const answerForm = document.getElementById("answerForm");
const codeGrid = document.getElementById("codeGrid");
const codeInput = document.getElementById("codeInput");
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

const codeCells = Array.from({ length: correctCode.length }, (_, index) => {
  const cell = document.createElement("span");
  cell.className = "code-cell";
  cell.setAttribute("aria-label", `${index + 1}文字目`);

  codeGrid.append(cell);
  return cell;
});

codeInput.addEventListener("beforeinput", handleCodeBeforeInput);
codeInput.addEventListener("input", handleCodeInput);
codeInput.addEventListener("compositionend", handleCodeInput);
codeInput.addEventListener("keydown", handleCodeKeydown);
codeInput.addEventListener("focus", renderCodeCells);
codeInput.addEventListener("blur", renderCodeCells);
codeInput.addEventListener("click", renderCodeCells);

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  judgeAnswer();
});

let answerSectionTop = 0;

setAnswerSectionTop();
updateAnswerPosition();

window.addEventListener("scroll", updateAnswerPosition, { passive: true });
window.addEventListener("resize", () => {
  if (document.activeElement === codeInput) {
    return;
  }

  setAnswerSectionTop();
  updateAnswerPosition();
});
window.addEventListener("load", () => {
  setAnswerSectionTop();
  updateAnswerPosition();
});

function createImage(src, alt) {
  const img = document.createElement("img");
  img.className = "puzzle-card__image";
  img.src = assetUrl(src);
  img.alt = alt;
  return img;
}

function setAnswerSectionTop() {
  const wasFixed = answerSection.classList.contains("is-fixed");

  if (wasFixed) {
    answerSection.classList.remove("is-fixed");
    answerPlaceholder.hidden = true;
  }

  answerSectionTop = answerSection.getBoundingClientRect().top + window.scrollY;
  answerPlaceholder.style.height = `${answerSection.offsetHeight + 22}px`;

  if (wasFixed) {
    updateAnswerPosition();
  }
}

function updateAnswerPosition() {
  const shouldFix = window.scrollY >= answerSectionTop;
  answerSection.classList.toggle("is-fixed", shouldFix);
  answerPlaceholder.hidden = !shouldFix;
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

function handleCodeInput(event) {
  if (event.isComposing) {
    return;
  }

  const cursor = codeInput.selectionStart || 0;
  const normalized = normalizeCode(codeInput.value).slice(0, correctCode.length);
  codeInput.value = normalized;
  codeInput.setSelectionRange(Math.min(cursor, normalized.length), Math.min(cursor, normalized.length));
  renderCodeCells();
}

function handleCodeKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    judgeAnswer();
  }
}

function judgeAnswer() {
  const answer = normalizeCode(codeInput.value).slice(0, correctCode.length);
  const isPerfect = answer === correctCode;

  codeCells.forEach((cell, index) => {
    const isCorrect = answer[index] === correctCode[index];
    cell.classList.toggle("is-correct", isCorrect);
    cell.classList.toggle("is-wrong", !isCorrect);
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

function renderCodeCells() {
  const answer = normalizeCode(codeInput.value).slice(0, correctCode.length);
  const activeIndex = Math.min(codeInput.selectionStart || answer.length, correctCode.length - 1);

  if (codeInput.value !== answer) {
    codeInput.value = answer;
  }

  codeCells.forEach((cell, index) => {
    cell.textContent = answer[index] || "";
    cell.classList.remove("is-correct", "is-wrong");
    cell.classList.toggle("is-active", document.activeElement === codeInput && index === activeIndex);
  });
}

function normalizeCode(value) {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function assetUrl(src) {
  return `${src}?v=${assetVersion}`;
}
