// Global variables for session and player tracking
let currentSessionId = null;
let currentPlayerId = null;

window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionFromURL = urlParams.get("session");
  if (sessionFromURL) {
    promptForPlayerName((name) => {
      currentSessionId = sessionFromURL;
      currentPlayerId = name;
      joinGameSession(currentSessionId, currentPlayerId);
    });
  }
});

class SpanglishFixitGame {
    constructor(sentences) {
        this.originalSentences = sentences;
        this.sentences = this.shuffle([...sentences].slice(0, 15));
        this.sentences.forEach(s => {
          s.clickedWord   = null;  // The word the player clicked
          s.studentAnswer = null;  // What the user typed
          s.wasCorrect    = null;  // Boolean indicating if the answer was correct
        });
        this.currentIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        this.totalSentences = 15; // Each game has 15 sentences.
        this.interval = null;
        this.gameActive = false;
        this.reviewMode = false;
        this.currentErrorWord = null; // Track the selected error word

        // Define methods before binding them

        this.startReview = () => {
    if (this.wrongAnswers.length === 0) return;
    this.reviewMode = true;
    this.currentIndex = 0;
    
    // Re-show the answer input for review:
    document.getElementById("answer").style.display = "block";
    
    // Hide the Review button when entering review mode:
    document.getElementById("review").style.display = "none";
    this.updateSentence();
};

        this.setupInputListener = () => {
            document.getElementById("answer").addEventListener("keyup", (event) => {
                if (event.key === "Enter") {
                    this.checkAnswer();
                }
            });
        };

        // Bind the arrow function methods
        this.startReview = this.startReview.bind(this);
        this.setupInputListener = this.setupInputListener.bind(this);

        this.initUI();
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    initUI() {
        console.log("Game script is running!");
        document.title = "Spanglish Fixit Challenge";
        document.body.innerHTML = `
    <style>
        /* General body styles */
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #2E3192, #1BFFFF);
            color: white;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        /* Instructions overlay */
        #instructions-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        #instructions-box {
            background: #333;
            padding: 20px;
            border-radius: 10px;
            max-width: 500px;
            text-align: left;
        }
        #instructions-box h2 {
            margin-top: 0;
        }
        /* Close instructions button */
        #close-instructions {
            margin-top: 15px;
            padding: 5px 10px;
            background: #28a745;
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            transition: 0.3s;
        }
        #close-instructions:hover {
            opacity: 0.8;
        }
        /* Game container */
        #game-container {
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
            text-align: center;
        }
        /* Paragraph style */
        p {
            font-size: 18px;
        }
        /* Input styles */
        input {
            padding: 10px;
            font-size: 16px;
            border-radius: 5px;
            border: none;
            outline: none;
            text-align: center;
            display: block;
            margin: 10px auto;
            width: 80%;
        }
        input.correct {
            border: 2px solid #00FF00;
            background-color: rgba(0, 255, 0, 0.2);
        }
        input.incorrect {
            border: 2px solid #FF0000;
            background-color: rgba(255, 0, 0, 0.2);
        }
        /* Button styles */
        button {
            padding: 10px 20px;
            font-size: 18px;
            margin-top: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: 0.3s;
        }
        button:hover {
            opacity: 0.8;
        }
        #start {
            background: #28a745;
            color: white;
        }
        #restart {
            background: #007bff;
            color: white;
            display: none;
        }
        #review {
            background: #ffc107;
            color: black;
            display: none;
        }
        /* Timer bar (points bar) */
        #timer-bar {
            width: 100%;
            height: 10px;
            background: red;
            transition: width 1s linear;
        }
        /* End-game text styles */
        .game-over {
            font-size: 24px;
            color: #FF4500;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .new-high {
            font-size: 20px;
            color: #FFD700;
            font-weight: bold;
        }
    </style>
    <!-- Instructions Overlay -->
        <div id="instructions-overlay">
            <div id="instructions-box">
                <h2>How to Play</h2>
                <p>Welcome to the Spanglish Fixit Challenge! Here's what to do:</p>
                <ul>
                    <li>Click the incorrect word in each sentence.</li>
                    <li>After clicking, type the correct word.</li>
                    <li>For each sentence, your points decrease from 100 to 10 over 30 seconds.</li>
                    <li>Incorrect clicks or wrong corrections lose you 50 points.</li>
                    <li>The game ends after 15 sentences (e.g., 2/15, 3/15, etc.).</li>
                </ul>
                <p>Good luck!</p>
                <button id="close-instructions">Got It!</button>
            </div>
        </div>
        <!-- Game Container -->
        <div id="game-container">
            <h1>Spanglish Fixit Challenge</h1>
            <!-- Single-player UI elements -->
            <p id="counter">Sentence: 0/15</p>
            <div id="points-bar-container" style="width:100%; background: #555; height: 10px; margin-top: 5px;">
                <div id="points-bar" style="width: 100%; height: 100%; background: #0f0; transition: width 0.1s linear;"></div>
            </div>
            <p id="sentence"></p>
            <p id="instructionsText">Click the error and type the correction:</p>
            <input type="text" id="answer" autofocus>
            <p id="feedback"></p>
            <p>Score: <span id="score">0</span></p>
            <p>Best Score: <span id="bestScore">0</span></p>
            <button id="restart">Restart</button>
            <button id="review">Review Mistakes</button>
            <button id="downloadReport" style="display: none;">Download Report</button>
        </div>
        <!-- Multiplayer Section -->
<div id="multiplayer-container" style="margin-top: 20px;">
  <h2>Multiplayer</h2>
  <button id="hostMultiplayer">Host Multiplayer Game</button>
  <button id="createMultiplayer">Create Multiplayer Game</button>
  <br/><br/>
  <input type="text" id="sessionIdInput" placeholder="Enter Session ID" />
  <button id="joinMultiplayer">Join Multiplayer Game</button>
  <div id="qr-code" style="margin-top: 20px;"></div> <!-- NEW QR CONTAINER -->
</div>
    `;

    // Load jsPDF and AutoTable before other game code runs
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => {
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js", () => {
    console.log("jsPDF and AutoTable loaded!");
    // Now you can safely call functions that depend on jsPDF, or initialize your game.
  });
});

loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", () => {
  console.log("QRCode.js loaded!");
});

    // Attach Multiplayer UI event listeners:
    const createBtn = document.getElementById("createMultiplayer");
    const joinBtn = document.getElementById("joinMultiplayer");
    const sessionInput = document.getElementById("sessionIdInput");

    const hostBtn = document.getElementById("hostMultiplayer");
if (hostBtn) {
  hostBtn.addEventListener("click", () => {
    promptForPlayerName((name) => {
      // Create a session as a host:
      const sessionId = createHostGameSession(sentences, name);
      currentSessionId = sessionId;
      currentPlayerId = "host";  // Mark this client as the host
      
      // Display the session ID for sharing:
      document.getElementById("sessionIdInput").value = sessionId;
      
      // Optionally, hide the host button and add a host label:
      hostBtn.style.display = "none";
      const hostLabel = document.createElement('div');
      hostLabel.id = "host-label";
      hostLabel.style.marginTop = "10px";
      hostLabel.style.fontWeight = "bold";
      hostLabel.textContent = "You are hosting this game";
      document.getElementById("game-container").appendChild(hostLabel);
      
      // Attach a realtime listener for the host view:
      joinGameSessionAsHost(sessionId, name);
      let baseUrl;
if (location.hostname === "localhost") {
  baseUrl = `${window.location.origin}`;
} else {
  baseUrl = "https://waggledook.github.io/Spanglishfixithostcomp";
}
const joinUrl = `${baseUrl}?session=${sessionId}`;
generateQRCode(joinUrl);
    });
  });
}

