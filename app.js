const questions = [
  {
    id: "regions",
    title: "원하는 근무 지역을 모두 선택해주세요",
    max: 5,
    options: [
      "충청북도 전체",
      "청주시",
      "충주시",
      "제천시",
      "보은군",
      "옥천군",
      "영동군",
      "증평군",
      "진천군",
      "괴산군",
      "음성군",
      "단양군",
      "서울특별시 전체",
      "강남구",
      "강동구",
      "강북구",
      "강서구",
      "관악구",
      "광진구",
      "구로구",
      "금천구",
      "노원구",
      "도봉구",
      "동대문구",
      "동작구",
      "마포구",
      "서초구",
      "성동구",
      "성북구",
      "송파구",
      "양천구",
      "영등포구",
      "용산구",
      "은평구",
      "종로구",
      "중구",
      "중랑구",
    ],
  },
  {
    id: "personality",
    title: "나와 가장 잘 맞는 성격은 무엇인가요?",
    max: 2,
    options: [
      "친절하고 사람을 좋아해요 (사람 중심)",
      "꼼꼼해요 (세밀한 작업 중심)",
      "성실하고 책임감 있어요 (규칙·위생 준수 중심)",
      "창의적이에요 (예술·공예 중심)",
      "자연을 좋아해요 (생태·농촌 중심)",
    ],
  },
  {
    id: "workScenes",
    title: "가장 끌리는 일터 장면을 골라주세요",
    max: 2,
    options: [
      "보육, 돌봄",
      "동네 관리 및 청소",
      "가게 운영",
      "음식 만들기",
      "식물 가꾸기",
      "행사 및 문화 돕기",
      "서류 정리",
      "교육 및 상담",
      "카페 및 바리스타",
    ],
  },
  {
    id: "activity",
    title: "하루에 감당할 수 있는 활동량은 어느 정도인가요?",
    max: 1,
    options: ["주로 앉아서", "가볍게 걷기", "야외 활동 가능"],
  },
  {
    id: "environment",
    title: "선호하시는 일터의 환경은 어디인가요?",
    max: 1,
    options: ["실내", "실외", "상관없음"],
  },
  {
    id: "days",
    title: "일주일에 몇 일 정도 근무하기를 희망하시나요?",
    max: 1,
    options: ["짧게", "4~5일"],
  },
  {
    id: "certificates",
    title: "보유 중인 자격증이 있다면 체크해주세요",
    max: 2,
    optional: true,
    noneOption: "해당 없음",
    options: ["사회복지사 1급/2급 자격증", "요양보호사 자격증", "해당 없음"],
  },
];

const hiddenJudgmentNotes = {
  workScenes: {
    "보육, 돌봄": "영유아 보육, 아이돌봄, 어르신 요양지원 및 일상생활기능지원을 수행해요",
    "동네 관리 및 청소": "건물 및 아파트 단지의 보안 경비 업무와 환경미화, 가사지원, 청소 활동을 수행해요",
    "가게 운영": "매장에서 상품을 매장판매 하거나 고객관리 및 응대 업무를 수행해요",
    "음식 만들기": "주방에서 음식조리공통직무, 한식조리, 김치 및 반찬가공, 곡류 가공 업무를 수행해요",
    "식물 가꾸기": "농장이나 밭에서 채소재배 및 과수재배 등 자연 농업 활동을 수행해요",
    "행사 및 문화 돕기": "문화·예술기획, 문헌정보관리, 자원봉사관리 업무를 지원해요",
    "서류 정리": "사무실에서 컴퓨터로 사무행정 업무를 처리하고 기록물을 관리해요",
    "교육 및 상담": "평생교육프로그램 운영 상담 교수, 보건교육, 청소년상담복지 지원 업무를 수행해요",
    "카페 및 바리스타": "카페에서 커피를 추출하고 음료를 제조하는 커피관리 업무를 수행해요",
  },
};

