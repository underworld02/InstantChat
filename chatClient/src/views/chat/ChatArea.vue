<template>
<!-- 界面右区域 -->
  <div class="chat-area__com">
    <!-- 上导航 "./components/Header"-->
    <chat-header
      :currentConversation="currentConversation"
      :set-current-conversation="setCurrentConversation"
    />
    <!-- 历史信息 './components/HistoryMsg'-->
    <transition name="slide-up">
      <div class="history-msg-container" v-if="showHistoryMsg">
        <history-msg :current-conversation="currentConversation" />
      </div>
    </transition>
    <!-- 会话区域 "./components/MessageList"-->
    <div :class="currentConversation.conversationType !== 'GROUP' ? 'main no-group' : 'main'">
      <div class="message-list-container">
        <message-list ref='messagelist'
          @load-message="loadmessage"
          :messagelist="messagesOutcome"
          :scrollbottom="scrollBottom"
          :hasmore="hasMore"
          :isloading="isLoading"
          :useanimation="useAnimation"
          :currentConversation="currentConversation"
          :last-enter-time="lastEnterTime"
          :set-last-enter-time="setLastEnterTime"
        />
      </div>

      <div class="group-desc" v-if="device !== 'Mobile' && currentConversation.conversationType === 'GROUP'">
        <group-desc :currentConversation="currentConversation" :key="datetamp" />
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="message-edit-container">

      <!-- 发送类型 -->
      <div class="send-type">
        <!-- 表情图标 -->
        <i class="item iconfont icon-emoji" @click.stop="showEmojiCom = !showEmojiCom"></i>
        <!-- 图片图标 -->
        <i class="item el-icon-picture" @click.stop="showUpImgCom = !showUpImgCom" />
        <!-- 文件上传 -->
        <label for="upfile">
          <el-tooltip class="item" effect="dark" content="只能上传小于 2M 的文件" placement="top">
            <i class="item el-icon-folder">
              <input
                id="upfile"
                class="file-inp upload"
                type="file"
                title="选择文件"
                @change="fileInpChange"
              >
            </i>
          </el-tooltip>
        </label>
        <!-- 绘画板、视频、电话 -->
        <i class="item iconfont icon-huaban" />
        <i class="item iconfont icon-shipin" />
        <i class="item el-icon-phone-outline" />
        <!-- 历史记录 -->
        <span
          :class="showHistoryMsg ? 'history-btn normal-font el-icon-caret-bottom' : 'history-btn normal-font el-icon-caret-top'"
          @click="setShowHistoryMsg">历史记录</span>
      </div>

      <!-- 发送清空 -->
      <div class="operation">
        <el-button @click="send" type="success" size="small" round>发送</el-button>
        <el-button @click="send" type="danger" size="small" round>清空</el-button>
      </div>

      <!-- 文本域 -->
      <div style="display: none" contenteditable="true" class="textarea" @input="test">
      </div>

      <textarea ref="chatInp" class="textarea" v-model="messageText" maxlength="200" @input="scrollBottom = true" @keydown.enter="send($event)"></textarea>

      <!-- emoji -->
      <transition name="fade">
        <!--图片上传组件  @getStatus 和 @getLocalUrl 事件处理上传状态和本地 URL 获取。  '@/components/customUploadImg' -->
        <up-img
          v-if="showUpImgCom"
          class="emoji-component"
          :token="token"
          @getStatus="getImgUploadResult"
          @getLocalUrl="getLocalUrl"
          :get-status="getImgUploadResult"
          :get-local-url="getLocalUrl"
        />
      </transition>
      <transition name="fade">
        <!--emoji上传组件  使用 @addemoji 事件将选择的表情添加到消息中   '@/components/customEmoji'-->
        <custom-emoji v-if="showEmojiCom" class="emoji-component" @addemoji="addEmoji" />        
      </transition>
    </div>
    
    <!-- 1000数据 -->
    <transition name="fade">
    <down-data
      class="emoji-component"
      :token="token"
    />
    </transition>
    <PieChart
      :data="pieData"
      title="示例扇形图"
      width="600px"
      height="400px"
    />
    <template>
    <div class="parent-component">
      <h1>文件上传示例</h1>
      <!-- 使用文件上传组件 -->
      <FileUploader />
    </div>
  </template>
  </div>
    
</template>