function generateQRCode(url) {
  const qrContainer = document.getElementById("qr-code");
  qrContainer.innerHTML = ""; // Clear any previous QR
  new QRCode(qrContainer, {
    text: url,
    width: 160,
    height: 160,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}


    if (createBtn && joinBtn && sessionInput) {
  // For creating a game (player1)
  createBtn.addEventListener("click", () => {
    promptForPlayerName((name) => {
      currentPlayerId = name; // Use custom name for player1
      currentSessionId = createGameSession(sentences);
      joinGameSession(currentSessionId, currentPlayerId);
      
      // Hide the single-player start button and show waiting message
      document.getElementById("start").style.display = "none";
      const waitingMessage = document.createElement('div');
      waitingMessage.id = 'waiting';
      waitingMessage.style.fontSize = '24px';
      waitingMessage.style.marginTop = '10px';
      waitingMessage.textContent = "Waiting for another player to join...";
      document.getElementById("game-container").appendChild(waitingMessage);
      
      // Mark game as active and show the session ID for sharing
      window.game.gameActive = true;
      console.log("Multiplayer session created & joined as", currentPlayerId, "with session ID:", currentSessionId);
      sessionInput.value = currentSessionId;
    });
  });

  // For joining a game (player2)
  joinBtn.addEventListener("click", () => {
    const roomId = sessionInput.value.trim();
    if (!roomId) return;
    promptForPlayerName((name) => {
      currentSessionId = roomId;
      currentPlayerId = name; // Use custom name for player2
      joinGameSession(currentSessionId, currentPlayerId);
    });
  });
}

    // Attach your existing event listeners:
    document.getElementById("close-instructions").addEventListener("click", () => {
        document.getElementById("instructions-overlay").style.display = "none";
    });
    document.getElementById("restart").addEventListener("click", () => this.restartGame());
    document.getElementById("review").addEventListener("click", () => this.startReview());
    this.setupInputListener();
    this.updateBestScoreDisplay();
}

    updateBestScoreDisplay() {
        let storedBest = localStorage.getItem("bestScoreSpanglish") || 0;
        document.getElementById("bestScore").textContent = storedBest;
    }

    updateSentence() {
  // Re-enable answer input for the new round.
  document.getElementById("answer").disabled = false;

  if (this.reviewMode) {
    // In review mode, use the length of wrongAnswers
    if (this.currentIndex >= this.wrongAnswers.length) {
      document.getElementById("sentence").innerHTML = "Review complete!";
      document.getElementById("answer").style.display = "none";
      document.getElementById("feedback").textContent = "";
      this.reviewMode = false;
      return;
    }
    document.getElementById("counter").textContent = `Review: ${this.currentIndex + 1}/${this.wrongAnswers.length}`;
  } else {
    // Normal game mode: check against totalSentences
    if (this.currentIndex >= this.totalSentences) {
      this.endGame();
      return;
    }
    document.getElementById("counter").textContent = `Sentence: ${this.currentIndex + 1}/${this.totalSentences}`;
  }

  const currentSet = this.reviewMode ? this.wrongAnswers : this.sentences;
  const currentSentence = currentSet[this.currentIndex];
  const sentenceParts = currentSentence.sentence.split(" ");
  let sentenceHTML = sentenceParts.map((word) => `<span class="clickable-word">${word}</span>`).join(" ");
  document.getElementById("sentence").innerHTML = sentenceHTML;

  // Re-enable clicking for new sentence
  document.getElementById("sentence").style.pointerEvents = "auto";

  // Start the 30-second phase timer for scoring (max 100 points, min 10)
  this.startClickTime = Date.now();
  if (this.pointsInterval) clearInterval(this.pointsInterval);
  this.pointsInterval = setInterval(() => {
    let elapsed = Date.now() - this.startClickTime;
    let availablePoints = Math.max(100 - Math.floor(elapsed / 300), 10);
    let percentage = ((availablePoints - 10) / (100 - 10)) * 100;
    document.getElementById("points-bar").style.width = percentage + "%";
  }, 100);

  // Attach click listeners to each word
  const clickableWords = document.querySelectorAll(".clickable-word");
  clickableWords.forEach((wordElement) => {
    wordElement.addEventListener("click", () => {
      this.handleWordClick(wordElement, currentSentence);
    });
  });
}

    handleWordClick(wordElement, currentSentence) {
    if (this.pointsInterval) {
        clearInterval(this.pointsInterval);
        this.pointsInterval = null;
    }
    const clickedWord = wordElement.textContent;
    // Record the clicked word in the current sentence:
    currentSentence.clickedWord = clickedWord;
    
    const cleanedClickedWord = clickedWord.replace(/[^\w\s]|_/g, "").trim().toLowerCase();
    const cleanedErrorWord = currentSentence.errorWord.replace(/[^\w\s]|_/g, "").trim().toLowerCase();
    const clickTime = Date.now() - this.startClickTime;
        if (this.reviewMode) {
            // In review mode, simply highlight correct/incorrect and proceed
            if (cleanedClickedWord === cleanedErrorWord) {
                wordElement.style.color = 'green';
            } else {
                wordElement.style.color = 'red';
            }
            const correctWordElements = document.querySelectorAll('.clickable-word');
            correctWordElements.forEach((element) => {
                if (element.textContent.replace(/[^\w\s]|_/g, "").trim().toLowerCase() === cleanedErrorWord) {
                    element.style.color = 'green';
                }
            });
            // Remove listeners so further clicks don’t register
            document.getElementById("sentence").style.pointerEvents = "none";
            this.selectErrorWord(clickedWord);
            return;
        }
        // Normal game mode: update score based on click speed
        if (cleanedClickedWord === cleanedErrorWord) {
            let clickScore = Math.max(100 - Math.floor(clickTime / 300), 10);
            this.score += clickScore;
            wordElement.style.color = 'green';
        } else {
            this.score -= 50;
            wordElement.style.color = 'red';
            if (!this.wrongAnswers.includes(currentSentence)) {
                this.wrongAnswers.push(currentSentence);
            }
        }
        document.getElementById("score").textContent = this.score;
        const correctWordElements = document.querySelectorAll('.clickable-word');
        correctWordElements.forEach((element) => {
            if (element.textContent.replace(/[^\w\s]|_/g, "").trim().toLowerCase() === cleanedErrorWord) {
                element.style.color = 'green';
            }
        });
        // Disable further clicks for this sentence
        document.getElementById("sentence").style.pointerEvents = "none";
        this.selectErrorWord(clickedWord);
    }

    selectErrorWord(word) {
        this.currentErrorWord = word;
        document.getElementById("feedback").textContent = `You selected "${word}". Now, type the correction.`;
        if (this.pointsInterval) {
            clearInterval(this.pointsInterval);
            this.pointsInterval = null;
        }
        this.startCorrectionTime = Date.now();
        document.getElementById("points-bar").style.width = "100%";
        this.pointsInterval = setInterval(() => {
            let elapsed = Date.now() - this.startCorrectionTime;
            let availablePoints = Math.max(100 - Math.floor(elapsed / 300), 10);
            let percentage = ((availablePoints - 10) / (100 - 10)) * 100;
            document.getElementById("points-bar").style.width = percentage + "%";
        }, 100);
        document.getElementById("answer").focus();
    }

    checkAnswer() {
  const input = document.getElementById("answer");
  // If input is already disabled, ignore additional submissions.
  if (input.disabled) return;
  
  // If no error word was clicked yet, do not proceed.
  if (!this.currentErrorWord) {
    document.getElementById("feedback").textContent = "Please click on the incorrect word first!";
    return;
  }
  
  if (this.pointsInterval) {
    clearInterval(this.pointsInterval);
    this.pointsInterval = null;
  }
  if (!this.gameActive && !this.reviewMode) return;
  
  // Disable the input so that the player cannot submit again this round.
  input.disabled = true;

  const userInput = input.value.trim().toLowerCase();
  const currentSet = this.reviewMode ? this.wrongAnswers : this.sentences;
  const currentSentence = currentSet[this.currentIndex];
  const correctionTime = Date.now() - this.startCorrectionTime;
  let possibleAnswers = currentSentence.correctAnswer;
  if (!Array.isArray(possibleAnswers)) {
    possibleAnswers = [possibleAnswers];
  }
  possibleAnswers = possibleAnswers.map(answer => answer.toLowerCase());
  // Record the student's answer and correctness for the final report.
  currentSentence.studentAnswer = userInput;
  currentSentence.wasCorrect = possibleAnswers.includes(userInput);

  // -----------------------
  // REVIEW MODE BRANCH
  // -----------------------
  if (this.reviewMode) {
    if (possibleAnswers.includes(userInput)) {
      let correctionScore = Math.max(100 - Math.floor(correctionTime / 300), 10);
      this.score += correctionScore;
      document.getElementById("score").textContent = this.score;
      input.classList.add("correct");
      document.getElementById("feedback").textContent = `Correct. The answer is: ${possibleAnswers.join(" / ")}`;

      setTimeout(() => {
        input.classList.remove("correct");
        input.value = "";
        // Submit the answer (with answer text) to Firebase so both players sync:
        submitAnswer(this.score, userInput);
        // Then advance to the next sentence locally:
        this.currentIndex++;
        this.currentErrorWord = null;
        this.updateSentence();
      }, 1000);
    } else {
      input.classList.add("incorrect");
      document.getElementById("feedback").textContent = `Incorrect. The correct answer is: ${possibleAnswers.join(" / ")}`;

      setTimeout(() => {
        input.classList.remove("incorrect");
        input.value = "";
        this.currentIndex++;
        this.currentErrorWord = null;
        this.updateSentence();
      }, 1000);
    }
    return;
  }

  // -----------------------
  // NORMAL MODE BRANCH
  // -----------------------
  if (possibleAnswers.includes(userInput)) {
    let correctionScore = Math.max(100 - Math.floor(correctionTime / 300), 10);
    this.score += correctionScore;
    document.getElementById("score").textContent = this.score;
    input.classList.add("correct");
    document.getElementById("feedback").textContent = `Correct. The answer is: ${possibleAnswers.join(" / ")}`;
    
    setTimeout(() => {
      input.classList.remove("correct");
      input.value = "";
      // Submit the answer (with answer text) to Firebase so both players sync:
      submitAnswer(this.score, userInput);
      // (Do not update this.currentIndex or call updateSentence() here; these are updated via Firebase.)
    }, 1000);
  } else {
    this.score -= 50;
    if (!this.wrongAnswers.some(item => item.sentence === currentSentence.sentence)) {
      this.wrongAnswers.push({
        sentence: currentSentence.sentence,
        errorWord: currentSentence.errorWord,
        correctAnswer: currentSentence.correctAnswer,
        studentAnswer: userInput
      });
    }
    document.getElementById("score").textContent = this.score;
    input.classList.add("incorrect");
    document.getElementById("feedback").textContent = `Incorrect. The correct answer is: ${possibleAnswers.join(" / ")}`;
    
    setTimeout(() => {
      input.classList.remove("incorrect");
      input.value = "";
      // Submit the answer (with answer text) to Firebase so both players sync:
      submitAnswer(this.score, userInput);
    }, 1000);
  }
}


    // No overall timer now, so startTimer() is removed.

    endGame() {
  this.gameActive = false;
  if (this.pointsInterval) clearInterval(this.pointsInterval);

  if (currentSessionId) {
    const sessionRef = firebase.database().ref('gameSessions/' + currentSessionId);
    sessionRef.once('value').then((snapshot) => {
      // Retrieve the session data and log it for debugging
      const sessionData = snapshot.val() || {};
      console.log("endGame() sessionData:", sessionData);

      // Safely get players data, even if it might be missing
      const players = sessionData.players || {};
      const player1Score = players.player1 ? players.player1.score : 0;
      const player2Score = players.player2 ? players.player2.score : 0;
      const p1Name = players.player1 ? players.player1.name : "Player 1";
      const p2Name = players.player2 ? players.player2.name : "Player 2";

      // Determine the winner message
      let winnerMessage = "";
      if (player1Score > player2Score) {
        winnerMessage = `${p1Name} wins!`;
      } else if (player2Score > player1Score) {
        winnerMessage = `${p2Name} wins!`;
      } else {
        winnerMessage = "It's a tie!";
      }

      // Build the game over message
      let endMessage = `
          <div class="game-over" style="font-size: 36px; color: #FFD700; text-shadow: 2px 2px 4px #000;">
              Game Over!
          </div>
          <div style="font-size: 24px; margin-top: 10px;">
              <span style="color: ${player1Score >= player2Score ? '#00FF00' : '#FF0000'};">
                  ${p1Name} Score: ${player1Score}
              </span>
              &nbsp;&nbsp;&nbsp;
              <span style="color: ${player2Score >= player1Score ? '#00FF00' : '#FF0000'};">
                  ${p2Name} Score: ${player2Score}
              </span>
          </div>
          <div style="font-size: 28px; margin-top: 20px; color: #FFFFFF; text-shadow: 1px 1px 2px #000;">
              ${winnerMessage}
          </div>
          <button id="restart" style="
              margin-top: 20px;
              padding: 10px 20px;
              font-size: 18px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;">
              Restart Game
          </button>
      `;

      // Hide auxiliary UI elements that are not needed in game over state
      document.getElementById("instructionsText").style.display = "none";
      document.getElementById("feedback").textContent = "";
      document.getElementById("answer").style.display = "none";
      document.getElementById("points-bar").style.width = "0%";
      document.getElementById("counter").style.display = "none";

      // Replace the sentence area with the game over message
      document.getElementById("sentence").innerHTML = endMessage;

      // Show the download report button if present
      const reportButton = document.getElementById("downloadReport");
      if (reportButton) {
        reportButton.style.display = "block";
        if (!reportButton.dataset.listenerAdded) {
          reportButton.addEventListener("click", () => this.downloadReport());
          reportButton.dataset.listenerAdded = "true";
        }
      }

      // Attach the restart event listener
      document.getElementById("restart").addEventListener("click", () => this.restartGame());
    }).catch((error) => {
      console.error("Error retrieving game session data in endGame:", error);
    });
  }
}


restartGame() {
    this.gameActive = false;
    this.reviewMode = false;
    if (this.pointsInterval) clearInterval(this.pointsInterval);
    this.currentIndex = 0;
    this.score = 0;
    this.wrongAnswers = [];
    this.sentences = this.shuffle([...this.originalSentences].slice(0, 15));

    document.getElementById("score").textContent = this.score;
    document.getElementById("feedback").textContent = "";
    document.getElementById("sentence").textContent = "";
    document.getElementById("answer").value = "";

    // Re-show the answer input
    document.getElementById("answer").style.display = "block";

    // Re-show instructions paragraph
    document.getElementById("instructionsText").style.display = "block";

    // Reset counters, hide review, hide restart, show start
    document.getElementById("counter").textContent = "Sentence: 0/15";
    document.getElementById("review").style.display = "none";
    document.getElementById("restart").style.display = "none";
}


    downloadReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Build table rows for the 15 tested sentences:
  let tableRows = [];
  window.game.sentences.forEach((item, index) => {
    let correct = Array.isArray(item.correctAnswer)
      ? item.correctAnswer.join(" / ")
      : item.correctAnswer;
    
    // Use a placeholder if no answer was recorded.
    let choice = item.clickedWord ? item.clickedWord : "—";
    let correction = item.studentAnswer ? item.studentAnswer : "—";

    tableRows.push([
      (index + 1).toString(),  // Sentence #
      item.sentence,           // Full Sentence
      item.errorWord,          // Error Word
      choice,                  // Your Choice
      correct,                 // Correct Answer
      correction               // Your Correction
    ]);
  });

  // Add a title at the top
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 150);  // dark blue
  doc.text("Spanglish Fixit Challenge - Results", 14, 20);

  // Reset text color for table
  doc.setTextColor(0, 0, 0);

  // Build the table with the proper header.
  doc.autoTable({
    startY: 30,
    head: [["#", "Full Sentence", "Error Word", "Your Choice", "Correct Answer", "Your Correction"]],
    body: tableRows,
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    bodyStyles: { fillColor: [216, 216, 216], textColor: 0 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10, cellPadding: 3 },
    didParseCell: function(data) {
      // Our table rows come from window.game.sentences.
      // Columns: 0: Sentence #, 1: Full Sentence, 2: Error Word, 
      // 3: Your Choice, 4: Correct Answer, 5: Your Correction.
      if (data.section === 'body' && data.row.index < window.game.sentences.length) {
        let sentenceData = window.game.sentences[data.row.index];
        // For "Your Choice" (column index 3):
        if (data.column.index === 3) {
          let normalizedClicked = sentenceData.clickedWord 
            ? sentenceData.clickedWord.replace(/[^\w\s]/g, "").toLowerCase() 
            : "";
          let normalizedError = sentenceData.errorWord.replace(/[^\w\s]/g, "").toLowerCase();
          if (normalizedClicked === normalizedError) {
            data.cell.styles.textColor = [0, 128, 0]; // green
          } else {
            data.cell.styles.textColor = [255, 0, 0]; // red
          }
        }
        // For "Your Correction" (column index 5):
        if (data.column.index === 5) {
          let possible = Array.isArray(sentenceData.correctAnswer) 
            ? sentenceData.correctAnswer 
            : [sentenceData.correctAnswer];
          possible = possible.map(ans => ans.toLowerCase());
          let normalizedCorrection = sentenceData.studentAnswer 
            ? sentenceData.studentAnswer.toLowerCase() 
            : "";
          if (possible.includes(normalizedCorrection)) {
            data.cell.styles.textColor = [0, 128, 0]; // green
          } else {
            data.cell.styles.textColor = [255, 0, 0]; // red
          }
        }
      }
    }
  });

  // Save the PDF
  doc.save("SpanglishFixit_Report.pdf");
}


}

