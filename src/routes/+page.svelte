<script lang="ts">
  import { onMount } from 'svelte';
  import QuizForm from '$lib/components/QuizForm.svelte';
  import QuizPlayer from '$lib/components/QuizPlayer.svelte';
  
  // Variables d'état Svelte 5
  let quiz = $state<{ question: string; choices: string[]; answer: string }[] | null>(null);
  let loading = $state(false);
  let error = $state('');
  let showForm = $state(true);

  async function handleQuizRequest(data: Record<string, any>) {
    loading = true;
    error = '';
    quiz = null;
    try {
      const res = await fetch('http://localhost:3001/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error(`Erreur serveur: ${res.status}`);
      }
      
      const responseData = await res.json();
      console.log('Réponse du serveur:', responseData);
      
      if (responseData.quiz) {
        // back here returns an object so no need to parse
        quiz = Array.isArray(responseData.quiz) ? responseData.quiz : [responseData.quiz];
        showForm = false; // hide the form when generated
        
        if (responseData.warning) {
          error = `⚠️ ${responseData.warning}`;
        }
      } else {
        error = responseData.error || 'Erreur inconnue';
      }
    } catch (e) {
      console.error('Erreur frontend:', e);
      if (e instanceof Error) {
        error = `Erreur: ${e.message}`;
      } else {
        error = 'Erreur inconnue';
      }
    } finally {
      loading = false;
    }
  }

  function resetQuiz() {
    quiz = null;
    showForm = true;
    error = '';
  }
</script>

<main class="min-h-screen bg-gray-900 text-white">
  {#if showForm}
    <div class="container mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">🎯 Quiz Generator</h1>
        <p class="text-gray-300 text-lg">Créez des quiz intelligents avec l'IA</p>
      </div>
      
      <QuizForm onSubmitQuiz={handleQuizRequest} />
      
      {#if loading}
        <div class="mt-6 max-w-md mx-auto">
          <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
            <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-white font-semibold mb-1">Génération en cours...</p>
            <p class="text-gray-400 text-sm">L'IA analyse votre contenu ✨</p>
          </div>
        </div>
      {/if}
      
      {#if error}
        <div class="mt-6 max-w-md mx-auto">
          <div class="bg-red-900 border border-red-700 rounded-lg p-4">
            <p class="text-red-300 font-semibold">❌ Erreur</p>
            <p class="text-red-200 text-sm mt-1">{error}</p>
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  {#if quiz && !showForm}
    <div class="container mx-auto px-4 py-8">
      <QuizPlayer {quiz} onBackToForm={resetQuiz} />
    </div>
  {/if}
</main>
