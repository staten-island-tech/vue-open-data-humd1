<script setup lang="ts">

import { ref, onMounted } from 'vue'

const restaurants = ref([])
const TOKEN='BrghHqv1rWgKvU2v4D1hOlMJi'  //i need this to use the data apparently :(
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
  <div class="Page fixed inset-0 min-h-screen bg-linear-to-br from-white to-amber-100">
  <div class="Header text-center mt-10 ">
    <h2 class="Line text-amber-300 overflow-hidden text-2xl font-limelight text-gray text-shadow-md text-shadow-amber-600/20 mb-5">DOHMH New York City Restaurant Inspection Results</h2>
    <h1 class="Title text-amber-300 overflow-hidden text-6xl font-limelight text-gray text-shadow-md text-shadow-amber-600/50 mb-5">Guess The Grade!</h1>
  </div>
  <div class="Gamemodes text-center text-4xl mt-10 flex flex-wrap items-center gap-10 justify-center flex-row">
    <router-link :to="{ name: 'game' }" custom v-slot="{ navigate }">
      <button @click="navigate" class="bg-amber-200 hover:bg-amber-300 text-white tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo rounded-lg font-bold px-2 py-2" >Guess Mode</button>
    </router-link>
    <router-link :to="{ name: 'chart1' }" custom v-slot="{ navigate }">
      <button @click="navigate" class="bg-amber-200 hover:bg-amber-300 text-white tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo rounded-lg font-bold  px-2 py-2">radial bar (d3+claude)</button>
    </router-link>
    <router-link :to="{ name: 'chart2' }" custom v-slot="{ navigate }">
      <button @click="navigate" class="bg-amber-200 hover:bg-amber-300 text-white tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo rounded-lg font-bold  px-2 py-2">reactive bar (vuecharts)</button>
    </router-link>
  </div>
  </div>
</template>

<style scoped></style>