// Sample sentences for testing
const sentences = [
    { 
        sentence: "It depends of the person.", 
        errorWord: "of",
        correctAnswer: "on"
    },
    { 
        sentence: "There is too much air contamination in Madrid.", 
        errorWord: "contamination",
        correctAnswer: "pollution"
    },
    { 
        sentence: "I went to a bar last night but it was almost empty. There were little people there.", 
        errorWord: "little",
        correctAnswer: "few"
    },
    { 
        sentence: "I couldn’t assist the meeting.", 
        errorWord: "assist",
        correctAnswer: "attend"
    },
    { 
        sentence: "Today’s class was very bored.", 
        errorWord: "bored",
        correctAnswer: "boring"
    },
    { 
        sentence: "She usually lives with her friends, but actually, she's staying with her mum while she recovers.", 
        errorWord: "actually",
        correctAnswer: ["currently", "at the moment"]
    },
    { 
        sentence: "Don’t shout at him. He’s very sensible.", 
        errorWord: "sensible",
        correctAnswer: "sensitive"
    },
    { 
        sentence: "She presented me to her friend Bea.", 
        errorWord: "presented",
        correctAnswer: "introduced"
    },
    { 
        sentence: "I don’t have no money.", 
        errorWord: "no",
        correctAnswer: "any"
    },
    { 
        sentence: "She gave me some good advices.", 
        errorWord: "advices",
        correctAnswer: "advice"
    },
    { 
        sentence: "I did a big effort.", 
        errorWord: "did",
        correctAnswer: "made"
    },
    { 
        sentence: "It’s an important amount of material.", 
        errorWord: "important",
        correctAnswer: ["significant", "considerable"]
    },
    {
        sentence: "I’m thinking in buying a new car.",
        errorWord: "in",
        correctAnswer: ["about", "of"]
    },
    {
        sentence: "The exam consists in 5 different papers.",
        errorWord: "in",
        correctAnswer: "of"
    },
    {
        sentence: "It was a real deception when I failed the exam.",
        errorWord: "deception",
        correctAnswer: "disappointment"
    },
    {
        sentence: "My favourite travel was when I went to Thailand.",
        errorWord: "travel",
        correctAnswer: "trip"
    },
    {
        sentence: "He’s absolutely compromised to the company’s goals.",
        errorWord: "compromised",
        correctAnswer: "committed"
    },
    {
        sentence: "This is your final advice! Don’t be late again.",
        errorWord: "advice",
        correctAnswer: "warning"
    },
    {
        sentence: "If you approve this final test, you’ll get the job.",
        errorWord: "approve",
        correctAnswer: "pass"
    },
    {
        sentence: "Could you give me the direction for the new offices?",
        errorWord: "direction",
        correctAnswer: "address"
    },
    {
        sentence: "They got very bad notes in their exams.",
        errorWord: "notes",
        correctAnswer: ["marks", "grades"]
    },
    {
        sentence: "You shouldn’t talk to the bus conductor while she’s driving.",
        errorWord: "conductor",
        correctAnswer: "driver"
    },
    {
        sentence: "We stayed in a camping, but it was dirty and overcrowded.",
        errorWord: "camping",
        correctAnswer: ["campsite", "camp site"]
    },
    {
        sentence: "Is there a public parking near here?",
        errorWord: "parking",
        correctAnswer: ["car park", "parking lot"]
    },
    {
        sentence: "Were you expecting to see him there or was it just a casualty?",
        errorWord: "casualty",
        correctAnswer: "coincidence"
    },
    {
        sentence: "I really can’t support people like that!",
        errorWord: "support",
        correctAnswer: "stand"
    },
    {
        sentence: "I don’t eat jam because I’m a vegetarian.",
        errorWord: "jam",
        correctAnswer: "ham"
    },
    {
        sentence: "I always take a coffee before going to work.",
        errorWord: "take",
        correctAnswer: ["have", "drink"]
    },
    {
        sentence: "That was a very long history.",
        errorWord: "history",
        correctAnswer: "story"
    },
    {
        sentence: "It was a very tired journey.",
        errorWord: "tired",
        correctAnswer: "tiring"
    },
    {
        sentence: "I have afraid of spiders.",
        errorWord: "have",
        correctAnswer: "am"
    },
    {
        sentence: "I had lucky to get the job.",
        errorWord: "had",
        correctAnswer: "was"
    },
    {
        sentence: "People is always telling me that.",
        errorWord: "is",
        correctAnswer: "are"
    },
    {
        sentence: "I organized a big party but anybody came.",
        errorWord: "anybody",
        correctAnswer: ["nobody", "no one"]
    },
    {
        sentence: "I have a carpet here with all the relevant documents.",
        errorWord: "carpet",
        correctAnswer: "folder"
    },
    {
        sentence: "She’s responsible of training new employees.",
        errorWord: "of",
        correctAnswer: "for"
    },
    {
        sentence: "At the moment, I’m unemployment, but I’m looking for a job.",
        errorWord: "unemployment",
        correctAnswer: "unemployed"
    },
    {
        sentence: "My wife and I often discuss about stupid things.",
        errorWord: "discuss",
        correctAnswer: "argue"
    },
    {
        sentence: "You can’t avoid me from seeing my friends.",
        errorWord: "avoid",
        correctAnswer: ["prevent", "stop"]
    },
    {
        sentence: "I wish it doesn’t rain during your holiday!",
        errorWord: "wish",
        correctAnswer: "hope"
    },
    {
        sentence: "Atleti won Real Madrid last night.",
        errorWord: "won",
        correctAnswer: "beat"
    },
    {
        sentence: "I’ll have a shower before go out.",
        errorWord: "go",
        correctAnswer: "going"
    },
    {
        sentence: "Sarah doesn’t think he’s coming today but I think yes.",
        errorWord: "yes",
        correctAnswer: "so"
    },
    {
        sentence: "For a long and healthy life, it’s important to practise sport regularly.",
        errorWord: "practise",
        correctAnswer: "do"
    },
    {
        sentence: "The factory needs to contract more staff over the summer.",
        errorWord: "contract",
        correctAnswer: ["hire", "employ", "take on"]
    },
    {
        sentence: "I’ve never been in London, but I would really like to go.",
        errorWord: "in",
        correctAnswer: "to"
    },
    {
        sentence: "Don’t put attention to anything they say.",
        errorWord: "put",
        correctAnswer: "pay"
    },
    {
        sentence: "He’s talking with the phone right now.",
        errorWord: "with",
        correctAnswer: "on"
    },
    {
        sentence: "The flight was cancelled for the weather.",
        errorWord: "for",
        correctAnswer: ["because of", "due to"]
    },
    {
        sentence: "I have known them since seven years.",
        errorWord: "since",
        correctAnswer: "for"
    },
    {
        sentence: "I don’t know how it is called.",
        errorWord: "how",
        correctAnswer: "what"
    },
    {
        sentence: "I have a doubt about this.",
        errorWord: "doubt",
        correctAnswer: "question"
    },
    {
        sentence: "I have a lot of homeworks.",
        errorWord: "homeworks",
        correctAnswer: "homework"
    },
    {
        sentence: "She’s very good in maths.",
        errorWord: "in",
        correctAnswer: "at"
    },
    {
        sentence: "They remembered me of my cousins.",
        errorWord: "remembered",
        correctAnswer: "reminded"
    },
    {
        sentence: "She’s married with an Ethiopian man.",
        errorWord: "with",
        correctAnswer: "to"
    },
    {
        sentence: "I like going to a disco at the weekend.",
        errorWord: "disco",
        correctAnswer: "club"
    },
    {
        sentence: "He’s so educated. He always treats everybody with a lot of respect.",
        errorWord: "educated",
        correctAnswer: "polite"
    },
    {
        sentence: "He needs to go to university because he pretends to be a doctor.",
        errorWord: "pretends",
        correctAnswer: ["intends", "wants", "hopes"]
    },
    {
        sentence: "The noise from the neighbour’s house is molesting me.",
        errorWord: "molesting",
        correctAnswer: ["bothering", "annoying", "disturbing", "irritating"]
    },
    {
        sentence: "I liked the movie, but it was a little large for me.",
        errorWord: "large",
        correctAnswer: "long"
    },
    {
        sentence: "He got a great punctuation in the game.",
        errorWord: "punctuation",
        correctAnswer: "score"
    },
    {
        sentence: "Can you borrow me your pen?",
        errorWord: "borrow",
        correctAnswer: "lend"
    },
    {
        sentence: "She works as a commercial in a bank.",
        errorWord: "commercial",
        correctAnswer: ["saleswoman", "salesperson"]
    },
    {
        sentence: "They said me to wait here.",
        errorWord: "said",
        correctAnswer: "told"
    },
    {
        sentence: "They all agreed that rock-climbing would be more funny.",
        errorWord: "funny",
        correctAnswer: "fun"
    },
    {
        sentence: "Did you know that Jane is going to make a party on Friday?",
        errorWord: "make",
        correctAnswer: "have"
    },
    { 
        sentence: "There’s plenty more soap if you’re still hungry.", 
        errorWord: "soap", 
        correctAnswer: "soup"
    },
    { 
        sentence: "We knew each other in 1996.", 
        errorWord: "knew", 
        correctAnswer: "met"
    },
    { 
        sentence: "I lived in Japan during three years.", 
        errorWord: "during", 
        correctAnswer: "for"
    },
    { 
        sentence: "I have two brothers, María and Juan.", 
        errorWord: "brothers", 
        correctAnswer: "siblings"
    },
    { 
        sentence: "Jane works very hardly. She’s a workaholic.", 
        errorWord: "hardly", 
        correctAnswer: "hard"
    },
    { 
        sentence: "Our teacher puts us too much homework.", 
        errorWord: "puts", 
        correctAnswer: ["gives", "sets"]
    },
    { 
        sentence: "I prefer spending time with another people.", 
        errorWord: "another", 
        correctAnswer: "other"
    },
    { 
        sentence: "I usually visit my family in Christmas.", 
        errorWord: "in", 
        correctAnswer: "at"
    },
    { 
        sentence: "Tim’s not as taller as me.", 
        errorWord: "taller", 
        correctAnswer: "tall"
    },
    { 
        sentence: "It’s one of the safest city in the world.", 
        errorWord: "city", 
        correctAnswer: "cities"
    },
    { 
        sentence: "How many time do you need?", 
        errorWord: "many", 
        correctAnswer: "much"
    },
    { 
        sentence: "I'm watching a great serie at the moment.", 
        errorWord: "serie", 
        correctAnswer: "series"
    }
];


