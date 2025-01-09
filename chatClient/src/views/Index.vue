<template>
  <div class="index-page">
<!-- 界面中区域 好友信息  @/views/conversation/ConversationList-->
    <transition name="fade-left">
      <div
        v-show="device === 'Desktop' || (device === 'Mobile' && currentUI === 'conversation')"
        :class="device === 'Mobile' ? 'conversation-list mobile' : 'conversation-list'"
      >
        <conversation-list
          :currentConversation="currentConversation"
          :set-current-conversation="setCurrentConversation"
          @setCurrentConversation="setCurrentConversation"
        />
      </div>
    </transition>
    <!-- 界面右区域   prop 的绑定 setCurrentConversation  上下文为父组件  @/views/chat/ChatArea-->
    <transition name="fade-right">
      <!--Mobile中 currentUI === 'conversation'，则显示左侧的会话列表 currentUI === 'chatArea'，则显示右侧的聊天区域-->
      <div
        v-show="device === 'Desktop' || (device === 'Mobile' && currentUI === 'chatArea')"
        v-loading="loading"
        :class="device === 'Mobile' ? 'conversation-chat-area mobile' : 'conversation-chat-area'"
      >
        <chat-area
          v-if="currentConversation && currentConversation._id"
          :currentConversation="currentConversation"
          :setLoading="setLoading"
          :set-current-conversation="setCurrentConversation"  
        />
        <div class="no-conversation hor-ver-center" v-else>
          <chat-svg width="400" height="300" />  <!--D3.js Adobe Illustrator 矢量图形 可编辑 可编程 兼容性--->
          <p>聊天~打开心灵的窗户</p>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import ConversationList from '@/views/conversation/ConversationList'
import ChatArea from '@/views/chat/ChatArea'
import { SET_UNREAD_NEWS_TYPE_MAP } from '@/store/constants'
import { fromatTime, saveRecentConversationToLocal } from '@/utils'
import weather from '@/components/customWeather'
import partTitle from '@/components/partTitle'
import chatSvg from '@/SVGComponents/chat'
// import AMap from '@/components/customMap'
export default {
  name: 'Home',
  data() {
    return {
      currentConversation: {},
      loading: false,
      matterLevelMap: { 
        'danger': '紧急事项' ,
        'warning': '重要事项' ,
        'normal': '一般事项' ,
        'info': '不重要事项'
      }
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    device() {
      return this.$store.state.device.deviceType
    },
    currentUI() {
      return this.$store.state.device.currentUI
    }
  },
  watch: {
    currentConversation: {
      handler(newVal, oldVal) {
        if (!newVal || !newVal.roomid) return
        try {
          if(newVal.roomid !== oldVal.roomid) {  //标识特定聊天房间或会话的唯一标识符
            // 如果新会话和旧会话的 roomid 不同
            // 1. 清除该会话的未读消息计数
            this.$store.dispatch('news/SET_UNREAD_NEWS', {
              roomid: this.currentConversation && this.currentConversation.roomid,
              count: 0,
              type: SET_UNREAD_NEWS_TYPE_MAP.clear
            })
            // 2. 设置该会话的最后一条消息
            this.$store.dispatch('news/SET_LAST_NEWS', {type: 'default', roomid: newVal.roomid})
            // 3. 更新 Vuex 中的当前会话状态
            this.$store.dispatch('app/SET_CURRENT_CONVERSATION', newVal)
            // 4. 将新会话添加到最近会话列表
            this.$store.dispatch('app/SET_RECENT_CONVERSATION', {type: 'add', data: newVal})

            // 将该会话下的消息设置为已读begin
            // 5. 如果会话类型为 "FRIEND"，将该会话下的消息标记为已读
            newVal.conversationType === "FRIEND" && this.$http.userIsReadMsg({
              roomid: newVal.roomid, userId: this.userInfo._id
            }).then(res => {
              // 用户切换会话来阅读消息
              // 确保请求成功
              if (res.status >= 400 || res.data.status !== 2000) return
              // 使用 socket 向服务器发送 'isReadMsg' 事件，标记消息为已读
              this.$socket.emit('isReadMsg', {  //1子组件发送事件 2客户端发送事件
                roomid: newVal.roomid,
                status: true
              }) // 1. 提示对方用户进入该会话
              if (oldVal.conversationType === "FRIEND") {
                this.$socket.emit('isReadMsg', {
                  roomid: oldVal.roomid || '',
                  status: false
                })
              } // 2. 提示对方用户退出该会话
              // end
            })
            // 将该会话下的消息设置为已读end
            // 6. 将最近会话保存到本地存储
            saveRecentConversationToLocal(newVal)
          }
        } catch (error) {
          console.log('errrrr', error)
        }
      }, deep: true, immediate: true
    }
  },
  methods: {
    setCurrentConversation(data) {  //// 带有备注，最后消息信息的会话列表
      this.currentConversation = data
    },
    setLoading(flag) {
      this.loading = flag
    }
  },
  components: {
    ConversationList,
    ChatArea,
    weather,
    partTitle,
    chatSvg
    // AMap
  }
}
</script>

<style lang="scss">
@import './../../static/css/animation.scss';
.index-page {
  display: flex;
  width: 100%;
  // height: calc(100vh - 60px);
  height: 100%;
  .conversation-list {
    width: 30%;
    border-right: 1px solid #cccccc;
    background-color: var(--primary-bgcolor-4);
    &.mobile {
      position: absolute;
      width: 100%;
    }
  }
  .conversation-chat-area {
    position: relative;
    width: 70%;
    &.mobile {
      // position: absolute;
      width: 100%;
    }
    .no-conversation {
      text-align: center;
    }
  }
}
</style>
