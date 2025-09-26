<script lang="ts">
  // Nouvelle approche Svelte 5 : callback props au lieu de createEventDispatcher
  interface Props {
    onSubmitQuiz?: (data: { text: string; numQuestions: string; numChoices: string }) => void;
  }
  
  let { onSubmitQuiz }: Props = $props();
  
  // Variables d'état Svelte 5
  let text = $state('');
  let numQuestions = $state(5);
  let numChoices = $state(4);

  function submitForm(e: Event) {
    e.preventDefault();
    if (!text.trim()) {
      return;
    }
    const data = {
      text: text,
      numQuestions: numQuestions.toString(),
      numChoices: numChoices.toString()
    };
    onSubmitQuiz?.(data);
  }
</script>

<div class="max-w-md mx-auto p-4">
  <div class="bg-gray-900 rounded-lg p-6 border border-gray-700">
    
    <form onsubmit={submitForm} class="space-y-4">
      
      <!-- txt src -->
      <div>
        <label for="text-input" class="block text-white text-sm font-semibold mb-2">
          📝 Votre texte source
        </label>
        <textarea 
          id="text-input"
          bind:value={text} 
          rows="6" 
          placeholder="Collez ici le texte pour générer un quiz..."
          class="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
        ></textarea>
      </div>

      <!-- params -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="num-questions" class="block text-white text-xs font-medium mb-1">
            ❓ Nombre de questions
          </label>
          <select 
            id="num-questions"
            bind:value={numQuestions}
            class="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="3">3 questions</option>
            <option value="5">5 questions</option>
            <option value="8">8 questions</option>
            <option value="10">10 questions</option>
          </select>
        </div>
        
        <div>
          <label for="num-choices" class="block text-white text-xs font-medium mb-1">
            ✅ Nombre de choix
          </label>
          <select 
            id="num-choices"
            bind:value={numChoices}
            class="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="2">2 choix</option>
            <option value="3">3 choix</option>
            <option value="4">4 choix</option>
          </select>
        </div>
      </div>

      <!-- btn gen quiz -->
      <button 
        type="submit" 
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        disabled={!text.trim()}
      >
        🚀 Générer le quiz
      </button>
    </form>
  </div>
</div>