// Create and store the game instance globally
window.game = new SpanglishFixitGame(sentences);


// -------------------------------
// Firebase Multiplayer Functions
// -------------------------------

// Create a new game session and store it in Firebase
function createGameSession(allSentences) {
  // Shuffle & slice to 15
  const selected = [...allSentences].sort(() => Math.random() - 0.5).slice(0, 15);
  const newSessionRef = firebase.database().ref("gameSessions").push();
  newSessionRef.set({
    sentences: selected,  // Only 15 are stored
    currentRound: -1, // Game not started until host triggers start
    roundStartTime: Date.now(),
    players: {},
    createdAt: Date.now()
  });
  console.log("Created game session with ID:", newSessionRef.key);
  return newSessionRef.key;
}

function createHostGameSession(allSentences, hostName) {
  const selected = [...allSentences].sort(() => Math.random() - 0.5).slice(0, 15);
  const newSessionRef = firebase.database().ref("gameSessions").push();
  newSessionRef.set({
    sentences: selected,
    currentRound: -1,  // <--- Must be -1 so the game waits for host
    roundStartTime: Date.now(),
    players: {},
    createdAt: Date.now(),
    host: { name: hostName }
  });
  console.log("Created host game session with ID:", newSessionRef.key);
  return newSessionRef.key;
}

