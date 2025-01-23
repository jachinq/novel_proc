
window.onload = function () {
  initEvents(); // 初始化事件
  loadEpubFiles();
  loadFileList();
}

function initEvents() {
  const coverBtn = document.getElementById("cover-btn");
  coverBtn.addEventListener("click", function () {
    const regex = document.getElementById("split-regex").value;
    const count = new Number(document.getElementById("count").value);

    const split = document.getElementById("split-book").checked;
    const title = document.getElementById("title").value || "";
    const author = document.getElementById("author").value || "";
    if (split && (!count || count <= 0 || isNaN(count))) {
      alert("请设置分割数量");
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

    coverBtn.disabled = true;
    fetch('/covert_book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        regex,
        filepath: filepaths[0],
        count,
        split,
        title,
        author
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) loadEpubFiles();
        else alert("转换失败");
        coverBtn.disabled = false;
      })
      .catch(error => console.error(error));
  });

  document.getElementById("split-book").addEventListener('change', function (evt) {
    const checked = evt.target.checked;
    const wrapper = document.getElementsByClassName("split-regex-wrapper")[0];
    if (checked) {
      wrapper.style.display = "block";
    } else {
      wrapper.style.display = "none";
    }
  });
}

function loadEpubFiles() {
  fetch('/list_epub_files')
    .then(response => response.json())
    .then(data => {
      const previewEl = document.getElementsByClassName('preview')[0];
      document.createElement('div');
      previewEl.innerHTML = '';
      const ulEl = document.createElement('ul');
      previewEl.appendChild(ulEl);

      data?.epub_files?.forEach(file => {
        const aEl = document.createElement('a');
        aEl.href = file.filepath;
        aEl.innerHTML = file.filename;
        // 点击a标签下载文件
        aEl.addEventListener('click', function (event) {
          event.preventDefault();
          const a = document.createElement('a');
          a.href = file.filepath;
          a.download = file.filename;
          a.click();
        });

        const liEl = document.createElement('li');
        liEl.appendChild(aEl);
        ulEl.appendChild(liEl);
      });
    })
    .catch(error => console.error(error));
}