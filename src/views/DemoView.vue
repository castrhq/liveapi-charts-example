<script setup>
import { ref } from 'vue'
import LiveCharts from '../components/LiveCharts.vue';

defineProps({
  
})

const streamKey = ref('');
const activeStreamKey = ref('');

const verifyStreamKey = () => {
    let currKey = streamKey.value;
    if(currKey.length && currKey.startsWith('lv_')) {
        if(currKey.includes('?')) {
            currKey = currKey.split('?')?.[0];
        }
        activeStreamKey.value = streamKey.value;
    } else {
        activeStreamKey.value = null;
        alert('Invalid stream key!');
    }
}

</script>

<template>
    <div class="container pt-5">
        <div class="stream-inputs">
            <div class="input-group mb-3">
                <span class="input-group-text" id="stream-key">Stream Key</span>
                <input v-model="streamKey" :disabled="isDisabled" type="text" class="form-control" placeholder="Stream Key" aria-label="Stream Key" aria-describedby="stream-key">
                <button class="btn btn-primary" @click="verifyStreamKey">Apply</button>
            </div>
        </div>
        <LiveCharts :stream-key="activeStreamKey" v-if="activeStreamKey"/>
    </div>
</template>

<style scoped>
.stream-inputs {
    display: flex;
    justify-content: center;
}
</style>