function joinGameSession(sessionId, userEnteredName) {
  const sessionRef = firebase.database().ref('gameSessions/' + sessionId);

  // Hide the single-player Start button so that multiplayer users are not confused.
  const startBtn = document.getElementById("start");
  if (startBtn) startBtn.style.display = "none";

  // 1. One-time fetch of the 15 sentences from Firebase and store them locally.
  sessionRef.once('value').then((snapshot) => {
    const data = snapshot.val();
    if (data && data.sentences) {
      window.game.sentences = data.sentences;
    }
  });

  // 2. Determine which player slot is free.
  sessionRef.child('players').once('value').then((snapshot) => {
    const playersData = snapshot.val() || {};
    let newPlayerKey;
    if (!playersData.player1) {
      newPlayerKey = 'player1';
    } else if (!playersData.player2) {
      newPlayerKey = 'player2';
    } else {
      console.error("Session is already full (2 players).");
      return;
    }

    // 3. Set the player's data with their custom name.
    sessionRef.child('players').child(newPlayerKey).set({
      name: userEnteredName,
      score: 0,
      hasAnswered: false
    });

    // Update global session and player ID.
    currentSessionId = sessionId;
    currentPlayerId = newPlayerKey;

    // Mark the game as active on this client.
    window.game.gameActive = true;
    window.game.currentIndex = -1;

    // 4. Attach a realtime listener for multiplayer updates.
    sessionRef.on('value', (snapshot) => {
      const gameState = snapshot.val();
      console.log("Game session updated:", gameState);
      if (!gameState) return;

      // ----- Ensure both players are connected -----
      if (!gameState.players || Object.keys(gameState.players).length < 2) {
        document.getElementById("feedback").textContent = "Waiting for another player to join...";
        return;
      }

      // ----- Waiting for Game Start (currentRound == -1) -----
      if (gameState.currentRound === -1) {
        if (currentPlayerId === "host") {
          // Show a Start Game button for the host if not already displayed.
          if (!window.startButtonDisplayed) {
            window.startButtonDisplayed = true;
            const startButton = document.createElement("button");
            startButton.id = "hostStartGame";
            startButton.textContent = "Start Game";
            startButton.style.padding = "10px 20px";
            startButton.style.fontSize = "18px";
            startButton.style.marginTop = "10px";
            startButton.style.background = "#28a745";
            startButton.style.color = "white";
            startButton.style.border = "none";
            startButton.style.borderRadius = "5px";
            startButton.addEventListener("click", () => {
              sessionRef.update({
                currentRound: 0,
                roundOver: false,
                roundStartTime: Date.now()
              });
              startButton.remove();
              window.startButtonDisplayed = false;
            });
            document.getElementById("feedback").textContent = "";
            document.getElementById("game-container").appendChild(startButton);
          }
        } else {
          document.getElementById("feedback").textContent = "Waiting for host to start the game...";
        }
        return; // Do not proceed until the game has started.
      }

      // ----- Game in Progress: Update Round & Sentence -----
      document.getElementById("counter").textContent = `Round: ${gameState.currentRound + 1}`;
      if (window.game.currentIndex !== gameState.currentRound) {
        window.game.currentIndex = gameState.currentRound;
        window.game.updateSentence();
      }

      // ----- Round Over: Wait for Host Trigger -----
      if (gameState.roundOver && !window.overlayDisplayed) {
  window.overlayDisplayed = true;
  if (currentPlayerId === "host") {
    showHostIntermission(gameState.sentences[gameState.currentRound], gameState);
  } else {
    showPlayerIntermission(gameState.sentences[gameState.currentRound], gameState);
  }
}
  // If the round is no longer over, remove the player's overlay and update the sentence.
if (!gameState.roundOver) {
  const overlay = document.getElementById("intermission");
  if (overlay) overlay.remove();
  window.overlayDisplayed = false; // Reset flag
  if (window.game.currentIndex !== gameState.currentRound) {
    window.game.currentIndex = gameState.currentRound;
    window.game.updateSentence();
  }
}
    });
  });
}

