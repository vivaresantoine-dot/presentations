<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ initial?: number }>(), { initial: 0 })
const count = ref(props.initial)
</script>

<template>
  <section class="counter" aria-label="Compteur interactif">
    <p>Une idée partagée, un pas de plus.</p>
    <div class="counter-actions">
      <button aria-label="Diminuer le compteur" @click="count--">−</button>
      <output aria-live="polite" aria-label="Valeur du compteur">{{ count }}</output>
      <button aria-label="Augmenter le compteur" @click="count++">+</button>
      <button class="reset" @click="count = props.initial">Réinitialiser</button>
    </div>
  </section>
</template>