const fallbackJobs = Array.from({ length: 15 }, (_, index) => ({
  title: `추천 공고 ${index + 1}`,
  company: "고용24 연동 대기",
  summary: "API 키를 설정하면 실제 고용24 채용공고를 불러와 Gemini가 적합도를 계산합니다.",
  url: "https://www.work24.go.kr",
  score: 100 - index * 3,
  reason: "현재는 예시 공고라 간단한 흐름 확인용으로 보여드리고 있습니다.",
}));

const state = {
  screen: "welcome",
  profile: { name: "", year: "", month: "", day: "", gender: "" },
  index: 0,
  answers: {},
  voiceTranscript: "",
  voiceStatus: "",
  isListening: false,
  greetingReady: false,
  jobs: [],
  visibleCount: 5,
};

const app = document.querySelector("#app");
let introTimer = null;
let recognition = null;
let mediaRecorder = null;
let audioChunks = [];
let finalSpeechTranscript = "";

window.addEventListener("nativeSpeechResult", (event) => {
  const transcript = event.detail?.transcript || "";
  if (!transcript) return;
  state.voiceTranscript = transcript;
  state.voiceStatus = "음성 내용을 인식했어요. 내용을 확인한 뒤 완료를 눌러주세요.";
  state.isListening = false;
  if (state.screen === "voice") renderVoice();
});

window.addEventListener("nativeSpeechError", () => {
  state.isListening = false;
  state.voiceStatus = "지금은 음성을 글자로 바꾸기 어려워요. 말씀하실 내용을 아래에 적어주시면 이어서 도와드릴게요.";
  if (state.screen === "voice") renderVoice();
});

function years() {
  const thisYear = new Date().getFullYear();
  const maxBirthYear = thisYear - 40;
  return Array.from({ length: 80 }, (_, i) => maxBirthYear - i);
}

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function setScreen(screen) {
  if (introTimer) {
    clearTimeout(introTimer);
    introTimer = null;
  }
  state.screen = screen;
  if (screen !== "greeting") state.greetingReady = false;
  render();
}

function render() {
  if (state.screen === "welcome") renderWelcome();
  if (state.screen === "greeting") renderGreeting();
  if (state.screen === "profile") renderProfile();
  if (state.screen === "mode") renderModeSelect();
  if (state.screen === "survey") renderSurvey();
  if (state.screen === "voice") renderVoice();
  if (state.screen === "complete") renderComplete();
  if (state.screen === "menu") renderMainMenu();
  if (state.screen === "loading") renderLoading();
  if (state.screen === "results") renderResults();
}

function renderWelcome() {
  app.innerHTML = `
    <section class="hero logo-hero" id="logoStart">
      <div class="intro-card">
        <div class="cover-title" aria-label="구해요 요기서">
          <span class="cover-cell cover-gu">구</span>
          <span class="cover-cell cover-hae">해</span>
          <span class="cover-cell cover-yo-top">요</span>
          <span class="cover-cell cover-yo-bottom">요</span>
          <span class="cover-cell cover-gi">기</span>
          <span class="cover-cell cover-seo">서</span>
        </div>
        <p class="app-subtitle">시니어 맞춤 일자리 매칭어플</p>
      </div>
      <p class="tap-hint">화면을 터치해 시작하기</p>
    </section>
  `;
  document.querySelector("#logoStart").addEventListener("click", () => setScreen("greeting"));
}

function renderGreeting() {
  app.innerHTML = `
    <section class="hero greeting-hero">
      <div class="greeting-scene">
        <p class="greeting">안녕하세요!<br />딱 맞는 일자리를 같이 찾아볼게요.</p>
      </div>
      <button class="primary bottom-button" id="goProfile" ${state.greetingReady ? "" : "disabled"}>다음</button>
    </section>
  `;
  document.querySelector("#goProfile").addEventListener("click", () => setScreen("profile"));
  if (!state.greetingReady) {
    introTimer = setTimeout(() => {
      state.greetingReady = true;
      renderGreeting();
    }, 1000);
  }
}

