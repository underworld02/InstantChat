<template>
  <div>
    <button @click="handleDownload" :disabled="isDownloading">
      {{ isDownloading ? `下载中... ${downloadProgress}%` : '下载数据' }}
    </button>
    <progress v-if="isDownloading" :value="downloadProgress" max="100"></progress>
  </div>
</template>

<script>
import useCsvDownload from '@/utils/useCsvDownload.js';

export default {
  mixins: [useCsvDownload],
  data() {
    return {
      tableData: [
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        { name: 'John Doe', age: 28, email: 'john.doe@example.com' },
        // 添加更多数据行...
      ],
    };
  },
  methods: {
    handleDownload() {
      this.downloadCSV(this.tableData, 'data_export');
    },
  },
};
</script>
