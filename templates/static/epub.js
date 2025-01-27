
window.onload = function () {
  initEvents(); // 初始化事件
  loadEpubFiles();
  loadFileList();
  initCover();
}

const serverCoverUrl = "/resources?filepath=templates/uploads/cover.jpg";
const coverEl = document.getElementById('cover-img');
const coverBtn = document.getElementById("cover-btn");
const uploadCoverBtn = document.getElementById("upload-cover");
const useServerCover = document.getElementById("use-server-cover");
const titleEl = document.getElementById("title");
const authorEl = document.getElementById("author");
let base64Img = null;
function initEvents() {
  
  coverBtn.addEventListener("click", function () {
    const regex = document.getElementById("split-regex").value;
    let count = new Number(document.getElementById("count").value);

    if (!count || count <= 0 || isNaN(count)) {
      count = 0
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
    const title = titleEl.value || "";
    const author = authorEl.value || "";

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
        title,
        author,
        cover: base64Img
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          loadEpubFiles();
          alert("转换成功");
        }
        else alert("转换失败");
        coverBtn.disabled = false;
      })
      .catch(error => console.error(error));
  });

  uploadCoverBtn.addEventListener('change', function (evt) {
    const coverfile = evt.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(coverfile);
    reader.onload = function () {
      const img = new Image();
      img.src = reader.result;
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        coverEl.src = dataUrl;
        base64Img = coverEl.src;
        useServerCover.checked = true;
      }
    }
  });

  useServerCover.addEventListener('change', function (evt) {
    if (evt.target.checked) {
      coverEl.src = serverCoverUrl;
      base64Img = coverEl.src;
      // console.log('use server cover', serverCoverUrl);
    } else {
      const title = titleEl.value || "";
      const author = authorEl.value || "";
      
      createCover(title || "标题", author || "作者");
      // console.log('create cover');  
    }
  });

  titleEl.addEventListener('input', function (evt) {
    if (useServerCover.checked) return;
    const title = evt.target.value;
    const author = authorEl.value || "";
    createCover(title, author);
  });

  authorEl.addEventListener('input', function (evt) {
    if (useServerCover.checked) return;
    const author = evt.target.value;
    const title = titleEl.value || "";
    createCover(title, author);
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

function createCover(title, author) {
  author = '作者: ' + author;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 185*3;
  const height = 260*3;
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  // 背景颜色填充渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  // linear-gradient(135deg,#fce38a,#f38181)
  gradient.addColorStop(0, '#fce38a');
  gradient.addColorStop(1, '#f38181');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  
  let y = 280;
  ctx.font = `bold ${24*3}px Arial`;
  y = drawWrapText(ctx, title, width, y);
  ctx.font = `${16*3}px Arial`;
  drawWrapText(ctx, author, width, y);

  const dataUrl = canvas.toDataURL('image/jpeg');
  coverEl.src = dataUrl;
  base64Img = coverEl.src;
}

function drawWrapText(ctx, text, width, y=280) {
// 如果标题宽度超过canvas宽度，则取6个字换行
  let titleLines = []
  let i = 0;
  while (i < text.length) {
    let line = text.slice(i, i + 6);
    i += 6;
    titleLines.push(line);
  }
  let lineHeight = 24 * 3;
  
  titleLines.forEach(line => {
    ctx.fillText(line, (width - ctx.measureText(line).width) / 2, y);
    y += lineHeight;
  });
  return y; 
}

function initCover() {
  if (useServerCover.checked) {
    coverEl.src = serverCoverUrl;
    base64Img = coverEl.src;
  } else {
    coverEl.src = createCover(titleEl.value || "标题", authorEl.value || "作者");
    base64Img = coverEl.src;
  }
}