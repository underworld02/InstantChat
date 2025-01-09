// useCsvDownload.js

import Vue from 'vue';

export default {
  data() {
    return {
      downloadProgress: 0, // 下载进度
      isDownloading: false, // 是否正在下载
    };
  },
  methods: {
    downloadCSV(data, fileName) {
      if (!data || !data.length) return;

      const workerScript = `
        self.onmessage = function(event) {
          const { data } = event.data;
          const batchSize = 100; // 每批次处理的数据条数
          const totalBatches = Math.ceil(data.length / batchSize); // 计算总批次数
          let currentBatch = 0; // 当前批次
          let csvContent = '';

          // 处理表头
          const headers = Object.keys(data[0]).join(',');
          csvContent += headers + '\\n'; // 添加表头行

          // 处理 CSV 生成和分批下载逻辑
          const processBatch = () => {
            const start = currentBatch * batchSize;
            const end = start + batchSize;
            const batchData = data.slice(start, end);

            // 将数据转换为 CSV 格式
            const csvRows = batchData.map(row => Object.values(row).join(','));
            csvContent += csvRows.join('\\n') + '\\n';

            currentBatch++;
            postMessage({ progress: (currentBatch / totalBatches) * 100 });

            if (currentBatch < totalBatches) {
              setTimeout(processBatch, 0); // 下一批次处理
            } else {
              // 所有数据处理完成，创建 Blob 对象
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              postMessage({ progress: 100, blob });
            }
          };

          // 开始处理第一批次
          processBatch();
        };
      `;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      // 初始化 Web Worker
      //const worker = new Worker('/src/utils/csvWorker.js');
      worker.postMessage({ data }); // 发送数据到 Web Worker
      this.isDownloading = true;

      // 监听 Web Worker 的消息
      worker.onmessage = (event) => {
        const { progress, blob } = event.data;

        if (blob) {
          // 创建 Blob 对象并下载文件
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          console.log('Download link created:', link.href); // 调试信息
          link.download = `${fileName}.csv`;
          link.click();
          URL.revokeObjectURL(link.href);
          this.isDownloading = false;
        } else {
          // 更新下载进度
          this.downloadProgress = progress;
        }
      };

      // 错误处理
      worker.onerror = (error) => {
        console.error('Worker error: ', error);
        this.isDownloading = false;
      };
    },
  },
};

  

// // hooks/useDownload.js
// import { ref } from 'vue';

// export function useDownload() {
//   const downloadUrl = ref(null); // 用于存储 Blob URL
//   let worker; // Web Worker 实例

//   // 初始化 Web Worker
//   const initWorker = () => {
//     if (typeof Worker !== 'undefined') {
//       worker = new Worker('/static/csvWorker.js');
//     } else {
//       console.error('Web Workers are not supported in your browser.');
//     }
//   };

//   // 创建 Blob URL 并触发下载
//   const createDownloadLink = (data, filename = 'download.csv') => {
//     if (!data || data.length === 0) return;

//     if (!worker) {
//       initWorker();
//     }

//     // 清除旧的 Blob URL（如果存在），以防内存泄漏
//     if (downloadUrl.value) {
//       URL.revokeObjectURL(downloadUrl.value);
//     }

//     worker.onmessage = function (e) {
//       const csvData = e.data; // 接收来自 Web Worker 的 CSV 数据
//       const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
//       downloadUrl.value = URL.createObjectURL(blob);

//       // 创建一个临时 <a> 元素并触发下载
//       const link = document.createElement('a');
//       link.href = downloadUrl.value;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     };

//     worker.onerror = function (error) {
//       console.error('Error in Web Worker:', error);
//     };

//     // 发送数据到 Web Worker 进行处理
//     worker.postMessage(data);
//   };

//   return {
//     createDownloadLink,
//   };
// }
