function preview_enchar({ lines = [] }) {

  const count = document.getElementById("preview-enchar-count");
  count.innerHTML = `总行数:${lines.length}`;

  const contentEl = document.getElementById("enchar-content")
  contentEl.value = lines.join("\n\n");
  contentEl.style.display = "block";

  const exclude_words = getCookie("exclude_words") || "";
  document.getElementById("exclude-words").value = exclude_words;
}

window.onload = function () {
  initEvents();
  loadFileList();
}

function initEvents() {
  const checkEncharBtn = document.getElementById("check-enchar-btn"); // 解析章节按钮
  const replaceEncharBtn = document.getElementById("replace-enchar-btn"); // 替换按钮

  function checkEnchar() {
    const exclude_words = document.getElementById("exclude-words").value;
    const filepaths = [];
    const checkboxes = document.getElementsByClassName("file-checkbox");
    Array.from(checkboxes).forEach(checkbox => {
      if (checkbox.checked) {
        const filepath = checkbox.id;
        console.log(filepath);
        filepaths.push(filepath);
      }
    })
    if (filepaths.length === 0) {
      alert("请选择文件");
      return;
    }

    checkEncharBtn.disabled = true;
    checkEncharBtn.innerText = "Checking...";
    setCookie("exclude_words", exclude_words);


    fetch('/check_enchar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filepath: filepaths[0],
        exclude_words
      })
    })
      .then(response => response.json())
      .then(data => {
        preview_enchar(data);
        checkEncharBtn.disabled = false;
        checkEncharBtn.innerText = "CheckEnchar";
      })
      .catch(error => console.error(error));

  }
  checkEncharBtn.addEventListener("click", checkEnchar);

  replaceEncharBtn.addEventListener("click", function () {
    const replace_words = document.getElementById("replace-words").value;
    const replace_with_words = document.getElementById("replace-with-words").value;
    const filepaths = [];
    const checkboxes = document.getElementsByClassName("file-checkbox");
    Array.from(checkboxes).forEach(checkbox => {
      if (checkbox.checked) {
        const filepath = checkbox.id;
        console.log(filepath);
        filepaths.push(filepath);
      }
    })
    if (filepaths.length === 0) {
      alert("请选择文件");
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
        filepath: filepaths[0],
        replace_words,
        replace_with_words
      })
    })
      .then(response => response.json())
      .then(data => {
        replaceEncharBtn.disabled = false;
        replaceEncharBtn.innerText = "ReplaceEnchar";
        if (data.success) {
          checkEnchar();
        } else {
          alert("替换失败");
        }
      })
      .catch(error => console.error(error));

  });



}

