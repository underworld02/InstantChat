<template>
  <div class="file-uploader">
    <input type="file" @change="onFileChange" />
    <div v-if="uploadProgress" >上传进度：{{ uploadProgress }}%</div>
    <button @click="startUpload" :disabled="!file || isUploading">开始上传</button>  
    <!-- 用于控制按钮的禁用状态 -->
  </div>
</template>

<script>
import axios from 'axios';
import Worker from './hash.worker.js'
export default {
  data() {
    return {
      file: null,              // 要上传的文件
      chunkSize: 5 * 1024 * 1024,  // 分片大小，5MB
      uploadProgress: 0,      // 上传进度
      isUploading: false,     // 是否正在上传
      retryLimit: 3,          // 重试次数限制
      worker: null,           // Web Worker实例  后台计算文件的哈希值
    };
  },
  methods: {
    onFileChange(event) {
      this.file = event.target.files[0];  // 获取选择的文件 
      if (this.file) {
        this.calculateHashWithWorker(this.file);  // 使用Web Worker计算文件hash
      }
    },
    calculateHashWithWorker(file) {
      if (this.worker) {
        this.worker.terminate();  // 终止之前的worker，防止重复创建
      }
      
      this.worker = new Worker();  // 创建Web Worker实例

      this.worker.postMessage(file);  // 发送文件到Web Worker进行处理   完成后通过 postMessage 将哈希值返回主线程

      this.worker.onmessage = (event) => {
        const { hash, error } = event.data;
        if (error) {
          console.error(error);
        } else {
          this.file.hash = hash;  // 接收计算完成的哈希值  主线程接收到哈希值后，保存到 file.hash
          console.log(`文件的MD5哈希值: ${hash}`);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Web Worker 错误: ', error.message);
      };
    },
    //检查已上传
    async startUpload() {
      if (!this.file) return; //检查文件是否存在
      this.isUploading = true;
      const uploadedChunks = await this.checkUploadedChunks(this.file.hash);  // 检查服务器端已上传分片  （支持断点续传）

      const chunks = this.createChunks(this.file, this.chunkSize);//分割成若干个分片
      await this.uploadChunks(chunks, uploadedChunks); //方法上传这些分片
      this.isUploading = false;
    },
    //创建分片
    createChunks(file, chunkSize) {  //file.slice() 方法获取每个分片，并将其存储在一个数组中
      const chunks = [];
      let currentSize = 0;
      while (currentSize < file.size) {
        const end = Math.min(currentSize + chunkSize, file.size);
        chunks.push({
          index: chunks.length,
          blob: file.slice(currentSize, end),
        });
        currentSize = end;
      }
      return chunks;
    },
    //请求已上传的分片列表
    async checkUploadedChunks(hash) {  //通过向服务器发送请求，获取已上传的分片信息。服务器根据文件的哈希值返回已上传的分片列表（用于断点续传）
      // 向服务器发送请求，获取已上传的分片
      const { data } = await axios.post('/api/upload/check', { hash });
      return data.uploadedChunks || [];
    },
    //上传 未上传的分片列表
    async uploadChunks(chunks, uploadedChunks) {  //遍历所有分片并检查是否已经上传过。未上传的分片通过调用 uploadChunkWithRetry 方法进行上传  
      const requests = chunks.map((chunk) => {
        if (uploadedChunks.includes(chunk.index)) return null;  // 如果分片已上传，则跳过

        return this.uploadChunkWithRetry(chunk);
      });

      await Promise.all(requests.filter(Boolean));  //使用 Promise.all() 
    },
    //上传 分片 带重试
    async uploadChunkWithRetry(chunk, retries = 0) {
      try {
        await this.uploadChunk(chunk);  // 尝试上传分片
      } catch (error) {
        if (retries < this.retryLimit) {
          console.warn(`Chunk ${chunk.index} 上传失败，重试中...`);
          await this.uploadChunkWithRetry(chunk, retries + 1);  // 递归重试上传
        } else {
          console.error(`Chunk ${chunk.index} 上传失败，超过重试限制`);
        }
      }
    },
    //上传 分片 实际操作
    async uploadChunk(chunk) { //实际上传分片的方法。使用 FormData 对象将文件分片、分片索引和文件哈希值发送到服务器 
      const formData = new FormData();
      formData.append('file', chunk.blob);
      formData.append('index', chunk.index);
      formData.append('hash', this.file.hash);
      
      const { data } = await axios.post('/api/upload/chunk', formData, { //通过 axios.post() 方法进行 HTTP POST 请求。
        onUploadProgress: (progressEvent) => {
          this.uploadProgress = Math.round((progressEvent.loaded / this.file.size) * 100);  // 监听上传进度事件  更新上传进度
        },
      });

      if (data.error) {
        throw new Error('分片上传失败');
      }
    },
  },
};
</script>

<style scoped>
.file-uploader {
  margin: 20px;
}
</style>
