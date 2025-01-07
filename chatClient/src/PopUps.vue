<template>
  <div class="pop-ups">
    <user-profile v-if="isShowUserProfile" />
    <!-- currentConversation 对象从父组件的数据传递到 fenzu-modal 组件中，作为其属性 -->
    <!-- @hidden-fenzu="hiddenFenzuModal": 这是一个事件监听器，当 fenzu-modal 组件内部触发了 hidden-fenzu 事件时，父组件中的 hiddenFenzuModal 方法会被调用。 -->
    <fenzu-modal
      v-if="isShowFenzuModal"
      :current-conversation="currentConversation"
      @hidden-fenzu="hiddenFenzuModal"
    />
    <beizhu-modal
      v-if="isShowBeizhuModal"
      :current-conversation="currentConversation"
    />
    <!-- name="fade": 这里的 name 属性指定了应用于过渡的名称。Vue 会使用这个名字来查找 CSS 过渡类。比如，此处会使用 .fade-enter-active, .fade-leave-active 等类来定义进入和离开的动画。 -->
    <transition name="fade">
      <!-- 监听 bearing-modal 组件的 close 事件。一旦组件触发 close 事件，就会通过事件总线 $eventBus 发射 toggleCreateGroup 事件，并将 show 参数设置为 false -->
      <bearing-modal
        v-if="showModal && isShowCreateGroup"
        @close="$eventBus.$emit('toggleCreateGroup', { show: false })"
        title="创建群聊"
        :width="400"
      >
        <template slot="body">
          <create-group />
        </template>
      </bearing-modal>
    </transition>
    <message-text-menu
      v-if="isShowMsgTextMenu"
      :message="currentMessage"
      :left="msgTextMenuLeft"
      :top="msgTextMenuTop"
    />
  </div>
</template>

<script>
import './../static/css/animation.scss'
import userProfile from '@/components/userProfile'   
import fenzuModal from '@/components/fenzuModal'    //分组管理
import beizhuModal from '@/components/beizhuModal'  //备注编辑
import createGroup from '@/components/createGroup'   //创建组
import bearingModal from '@/components/bearingModal'  // 
import messageTextMenu from '@/components/messageTypes/messageTextMenu'
export default {
  data() {
    return {
      showModal: false,
      isShowUserProfile: false,
      isShowFenzuModal: false,
      isShowBeizhuModal: false,
      isShowCreateGroup: false,
      isShowMsgTextMenu: false,
      currentConversation: {}, // 当前操作的会话

      currentMessage: {}, // 当前操作的消息
      msgTextMenuLeft: 0,
      msgTextMenuTop: 0

    }
  },
  methods: {
    hiddenFenzuModal() {
      this.isShowFenzuModal = false
    },
    close() {
      this.showModal = false
    }
  },
  created() {
    this.$eventBus.$on('showUserProfile', () => {
      this.isShowUserProfile = true
    })
    this.$eventBus.$on('toggleFenzuModal', (e) => {
      const { show, data } = e
      this.isShowFenzuModal = show
      this.currentConversation = data.currentConversation || {}
    })
    this.$eventBus.$on('toggleBeizhuModal', (e) => {
      const { show, data } = e
      this.isShowBeizhuModal = show
      this.currentConversation = data.currentConversation || {}
    })
    this.$eventBus.$on('toggleCreateGroup', (e) => {
      const { show } = e
      this.showModal = show
      this.isShowCreateGroup = show
    })
    this.$eventBus.$on('toggleMsgTextMenu', (e) => {
      const { show, data, left, top } = e
      this.isShowMsgTextMenu = show
      this.currentMessage = data
      this.msgTextMenuLeft = left
      this.msgTextMenuTop = top
    })
  },
  components: {
    userProfile,
    fenzuModal,
    beizhuModal,
    createGroup,
    messageTextMenu,
    bearingModal
  }
}
</script>
