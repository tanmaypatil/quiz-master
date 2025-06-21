  
        let quizData = [];
        let currentQuestion = 0;
        let score = 0;
        let selectedOption = -1;
        let answered = false;
        let userAnswers = []; // Track all user answers

        // AWS API Gateway endpoint - UPDATE THIS WITH YOUR ACTUAL ENDPOINT
        const API_ENDPOINT = 'https://your-api-gateway-url.amazonaws.com/prod/save-results';

        function loadQuiz() {
            try {
                const jsonText = document.getElementById('jsonData').value;
                quizData = JSON.parse(jsonText);

                if (!Array.isArray(quizData) || quizData.length === 0) {
                    alert('Please provide a valid array of questions');
                    return;
                }

                // Validate question format
                for (let q of quizData) {
                    if (!q.question || !q.options || !Array.isArray(q.options) || typeof q.correct !== 'number') {
                        alert('Invalid question format. Each question needs: question, options (array), and correct (number)');
                        return;
                    }
                }

                document.getElementById('jsonInput').style.display = 'none';
                document.getElementById('quizContainer').style.display = 'block';

                currentQuestion = 0;
                score = 0;
                userAnswers = []; // Reset answers array
                updateScore();
                showQuestion();
            } catch (e) {
                alert('Invalid JSON format. Please check your data.');
            }
        }

        function showQuestion() {
            if (currentQuestion >= quizData.length) {
                showFinalResults();
                return;
            }

            const question = quizData[currentQuestion];
            document.getElementById('questionText').textContent = `${currentQuestion + 1}. ${question.question}`;

            const optionsContainer = document.getElementById('optionsContainer');
            optionsContainer.innerHTML = '';

            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.textContent = option;
                optionElement.onclick = () => selectOption(index);
                optionElement.setAttribute('data-index', index);
                optionsContainer.appendChild(optionElement);
            });

            selectedOption = -1;
            answered = false;
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'inline-block';

            updateProgress();
        }

        function selectOption(index) {
            if (answered) return;

            selectedOption = index;

            // Remove previous selection
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Add selection to clicked option
            document.querySelector(`[data-index="${index}"]`).classList.add('selected');
            document.getElementById('submitBtn').disabled = false;
        }

        function submitAnswer() {
            if (selectedOption === -1 || answered) return;

            answered = true;
            const question = quizData[currentQuestion];
            const correctIndex = question.correct;

            // Store user answer
            userAnswers.push({
                questionIndex: currentQuestion,
                question: question.question,
                selectedOption: selectedOption,
                selectedAnswer: question.options[selectedOption],
                correctOption: correctIndex,
                correctAnswer: question.options[correctIndex],
                isCorrect: selectedOption === correctIndex
            });

            // Show correct and incorrect answers
            document.querySelectorAll('.option').forEach((opt, index) => {
                opt.style.pointerEvents = 'none';
                if (index === correctIndex) {
                    opt.classList.add('correct');
                } else if (index === selectedOption && index !== correctIndex) {
                    opt.classList.add('incorrect');
                }
            });

            // Update score
            if (selectedOption === correctIndex) {
                score++;
                updateScore();
            }

            document.getElementById('submitBtn').style.display = 'none';
            document.getElementById('nextBtn').style.display = 'inline-block';
        }

        function nextQuestion() {
            currentQuestion++;
            showQuestion();
        }

        function updateScore() {
            document.getElementById('score').textContent = score;
            document.getElementById('total').textContent = quizData.length;
        }

        function updateProgress() {
            const progress = ((currentQuestion + 1) / quizData.length) * 100;
            document.getElementById('progress').style.width = progress + '%';
        }

        async function showFinalResults() {
            const percentage = Math.round((score / quizData.length) * 100);
            let message = `Quiz Complete! 🎉<br>Final Score: ${score} / ${quizData.length} (${percentage}%)`;

            if (percentage >= 90) message += '<br>Excellent work! 🏆';
            else if (percentage >= 70) message += '<br>Great job! 👏';
            else if (percentage >= 50) message += '<br>Good effort! 👍';
            else message += '<br>Keep practicing! 💪';

            // Save results to AWS DynamoDB
            try {
                await saveQuizResults();
                message += '<br><small>✅ Results saved to database</small>';
            } catch (error) {
                console.error('Failed to save results:', error);
                message += '<br><small>⚠️ Failed to save results</small>';
            }

            document.getElementById('results').innerHTML = message;
            document.getElementById('results').style.display = 'block';
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('restartBtn').style.display = 'inline-block';
        }

        async function saveQuizResults() {
            const userId = prompt("Enter your user ID (optional):") || 'anonymous';

            const results = {
                userId: userId,
                score: score,
                total: quizData.length,
                answers: userAnswers,
                quizData: quizData, // Optional: save questions too
                timestamp: new Date().toISOString()
            };

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(results)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Results saved:', data);
            return data;
        }

        function restartQuiz() {
            currentQuestion = 0;
            score = 0;
            selectedOption = -1;
            answered = false;
            userAnswers = []; // Reset answers

            document.getElementById('results').style.display = 'none';
            document.getElementById('restartBtn').style.display = 'none';

            updateScore();
            showQuestion();
        }

        // Async/await version
        async function loadJson() {
            try {
                const response = await fetch('/quiz.json');
                const data = await response.json();
                console.log(data);
                return data;
            } catch (error) {
                console.error('Error loading JSON:', error);
            }
        }

        // Load sample data on page load
        window.onload = async function () {
            const sampleData = await loadJson();
            document.getElementById('jsonData').value = JSON.stringify(sampleData, null, 2);
        };

        // Side Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const createQuizLink = document.getElementById('createQuizLink');
    const homeLink = document.getElementById('homeLink');
    const quizForm = document.getElementById('quizForm');
    const existingQuizContent = document.getElementById('quizQuestions');

    // Toggle side menu
    function toggleMenu() {
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // Close menu
    function closeMenu() {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Show quiz form
    function showQuizForm() {
        quizForm.style.display = 'block';
        existingQuizContent.style.display = 'none';
        closeMenu();
    }

    // Show home/existing content
    function showHome() {
        quizForm.style.display = 'none';
        existingQuizContent.style.display = 'block';
        closeMenu();
    }

    // Event listeners
    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    if (createQuizLink) {
        createQuizLink.addEventListener('click', (e) => {
            e.preventDefault();
            showQuizForm();
        });
    }
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showHome();
        });
    }

    // Handle quiz form submission
    if (quizForm) {
        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const prompt = document.getElementById('prompt').value;
            
            if (prompt.trim()) {
                console.log('Quiz prompt:', prompt);
                // Add your quiz generation logic here
                alert('Quiz generation started with prompt: ' + prompt);
            } else {
                alert('Please enter a prompt for your quiz.');
            }
        });
    }
});


    