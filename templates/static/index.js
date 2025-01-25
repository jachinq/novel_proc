const uploadBtn = document.getElementById("upload-file");
const delBookBtn = document.getElementById("del-book");
const downloadBookBtn = document.getElementById("download-book");

window.onload = function () {
  // 上传文件
  uploadBtn.addEventListener("change", function () {
    var file = this.files[0];
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
      const data = reader.result; // contains the contents of the file as a string
      console.log(file);

      // 上传到服务器
      fetch('/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          data
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) loadFileList();
          else alert('上传失败');
        })
        .catch(error => console.error(error));
    };
    reader.onerror = function () {
      console.log("Error reading file");
    };
  });

  // 删除文件
  delBookBtn.addEventListener("click", async function () {
    const selected_file = getSelectedFile();
    const filepath = selected_file.filepath;
    if (!filepath) return;

    const check = await fetch('/check_delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filepath
      })
    });
    const result = await check.json();
    if (!result.success) {
      alert(result.message || '检查删除失败');
      return;
    }
    const splitsize = result.data.splits.length;
    const epubsize = result.data.epubs.length;

    // if (splitsize > 0 || epubsize > 0) {
      if (!confirm(`确定要删除 "${selected_file.filename}" 吗？\n\n该文件包含 ${splitsize} 个分卷和 ${epubsize} 个 epub 文件，删除后将无法恢复。`)) return;
    // } else {
    //   if (!confirm(`确定要删除 "${selected_file.filename}" 吗？`)) return;
    // }

    fetch('/delete_book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filepath
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message || '删除成功')
          loadFileList()
        }
        else alert('删除失败');
      })
      .catch(error => console.error(error));
  });

  // 下载文件
  downloadBookBtn.addEventListener("click", function () {
    const filepath = getSelectedFile().filepath;
    if (!filepath) return;

    fetch(`/resources?filepath=${filepath}`)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filepath;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(error => console.error(error));
  });

  loadFileList();
}