// -------------------------------
// Example Usage:
// -------------------------------

// To create a multiplayer session, call createGameSession with your sentences array:
// const sessionId = createGameSession(sentences);
// You can then display this sessionId on the UI so another player can join.

// To join a multiplayer session, use joinGameSession with the room ID and a unique player identifier:
// joinGameSession("theRoomIdFromUI", "player1");

// ------------------------------------------------------
// You can integrate these functions with new UI elements such as:
// - A "Create Multiplayer Game" button that calls createGameSession(sentences)
// - An input field for a room ID and a "Join Multiplayer Game" button that calls joinGameSession(roomId, playerId)
// ------------------------------------------------------

function submitAnswer(newScore, answerText) {
  if (!currentSessionId || !currentPlayerId) {
    console.error("Session ID or player ID is not set.");
    return;
  }
  const sessionRef = firebase.database().ref('gameSessions/' + currentSessionId);

  // Update the player's score, mark as answered, and store their answer:
  sessionRef.child('players').child(currentPlayerId).update({
    score: newScore,
    hasAnswered: true,
    lastAnswer: answerText
  });

  // Check if both players have answered, then set roundOver flag:
  sessionRef.once('value', (snapshot) => {
    const sessionData = snapshot.val();
    const players = sessionData.players;
    if (
      players.player1 && players.player1.hasAnswered &&
      players.player2 && players.player2.hasAnswered &&
      !sessionData.roundOver
    ) {
      sessionRef.update({
        roundOver: true,
        roundOverTime: Date.now()
      });
    }
  });
}

