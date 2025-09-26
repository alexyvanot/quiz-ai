<script lang="ts">
	interface Props {
		quiz: { question: string; choices: string[]; answer: string }[];
		onBackToForm?: () => void;
	}
	
	let { quiz, onBackToForm }: Props = $props();

	let currentQuestionIndex = $state(0);
	let userAnswers = $state<string[]>([]);
	let showResults = $state(false);
	let selectedAnswer = $state('');

	$effect(() => {
		if (quiz && userAnswers.length === 0) {
			userAnswers = new Array(quiz.length).fill('');
		}
	});

	const currentQuestion = $derived(() => quiz[currentQuestionIndex]);
	const isLastQuestion = $derived(() => currentQuestionIndex === quiz.length - 1);
	const isFirstQuestion = $derived(() => currentQuestionIndex === 0);

	function selectAnswer(answer: string) {
		selectedAnswer = answer;
		userAnswers[currentQuestionIndex] = answer;
	}

	function nextQuestion() {
		if (selectedAnswer) {
			userAnswers[currentQuestionIndex] = selectedAnswer;
		}
		
		if (isLastQuestion()) {
			showResults = true;
		} else {
			currentQuestionIndex++;
			selectedAnswer = userAnswers[currentQuestionIndex] || '';
		}
	}

	function previousQuestion() {
		if (!isFirstQuestion()) {
			currentQuestionIndex--;
			selectedAnswer = userAnswers[currentQuestionIndex] || '';
		}
	}

	function restartQuiz() {
		currentQuestionIndex = 0;
		userAnswers = new Array(quiz.length).fill('');
		showResults = false;
		selectedAnswer = '';
	}

	function calculateScore() {
		let correct = 0;
		for (let i = 0; i < quiz.length; i++) {
			if (userAnswers[i] && userAnswers[i] === quiz[i].answer) {
				correct++;
			}
		}
		console.log('Score calculé:', correct, 'sur', quiz.length);
		console.log('Réponses utilisateur:', userAnswers);
		console.log('Bonnes réponses:', quiz.map(q => q.answer));
		return correct;
	}

	// Score et pourcentage dérivés
	const score = $derived(() => userAnswers.length > 0 ? calculateScore() : 0);
	const progressPercentage = $derived(() => ((currentQuestionIndex + 1) / quiz.length) * 100);
</script>

