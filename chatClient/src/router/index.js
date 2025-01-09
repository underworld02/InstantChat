import Vue from 'vue'
import Router from 'vue-router'
import store from './../store'

Vue.use(Router)

const router = new Router({
  routes: [{
      path: '/',
      redirect: '/chat',
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import("@/views/Login"),
      meta: {
        deepth: 0.5
      }
    },
    {
      path: '/chat',  //网页显示的路劲 #/chat/home
      name: 'Layout',
      component: () => import('@/views/layout'),
      redirect: '/chat/home',
      meta: {
        requiresAuth: true,
        keepAlive: true
      }, //子页面是被插入到父页面的 <router-view> 标签中。这样设计的目的是让布局组件（通常是父路由对应的组件）提供共用的页面结构（如导航栏、侧边栏、底部栏等），而子路由则负责填充具体的内容区域
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/Index'),
          meta: {
            requiresAuth: true,//访问此路由需要用户认证。
            keepAlive: true, //表示希望 Vue 的 <keep-alive> 包装器缓存此路由的组件实例  指示应用该组件应该被 <keep-alive> 缓存。这意味着 Vue 会在组件第一次加载后将其实例保持在内存中，而不是在每次访问时重新创建
            deepth: 1
          },
        },
        {
          path: 'user/:id',  //在路由对应的组件中，你可以通过 this.$route.params.id 来访问这个 id 参数的实际值。
          name: 'UserDetails',
          component: () => import('@/views/UserDetails'), //懒加载
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'add',
          name: 'Add',
          component: () => import('@/views/Add'),
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'setting',
          name: 'Setting',
          component: () => import('@/views/Setting'),
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'system',
          name: 'System',
          component: () => import('@/views/SystemNews'),
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'mzone',
          name: 'MZone',
          component: () => import('@/views/MZone/index'),
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'editor',
          name: 'Editor',
          component: () => import('@/views/MZone/editorBlog'),
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'schedule',
          name: 'Schedule',
          component: () => import('@/views/Schedule'),
          meta: {
            requiresAuth: true
          },
        },
        {
          path: 'blog/:id',
          name: 'BlogInfo',
          component: () => import('@/views/BlogInfo'),
          meta: {
            requiresAuth: true
          }
        }
      ]
    },
    {
      path: '*',
      name: 'NotFound',
      component: () => import('@/views/404')
    }
  ]
})

// 全局前置守卫 在每次路由变化前，检查路由的 meta.requiresAuth 标记。
// 如果用户未登录（userIsLogin 为 false）且尝试访问需要认证的路由，将被重定向到登录页面，并附带原本想要访问的路由地址，便于登录后能够直接跳转到该路由。
router.beforeEach((to, from, next) => {  
  /**tips:需要在钩子函数内读取登录状态 */
  const userIsLogin = store.state.user.isLogin
  if(to.meta.requiresAuth){
    if(userIsLogin){
      next()
    }else{
      // alert('请先登录再进行此操作!')
      next({
        path: '/login',
        /** 将刚刚要去的路由path（却无权限）作为参数，方便登录成功后直接跳转到该路由 */
        query: { redirect: to.fullPath }  //登录成功后 你可以在登录逻辑中检查 URL 的查询参数 redirect
      })
    } 
  }else{
    next()
  }
})

export default router