function showIntermission(currentSentence, sessionData) {
  const sessionRef = firebase.database().ref('gameSessions/' + currentSessionId);
  
  // Retrieve players from the session data
  const p1 = sessionData.players.player1;
  const p2 = sessionData.players.player2;
  
  // Determine which player is leading
  let firstPlayer, secondPlayer;
  if (p1.score >= p2.score) {
    firstPlayer = p1;
    secondPlayer = p2;
  } else {
    firstPlayer = p2;
    secondPlayer = p1;
  }
  
  // Create an intermission overlay element with enhanced visuals
  const intermissionDiv = document.createElement('div');
  intermissionDiv.id = 'intermission';
  intermissionDiv.style.position = 'absolute';
  intermissionDiv.style.top = '50%';
  intermissionDiv.style.left = '50%';
  intermissionDiv.style.transform = 'translate(-50%, -50%)';
  intermissionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  intermissionDiv.style.padding = '30px';
  intermissionDiv.style.borderRadius = '12px';
  intermissionDiv.style.boxShadow = '0px 0px 20px rgba(0, 0, 0, 0.5)';
  intermissionDiv.style.zIndex = '2000';
  intermissionDiv.style.color = '#fff';
  intermissionDiv.style.fontFamily = "'Poppins', sans-serif";
  
  // Format the correct answer (handling arrays if necessary)
  const correctText = Array.isArray(currentSentence.correctAnswer)
    ? currentSentence.correctAnswer.join(" / ")
    : currentSentence.correctAnswer;
  
  // Build the inner HTML using the custom names and ordering by score
  intermissionDiv.innerHTML = `
    <h2 style="margin-top: 0; font-size: 28px;">Round Complete!</h2>
    <p style="font-size: 20px;">
      <strong>Error Word:</strong> 
      <span style="color: #FF4D4D; font-weight: bold;">${currentSentence.errorWord}</span>
    </p>
    <p style="font-size: 20px;">
      <strong>Correct Word:</strong> 
      <span style="color: #66FF66; font-weight: bold;">${correctText}</span>
    </p>
    <hr style="border: 1px solid #555; margin: 20px 0;">
    <p style="font-size: 20px;">
      <strong style="color: #00FF00;">${firstPlayer.name} Score:</strong> ${firstPlayer.score}
    </p>
    <p style="font-size: 20px;">
      <strong style="color: #FF0000;">${secondPlayer.name} Score:</strong> ${secondPlayer.score}
    </p>
    <p style="font-size: 18px; margin-top: 20px;">
      Next round starting in <span id="intermissionCountdown">5</span> seconds
    </p>
  `;
  
  document.getElementById("game-container").appendChild(intermissionDiv);
  
  // Set countdown to 5 seconds
  let countdown = 5;
  const intermissionInterval = setInterval(() => {
    countdown--;
    document.getElementById("intermissionCountdown").textContent = countdown;
    if (countdown <= 0) {
      clearInterval(intermissionInterval);
      intermissionDiv.remove();
      // Advance to the next round by updating Firebase:
      const newRound = sessionData.currentRound + 1;
      sessionRef.update({
        currentRound: newRound,
        roundStartTime: Date.now(),
        roundOver: false  // Clear the roundOver flag
      });
      // Reset answer flags for both players
      sessionRef.child('players').child('player1').update({ hasAnswered: false });
      sessionRef.child('players').child('player2').update({ hasAnswered: false });
      window.overlayDisplayed = false;
    }
  }, 1000);
}

// Now define startMultiplayerGame() at top level, not inside submitAnswer()
function startMultiplayerGame() {
  promptForPlayerName((name) => {
    currentPlayerId = name; // Use the custom name for player1
    currentSessionId = createGameSession(sentences);
    joinGameSession(currentSessionId, currentPlayerId);

    // Hide the single-player Start button
    document.getElementById("start").style.display = "none";

    // Display a waiting message for player1 until another player joins
    const waitingMessage = document.createElement('div');
    waitingMessage.id = 'waiting';
    waitingMessage.style.fontSize = '24px';
    waitingMessage.style.marginTop = '10px';
    waitingMessage.textContent = "Waiting for another player to join...";
    document.getElementById("game-container").appendChild(waitingMessage);

    // Mark the game as active in multiplayer mode
    window.game.gameActive = true;
    console.log("Multiplayer session created & joined as", currentPlayerId, "with session ID:", currentSessionId);
  });
}

function startCountdown() {
  let countdown = 5;
  const countdownEl = document.createElement("div");
  countdownEl.id = "countdown";
  countdownEl.style.fontSize = "24px";
  countdownEl.style.marginTop = "10px";
  document.getElementById("game-container").appendChild(countdownEl);

  const interval = setInterval(() => {
    countdownEl.textContent = `Game starting in ${countdown}...`;
    if (countdown <= 0) {
      clearInterval(interval);
      countdownEl.remove();
      // Start the game for both players after countdown
      window.game.startGame();
    }
    countdown--;
  }, 1000);
}

