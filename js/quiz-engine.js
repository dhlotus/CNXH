/* ============================================================
   QUIZ-ENGINE.JS — Logic chung cho tất cả các bài kiểm tra
   Dùng cho: bai1.html, bai2.html, ..., bai6.html

   Cách hoạt động:
   - Mỗi file "baiX-data.js" định nghĩa mảng BAIX_QUESTIONS
   - Trước khi include file này, phải include file data của bài đó
   - File này tự động đọc biến QUIZ_DATA được set từ HTML
   ============================================================ */

/* ============================================================
   RENDER CÂU HỎI
   ============================================================ */
function renderQuiz(questions, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = "";
  questions.forEach((q, index) => {
    const letters = ["A", "B", "C", "D", "E", "F"];
    let optionsHtml = "";

    q.options.forEach((opt, i) => {
      const isMulti = q.correct.length > 1;
      optionsHtml += `
        <div class="option ${isMulti ? "multi-hint" : ""}" data-q="${index}" data-opt="${i}">
          <div class="option-letter">${letters[i]}</div>
          <div class="option-text">${opt}</div>
          <div class="option-result-icon"></div>
        </div>
      `;
    });

    html += `
      <div class="question-card" data-qcard="${index}" style="animation-delay: ${Math.min(index * 0.04, 0.6)}s">
        <div class="question-header">
          <span class="question-number">Câu ${q.id}</span>
          <span class="question-status" data-status="${index}"></span>
        </div>
        <div class="question-text">${q.text}</div>
        ${q.note ? `<div class="question-note">💡 ${q.note}</div>` : ""}
        <div class="options">${optionsHtml}</div>
      </div>
    `;
  });

  container.innerHTML = html;
  attachHandlers(questions);
}

/* ============================================================
   XỬ LÝ CHỌN ĐÁP ÁN
   ============================================================ */
function attachHandlers(questions) {
  document.querySelectorAll(".option").forEach((option) => {
    option.addEventListener("click", function () {
      if (this.classList.contains("locked")) return;

      const qIndex = parseInt(this.dataset.q);
      const question = questions[qIndex];
      const isMulti = question.correct.length > 1;

      if (isMulti) {
        handleMultiChoice(this, question, qIndex);
      } else {
        handleSingleChoice(this, question, qIndex);
      }
    });
  });
}

/* ============================================================
   CÂU 1 ĐÁP ÁN
   ============================================================ */
function handleSingleChoice(clickedOption, question, qIndex) {
  const qCard = clickedOption.closest(".question-card");
  const allOpts = qCard.querySelectorAll(".option");

  allOpts.forEach((opt) => opt.classList.add("locked"));

  const optIndex = parseInt(clickedOption.dataset.opt);
  const isCorrect = question.correct.includes(optIndex);

  // Tô xanh đáp án đúng
  question.correct.forEach((correctIdx) => {
    const correctOpt = qCard.querySelector(`.option[data-opt="${correctIdx}"]`);
    if (correctOpt) {
      correctOpt.classList.add("correct");
      correctOpt.querySelector(".option-result-icon").textContent = "✓";
    }
  });

  // Nếu chọn sai thì tô đỏ
  if (!isCorrect) {
    clickedOption.classList.add("wrong");
    clickedOption.querySelector(".option-result-icon").textContent = "✕";
  }

  markQuestionStatus(qIndex, isCorrect);
  qCard.classList.add("answered");
  question._answered = true;
  question._isCorrect = isCorrect;
}

/* ============================================================
   CÂU NHIỀU ĐÁP ÁN
   ============================================================ */
function handleMultiChoice(clickedOption, question, qIndex) {
  if (clickedOption.classList.contains("locked")) return;

  const qCard = clickedOption.closest(".question-card");

  // Toggle chọn
  if (clickedOption.classList.contains("selected")) {
    clickedOption.classList.remove("selected");
    clickedOption.querySelector(".option-result-icon").textContent = "";
  } else {
    clickedOption.classList.add("selected");
    clickedOption.querySelector(".option-result-icon").textContent = "●";
  }

  const selected = qCard.querySelectorAll(".option.selected");
  const correctCount = question.correct.length;

  // Khi chọn đủ số lượng đáp án đúng → khóa và chấm
  if (selected.length >= correctCount) {
    const allOpts = qCard.querySelectorAll(".option");
    allOpts.forEach((opt) => opt.classList.add("locked"));

    let hasWrong = false;

    allOpts.forEach((opt) => {
      const idx = parseInt(opt.dataset.opt);
      const isCorrect = question.correct.includes(idx);
      const isSelected = opt.classList.contains("selected");

      opt.classList.remove("selected");

      if (isCorrect) {
        opt.classList.add("correct");
        opt.querySelector(".option-result-icon").textContent = "✓";
      } else if (isSelected && !isCorrect) {
        opt.classList.add("wrong");
        opt.querySelector(".option-result-icon").textContent = "✕";
        hasWrong = true;
      }
    });

    const fullyCorrect = !hasWrong;

    markQuestionStatus(qIndex, fullyCorrect);
    qCard.classList.add("answered");
    question._answered = true;
    question._isCorrect = fullyCorrect;
  }
}