function renderProfile() {
  const maxDay = daysInMonth(state.profile.year, state.profile.month);
  app.innerHTML = `
    <section class="panel profile-panel">
      <div class="brand"><span class="brand-mark"></span><span>충북 일자리 매칭</span></div>
      <div class="content-zone">
        <h2>이름과 생년월일을 알려주세요!</h2>
        <div class="field">
          <label for="name">이름</label>
          <input id="name" value="${state.profile.name}" placeholder="이름을 입력해주세요" />
        </div>
        <div class="field">
          <label>생년월일</label>
          <p class="hint">현재는 만 40세 이상만 선택할 수 있어요.</p>
          <div class="date-grid">
            <select id="year"><option value="">연도</option>${years().map((y) => `<option ${state.profile.year == y ? "selected" : ""}>${y}</option>`).join("")}</select>
            <select id="month"><option value="">월</option>${Array.from({ length: 12 }, (_, i) => i + 1).map((m) => `<option value="${m}" ${state.profile.month == m ? "selected" : ""}>${m}월</option>`).join("")}</select>
            <select id="day"><option value="">일</option>${Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => `<option value="${d}" ${state.profile.day == d ? "selected" : ""}>${d}일</option>`).join("")}</select>
          </div>
        </div>
        <div class="field">
          <label>성별</label>
          <div class="gender-grid">
            <button class="choice mini-choice ${state.profile.gender === "여성" ? "selected" : ""}" data-gender="여성">여성</button>
            <button class="choice mini-choice ${state.profile.gender === "남성" ? "selected" : ""}" data-gender="남성">남성</button>
            <button class="choice mini-choice ${state.profile.gender === "선택 안 함" ? "selected" : ""}" data-gender="선택 안 함">선택 안 함</button>
          </div>
        </div>
      </div>
      <button class="primary bottom-button" id="completeProfile" disabled>다음</button>
    </section>
  `;

  ["name", "year", "month", "day"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("input", updateProfile);
    document.querySelector(`#${id}`).addEventListener("change", updateProfile);
  });
  document.querySelectorAll("[data-gender]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profile.gender = button.dataset.gender;
      renderProfile();
    });
  });
  validateProfile();
}

function updateProfile() {
  state.profile.name = document.querySelector("#name").value.trim();
  state.profile.year = document.querySelector("#year").value;
  state.profile.month = document.querySelector("#month").value;
  state.profile.day = document.querySelector("#day").value;
  if (this.id === "year" || this.id === "month") renderProfile();
  validateProfile();
}

function validateProfile() {
  const complete = state.profile.name && state.profile.year && state.profile.month && state.profile.day && state.profile.gender;
  const button = document.querySelector("#completeProfile");
  button.disabled = !complete;
  button.onclick = () => setScreen("mode");
}

function renderModeSelect() {
  app.innerHTML = `
    <section class="panel mode-panel">
      <div class="brand"><span class="brand-mark"></span><span>충북 일자리 매칭</span></div>
      <div class="content-zone mode-zone">
        <h2>${state.profile.name}님, 어떤 방식으로 시작할까요?</h2>
        <p class="lead">편한 방법으로 정보를 알려주시면 맞춤 공고 추천에 활용할게요.</p>
        <div class="mode-grid">
          <button class="mode-card" id="chooseSurvey">
            <strong>체크리스트로 지원서 쓰기</strong>
            <span>질문을 하나씩 고르며 차분하게 진행해요.</span>
          </button>
          <button class="mode-card" id="chooseVoice">
            <strong>음성으로 지원서 쓰기</strong>
            <span>마이크로 말씀하신 내용을 바탕으로 추천해요.</span>
          </button>
        </div>
      </div>
    </section>
  `;
  document.querySelector("#chooseSurvey").addEventListener("click", () => {
    state.index = 0;
    setScreen("survey");
  });
  document.querySelector("#chooseVoice").addEventListener("click", () => setScreen("voice"));
}

