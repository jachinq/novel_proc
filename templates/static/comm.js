async function loadFileList() {

  // 加载文件列表
  const response = await fetch('/filelist');
  const data = await response.json();

  const setected_file = JSON.parse(getCookie("setected_file") || "{}");

  function onCheckedChange(checkbox, file) {
    setCookie("setected_file", JSON.stringify(file));
    // 将所有的 checkbox 全部取消选中
    const checkboxes = document.querySelectorAll(".file-checkbox");
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    // 将当前 checkbox 选中
    checkbox.checked = true;
  }

  function createCheckbox(parent, file) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = file.filename;
    checkbox.id = file.filepath;
    checkbox.classList.add("file-checkbox");
    checkbox.addEventListener("click", onCheckedChange.bind(null, checkbox, file));
    if (setected_file.filepath === file.filepath) {
      checkbox.checked = true;
    }

    const span = document.createElement("span");
    span.innerHTML = file.filename;
    span.addEventListener("click", function () {
      // 选中
      checkbox.checked = !checkbox.checked;
      onCheckedChange(checkbox, file);
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

function getSelectedFile() {
  let selected_file = {};
    const checkboxes = document.getElementsByClassName("file-checkbox");
    Array.from(checkboxes).forEach(checkbox => {
      if (checkbox.checked) {
        const filepath = checkbox.id;
        console.log(filepath);
        selected_file.filepath = filepath;
        selected_file.filename = checkbox.value;
      }
    })
    if (!selected_file.filepath) {
      alert("请选择文件");
      return;
    }
  return selected_file;
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