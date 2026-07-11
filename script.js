const assetVersion = "20260711-1748";

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
const codeEntry = document.querySelector(".code-entry");
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

const codeSlots = Array.from({ length: correctCode.length }, () => "");
const codeStatuses = Array.from({ length: correctCode.length }, () => "");
let activeCodeIndex = 0;
let hasJudged = false;

codeInput.addEventListener("pointerdown", handleCodePointerDown);
codeInput.addEventListener("beforeinput", handleCodeBeforeInput);
codeInput.addEventListener("input", handleCodeInput);
codeInput.addEventListener("compositionend", handleCodeInput);
codeInput.addEventListener("keydown", handleCodeKeydown);
codeInput.addEventListener("paste", handleCodePaste);
codeInput.addEventListener("focus", renderCodeCells);
codeInput.addEventListener("blur", renderCodeCells);
codeEntry.addEventListener("click", () => codeInput.focus());

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

function handleCodePointerDown(event) {
  event.preventDefault();
  activeCodeIndex = getCodeIndexFromPoint(event.clientX, event.clientY);
  codeInput.focus();
  renderCodeCells();
}

function handleCodeBeforeInput(event) {
  if (event.isComposing) {
    return;
  }

  if (event.inputType && event.inputType.startsWith("delete")) {
    event.preventDefault();
    deleteSelectedCode(event.inputType);
    return;
  }

  if (!event.data || event.inputType === "insertFromPaste") {
    return;
  }

  const value = normalizeCode(event.data);

  if (!value) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  insertCodeCharacters(value);
}

function handleCodeInput(event) {
  if (event.isComposing) {
    return;
  }

  const value = normalizeCode(codeInput.value);

  if (value) {
    insertCodeCharacters(value);
  }

  codeInput.value = "";
  renderCodeCells();
}

function handleCodeKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    judgeAnswer();
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    deleteSelectedCode(event.key === "Delete" ? "deleteContentForward" : "deleteContentBackward");
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    activeCodeIndex = Math.max(0, activeCodeIndex - 1);
    renderCodeCells();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    activeCodeIndex = Math.min(correctCode.length, activeCodeIndex + 1);
    renderCodeCells();
  }
}

function handleCodePaste(event) {
  event.preventDefault();
  insertCodeCharacters(event.clipboardData.getData("text"));
}

function judgeAnswer() {
  hasJudged = true;
  const isPerfect = codeSlots.every((character, index) => character === correctCode[index]);

  codeSlots.forEach((character, index) => {
    codeStatuses[index] = character === correctCode[index] ? "correct" : "wrong";
  });
  renderCodeCells();

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

function insertCodeCharacters(value) {
  const characters = normalizeCode(value).slice(0, correctCode.length - activeCodeIndex).split("");

  characters.forEach((character) => {
    if (activeCodeIndex >= correctCode.length) {
      return;
    }

    setCodeSlot(activeCodeIndex, character);
    activeCodeIndex += 1;
  });

  activeCodeIndex = Math.min(activeCodeIndex, correctCode.length);
  codeInput.value = "";
  renderCodeCells();
}

function deleteSelectedCode(inputType) {
  if (inputType === "deleteContentForward") {
    if (activeCodeIndex < correctCode.length) {
      setCodeSlot(activeCodeIndex, "");
    }

    renderCodeCells();
    return;
  }

  const targetIndex = activeCodeIndex === correctCode.length ? correctCode.length - 1 : activeCodeIndex;

  if (codeSlots[targetIndex]) {
    activeCodeIndex = targetIndex;
    setCodeSlot(activeCodeIndex, "");
  } else if (targetIndex > 0) {
    activeCodeIndex = targetIndex - 1;
    setCodeSlot(activeCodeIndex, "");
  }

  renderCodeCells();
}

function setCodeSlot(index, character) {
  const nextCharacter = normalizeCode(character).slice(0, 1);

  if (codeSlots[index] === nextCharacter) {
    return;
  }

  codeSlots[index] = nextCharacter;

  if (!hasJudged) {
    codeStatuses[index] = "";
    return;
  }

  codeStatuses[index] = nextCharacter === correctCode[index] ? "correct" : "";
}

function getCodeIndexFromPoint(x, y) {
  let closestIndex = 0;
  let closestDistance = Infinity;

  codeCells.forEach((cell, index) => {
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(centerX - x, centerY - y);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function renderCodeCells() {
  const visibleActiveIndex = Math.min(activeCodeIndex, correctCode.length - 1);

  codeCells.forEach((cell, index) => {
    cell.textContent = codeSlots[index];
    cell.classList.toggle("is-correct", codeStatuses[index] === "correct");
    cell.classList.toggle("is-wrong", codeStatuses[index] === "wrong");
    cell.classList.toggle("is-active", document.activeElement === codeInput && index === visibleActiveIndex);
  });
}

function normalizeCode(value) {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function assetUrl(src) {
  return `${src}?v=${assetVersion}`;
}
