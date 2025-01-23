window.onload = function () {
  // 上传文件
  document.getElementById("upload-file").addEventListener("change", function () {
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
}