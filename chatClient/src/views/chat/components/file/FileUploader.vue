<template>
  <div class="file-uploader">
    <input type="file" @change="onFileChange" />
    <div v-if="uploadProgress > 0">上传进度：{{ uploadProgress }}%</div>
    <button @click="startUpload" :disabled="!file || isUploading">开始上传</button>
  </div>
</template>

<script>
import axios from 'axios';
import SparkMD5 from 'spark-md5';

export default {
  data() {
    return {
      file: null,              // 要上传的文件
      chunkSize: 5 * 1024 * 1024,  // 分片大小，5MB
      uploadProgress: 0,      // 上传进度
      isUploading: false,     // 是否正在上传
      retryLimit: 3,          // 重试次数限制
    };
  },
  methods: {
    async onFileChange(event) {
      this.file = event.target.files[0];  // 获取选择的文件
      if (this.file) {
        this.file.hash = await this.calculateHash(this.file);  // 计算文件的hash值
      }
    },
    async calculateHash(file) {
      return new Promise((resolve, reject) => {
        const chunkSize = this.chunkSize;
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
            resolve(spark.end());
          }
        };

        fileReader.onerror = () => {
          reject('文件读取失败');
        };

        function loadNext() {
          const start = currentChunk * chunkSize;
          const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
          fileReader.readAsArrayBuffer(file.slice(start, end));
        }

        loadNext();
      });
    },
    async startUpload() {
      if (!this.file) return;
      this.isUploading = true;
      const uploadedChunks = await this.checkUploadedChunks(this.file.hash);  // 检查已上传分片

      const chunks = this.createChunks(this.file, this.chunkSize);
      await this.uploadChunks(chunks, uploadedChunks);
      this.isUploading = false;
    },
    createChunks(file, chunkSize) {
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
    async checkUploadedChunks(hash) {
      // 向服务器发送请求，获取已上传的分片
      const { data } = await axios.post('/api/upload/check', { hash });
      return data.uploadedChunks || [];
    },
    async uploadChunks(chunks, uploadedChunks) {
      const requests = chunks.map((chunk) => {
        if (uploadedChunks.includes(chunk.index)) return null;  // 如果分片已上传，则跳过

        return this.uploadChunkWithRetry(chunk);
      });

      await Promise.all(requests.filter(Boolean));
    },
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
    async uploadChunk(chunk) {
      const formData = new FormData();
      formData.append('file', chunk.blob);
      formData.append('index', chunk.index);
      formData.append('hash', this.file.hash);
      
      const { data } = await axios.post('/api/upload/chunk', formData, {
        onUploadProgress: (progressEvent) => {
          this.uploadProgress = Math.round((progressEvent.loaded / this.file.size) * 100);  // 更新上传进度
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