{#if !showResults}
	<!-- ui -->
	<div class="max-w-2xl mx-auto">
		<div class="bg-gray-900 rounded-lg border border-gray-700 p-6">
			<!-- progressbar -->
			<div class="bg-gray-800 h-2 rounded-full mb-6">
				<div 
					class="bg-blue-500 h-2 rounded-full transition-all duration-500"
					style="width: {progressPercentage()}%"
				></div>
			</div>

			<!-- header -->
			<div class="flex justify-between items-center mb-6">
				<button
					onclick={() => onBackToForm?.()}
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
				>
					← Retour
				</button>
				<div class="bg-blue-600 px-4 py-2 rounded-lg">
					<span class="text-white font-semibold">
						{currentQuestionIndex + 1} / {quiz.length}
					</span>
				</div>
			</div>

			<!-- question -->
			<div class="mb-8">
				<h3 class="text-2xl font-bold text-white mb-6">
					{currentQuestion().question}
				</h3>

				<!-- choice -->
				<div class="space-y-3">
					{#each currentQuestion().choices as choice, index}
						<label 
							class="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors
							{selectedAnswer === choice ? 'border-blue-500 bg-blue-900' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}"
						>
							<input
								type="radio"
								bind:group={selectedAnswer}
								value={choice}
								class="sr-only"
								onchange={() => selectAnswer(choice)}
							/>
							<div class="flex items-center w-full">
								<div class="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-bold
									{selectedAnswer === choice ? 'border-blue-400 bg-blue-500 text-white' : 'border-gray-500 text-gray-400 bg-gray-700'}">
									{selectedAnswer === choice ? '✓' : String.fromCharCode(65 + index)}
								</div>
								<span class="text-white font-medium">{choice}</span>
							</div>
						</label>
					{/each}
				</div>

				<!-- Navigation -->
				<div class="flex justify-between mt-8">
					<button
						onclick={previousQuestion}
						disabled={isFirstQuestion()}
						class="px-6 py-3 rounded-lg font-semibold transition-colors
						{isFirstQuestion() ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}"
					>
						← Précédent
					</button>

					<button
						onclick={nextQuestion}
						disabled={!selectedAnswer}
						class="px-8 py-3 rounded-lg font-bold transition-colors
						{!selectedAnswer ? 'bg-gray-600 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}"
					>
						{isLastQuestion() ? '🏁 Terminer' : 'Suivant →'}
					</button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- results screen -->
	<div class="max-w-2xl mx-auto">
		<div class="bg-gray-900 rounded-lg border border-gray-700 p-8">
			<!-- result header -->
			<div class="text-center mb-8">
				<div class="text-6xl mb-4">
					{#if score() >= quiz.length * 0.8}🏆
					{:else if score() >= quiz.length * 0.6}👏
					{:else}💪
					{/if}
				</div>
				<h2 class="text-3xl font-bold text-white mb-2">Quiz terminé !</h2>
				<div class="text-2xl font-bold text-blue-400">
					{score()} / {quiz.length} ({Math.round((score() / quiz.length) * 100)}%)
				</div>
			</div>

			<!-- score -->
			<div class="mb-8">
				<div class="w-full bg-gray-700 rounded-full h-4">
					<div 
						class="h-4 rounded-full transition-all duration-1000
						{score() >= quiz.length * 0.8 ? 'bg-green-500' : score() >= quiz.length * 0.6 ? 'bg-yellow-500' : 'bg-red-500'}"
						style="width: {(score() / quiz.length) * 100}%"
					></div>
				</div>
				<p class="text-center mt-3 text-xl font-bold
					{score() >= quiz.length * 0.8 ? 'text-green-400' : score() >= quiz.length * 0.6 ? 'text-yellow-400' : 'text-red-400'}">
					{#if score() >= quiz.length * 0.8}
						Excellent travail !
					{:else if score() >= quiz.length * 0.6}
						Bien joué !
					{:else}
						Continuez vos efforts !
					{/if}
				</p>
			</div>

			<!-- details -->
			<div class="mb-8">
				<h3 class="text-xl font-bold text-white mb-4">📋 Détails des réponses</h3>
				<div class="space-y-3 max-h-80 overflow-y-auto">
					{#each quiz as question, index}
						<div class="border-2 rounded-lg p-4
							{userAnswers[index] === question.answer ? 'border-green-500 bg-green-900' : 'border-red-500 bg-red-900'}">
							<div class="flex items-start justify-between mb-2">
								<div class="font-bold text-white flex-1 mr-4">
									Q{index + 1}: {question.question}
								</div>
								<div class="text-2xl">
									{userAnswers[index] === question.answer ? '✅' : '❌'}
								</div>
							</div>
							<div class="space-y-2">
								<div class="flex justify-between p-2 bg-gray-800 rounded">
									<span class="text-gray-300">Votre réponse:</span>
									<span class="font-bold {userAnswers[index] === question.answer ? 'text-green-400' : 'text-red-400'}">
										{userAnswers[index] || 'Aucune réponse'}
									</span>
								</div>
								{#if userAnswers[index] !== question.answer}
									<div class="flex justify-between p-2 bg-green-800 rounded">
										<span class="text-gray-300">Bonne réponse:</span>
										<span class="font-bold text-green-400">{question.answer}</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- actions -->
			<div class="flex gap-4">
				<button
					onclick={restartQuiz}
					class="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
				>
					🔄 Refaire le quiz
				</button>
				<button
					onclick={() => onBackToForm?.()}
					class="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
				>
					➕ Nouveau quiz
				</button>
			</div>
		</div>
	</div>
{/if}
