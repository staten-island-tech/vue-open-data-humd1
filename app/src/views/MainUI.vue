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

const items = [
  { id: 1, label: 'Manhattan' },
  { id: 2, label: 'Brooklyn' },
  { id: 3, label: 'Queens' },
  { id: 4, label: 'Bronx' },
  { id: 5, label: 'Staten Island' },
]

</script>

<template>
  <div class="Page fixed inset-0 min-h-screen bg-linear-to-br from-white to-amber-100">
  <div class="Header text-center mt-10 ">
    <h2 class="Line text-amber-300 overflow-hidden text-2xl font-limelight text-gray text-shadow-md text-shadow-amber-600/20 mb-5">DOHMH New York City Restaurant Inspection Results</h2>
    <h1 class="Title text-amber-300 overflow-hidden text-6xl font-limelight text-gray text-shadow-md text-shadow-amber-600/50 mb-10">Guess The Grade!</h1>
  </div>
  <div style="overflow: hidden; width: 100vw; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; margin-bottom: 10px;">
    <div class="carousel-track">
      <div
        v-for="(item, i) in [...items, ...items, ...items, ...items, ...items, ...items]"
        :key="`${item.id}-${i}`"
        class="carousel-item"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
  <div class="Gamemodes text-center text-4xl mt-15 flex flex-wrap items-center gap-10 justify-center flex-row">
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
  <div class = "mt-20 directions text-center flex flex-wrap items-center gap-10 justify-center flex-column  text-amber-300 tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo">
    <p class="mb-5">Click "Guess Mode" to play a game where you guess the restaurant's grade based on the given information.  </p>
    <p class="mb-5">Click "radial bar" to see a chart made by d3, and "reactive bar" to see a chart made by vuecharts. </p>
    <p class="mb-5">Use the toggle on the bottom to adjust your color theme. </p>
    
  </div>
  <div class="fab fab-flower">
  <div tabindex="0" role="button" class="btn btn-lg btn-info btn-circle bg-amber-200 border-amber-300 text-white">🌣</div>
  <button class="fab-main-action btn-lg btn btn-circle btn-success  bg-amber-300 border-amber-400 text-amber-500">🌣</button>

  <div class="tooltip [--tooltip-color:amber-300] [--tooltip-text-color:white] tooltip-left" data-tip="Default">
    <button class="btn text-2xl btn-circle  bg-amber-300 border-amber-400 text-amber-500">1</button>
  </div>
  <div class="tooltip tooltip-left" data-tip="Sunset">
    <button class="btn text-2xl btn-circle  bg-amber-300 border-amber-400 text-amber-500">2</button>
  </div>
  <div class="tooltip" data-tip="Cool">
    <button class="btn text-2xl btn-circle  bg-amber-300 border-amber-400 text-amber-500">3</button>
  </div>
  <div class="tooltip" data-tip="Dark">
    <button class="btn text-2xl btn-circle  bg-amber-300 border-amber-400 text-amber-500">4</button>
  </div>
</div>
  </div>
</template>

<style scoped>
.carousel-track {
  display: flex;
  width: max-content;
  animation: scroll 20s linear infinite;
  padding: 0.5rem 0;
}

.carousel-item {
  flex-shrink: 0;
  padding: 0.5rem 1.5rem;
  background: #fde68a;
  color: #78350f;
}

@keyframes scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-20%); }
}
</style>
