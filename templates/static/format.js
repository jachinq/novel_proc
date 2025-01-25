const selectedFileEl = document.getElementById("selected-file");
const loadBtn = document.getElementById("load-btn"); // 加载按钮
const saveBtn = document.getElementById("save-btn"); // 保存按钮
const checkEncharBtn = document.getElementById("check-enchar-btn"); // 解析章节按钮
const replaceEncharBtn = document.getElementById("replace-enchar-btn"); // 替换按钮
const process_newline_btn = document.getElementById("process-newline-btn"); // 换行按钮

window.onload = function () {
  initEvents();
  loadSelectedFile();
}

let refresh = loadText;

const loadSelectedFile = function () {
  selected_file = JSON.parse(getCookie("setected_file") || "{}");
  // console.log(selected_file)
  if (selected_file && selected_file.filepath && selected_file.filename) {
    selectedFileEl.innerHTML = `当前选中文件：${selected_file.filename}`;
  } else {
    selectedFileEl.innerHTML = "请选择文件";
  }
}

// 预览内容
function preview_text({ lines = [], content = '', sep = '' }) {
  const countEl = document.getElementById("preview-enchar-count");
  const contentEl = document.getElementById("enchar-content")

  contentEl.style.display = "block";
  if (lines.length > 0) {
    contentEl.value = lines.join(sep);
    countEl.innerHTML = `总数:${lines.length}`;
  }
  else if (content && content.trim() !== '') {
    contentEl.value = content;
    countEl.innerHTML = `总数:${content.length}`;
  }

  const exclude_words = getCookie("exclude_words") || "";
  document.getElementById("exclude-words").value = exclude_words;
}

let selected_file = {};
function getSelectedFile() {
  if (!selected_file ||!selected_file.filepath) {
    alert("请先选择文件");
    return;
  }
  return selected_file.filepath
}

// 检查英文字符
function checkEnchar() {
  const exclude_words = document.getElementById("exclude-words").value;

  const filepath = getSelectedFile();
  if (!filepath) {
    return;
  }

  checkEncharBtn.disabled = true;
  checkEncharBtn.innerText = "Checking...";
  setCookie("exclude_words", exclude_words);

  refresh = checkEnchar;

  fetch('/check_enchar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filepath,
      exclude_words
    })
  })
    .then(response => response.json())
    .then(data => {
      preview_text({ sep: '\n\n', ...data });
      checkEncharBtn.disabled = false;
      checkEncharBtn.innerText = "检查英文";
    })
    .catch(error => console.error(error));

}

// 替换字符
function replaceEnchar() {
  const replace_words = document.getElementById("replace-words").value;
  const replace_with_words = document.getElementById("replace-with-words").value;

  const filepath = getSelectedFile();
  if (!filepath) {
    return;
  }

  replaceEncharBtn.disabled = true;
  replaceEncharBtn.innerText = "Replacing...";


  fetch('/replace_enchar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filepath,
      replace_words,
      replace_with_words
    })
  })
    .then(response => response.json())
    .then(data => {
      replaceEncharBtn.disabled = false;
      replaceEncharBtn.innerText = "替换文本";
      if (data.success) {
        refresh();
      } else {
        alert("替换失败");
      }
    })
    .catch(error => console.error(error));

}

// 换行处理
function process_newline() {
  const filepath = getSelectedFile();
  if (!filepath) {
    return;
  }

  process_newline_btn.disabled = true;
  process_newline_btn.innerText = "processing...";

  fetch('/process_newline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filepath,
    })
  })
    .then(response => response.json())
    .then(data => {
      process_newline_btn.disabled = false;
      process_newline_btn.innerText = "空行处理";
      if (data.success) {
        preview_text(data)
      } else {
        alert("替换失败");
      }
    })
    .catch(error => console.error(error));

}

// 加载文件
async function loadText() {
  const filepath = getSelectedFile();
  if (!filepath) {
    return;
  }

  loadBtn.disabled = true;
  loadBtn.innerText = "加载中";
  refresh = loadText;

  const response = await fetch('/load_text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filepath,
    })
  });
  const data = await response.json();
  if (data.success) {
    preview_text(data)
  } else {
    alert("加载失败");
  }
  loadBtn.disabled = false;
  loadBtn.innerText = "加载";
}

// 保存文件
async function saveText() {
  const filepath = getSelectedFile();
  if (!filepath) {
    return;
  }

  const response = await fetch('/save_text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filepath,
      content: document.getElementById("enchar-content").value,
    })
  });
  const data = await response.json();
  if (data.success) {
    preview_text(data)
  } else {
    alert("加载失败");
  }
}

function initEvents() {
  loadBtn.addEventListener("click", loadText);
  saveBtn.addEventListener("click", saveText);
  checkEncharBtn.addEventListener("click", checkEnchar);
  replaceEncharBtn.addEventListener("click", replaceEnchar);
  process_newline_btn.addEventListener("click", process_newline);
}