function renderSurvey() {
  const question = questions[state.index];
  const selected = state.answers[question.id] || [];
  const percent = Math.round(((state.index + 1) / questions.length) * 100);

  app.innerHTML = `
    <section class="panel">
      <div class="progress">
        <div class="bar"><span style="width:${percent}%"></span></div>
        <strong>${state.index + 1}/${questions.length}</strong>
      </div>
      <h2>${question.title}</h2>
      <p class="hint">${question.max > 1 ? `${question.max}개까지 선택할 수 있어요.` : "선택하면 자동으로 다음 문항으로 넘어가요."}</p>
      <div class="choice-list">
        ${question.options.map((option) => `<button class="choice ${selected.includes(option) ? "selected" : ""}" data-option="${option}">${option}</button>`).join("")}
      </div>
      <div class="survey-footer">
        <button class="secondary" id="prevQuestion" ${state.index === 0 ? "disabled" : ""}>이전</button>
        ${question.optional || question.max > 1 ? `<button class="primary" id="nextQuestion">${state.index === questions.length - 1 ? "완료" : "다음"}</button>` : ""}
      </div>
    </section>
  `;

  document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => chooseOption(question, button.dataset.option));
  });
  document.querySelector("#prevQuestion").addEventListener("click", previousQuestion);
  const next = document.querySelector("#nextQuestion");
  if (next) next.addEventListener("click", nextQuestion);
}

function chooseOption(question, option) {
  const selected = state.answers[question.id] || [];
  if (option === question.noneOption) {
    state.answers[question.id] = [option];
    renderSurvey();
    return;
  }

  const selectedWithoutNone = question.noneOption
    ? selected.filter((item) => item !== question.noneOption)
    : selected;

  if (question.max === 1) {
    state.answers[question.id] = [option];
    setTimeout(nextQuestion, 180);
    renderSurvey();
    return;
  }

  if (selectedWithoutNone.includes(option)) {
    state.answers[question.id] = selectedWithoutNone.filter((item) => item !== option);
  } else if (selectedWithoutNone.length < question.max) {
    state.answers[question.id] = [...selectedWithoutNone, option];
  }
  renderSurvey();
}

function previousQuestion() {
  if (state.index > 0) {
    state.index -= 1;
    renderSurvey();
  }
}

function nextQuestion() {
  const question = questions[state.index];
  if (!question.optional && !(state.answers[question.id] || []).length) return;
  if (state.index < questions.length - 1) {
    state.index += 1;
    renderSurvey();
    return;
  }
  setScreen("complete");
}

function renderVoice() {
  const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  app.innerHTML = `
    <section class="panel voice-panel">
      <div class="brand"><span class="brand-mark"></span><span>충북 일자리 매칭</span></div>
      <div class="voice-prompt-box">
        <h2>말씀해주시면 좋아요</h2>
        <ul>
          <li>원하는 지역</li>
          <li>해보고 싶은 일</li>
          <li>가능한 근무일</li>
          <li>보유 자격증</li>
          <li>불편한 부분</li>
        </ul>
        <p>편한 말투로 이야기해도 괜찮아요.</p>
      </div>
      <p class="voice-example">예: “청주에서 주 5일 정도 일하고 싶고, 요양보호사 자격증이 있어요.”</p>
      <button class="mic-button ${state.isListening ? "listening" : ""}" id="toggleVoice">
        <span class="mic-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z"></path>
            <path d="M19 11a7 7 0 0 1-14 0"></path>
            <path d="M12 18v3"></path>
            <path d="M8 21h8"></path>
          </svg>
        </span>
        <span>${state.isListening ? "말하기 종료" : "마이크로 말하기"}</span>
      </button>
      <p class="hint">${state.voiceStatus || (supported ? "마이크 권한 요청이 뜨면 허용을 눌러주세요. 브레이브에서 인식이 안 되면 녹음 방식으로 자동 전환됩니다." : "이 브라우저는 내장 음성 인식이 제한될 수 있어요. 버튼을 누르면 녹음 방식으로 시도합니다.")}</p>
      <textarea id="voiceTranscript" class="transcript" placeholder="인식된 내용이 여기에 표시됩니다.">${state.voiceTranscript}</textarea>
      <button class="primary bottom-button" id="completeVoice" ${state.voiceTranscript.trim() ? "" : "disabled"}>완료</button>
      <button class="secondary" id="backToMode">이전</button>
    </section>
  `;

  document.querySelector("#toggleVoice").addEventListener("click", toggleVoiceInput);
  document.querySelector("#voiceTranscript").addEventListener("input", (event) => {
    state.voiceTranscript = event.target.value;
    document.querySelector("#completeVoice").disabled = !state.voiceTranscript.trim();
  });
  document.querySelector("#completeVoice").addEventListener("click", () => {
    state.answers.voiceTranscript = state.voiceTranscript.trim();
    setScreen("complete");
  });
  document.querySelector("#backToMode").addEventListener("click", () => setScreen("mode"));
}

