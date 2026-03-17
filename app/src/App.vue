<script setup lang="ts">

import { ref, onMounted } from 'vue'

const restaurants = ref([])
const TOKEN='BrghHqv1rWgKvU2v4D1hOlMJi'
async function getRestaurants(
){
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/43nn-pn8j.json', {
      headers: {
        'X-App-Token': TOKEN
      }
    })
    const data = await response.json()
    restaurants.value = data
    console.log(restaurants.value)
  } catch (error){
    console.log(error)
  }
    
}

onMounted(()=>{
  getRestaurants()
})

</script>

<template>
  <div class="Header">Guess The Grade of NYC restaurants!</div>
</template>

<style scoped></style>
