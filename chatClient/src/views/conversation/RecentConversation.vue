<template>
<!-- 应用了一个加载指示器。 -->
  <div class="recent-conversation-list" v-loading="isLoading">
    <!-- 过渡动画 -->
    <transition-group name="slide-up" appear>
      <!-- 好友信息条目 ./ConversationItem-->
      <conversation-item
        v-for="item in  outcomeConversationList"
        :key="item._id"
        :conversationInfo="item"
        :currentConversation="currentConversation"
        :recent-conversation="conversationList"
        @setCurrentConversation="setCurrentConversation"
        @click.native="changeCurrentConversation(item)"
        type="recent"
      />
    </transition-group>

    <div class="empty hor-ver-center" v-if="!outcomeConversationList.length">
      <empty-svg width="200" height="200" />
      <span class="secondary-font">最近没有聊天好友</span>
    </div>
  </div>
</template>

<script>
import { conversationTypes } from '@/const'
import { arrUnique } from '@/utils'
import conversationItem from './ConversationItem'
import EmptySvg from '@/SVGComponents/empty'
export default {
  props: ['currentConversation', 'setCurrentConversation'],  //当前会话对象  用于设置当前会话的函数
  data() {
    return {
      conversationList: [],  //存储所有会话列表 不带lastnews
      lastNewsMap: {},  //存储每个会话的最后一条消息
      isLoading: false  //指示加载状态
    }
  },
  computed: {
    userInfo() { // 用户信息
      return this.$store.state.user.userInfo
    },
    // lastNews() { // 最后发送的消息
    //   return this.$store.state.news.lastNews
    // },
    friendBeizhu() { // 好友备注Map {id2: '备注1', id1: '备注2'}
      return this.userInfo.friendBeizhu || {}
    },
    recentConversation() {  //最近会话
      return this.$store.state.app.recentConversation
    },
    outcomeConversationList() { // 带有备注，最后消息信息的会话列表
      const conversationList = JSON.parse(JSON.stringify(this.conversationList))
      return conversationList.length && conversationList.map(item => {
        item.beizhu = this.friendBeizhu[item._id] ? this.friendBeizhu[item._id] : ''
        item.lastNews = this.lastNewsMap[item.roomid] ? this.lastNewsMap[item.roomid] : ''
        item.lastNewsTime = this.lastNewsMap[item.roomid] ?
            (this.lastNewsMap[item.roomid].time ? new Date(this.lastNewsMap[item.roomid].time) : new Date(Date.now()-2000)) :
            new Date(Date.now()-2000) // -2000ms为了解决没有最近消息的会话的lastNews一直为当前时间（这样会和新发送的消息的会话冲突）
        return item
      }).sort((a, b) => {
        return b.lastNewsTime - a.lastNewsTime
      })
      // let res = []
      // this.conversationList.forEach(item => {
      //   let resItem = {}
      //   resItem.beizhu = this.friendBeizhu[item._id] ? this.friendBeizhu[item._id] : ''
      //   resItem.lastNews = this.lastNewsMap[item.roomid] ? this.lastNewsMap[item.roomid] : ''
      //   res.push({...resItem, ...item})
      //   console.log(res)
      // })
      // return res
    }
  },
  methods: {
    /*
    "list" :[
      {
        "createDate": "2024-07-24T00:00:00.000Z",
        "_id": "66a0fdcc02725a7f404fc589",
        "userM": {
          "photo": "face/face10.jpg",
          "signature": "",
          "nickname": "内马尔bf",
          "onlineTime": 19495210,
          "_id": "66a0fd9902725a7f404fc587",
          "level": 6
        },
        "userY": {
          "photo": "face/face8.jpg",
          "signature": "",
          "nickname": "欧文64",
          "onlineTime": 1634029936,
          "_id": "66a0fc8502725a7f404fc584",
          "level": 8
        },
        "__v": 0
      }
    ]
    
    */
    async getRecentConversation() { //获取最近的好友会话。
      this.isLoading = true //正在被加载 
      //获取最近会话好友的 ID 字符串 Ids
      const recentFriendIdsStr = window.localStorage.getItem('coMessager-recentConversation-friend') || ''
      //去除数组中的重复元素，并通过 filter(item => item) 去除空字符串
      const recentFriendIds = arrUnique(recentFriendIdsStr.split(',')).filter(item => item) // 去重
      //获取会话列表 
      const { data } = await this.$http.getRecentConversationList({
        userId: this.userInfo._id,
        recentFriendIds
      })
      const list = data.data
      const myId = this.userInfo._id
      //每个会话对象创建一个新的格式化对象，包括会话的创建日期、会话类型、相关用户信息
      /**"res": {
        "createDate": "2024-07-24T00:00:00.000Z",
        "roomid": "66a0fd9902725a7f404fc587-66a0fc8502725a7f404fc584",
        "photo": "face/face10.jpg",
        "signature": "",
        "nickname": "内马尔bf",
        "onlineTime": 19495210,
        "_id": "66a0fd9902725a7f404fc587",
        "level": 6,
        "conversationType": "FRIEND",
        "myNickname": "欧文64",
        "myId": "66a0fc8502725a7f404fc584",
        "myAvatar": "face/face8.jpg"
      }
      */
      const conversationList = (list || []).map(item => {
        let res = {}
        res.createDate = item.createDate
        res.roomid = item.userM._id + '-' + item.userY._id  //userM._id-userY._id
        if (item.userM._id === myId && item.userY._id !== myId) {
          res = {
            ...res, ...item.userY, 
            conversationType: conversationTypes.friend,
            myNickname: this.userInfo.nickname,
            myId: this.userInfo._id,
            myAvatar: this.userInfo.photo
          }
        } else {
          res = {
            ...res, ...item.userM, 
            conversationType: conversationTypes.friend,
            myNickname: this.userInfo.nickname,
            myId: this.userInfo._id,
            myAvatar: this.userInfo.photo
          }
        }
        return res
      })
      //初始化或重置最近会话列表
      this.$store.dispatch('app/SET_RECENT_CONVERSATION', {type: 'init', data: conversationList})   //store  app/SET_RECENT_CONVERSATION  conversationList
      // 获取最后一条消息存入Vuex
      const reqArr = []
      // this.$http.getLastNews()返回的是一个 Promise 对象
      conversationList.forEach(item => {  
        const req = this.$http.getLastNews({roomid: item.roomid})
        reqArr.push(req)
      })
      //每个会话使用异步请求获取最后一条消息，并使用 Promise.all 等待所有请求完成
      /*
      "data": {
        "status": 2000,
        "data": {
          "isReadUser": [
            "66a0fc8502725a7f404fc584"
          ],
          "_id": "66d030d52b916231745856ed",
          "roomid": "66a0fd9902725a7f404fc587-66a0fc8502725a7f404fc584",
          "senderId": "66a0fc8502725a7f404fc584",
          "senderNickname": "欧文64",
          "senderAvatar": "face/face8.jpg",
          "time": "2024-08-29T08:27:01.253Z",
          "message": "",
          "messageType": "artBoard",
          "__v": 0
        },
        "msg": "获取成功"
      },
      */
      Promise.all(reqArr).then(res => {  //管理了异步请求的并发处理 ///101
        const lastNewsArr = res.map(item => {
          return item.data.data
        })
        const lastNewsMap = lastNewsArr.reduce((map, item) => {  //{roomid:lastNews}
          item ? map[item.roomid] = item : null
          return map
        }, {}) 
        this.$store.dispatch('news/SET_LAST_NEWS', {                         ////// store SET_LAST_NEWS lastNewsMap
          type: 'init',  
          res: lastNewsMap
        })
        this.isLoading = false
      }).catch(err => {
        console.log(err)
      })
      // end
      this.conversationList = conversationList
    },
    async getRecentGroupConversation() {  //获取最近的群组会话。
      const recentGroupIdsStr = window.localStorage.getItem('coMessager-recentConversation-group') || ''
      const recentGroupIds = arrUnique(recentGroupIdsStr.split(',')).filter(item => item) // 去重
      this.$http.getRecentGroupConversation({
        userId: this.userInfo._id,
        groupIds: recentGroupIds
      }).then(res => {
        // console.log("AAA")
        // console.log(res)
        if (res.data.status === 2000) {
          const groupList = res.data.data
          groupList.forEach(item => {
            item.conversationType = 'GROUP'
            item.isGroup = true
            item.roomid = item.groupId._id
          })
          const groupRoomids = groupList.map(item => item.groupId._id)
          const reqArr = []
          groupRoomids.forEach(item => {
            const req = this.$http.getGroupLastNews({roomid: item})
            reqArr.push(req)
          })
          Promise.all(reqArr).then(res => {
            const lastNewsArr = res.map(item => {
              // console.log("BBB")
              // console.log(item)
              return item.data.data
            })
            // console.log(lastNewsArr)
            const lastNewsMap = lastNewsArr.reduce((map, item) => {
              item ? map[item.roomid] = item : null
              return map
            }, {})
            this.$store.dispatch('news/SET_LAST_NEWS', {                                       ////// store SET_LAST_NEWS lastNewsMap
              type: 'concat',
              res: lastNewsMap
            })
            this.isLoading = false
          }).catch(err => {
            console.log(err)
          })
          this.conversationList = [...this.conversationList, ...groupList]
          this.$store.dispatch('app/SET_RECENT_CONVERSATION', {type: 'init', data: this.conversationList}) ////// store SET_RECENT_CONVERSATION conversationList
        }
      })
    },
    changeCurrentConversation(item) {  //改变当前会话，并通过事件通知父组件。   // emit setCurrentConversation
      this.$emit('setCurrentConversation', item)
    }
  },
  watch: {  //监听 Vuex store 中的 recentConversation 和 lastNews 的变化
    '$store.state.app.recentConversation': {
      handler(newVal, oldVal) {
        console.log(newVal)
        this.conversationList = newVal.filter(item => Object.keys(item).length > 0)
      }, deep: true, immediate: true
    },
    '$store.state.news.lastNews': {
      handler(newVal, oldVal) {
        this.lastNewsMap = newVal
      }
    }
  },
  components: {
    conversationItem,
    EmptySvg
  },
  async created() {  //在组件创建时，获取最近的会话和群组会话
    await this.getRecentConversation()
    this.getRecentGroupConversation()
  },
}
</script>

<style lang="scss">
.recent-conversation-list {
  @import './../../../static/css/animation.scss';
  position: relative;
  height: 510px;
  overflow-x: hidden;
  .empty {
    text-align: center;
  }
}
</style>