function toggleVoiceInput() {
  if (state.isListening) {
    if (window.NativeBridge?.stopSpeech) {
      window.NativeBridge.stopSpeech();
      state.isListening = false;
      state.voiceStatus = "말하기를 종료했어요. 인식된 내용을 확인해 주세요.";
      renderVoice();
      return;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      stopAudioRecordingFallback();
      return;
    }
    if (recognition) recognition.stop();
    state.isListening = false;
    state.voiceStatus = "말하기를 종료했어요. 인식된 내용을 확인한 뒤 완료를 눌러주세요.";
    renderVoice();
    return;
  }

  if (window.NativeBridge?.startSpeech) {
    state.isListening = true;
    state.voiceStatus = "듣고 있어요. 말씀하신 내용이 아래에 표시됩니다.";
    renderVoice();
    window.NativeBridge.startSpeech();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    state.isListening = false;
    state.voiceTranscript = state.voiceTranscript || "청주에서 주 5일 정도 일하고 싶고, 요양보호사 자격증이 있어요. 사람을 돌보는 일이 좋아요.";
    state.voiceStatus = "미리보기 브라우저 제한으로 시연용 문장을 넣었어요. 실제 휴대폰 Chrome에서는 마이크 권한을 허용해 음성 입력을 사용할 수 있습니다.";
    renderVoice();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = true;
  recognition.continuous = true;
  finalSpeechTranscript = state.voiceTranscript ? `${state.voiceTranscript} ` : "";

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (!transcript) continue;

      if (event.results[index].isFinal) {
        finalSpeechTranscript = appendUniqueSpeech(finalSpeechTranscript, transcript);
      } else {
        interimTranscript = transcript;
      }
    }
    state.voiceTranscript = `${finalSpeechTranscript}${interimTranscript ? ` ${interimTranscript}` : ""}`.trim();
    const textarea = document.querySelector("#voiceTranscript");
    const complete = document.querySelector("#completeVoice");
    if (textarea) textarea.value = state.voiceTranscript;
    if (complete) complete.disabled = !state.voiceTranscript;
  };

  recognition.onend = () => {
    state.isListening = false;
    state.voiceStatus = state.voiceTranscript
      ? "말하기를 종료했어요. 인식된 내용을 확인한 뒤 완료를 눌러주세요."
      : "음성이 인식되지 않았어요. 다시 누르거나 아래 칸에 직접 입력해 주세요.";
    if (state.screen === "voice") renderVoice();
  };

  recognition.onerror = () => {
    state.isListening = false;
    startAudioRecordingFallback();
  };

  try {
    recognition.start();
    state.isListening = true;
    state.voiceStatus = "듣고 있어요. 말씀하신 내용이 아래에 표시됩니다.";
    renderVoice();
  } catch {
    state.isListening = false;
    startAudioRecordingFallback();
  }
}

async function startAudioRecordingFallback() {
  if (!navigator.mediaDevices?.getUserMedia) {
    state.voiceStatus = "이 브라우저에서는 마이크 녹음도 제한되어 있어요. 아래 칸에 직접 입력해도 추천에 반영됩니다.";
    renderVoice();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      state.voiceStatus = "녹음을 분석하고 있어요. 잠시만 기다려주세요.";
      renderVoice();
      await transcribeRecordedAudio(new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" }));
    };
    mediaRecorder.start();
    state.isListening = true;
    state.voiceStatus = "녹음 중이에요. 다시 누르면 녹음을 마치고 내용을 분석합니다.";
    renderVoice();
  } catch {
    state.voiceStatus = "마이크 권한은 허용됐지만 녹음을 시작하지 못했어요. 아래 칸에 직접 입력해도 추천에 반영됩니다.";
    renderVoice();
  }
}

