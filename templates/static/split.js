
window.onload = function () {
  initEvents();
  loadFileList();
  loadSplitpubFiles();
}

function initEvents() {
  const splitBtn = document.getElementById("split-regex-submit");
  splitBtn.addEventListener("click", function () {
    const regex = document.getElementById("split-regex").value;
    const count = new Number(document.getElementById("count").value);
    if (!count || count <= 0 || isNaN(count)) {
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

    splitBtn.disabled = true;
    splitBtn.innerHTML = "正在分割...";
    fetch('/split_book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        regex,
        filepath: filepaths[0],
        type: 0,
        count
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) loadSplitpubFiles();
        else alert('分割失败');
        splitBtn.disabled = false;
        splitBtn.innerHTML = "Split";
      })
      .catch(error => console.error(error));

  });
}



function loadSplitpubFiles() {
  fetch('/list_split_files')
    .then(response => response.json())
    .then(data => {
      const previewEl = document.getElementsByClassName('preview')[0];
      document.createElement('div');
      previewEl.innerHTML = '';
      const ulEl = document.createElement('ul');
      previewEl.appendChild(ulEl);

      data?.split_files?.forEach(file => {
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