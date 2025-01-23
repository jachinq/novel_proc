async function loadFileList() {

  // 加载文件列表
  const response = await fetch('/filelist');
  const data = await response.json();

  function createCheckbox(parent, file) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = file.filename;
    checkbox.id = file.filepath;
    checkbox.classList.add("file-checkbox");
    checkbox.addEventListener("click", function () {
      console.log(file);
    });

    const span = document.createElement("span");
    span.innerHTML = file.filename;
    span.addEventListener("click", function () {
      // 选中
      checkbox.checked = !checkbox.checked;
    });

    parent.appendChild(checkbox);
    parent.appendChild(span);
  }

  const fileList = document.getElementById("file-list");
  fileList.innerHTML = "";
  data?.file_list?.forEach(file => {
    const li = document.createElement("div");
    createCheckbox(li, file);
    li.addEventListener("click", function () {
      // console.log(file.filename);
    });
    fileList.appendChild(li);
  });
}

// 从 cookie 中获取信息
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// 保存 cookie
function setCookie(name, value, days=-1) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  let expires = `expires=${date.toUTCString()}`;
  if (days === -1) {
    expires = "";
  }
  document.cookie = `${name}=${value}; ${expires}; path=/`;
}