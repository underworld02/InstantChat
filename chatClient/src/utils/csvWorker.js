// // public/csvWorker.js
// self.onmessage = function (e) {
//     const data = e.data; // 从主线程接收到的数据
//     const csvData = convertToCSV(data); // 转换为 CSV 格式
//     self.postMessage(csvData); // 将结果发送回主线程
//   };
  
//   // 将 JSON 数据转换为 CSV 格式
//   function convertToCSV(data) {
//     if (!Array.isArray(data) || data.length === 0) return '';
  
//     // 提取表头
//     const headers = Object.keys(data[0]);
//     const csvRows = [headers.join(',')];
  
//     // 转换每一行数据为 CSV 格式
//     data.forEach(row => {
//       const values = headers.map(header => JSON.stringify(row[header] ?? ''));
//       csvRows.push(values.join(','));
//     });
  
//     return csvRows.join('\n');
//   }
// csvWorker.js
// csvworker.js
// self.onmessage =
export default function(event) {
  const { data } = event.data;
  const batchSize = 100; // 每批次处理的数据条数
  const totalBatches = Math.ceil(data.length / batchSize); // 计算总批次数
  let currentBatch = 0; // 当前批次
  let csvContent = '';

  // 处理表头
  const headers = Object.keys(data[0]).join(','); // 获取数据的键作为表头
  csvContent += headers + '\n'; // 添加表头行

  // 处理 CSV 生成和分批下载逻辑
  const processBatch = () => {
    const start = currentBatch * batchSize;
    const end = start + batchSize;
    const batchData = data.slice(start, end);

    // 将数据转换为 CSV 格式
    const csvRows = batchData.map(row => Object.values(row).join(','));
    csvContent += csvRows.join('\n') + '\n';

    currentBatch++;
    postMessage({ progress: (currentBatch / totalBatches) * 100 });

    if (currentBatch < totalBatches) {
      setTimeout(processBatch, 0); // 下一批次处理
    } else {
      // 所有数据处理完成，创建 Blob 对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log('Blob created:', blob); // 调试信息
      postMessage({ progress: 100, blob });
    }
  };

  // 开始处理第一批次
  processBatch();
};
