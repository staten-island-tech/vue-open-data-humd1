import { createRouter, createWebHistory } from 'vue-router'
import MainUI from '@/views/MainUI.vue'
import GuessGame from '@/views/GuessGame.vue'
import Chart1 from '@/views/ChartOne.vue'
import Chart2 from '@/views/ChartTwo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainUI,
    },
    {
      path: '/game',
      name: 'game',
      component: GuessGame,
    },
    {
      path: '/charts/1',
      name: 'chart1',
      component: Chart1,
    },
    {
      path: '/charts/2',
      name: 'chart2',
      component: Chart2,
    }
  ],
})

export default router
