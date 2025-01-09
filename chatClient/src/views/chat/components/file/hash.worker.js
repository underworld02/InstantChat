// hashWorker.js

self.importScripts('https://cdn.jsdelivr.net/npm/spark-md5@3.0.0/spark-md5.min.js');

self.onmessage = function (event) {
  const file = event.data;
  const chunkSize = 5 * 1024 * 1024; // 分片大小
  const chunks = Math.ceil(file.size / chunkSize);
  const spark = new SparkMD5.ArrayBuffer();
  let currentChunk = 0;

  const fileReader = new FileReader();

  fileReader.onload = (e) => {
    spark.append(e.target.result);
    currentChunk++;
    if (currentChunk < chunks) {
      loadNext();
    } else {
      self.postMessage({ hash: spark.end() }); // 发送计算完成的哈希值
    }
  };

  fileReader.onerror = () => {
    self.postMessage({ error: '文件读取失败' });
  };

  function loadNext() {
    const start = currentChunk * chunkSize;
    const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
    fileReader.readAsArrayBuffer(file.slice(start, end));
  }

  loadNext();
};