async function stopAudioRecordingFallback() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    state.isListening = false;
    renderVoice();
  }
}

async function transcribeRecordedAudio(blob) {
  try {
    const dataUrl = await blobToDataUrl(blob);
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: blob.type || "audio/webm",
        audioBase64: dataUrl.split(",")[1],
      }),
    });
    const data = await response.json();
    if (data.transcript) {
      state.voiceTranscript = data.transcript;
      state.voiceStatus = "녹음 내용을 인식했어요. 내용을 확인한 뒤 완료를 눌러주세요.";
    } else {
      state.voiceStatus = data.message || "녹음은 됐지만 내용을 글자로 바꾸지 못했어요. 아래 칸에 직접 입력해도 됩니다.";
    }
  } catch {
    state.voiceStatus = "녹음 분석 중 문제가 있었어요. 아래 칸에 직접 입력해도 추천에 반영됩니다.";
  }
  renderVoice();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function appendUniqueSpeech(base, next) {
  const normalizedBase = normalizeSpeechText(base);
  const normalizedNext = normalizeSpeechText(next);
  if (!normalizedNext || normalizedBase.endsWith(normalizedNext)) return base;
  if (normalizedBase.includes(normalizedNext) && normalizedNext.length > 6) return base;
  return `${base}${base.trim() ? " " : ""}${next}`.trimEnd();
}

function normalizeSpeechText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function renderMainMenu() {
  app.innerHTML = `
    <section class="panel menu-panel">
      <div class="menu-logo-area">
        <div class="cover-title menu-cover" aria-label="구해요 요기서">
          <span class="cover-cell cover-gu">구</span>
          <span class="cover-cell cover-hae">해</span>
          <span class="cover-cell cover-yo-top">요</span>
          <span class="cover-cell cover-yo-bottom">요</span>
          <span class="cover-cell cover-gi">기</span>
          <span class="cover-cell cover-seo">서</span>
        </div>
        <p class="lead">${state.profile.name}님, 무엇을 해볼까요?</p>
      </div>
      <div class="menu-action-zone">
        <div class="menu-grid">
          <button class="menu-card" id="showJobs">
            <strong>공고보기</strong>
            <span>맞춤 추천 공고와 추천 이유를 확인해요.</span>
          </button>
          <button class="menu-card disabled-card" id="nearJobs" disabled>
            <strong>내 주변 일자리 보기</strong>
            <span>지도와 GPS 기반 기능은 다음 단계에서 추가할 예정이에요.</span>
          </button>
        </div>
      </div>
    </section>
  `;
  document.querySelector("#showJobs").addEventListener("click", loadRecommendations);
}

function renderComplete() {
  app.innerHTML = `
    <section class="hero complete-hero" id="completeNext">
      <div class="complete-message">
        <h1>고생하셨어요.</h1>
        <p class="lead">이제 ${state.profile.name}님에게 맞는 메뉴를 보여드릴게요.</p>
      </div>
      <p class="tap-hint">화면을 터치해 계속하기</p>
    </section>
  `;
  document.querySelector("#completeNext").addEventListener("click", () => setScreen("menu"));
}

async function loadRecommendations() {
  setScreen("loading");
  const payload = {
    profile: {
      ...state.profile,
      birthDate: `${state.profile.year}-${String(state.profile.month).padStart(2, "0")}-${String(state.profile.day).padStart(2, "0")}`,
    },
    answers: state.answers,
    voiceTranscript: state.voiceTranscript,
    hiddenJudgmentNotes,
  };

  const minimumThinkingTime = new Promise((resolve) => setTimeout(resolve, 1800));
  try {
    const [response] = await Promise.all([
      fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      minimumThinkingTime,
    ]);
    if (!response.ok) throw new Error("recommendation failed");
    const data = await response.json();
    state.jobs = data.jobs?.length ? data.jobs : fallbackJobs;
  } catch {
    await minimumThinkingTime;
    state.jobs = await loadStaticJobs(payload);
  }
  state.visibleCount = 5;
  setScreen("results");
}