function promptForPlayerName(callback) {
  // Create an overlay element
  const overlay = document.createElement("div");
  overlay.id = "nameOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "3000";
  
  // Create inner content with aesthetics matching the game overlays
  overlay.innerHTML = `
    <div style="
      background: #333;
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      width: 80%;
      max-width: 400px;
      font-family: 'Poppins', sans-serif;
    ">
      <h2 style="margin-top: 0;">Enter Your Name</h2>
      <input type="text" id="playerNameInput" placeholder="Your name" style="
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: none;
          outline: none;
          text-align: center;
          display: block;
          margin: 10px auto;
          width: 80%;
      "/>
      <br/>
      <button id="submitPlayerName" style="
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 5px;
          transition: 0.3s;
      ">Submit</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Auto-select the input and allow submission with Enter key
  const input = document.getElementById("playerNameInput");
  input.focus();
  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      document.getElementById("submitPlayerName").click();
    }
  });
  
  document.getElementById("submitPlayerName").addEventListener("click", () => {
    const name = input.value.trim();
    if (name !== "") {
      document.body.removeChild(overlay);
      callback(name);
    } else {
      alert("Please enter a valid name.");
    }
  });
}

function joinGameSessionAsHost(sessionId, hostName) {
  const sessionRef = firebase.database().ref('gameSessions/' + sessionId);
  sessionRef.child('host').set({ name: hostName });

  // Hide single-player UI
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.style.display = "none";
  }

  let hostStatusDiv = document.getElementById("host-status");
if (!hostStatusDiv) {
  hostStatusDiv = document.createElement("div");
  hostStatusDiv.id = "host-status";
  // Style it like the game box:
  hostStatusDiv.style.background = "rgba(0, 0, 0, 0.8)";
  hostStatusDiv.style.padding = "20px";
  hostStatusDiv.style.borderRadius = "10px";
  hostStatusDiv.style.width = "90%";
  hostStatusDiv.style.maxWidth = "600px";
  hostStatusDiv.style.margin = "20px auto"; // Centers it and gives top margin
  hostStatusDiv.style.color = "#fff";
  // Place it above the multiplayer buttons:
  const multiDiv = document.getElementById("multiplayer-container");
  document.body.insertBefore(hostStatusDiv, multiDiv);
}

  sessionRef.on('value', (snapshot) => {
    const gameState = snapshot.val();
    if (!gameState) return;
    console.log("Host view update:", gameState);

    // Build minimal host view HTML:
let hostHtml = `<h2 style="margin-top: 0; font-size: 32px;">Host View</h2>`;
hostHtml += `<p style="font-size: 20px;">Current Round: ${gameState.currentRound === -1 ? "Not started" : (gameState.currentRound + 1)}</p>`;

if (gameState.currentRound >= 0 && gameState.currentRound < gameState.sentences.length) {
  const currentSentence = gameState.sentences[gameState.currentRound];
  // Display the sentence in a bigger, highlighted box:
  hostHtml += `<div style="font-size: 26px; font-weight: bold; background: #fff; color: #000; padding: 10px; border-radius: 5px; margin: 10px 0;">
                  ${currentSentence.sentence}
               </div>`;
}

// Also show the players’ names and scores:
if (gameState.players) {
  hostHtml += "<h3 style='font-size: 24px;'>Players</h3>";
  for (let playerKey in gameState.players) {
    let p = gameState.players[playerKey];
    hostHtml += `<p style="font-size: 18px;">${p.name}: Score ${p.score} ${p.hasAnswered ? "(Answered)" : "(Waiting)"}</p>`;
  }
}

// Update the hostStatusDiv with the new HTML:
hostStatusDiv.innerHTML = hostHtml;
    
    // **New Code:** If the game hasn't started yet (currentRound is -1),
    // and this client is the host, show the host's "Start Game" button.
    if (
  gameState.currentRound === -1 &&
  gameState.players &&
  Object.keys(gameState.players).length >= 2 &&
  currentPlayerId === "host" &&
  !window.startButtonDisplayed
) {
      window.startButtonDisplayed = true;
      const startButton = document.createElement("button");
      startButton.id = "hostStartGame";
      startButton.textContent = "Start Game";
      startButton.style.padding = "10px 20px";
      startButton.style.fontSize = "18px";
      startButton.style.marginTop = "10px";
      startButton.style.background = "#28a745";
      startButton.style.color = "white";
      startButton.style.border = "none";
      startButton.style.borderRadius = "5px";
      startButton.addEventListener("click", () => {
        sessionRef.update({
          currentRound: 0,
          roundOver: false,
          roundStartTime: Date.now()
        });
        startButton.remove();
        window.startButtonDisplayed = false;
      });
      hostStatusDiv.appendChild(startButton);
      document.getElementById("feedback").textContent = "";
      hostStatusDiv.appendChild(startButton);
    }
    
    // If the game is over or if the round has ended and the host hasn’t
    // triggered the next round, show the host intermission overlay.
    if (gameState.currentRound >= window.game.totalSentences) {
      console.log("Game over condition met on host.");
      window.game.endGame();
    } else if (gameState.roundOver && currentPlayerId === "host" && !window.overlayDisplayed) {
      console.log("Displaying host intermission for round " + (gameState.currentRound + 1));
      window.overlayDisplayed = true;
      showHostIntermission(gameState.sentences[gameState.currentRound], gameState);
    }
  });
}

function showHostIntermission(currentSentence, sessionData) {
  // Create a host-specific intermission overlay
  const intermissionDiv = document.createElement('div');
  intermissionDiv.id = 'host-intermission';
  intermissionDiv.style.position = 'absolute';
  intermissionDiv.style.top = '50%';
  intermissionDiv.style.left = '50%';
  intermissionDiv.style.transform = 'translate(-50%, -50%)';
  intermissionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  intermissionDiv.style.padding = '30px';
  intermissionDiv.style.borderRadius = '12px';
  intermissionDiv.style.boxShadow = '0px 0px 20px rgba(0, 0, 0, 0.5)';
  intermissionDiv.style.zIndex = '2000';
  intermissionDiv.style.color = '#fff';
  intermissionDiv.style.fontFamily = "'Poppins', sans-serif";
  
  let hostHtml = `<h2 style="margin-top: 0; font-size: 28px;">Round Complete!</h2>`;
  hostHtml += `<p style="font-size: 20px;"><strong>Error Word:</strong> <span style="color: #FF4D4D; font-weight: bold;">${currentSentence.errorWord}</span></p>`;
  hostHtml += `<p style="font-size: 20px;"><strong>Correct Word:</strong> <span style="color: #66FF66; font-weight: bold;">${Array.isArray(currentSentence.correctAnswer) ? currentSentence.correctAnswer.join(" / ") : currentSentence.correctAnswer}</span></p>`;
  hostHtml += `<hr style="border: 1px solid #555; margin: 20px 0;">`;
  
  hostHtml += `<h3 style="font-size: 24px;">Player Scores & Answers</h3>`;
  for (let key in sessionData.players) {
    const player = sessionData.players[key];
    hostHtml += `<p style="font-size: 20px;"><strong>${player.name}:</strong> Score: ${player.score} - Answer: ${player.lastAnswer || "No answer"}</p>`;
  }
  
  // Instead of an automatic countdown, the host clicks "Next Round" to advance.
  hostHtml += `<button id="nextRoundBtn" style="
      padding: 10px 20px;
      font-size: 18px;
      margin-top: 20px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: 0.3s;
  ">Next Round</button>`;
  
  intermissionDiv.innerHTML = hostHtml;
  document.body.appendChild(intermissionDiv);
  
  // When the host clicks "Next Round", update Firebase.
  document.getElementById("nextRoundBtn").addEventListener("click", () => {
  const sessionRef = firebase.database().ref("gameSessions/" + currentSessionId);

  // If we’re already at the final round, end the game:
  if (sessionData.currentRound >= window.game.totalSentences - 1) {
  // Move these two lines UP here so we always remove the overlay:
  intermissionDiv.remove();
  window.overlayDisplayed = false;
  
  // Mark currentRound so the host logic triggers endGame:
  sessionRef.update({ currentRound: window.game.totalSentences });
  return;
}

  // Otherwise, increment normally:
  const newRound = sessionData.currentRound + 1;
  sessionRef.update({
    currentRound: newRound,
    roundStartTime: Date.now(),
    roundOver: false
  });
  
  // Reset answer flags, remove overlay, etc.:
  sessionRef.child("players").child("player1").update({ hasAnswered: false });
  sessionRef.child("players").child("player2").update({ hasAnswered: false });
  intermissionDiv.remove();
  window.overlayDisplayed = false;
});
}

 function showPlayerIntermission(currentSentence, sessionData) {
  // Grab the players from sessionData:
  const p1 = sessionData.players.player1;
  const p2 = sessionData.players.player2;

  // Create the overlay container
  const intermissionDiv = document.createElement('div');
  intermissionDiv.id = 'intermission';
  intermissionDiv.style.position = 'absolute';
  intermissionDiv.style.top = '50%';
  intermissionDiv.style.left = '50%';
  intermissionDiv.style.transform = 'translate(-50%, -50%)';
  intermissionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  intermissionDiv.style.padding = '30px';
  intermissionDiv.style.borderRadius = '12px';
  intermissionDiv.style.boxShadow = '0px 0px 20px rgba(0, 0, 0, 0.5)';
  intermissionDiv.style.zIndex = '2000';
  intermissionDiv.style.color = '#fff';
  intermissionDiv.style.fontFamily = "'Poppins', sans-serif";

  // Format the correct answer
  const correctText = Array.isArray(currentSentence.correctAnswer)
    ? currentSentence.correctAnswer.join(" / ")
    : currentSentence.correctAnswer;

  // Build the HTML, including both players’ names and scores
  intermissionDiv.innerHTML = `
    <h2 style="margin-top: 0; font-size: 28px;">Round Complete!</h2>
    <p style="font-size: 20px;">
      <strong>Error Word:</strong>
      <span style="color: #FF4D4D; font-weight: bold;">${currentSentence.errorWord}</span>
    </p>
    <p style="font-size: 20px;">
      <strong>Correct Word:</strong>
      <span style="color: #66FF66; font-weight: bold;">${correctText}</span>
    </p>
    <hr style="border: 1px solid #555; margin: 20px 0;">
    
    <h3 style="font-size: 24px;">Scores</h3>
    <p style="font-size: 20px;">
      <strong>${p1.name}:</strong> ${p1.score}
    </p>
    <p style="font-size: 20px;">
      <strong>${p2.name}:</strong> ${p2.score}
    </p>

    <p style="font-size: 20px; margin-top: 20px;">
      Waiting for host to start the next round...
    </p>
  `;

  // Append the overlay to the game container
  document.getElementById("game-container").appendChild(intermissionDiv);
}


