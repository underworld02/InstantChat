<template>
  <div class="file-uploader">
    <input type="file" @change="onFileChange" />
    <div v-if="uploadProgress > 0">上传进度：{{ uploadProgress }}%</div>
    <button @click="startUpload" :disabled="!file || isUploading">开始上传</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  computed: {
    ...mapGetters(['getFile', 'getUploadProgress', 'isUploading']),
    file() {
      return this.getFile;
    },
    uploadProgress() {
      return this.getUploadProgress;
    },
  },
  methods: {
    ...mapActions(['calculateHashWithWorker', 'checkUploadedChunks', 'uploadChunks']),
    async onFileChange(event) {
      const file = event.target.files[0];  // 获取选择的文件
      if (file) {
        await this.calculateHashWithWorker(file);  // 使用Web Worker计算文件hash
      }
    },
    async startUpload() {
      if (!this.file) return;
      this.$store.commit('SET_IS_UPLOADING', true);
      const uploadedChunks = await this.checkUploadedChunks(this.file.hash);  // 检查已上传分片

      const chunks = this.createChunks(this.file, this.$store.state.upload.chunkSize);
      await this.uploadChunks(chunks);
      this.$store.commit('SET_IS_UPLOADING', false);
    },
    createChunks(file, chunkSize) {
      const chunks = [];
      let currentSize = 0;
      while (currentSize < file.size) {
        const end = Math.min(currentSize + chunkSize, file.size);
        chunks.push({
          index: chunks.length,
          blob: file.slice(currentSize, end),
          hash: file.hash,
          file: file
        });
        currentSize = end;
      }
      return chunks;
    },
  },
};
</script>

<style scoped>
.file-uploader {
  margin: 20px;
}
</style>
