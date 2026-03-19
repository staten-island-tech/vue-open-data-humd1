<script setup lang="ts">
import {ref} from 'vue'
import RandomRestaurant from '@/components/RandomRestaurant.vue'
const restaurants = ref([])
const selectedRestaurant = ref({})

</script>

<template>
    <h1>GAME</h1>
    <RandomRestaurant :restaurants="selectedRestaurant" />
</template>

<style scoped></style>


