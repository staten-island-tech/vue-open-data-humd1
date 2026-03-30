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
    <h2 class="Line text-amber-300 overflow-hidden text-2xl font-limelight text-gray text-shadow-md text-shadow-amber-600/20 mb-5"> ☆DOHMH New York City Restaurant Inspection Results☆</h2>
    <h1 class="Title text-amber-300 overflow-hidden text-6xl font-limelight text-gray text-shadow-md text-shadow-amber-600/50 mb-10">Guess The Grade!</h1>
  </div>
  <div style="overflow: hidden; width: 100vw; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; margin-bottom: 10px;">
    <div class="carousel-track">
      <div
        v-for="(item, i) in [...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items]"
        :key="`${item.id}-${i}`"
        class="carousel-item"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
  <div class="Gamemodes text-center text-4xl mt-15 flex flex-wrap items-center gap-10 justify-center flex-row">
    <router-link :to="{ name: 'chart1' }" custom v-slot="{ navigate }">
      <button @click="navigate" class="bg-amber-200 hover:bg-amber-300 text-white tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo rounded-lg font-bold  px-2 py-2">radial bar </button>
    </router-link>
    <router-link :to="{ name: 'chart2' }" custom v-slot="{ navigate }">
      <button @click="navigate" class="bg-amber-200 hover:bg-amber-300 text-white tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo rounded-lg font-bold  px-2 py-2">grade map</button>
    </router-link>
  </div>
  <div class = "mt-20 directions text-center flex flex-wrap items-center gap-10 justify-center flex-column  text-amber-300 tracking-widest text-2xl text-shadow-md text-shadow-amber-600/20 font-federo">
    <p class="mb-5">Click "radial bar" to see a chart comparing restaurant violations in each borough, and "grade map" to view restaurant grades by location (both made by claude + d3)</p>
    
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
  to   { transform: translateX(-10%); }
}
</style>
