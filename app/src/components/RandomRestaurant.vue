<template>
    <div class = "Info text-center mt-10">
        <h1>{{ restaurants.dba }}</h1>
        <h2>{{ restaurants.cuisine_description }}</h2>
        <h3>{{ restaurants.boro }}</h3>
    </div>
</template>

<script setup lang="ts">
defineProps({
    restaurants: {
        type: Object,
        required: true,
    }
})

</script>

<style scoped>

</style>