<script>
import { mapState } from "vuex"
import { cloneDeep } from 'lodash'
import { fromatTime } from "@/utils"
import chatHeader from "./components/Header"
import messageList from "./components/MessageList"
import { SET_UNREAD_NEWS_TYPE_MAP } from "@/store/constants"
import { conversationTypes, uploadImgStatusMap, qiniu_URL } from '@/const'
import customEmoji from '@/components/customEmoji'
import upImg from '@/components/customUploadImg'
import groupDesc from './components/GroupDesc'
import historyMsg from './components/HistoryMsg'
import xss from '@/utils/xss'
////////////////////////////////
import downData from "./components/DownData.vue"
import PieChart from './components/PieChart.vue';
import FileUploader from './components/file/FileUploader1.vue';
////////////////////////////////
export default {
  props: {
    currentConversation: Object,
    setLoading: Function,
    setCurrentConversation: Function
  },
  data() {
    return {
      messageText: "",
      messages: [],
      showEmojiCom: false,
      showUpImgCom: false,
      token: '', // 上传七牛云所需token
      page: 0,
      pageSize: 15,
      hasMore: true,
      showTopOperation: false,
      scrollBottom: true,
      isLoading: false,
      useAnimation: false,
      lastEnterTime: Date.now(), // 对方进入该会话的时间
      showHistoryMsg: false,
      datetamp: Date.now(), // 切换群聊重新强制加载群聊详情
      pieData: [
        { value: 1048, name: '搜索引擎' },
        { value: 735, name: '直接访问' },
        { value: 580, name: '邮件营销' },
        { value: 484, name: '联盟广告' },
        { value: 300, name: '视频广告' },
      ],
    }
  },
  computed: {
    ...mapState("user", {
      userInfo: "userInfo"
    }),
    messagesOutcome() {
      return this.messages.filter(item => {
        return item.roomid === this.currentConversation.roomid
      })
    },
    device() {
      return this.$store.state.device.deviceType
    }
  },
  sockets: {  //对象通常用于处理与 WebSocket 服务器的通信
    receiveMessage(news) {
      console.log("收到新的消息", news)
      this.messages = [...this.messages, news]
      if (news.roomid === this.currentConversation.roomid) {
        setTimeout(() => {
          this.$store.dispatch("news/SET_UNREAD_NEWS", {  //清除该会话的未读消息计数 《=============================
            roomid: news.roomid,
            count: 0,
            type: SET_UNREAD_NEWS_TYPE_MAP.clear
          })
        }, 0)
      }
    },
    conversationList(list) {
      // console.log("当前会话列表", list)
    }
  },
  methods: {
    test(e) {
      console.log(e, 123132)
    },
    setShowHistoryMsg() {        //显示历史记录
      this.showHistoryMsg = !this.showHistoryMsg
    },
    /**最后进入该会话的时间 */
    setLastEnterTime(time) {
      this.lastEnterTime = time
    },
    //生成一个消息对象的公共部分，该对象包含与当前用户和会话相关的信息。这个方法在发送消息时很有用，因为它集中创建了发送消息时需要的所有通用数据，从而避免重复代码。
    generatorMessageCommon() {
      return {
        roomid: this.currentConversation.roomid, // 当前会话的房间ID
        senderId: this.userInfo._id,  // 发送者的用户ID
        snderName: this.userInfo.name,  // 发送者的用户名
        senderNickname: this.userInfo.nickname,  //// 发送者的用户昵称
        senderAvatar: this.userInfo.photo,  //// 发送者的头像
        time: Date.now(),                // 消息发送的时间戳
        isReadUser: [this.userInfo._id],   // // 已读该消息的用户列表，初始为发送者自己
        conversationType: this.currentConversation.conversationType,  //// 当前会话的类型
        currentConversation: this.currentConversation  // // 当前会话的完整信息
      }
    },
    //处理图片上传的不同状态并更新聊天消息列表，最终在图片上传完成后发送新消息。它根据上传结果的状态 (res.status) 来执行不同的逻辑分支，例如显示错误消息、更新上传进度、发送新消息
    getImgUploadResult(res) {
      const { guid } = res // 图片的唯一标识
      const msgListClone = cloneDeep(this.messages)  // 深拷贝当前消息列表
        // 1. 处理上传错误
      if (res.status === uploadImgStatusMap.error) {   // 显示错误消息
        this.$message.error('图片上传失败！')
        return
      }
      // 2. 处理上传中状态
      if (res.status === uploadImgStatusMap.next) {  //百分比、已上传字节数和总字节数
        const percent = Number((res.data && res.data.total && res.data.total.percent) || 0).toFixed(2)
        const loaded = (res.data && res.data.total && res.data.total.loaded) || 0
        const size = (res.data && res.data.total && res.data.total.size) || 0
        console.log(`图片大小：${size}，已上传：${loaded}，百分比：${percent}`)

        // 更新消息列表中对应图片的上传进度
        msgListClone.forEach(item => {
          if (item.guid === guid) {
            item.uploadPercent = Number(percent) // 更新进度
          }
        })
        this.messages = msgListClone        // 更新消息列表
        return
      }

      // 3. 处理上传完成状态
      if (res.status === uploadImgStatusMap.complete) {
        const imgKey = res.data.key     // 获取图片的唯一标识符（用于构造URL）
        let img_URL = ''
        // 根据返回的key值决定图片URL的前缀
        if ((imgKey || '').includes('/uploads/')) {
          img_URL = process.env.IMG_URL + imgKey  // 使用环境变量中的图片URL前缀
        } else {
          img_URL = qiniu_URL + imgKey            // 使用七牛云的URL前缀
        }

        // 创建新消息对象
        // const img_URL = qiniu_URL + res.data.key
        const common = this.generatorMessageCommon() // 获取通用消息部分
        const newMessage = {
          ...common,
          message: img_URL,    // 设置消息为图片URL
          messageType: "img", // emoji/text/img/file/sys/artboard/audio/video // 设置消息类型为图片
        }
         // 更新消息列表，删除上传状态
        msgListClone.forEach(item => {
          if (item.guid === guid) {
            item.uploading = false    // 标记上传已完成
            delete item.uploadPercent // 删除进度信息
          }
        })
        this.messages = msgListClone   // 更新消息列表
        // 发送新消息
        this.$socket.emit("sendNewMessage", newMessage)     // 使用 WebSocket 发送新消息
         // 更新 Vuex 状态中的最后一条消息
        this.$store.dispatch('news/SET_LAST_NEWS', {
          type: 'edit',
          res: {
            roomid: this.currentConversation.roomid,
            news: newMessage
          }
        })
        this.messageText = "" // 清空输入框
      }
    },
    /**
     * 直接获取本地的地址
     */
    getLocalUrl(url, guid) {  
      // return
      const common = this.generatorMessageCommon()
      const newMessage = {
        ...common,
        uploading: true,
        guid,
        message: url,
        messageType: "img",
      }
      this.messages = [...this.messages, newMessage]
      this.$store.dispatch('news/SET_LAST_NEWS', {
        type: 'edit',
        res: {
          roomid: this.currentConversation.roomid,
          news: newMessage
        }
      })
    },
    fileInpChange(e) {        //文件

    },
    addEmoji(emoji = '') {   //添加emoji
      this.messageText += emoji
    },
    send(e) {                  //发送消息
      e.preventDefault()
      if (!this.messageText) {
        return
      }
      const common = this.generatorMessageCommon()
      const newMessage = {
        ...common,
        message: xss(this.messageText),
        messageType: "text",
      }
      this.messages = [...this.messages, newMessage]
      this.$socket.emit("sendNewMessage", newMessage)
      this.$store.dispatch('news/SET_LAST_NEWS', {
        type: 'edit',
        res: {
          roomid: this.currentConversation.roomid,
          news: newMessage
        }
      })
      this.messageText = ""
    },
    joinChatRoom() {
      this.$socket.emit("join", this.currentConversation)
    },
    async getRecentNews(init = true) {
      /**
       * getRecentNews分为两种目前分为两种情况：1.获取两两好友之间的；2.获取群聊的
       */
      if (this.isLoading) return // 防止重复发起请求
      this.isLoading = true
      init && this.setLoading(true) // 只有在第一次加载的时候才让ChatArea有loading动画，后面加载时不显示
      const { roomid, conversationType } = this.currentConversation
      const params = {
        roomid,
        page: this.page,
        pageSize: this.pageSize
      }
      if (conversationType === conversationTypes.friend) {
        const { data, status } = await this.$http.getRecentNews(params)
        this.setLoading(false)
        if (data.status === 2000 && status === 200) {
          this.isLoading = false
          data.data.reverse()
          this.messages = [...data.data, ...this.messages]
          if (data.data.length < this.pageSize) {
            this.hasMore = false
            return
          }
          this.page++
        }
      } else if (conversationType === conversationTypes.group) {
        const { data, status } = await this.$http.getRecentGroupNews(params)
        this.setLoading(false)
        this.isLoading = false
        if (data.status === 2000 && status === 200) {
          data.data.reverse()
          this.messages = [...data.data, ...this.messages]
          if (data.data.length < this.pageSize) {
            this.hasMore = false
            return
          }
          this.page++
        }
      }
    },
    handlerShowEmoji() {
      this.showEmojiCom = false
      this.showUpImgCom = false
    },
    loadmessage() {
      this.scrollBottom = false
      this.useAnimation = true
      if (this.hasMore) {
        this.getRecentNews(false)
      }
    },
    watchWebRtcMsg() {
      this.$eventBus.$on('web_rtc_msg', (e) => {
        const { type } = e
        // const 
        const common = this.generatorMessageCommon()
        const newMessage = {
          ...common,
          message: '',
          messageType: type
        }
        this.messages = [...this.messages, newMessage]
        this.$socket.emit("sendNewMessage", newMessage)
        this.$store.dispatch('news/SET_LAST_NEWS', {
          type: 'edit',
          res: {
            roomid: this.currentConversation.roomid,
            news: newMessage
          }
        })
      })
    },
    /**聊天内容输入框自动聚焦 */
    chatInpAutoFocus() {
      this.$nextTick(() => {
        this.$refs.chatInp.focus();
      })
    }
  },
  components: {
    chatHeader,
    messageList,
    customEmoji,
    groupDesc,
    upImg,
    historyMsg,
    downData,///////////////////
    PieChart,
    FileUploader,
  },
  watch: {
    currentConversation(newVal, oldVal) {
      if (newVal && newVal._id) {
        this.chatInpAutoFocus()
        this.page = 0
        this.scrollBottom = true
        this.showHistoryMsg = false
        this.setLoading(true)
        this.messageText = ""
        this.messages = []
        this.hasMore = true
        this.joinChatRoom()
        this.getRecentNews()
        this.datetamp = Date.now()
      }
    }, deep: true, immediate: true
  },
  created() {
    console.log('chatArea created')
    //为 document 对象添加一个事件监听器。这个监听器会在文档中发生 click 事件时调用
    document.addEventListener('click', this.handlerShowEmoji)
    this.getRecentNews()
    this.$http.getQiniuToken().then(res => {
      const { data } = res
      this.token = data.data
    })
  },
  mounted() {
    this.watchWebRtcMsg()
  },
  beforeDestroy() {
    console.log('chatArea BeforeDestroy')
    document.removeEventListener('click', this.handlerShowEmoji)
  },
};
</script>