/* ============================================================
   ĐÁNH DẤU TRẠNG THÁI CÂU HỎI (✓ Đúng / ✗ Sai)
   ============================================================ */
function markQuestionStatus(qIndex, isCorrect) {
  const statusEl = document.querySelector(
    `.question-status[data-status="${qIndex}"]`,
  );
  if (!statusEl) return;
  statusEl.textContent = isCorrect ? "✓ Đúng" : "✗ Sai";
  statusEl.classList.add("show", isCorrect ? "correct" : "wrong");
}

/* ============================================================
   TỔNG KẾT KẾT QUẢ
   ============================================================ */
function setupSummary(questions) {
  const btn = document.getElementById("summaryBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const answered = questions.filter((q) => q._answered).length;

    if (answered === 0) {
      alert("Bạn chưa trả lời câu nào!");
      return;
    }

    const correct = questions.filter((q) => q._isCorrect === true).length;
    const wrong = questions.filter((q) => q._isCorrect === false).length;
    const total = questions.length;

    showModal(correct, wrong, total);

    // Confetti nếu độ chính xác >= 70%
    const percent = Math.round((correct / total) * 100);
    if (percent >= 70) launchConfetti();
  });
}

/* ============================================================
   MODAL KẾT QUẢ
   ============================================================ */
function showModal(correct, wrong, total) {
  const modal = document.getElementById("resultModal");
  if (!modal) return;

  // Độ chính xác = số câu đúng / TỔNG số câu
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  document.getElementById("modalCorrect").textContent = correct;
  document.getElementById("modalWrong").textContent = wrong;
  document.getElementById("modalTotal").textContent = total;

  // Cập nhật label "X/Y câu"
  const scoreLabel = document.getElementById("scoreLabel");
  if (scoreLabel) {
    scoreLabel.textContent = `${correct}/${total} câu`;
  }

  // Vòng tròn progress
  const circle = document.getElementById("scoreCircle");
  if (circle) {
    const circumference = 2 * Math.PI * 70;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    setTimeout(() => {
      circle.style.strokeDashoffset =
        circumference - (percent / 100) * circumference;
    }, 150);
  }

  // Đếm số %
  animateNumber(document.getElementById("scoreNumber"), percent);

  // Emoji + thông điệp
  const emoji = document.getElementById("modalEmoji");
  const title = document.getElementById("modalTitle");
  const sub = document.getElementById("modalSub");

  if (percent >= 90) {
    emoji.textContent = "🏆";
    title.textContent = "Xuất sắc!";
    sub.textContent = `Bạn đúng ${correct}/${total} câu — nắm rất vững kiến thức!`;
  } else if (percent >= 70) {
    emoji.textContent = "🎉";
    title.textContent = "Làm tốt lắm!";
    sub.textContent = `Bạn đúng ${correct}/${total} câu — cố thêm chút nữa là hoàn hảo!`;
  } else if (percent >= 50) {
    emoji.textContent = "💪";
    title.textContent = "Khá ổn!";
    sub.textContent = `Bạn đúng ${correct}/${total} câu — xem lại những câu sai nhé!`;
  } else {
    emoji.textContent = "📖";
    title.textContent = "Cần ôn thêm!";
    sub.textContent = `Bạn đúng ${correct}/${total} câu — thử lại lần nữa nhé!`;
  }

  modal.classList.add("active");
}

/* ============================================================
   ANIMATION ĐẾM SỐ %
   ============================================================ */
function animateNumber(el, target) {
  if (!el) return;
  let current = 0;
  const duration = 1200;
  const stepTime = 16;
  const steps = duration / stepTime;
  const increment = target / steps;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.round(current) + "%";
  }, stepTime);
}

/* ============================================================
   CONFETTI
   ============================================================ */
function launchConfetti() {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#3b82f6",
  ];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = Math.random() * 2 + 2 + "s";
    confetti.style.animationDelay = Math.random() * 0.5 + "s";
    confetti.style.width = Math.random() * 8 + 6 + "px";
    confetti.style.height = Math.random() * 8 + 6 + "px";
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4500);
  }
}

/* ============================================================
   KHỞI TẠO — Chạy khi DOM đã load xong
   Đọc mảng câu hỏi từ biến QUIZ_DATA (được set trong baiX-data.js)
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  // Lấy dữ liệu từ biến QUIZ_DATA (được define trong file data của từng bài)
  const sourceData = window.QUIZ_DATA || [];
  if (sourceData.length === 0) {
    console.warn("⚠️ Chưa có dữ liệu câu hỏi. Kiểm tra file data của bài.");
    return;
  }

  // Clone dữ liệu + thêm state
  const questions = sourceData.map((q) => ({
    ...q,
    _answered: false,
    _isCorrect: null,
  }));

  // Cập nhật số câu vào subtitle nếu có
  const subtitle = document.querySelector(".quiz-title-header .subtitle");
  if (subtitle && !subtitle.textContent.trim()) {
    subtitle.textContent = `${questions.length} câu hỏi trắc nghiệm`;
  }

  // Render + setup
  renderQuiz(questions, "quizContainer");
  setupSummary(questions);

  // Đóng modal khi click overlay
  const modal = document.getElementById("resultModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === this) this.classList.remove("active");
    });
  }

  // Đóng modal khi nhấn ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
  });
});