async function loadStaticJobs(payload) {
  try {
    const response = await fetch("./jobs.json");
    if (!response.ok) throw new Error("static jobs failed");
    const jobs = await response.json();
    return selectStaticJobs(payload, jobs).slice(0, 15);
  } catch {
    try {
      if (window.NativeBridge?.getJobsJson) {
        const jobs = JSON.parse(window.NativeBridge.getJobsJson());
        return selectStaticJobs(payload, jobs).slice(0, 15);
      }
    } catch {
      return fallbackJobs;
    }
    return fallbackJobs;
  }
}

function selectStaticJobs(payload, jobs) {
  const answers = payload.answers || {};
  const voiceTerms = String(payload.voiceTranscript || answers.voiceTranscript || "")
    .split(/[\s,.;!?~]+/)
    .filter((term) => term.length >= 2);
  const terms = [
    ...(answers.regions || []),
    ...(answers.workScenes || []),
    ...(answers.personality || []),
    ...(answers.activity || []),
    ...(answers.environment || []),
    ...(answers.days || []),
    ...(answers.certificates || []),
    ...voiceTerms,
  ].filter((term) => term && term !== "해당 없음");

  const hiddenNotes = payload.hiddenJudgmentNotes?.workScenes || {};
  const hiddenTerms = (answers.workScenes || [])
    .map((scene) => hiddenNotes[scene] || "")
    .flatMap((note) => note.split(/[\s,·]+/))
    .filter((term) => term.length >= 2);

  const normalizedTerms = buildMatchTerms([...terms, ...hiddenTerms]);
  const regionScopedJobs = filterStaticJobsByRegion(answers.regions || [], jobs);

  return regionScopedJobs
    .map((job) => {
      const haystack = normalizeText([
        job.title,
        job.company,
        job.summary,
        job.region,
        job.schedule,
        job.certificates,
        job.occupation,
        job.description,
      ].filter(Boolean).join(" "));
      let score = 38;
      score += normalizedTerms.reduce((total, term) => total + (term && haystack.includes(term) ? 2 : 0), 0);
      if ((answers.regions || []).some((region) => staticRegionMatcher(region).some((keyword) => haystack.includes(normalizeText(keyword))))) score += 14;
      if ((answers.certificates || []).some((cert) => cert !== "해당 없음" && buildMatchTerms([cert]).some((term) => haystack.includes(term)))) score += 16;
      if ((answers.workScenes || []).some((scene) => buildMatchTerms([scene]).some((term) => haystack.includes(term)))) score += 12;
      if ((answers.days || []).includes("4~5일") && haystack.includes("주5일")) score += 8;
      if ((answers.days || []).includes("짧게") && (haystack.includes("주3일") || haystack.includes("시간제") || haystack.includes("파트"))) score += 8;
      if ((answers.environment || []).includes("실내") && !haystack.includes("야외")) score += 4;
      if ((answers.environment || []).includes("실외") && (haystack.includes("야외") || haystack.includes("외근"))) score += 4;
      score = Math.min(97, Math.round(score));
      return { ...job, score, reason: job.reason || buildStaticReason(answers, job) };
    })
    .sort((a, b) => b.score - a.score);
}

function filterStaticJobsByRegion(regions, jobs) {
  const selected = (regions || []).filter(Boolean);
  if (!selected.length) return jobs;

  const matched = jobs.filter((job) => {
    const regionText = normalizeText([job.region, job.summary, job.description].filter(Boolean).join(" "));
    return selected.some((region) => staticRegionMatcher(region).some((keyword) => regionText.includes(normalizeText(keyword))));
  });

  if (!matched.length) return jobs;

  const matchedUrls = new Set(matched.map((job) => job.url));
  const rest = jobs.filter((job) => !matchedUrls.has(job.url));
  return [...matched, ...rest];
}

function staticRegionMatcher(region) {
  if (region === "충청북도 전체") {
    return ["충청북도", "충북", "청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"];
  }
  if (region === "서울특별시 전체") {
    return ["서울특별시", "서울"];
  }
  return [region];
}