<style lang="scss">
@import './../../../static/css/animation.scss';
.chat-area__com {
  position: relative;
  height: 100%;
  .history-msg-container {
    position: absolute;
    z-index: 1004;
    height: calc(100% - 210px);
    width: 100%;
  }
  .main {
    display: flex;
    position: relative;
    height: calc(100% - 210px);
    width: 100%;
    .message-list-container {
      position: relative;
      height: 100%;
      width: 75%;
      flex: 1;
      .top-operation {
        position: absolute;
      }
    }
    .group-desc {
      height: 100%;
      width: 25%;
    }
  }
  .main.no-group {
    .message-list-container {
      height: 100%;
      width: 100%;
    }
    .group-desc {
      width: 0%;
    } 
  }
  .message-edit-container {
    box-sizing: border-box;
    position: relative;
    height: 150px;
    border-top: 1px solid #cccccc;
    .send-type {
      position: relative;
      padding: 5px 10px 0;
      height: 25px;
      .item {
        cursor: pointer;
        font-size: 20px;
        margin-right: 10px;
        .upload {
          display: none;
          border: none;
        }
      }
      .history-btn {
        position: absolute;
        right: 5px;
        cursor: pointer;
      }
    }
    .operation {
      position: absolute;
      bottom: 5px;
      right: 2px;
    }
    .textarea {
      overflow-x: hidden;
      box-sizing: border-box;
      height: calc(100% - 30px);
      width: 100%;
      outline: none;
      border: none;
      padding: 0 10px;
      border: 0;
      border-radius: 5px;
      background-color: #e9ebee;
      padding: 10px;
      resize: none;
      img {
        width: 50px;
      }
    }
    .emoji-component {
      position: absolute;
      bottom: 101%;
    }
  }
}
</style>
