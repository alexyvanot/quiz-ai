<script lang="ts">
  export let quiz: { question: string; choices: string[]; answer: string }[] = [];
</script>

<div class="mt-8">
  <h2 class="text-2xl font-semibold mb-4">Quiz généré</h2>
  {#each quiz as q, i}
    <div class="mb-6 p-4 border rounded">
      <div class="font-bold">{i+1}. {q.question}</div>
      <ul class="list-disc ml-6">
        {#each q.choices as choice, j}
          <li>{choice}</li>
        {/each}
      </ul>
      <div class="text-green-600">Bonne réponse : {q.answer}</div>
    </div>
  {/each}
</div>
