const state = {
  sysUsers: '' || JSON.parse(window.localStorage.getItem('sysusers')),
  isToCoArtBoard: false, // 是否在白板协作
  // isAudioOrVideo: false, // 是否正在语音通话或者视频通话
  isVideoing: false, // 是否正在视频通话
  isAudioing: false, // 是否正在音频通话
  currentConversation: {}, // 当前的会话，在白板协作、音视频通话会使用
  agreeFriendValidate: false, // 同意好友申请
  recentConversation: [], // 最近的会话列表
  onlineUser: [], // 在线用户列表
  allConversation: [], // 所有会话列表
  allFriends: [], // 所有的好友列表
}

const mutations = {
  setSysUsers(state, data) {
    state.sysUsers = data
    const dataStr = JSON.stringify(data)
    window.localStorage.setItem('sysusers', dataStr)
  },
  setIsToCoArtBoard(state, data) {
    state.isToCoArtBoard = data
  },
  setIsAudioing(state, data) {
    state.isAudioing = data
  },
  setIsVideoing(state, data) {
    state.isVideoing = data
  },
  setCurrentConversation(state, data) {
    state.currentConversation = data
  },
  setAgreeFriendValidate(state, data) {
    state.agreeFriendValidate = data
  },
  setRecentConversation(state, data) {  //管理最近会话的增删改操作。根据传入的 type（init、add 或 delete）
    const res = data.data
    if (data.type === 'init') {
      state.recentConversation = res  // 初始化最近会话列表
    } else if (data.type === 'add') {
      const ids = state.recentConversation.map(item => item._id)
      const newData = !ids.includes(res._id) ? [...state.recentConversation, res] : [...state.recentConversation]    // 添加会话
      state.recentConversation = newData
    } else if (data.type === 'delete') {
      const index = state.recentConversation.findIndex(item => item._id === res._id)
      const newData = JSON.parse(JSON.stringify(state.recentConversation))
      index !== -1 && newData.splice(index, 1)  // 删除会话
      state.recentConversation = newData
    }
  },
  setOnlineUser(state, data) {
    state.onlineUser = data
  },
  setAllConversation(state, data) {
    state.allConversation = [...state.allConversation, ...data]   // 添加所有会话
  },
  setAllFriends(state, data) {//管理所有好友的增删改操作。type 为 init 时初始化好友列表，为 delete 时从列表中移除指定好友。
    const { resource, type } = data
    console.log('setFriend', data)
    if (type === 'init') {
      // resourece === [{...}, {...}, ...]
      state.allFriends = resource       // 初始化好友列表
    } else if (type === 'delete') {
      // resource === 删除被好友ID
      state.allFriends = (state.allFriends || []).filter(item => item._id !== resource)  // 删除好友
    }
  }
}

const actions = {
  SET_SYS_USERS({commit}, data) {  // 从 context 对象中解构出 commit 方法
    commit('setSysUsers', data)
  },
  SET_ISTOCOARTBOARD({commit}, data) {
    commit('setIsToCoArtBoard', data)
  },
  SET_IS_AUDIOING({commit}, data) {
    commit('setIsAudioing', data)
  },
  SET_IS_VIDEOING({commit}, data) {
    commit('setIsVideoing', data)
  },
  SET_CURRENT_CONVERSATION({commit}, data) {
    commit('setCurrentConversation', data)
  },
  SET_AGREE_FRIEND_VALIDATE({commit}, data) {
    commit('setAgreeFriendValidate', data)
  },
  SET_RECENT_CONVERSATION({commit}, data) {
    commit('setRecentConversation', data)
  },
  SET_ONLINE_USER({commit}, data) {
    commit('setOnlineUser', data)
  },
  SET_ALL_CONVERSATION({commit}, data) {
    commit('setAllConversation', data)
  },
  SET_ALL_FRIENDS({commit}, data) {
    commit('setAllFriends', data)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