function buildStaticReason(answers, job) {
  const reasons = [];
  const haystack = normalizeText([
    job.title,
    job.company,
    job.summary,
    job.region,
    job.schedule,
    job.certificates,
    job.occupation,
    job.description,
  ].filter(Boolean).join(" "));

  if ((answers.certificates || []).some((cert) => cert !== "해당 없음" && haystack.includes(normalizeText(cert)))) {
    reasons.push("보유하신 자격증과 공고 조건이 잘 맞습니다");
  }
  if ((answers.days || []).includes("4~5일") && haystack.includes("주5일")) {
    reasons.push("희망하신 근무일수와 비슷합니다");
  }
  if ((answers.days || []).includes("짧게") && (haystack.includes("주3일") || haystack.includes("시간제") || haystack.includes("파트"))) {
    reasons.push("짧게 일하고 싶은 조건과 비교적 잘 맞습니다");
  }

  const text = reasons.slice(0, 2).join(" 그리고 ");
  return text ? `${text}. 한 번 확인해보셔도 좋겠습니다.` : "선택하신 답변과 공고 내용이 일부 맞아 추천드렸습니다. 자세한 조건을 한 번 확인해보셔도 좋겠습니다.";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()\/,·.-]/g, "");
}

function buildMatchTerms(values) {
  const stopWords = new Set(["하고", "싶고", "정도", "있어요", "좋아요", "가능", "선택", "해당", "없음", "중심", "자격증"]);
  return [...new Set(values
    .flatMap((value) => String(value || "").split(/[\s,.;!?~()\/·-]+/))
    .map(normalizeText)
    .filter((term) => term.length >= 2 && !stopWords.has(term))
    .flatMap((term) => {
      const terms = [term];
      if (term.includes("요양보호사")) terms.push("요양보호사", "요양", "돌봄");
      if (term.includes("사회복지사")) terms.push("사회복지사", "복지");
      if (term.includes("청소")) terms.push("청소", "미화");
      if (term.includes("보육")) terms.push("보육", "돌봄");
      if (term.includes("카페") || term.includes("바리스타")) terms.push("카페", "바리스타");
      return terms;
    }))];
}

function renderLoading() {
  app.innerHTML = `
    <section class="loader">
      <div>
        <div class="spinner"></div>
        <h2>답변을 분석하고 있어요</h2>
        <p class="lead">Gemini가 체크리스트와 공고를 비교하는 중입니다.</p>
      </div>
    </section>
  `;
}

function renderResults() {
  const visible = state.jobs.slice(0, state.visibleCount);
  app.innerHTML = `
    <section class="panel">
      <div class="brand"><span class="brand-mark"></span><span>충북 일자리 매칭</span></div>
      <h2>${state.profile.name}님에게 맞는 추천 공고</h2>
      <p class="lead">상위 ${Math.min(state.visibleCount, state.jobs.length)}개를 보여드려요.</p>
      <div class="job-list">
        ${visible.map((job) => `
          <article class="job">
            <h3>${job.title}</h3>
            ${Number.isFinite(Number(job.score)) ? `<p class="score">추천 점수 ${Math.round(Number(job.score))}점</p>` : ""}
            <p>${job.company ? `${job.company} · ` : ""}${job.summary}</p>
            ${job.reason ? `<p class="reason">${job.reason}</p>` : ""}
            <div class="job-actions">
              <a href="${job.url}" target="_blank" rel="noreferrer">공고 링크 보기</a>
              ${job.phone ? `<a href="tel:${job.phone}">전화하기</a>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
      ${state.visibleCount < state.jobs.length ? `<button class="primary" id="showMore">다음 5개 보기</button>` : `<p class="hint">추천 공고 ${state.jobs.length}개를 모두 확인했어요.</p>`}
    </section>
  `;
  const showMore = document.querySelector("#showMore");
  if (showMore) showMore.addEventListener("click", () => {
    state.visibleCount += 5;
    renderResults();
  });
}

render();
