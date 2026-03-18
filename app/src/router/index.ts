import { createRouter, createWebHistory } from 'vue-router'
import MainUI from '@/views/MainUI.vue'
import GuessGame from '@/views/GuessGame.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainUI,
    },
    {
      path: '/',
      name: 'game',
      component: GuessGame,
    }
  ],
})

export default router
