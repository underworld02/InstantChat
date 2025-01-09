import axios from 'axios';

const state = {
  file: null,              // 要上传的文件
  uploadProgress: 0,       // 上传进度
  isUploading: false,      // 是否正在上传
  uploadedChunks: [],      // 已上传的分片
  retryLimit: 3,           // 重试次数限制
  worker: null,            // Web Worker实例
};

const getters = {
  getFile: (state) => state.file,
  getUploadProgress: (state) => state.uploadProgress,
  isUploading: (state) => state.isUploading,
  getUploadedChunks: (state) => state.uploadedChunks,
  getWorker: (state) => state.worker,
};

const mutations = {
  SET_FILE(state, file) {
    state.file = file;
  },
  SET_UPLOAD_PROGRESS(state, progress) {
    state.uploadProgress = progress;
  },
  SET_IS_UPLOADING(state, status) {
    state.isUploading = status;
  },
  SET_UPLOADED_CHUNKS(state, chunks) {
    state.uploadedChunks = chunks;
  },
  ADD_UPLOADED_CHUNK(state, chunkIndex) {
    state.uploadedChunks.push(chunkIndex);
  },
  SET_WORKER(state, worker) {
    state.worker = worker;
  },
  TERMINATE_WORKER(state) {
    if (state.worker) {
      state.worker.terminate();
      state.worker = null;
    }
  },
};

const actions = {
  async calculateHashWithWorker({ commit }, file) {
    return new Promise((resolve, reject) => {
      commit('TERMINATE_WORKER');
      const worker = new Worker('./hashWorker.js');
      commit('SET_WORKER', worker);

      worker.postMessage(file);  // 发送文件到Web Worker进行处理

      worker.onmessage = (event) => {
        const { hash, error } = event.data;
        if (error) {
          console.error(error);
          reject(error);
        } else {
          file.hash = hash;  // 接收计算完成的哈希值
          commit('SET_FILE', file);
          console.log(`文件的MD5哈希值: ${hash}`);
          resolve(hash);
        }
      };

      worker.onerror = (error) => {
        console.error('Web Worker 错误: ', error.message);
        reject(error.message);
      };
    });
  },
  async checkUploadedChunks({ commit }, hash) {
    const { data } = await axios.post('/api/upload/check', { hash });
    commit('SET_UPLOADED_CHUNKS', data.uploadedChunks || []);
    return data.uploadedChunks || [];
  },
  async uploadChunks({ state, dispatch, commit }, chunks) {
    const requests = chunks.map((chunk) => {
      if (state.uploadedChunks.includes(chunk.index)) return null;  // 如果分片已上传，则跳过
      return dispatch('uploadChunkWithRetry', chunk);
    });

    await Promise.all(requests.filter(Boolean));
  },
  async uploadChunkWithRetry({ state, dispatch }, chunk, retries = 0) {
    try {
      await dispatch('uploadChunk', chunk);  // 尝试上传分片
    } catch (error) {
      if (retries < state.retryLimit) {
        console.warn(`Chunk ${chunk.index} 上传失败，重试中...`);
        await dispatch('uploadChunkWithRetry', chunk, retries + 1);  // 递归重试上传
      } else {
        console.error(`Chunk ${chunk.index} 上传失败，超过重试限制`);
      }
    }
  },
  async uploadChunk({ commit }, chunk) {
    const formData = new FormData();
    formData.append('file', chunk.blob);
    formData.append('index', chunk.index);
    formData.append('hash', chunk.hash);
    
    const { data } = await axios.post('/api/upload/chunk', formData, {
      onUploadProgress: (progressEvent) => {
        commit('SET_UPLOAD_PROGRESS', Math.round((progressEvent.loaded / chunk.file.size) * 100));  // 更新上传进度
      },
    });

    if (data.error) {
      throw new Error('分片上传失败');
    }
    commit('ADD_UPLOADED_CHUNK', chunk.index);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
