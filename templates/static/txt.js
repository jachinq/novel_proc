function preview(data) {
  const filepathEl = document.getElementsByClassName("filepath")[0];
  const preview = document.getElementsByClassName("chapter-list")[0];
  const contentWrapperEl = document.getElementsByClassName("content-wrapper")[0];
  filepathEl.innerHTML = "";
  preview.innerHTML = "";
  contentWrapperEl.innerHTML = "";

  const filepath = document.createElement("div");
  filepath.innerHTML = `filepath:${data.filepath}`;
  filepathEl.appendChild(filepath);

  const chapters = data.chapters;
  const chapterList = document.createElement("ul");
  chapters.forEach(chapter => {
    const li = document.createElement("li");
    li.innerHTML = chapter;
    chapterList.appendChild(li);
    li.addEventListener("click", function () {
      fetch('/read_chapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filepath: data.filepath,
          chapter_index: chapters.indexOf(chapter)
        })
      })
        .then(response => response.json())
        .then(data => {
          // console.log(data);
          const content = document.createElement("textarea");
          content.value = data.contents?.join("\n");
          const chapterTitle = document.createElement("span");
          chapterTitle.innerHTML = chapter;
          chapterTitle.classList.add("chapter-title");
          contentWrapperEl.innerHTML = "";
          contentWrapperEl.appendChild(chapterTitle);
          contentWrapperEl.appendChild(content);
        })
        .catch(error => console.error(error));
    });
  });
  preview.appendChild(chapterList);

}

window.onload = function () {
  initEvents();
  loadFileList();
}

function initEvents() {
  const parseBtn = document.getElementById("parse-btn"); // 解析章节按钮

  parseBtn.addEventListener("click", function () {
    const regex = document.getElementById("split-regex").value;
    const chapterNameLimit = new Number(document.getElementById("chapter-name-limit").value);
    if (!chapterNameLimit || isNaN(chapterNameLimit)) {
      alert("请输入数字");
      return;
    }

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

    parseBtn.disabled = true;
    parseBtn.innerHTML = "Parsing...";


    fetch('/parse_chapters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        regex, chapterNameLimit,
        filepath: filepaths[0]
      })
    })
      .then(response => response.json())
      .then(data => {
        preview(data);
        parseBtn.disabled = false;
        parseBtn.innerHTML = "Parse";
      })
      .catch(error => console.error(error));

  });

}

