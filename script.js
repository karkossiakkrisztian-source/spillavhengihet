document.addEventListener("DOMContentLoaded", () => {

    let history = [];

    const startBtn = document.getElementById("startBtn");
    const finishBtn = document.getElementById("finishBtn");
    const sendBtn = document.getElementById("sendBtn");
    const restartBtn = document.getElementById("restartBtn");

    const chatBox = document.getElementById("chatBox");
    const input = document.getElementById("messageInput");

    function addMessage(type, text) {

        const div = document.createElement("div");

        div.className = type;
        div.textContent = text;

        chatBox.appendChild(div);

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    startBtn.addEventListener("click", () => {

        document
            .getElementById("startScreen")
            .classList.add("hidden");

        document
            .getElementById("testScreen")
            .classList.remove("hidden");
    });

    document
        .querySelectorAll('input[type="radio"]')
        .forEach(radio => {

            radio.addEventListener("change", updateProgress);

        });

    function updateProgress() {

        let answered = 0;

        for (let i = 1; i <= 5; i++) {

            if (
                document.querySelector(
                    `input[name="q${i}"]:checked`
                )
            ) {
                answered++;
            }
        }

        document.getElementById(
            "progressFill"
        ).style.width = `${answered * 20}%`;
    }

    finishBtn.addEventListener("click", analyse);

    async function analyse() {

        let total = 0;
        let answered = 0;

        for (let i = 1; i <= 5; i++) {

            const selected = document.querySelector(
                `input[name="q${i}"]:checked`
            );

            if (selected) {

                answered++;
                total += Number(selected.value);
            }
        }

        if (answered !== 5) {

            alert("Svar på alle spørsmål.");
            return;
        }

        document
            .getElementById("testScreen")
            .classList.add("hidden");

        document
            .getElementById("resultScreen")
            .classList.remove("hidden");

        const percent = (total / 15) * 100;

        document.getElementById(
            "scoreFill"
        ).style.width = `${percent}%`;

        document.getElementById(
            "scoreText"
        ).textContent = `Score ${total}/15`;

        finishBtn.disabled = true;

        try {

            const res = await fetch("chat.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message:
                        `Brukeren fikk ${total}/15 på spilltesten. Gi en vennlig analyse og konkrete råd.`,
                    history: []
                })
            });

            const data = await res.json();

            history = data.history || [];

            document.getElementById(
                "analysis"
            ).textContent =
                data.reply || "Ingen respons.";

            addMessage(
                "bot",
                "Hei 👋 Jeg har analysert spilltesten din. Hva lurer du på?"
            );

        } catch (err) {

            console.error(err);

            document.getElementById(
                "analysis"
            ).textContent =
                "Kunne ikke kontakte AI.";
        }

        finishBtn.disabled = false;
    }

    async function sendMessage() {

        const msg = input.value.trim();

        if (!msg) return;

        addMessage("user", msg);

        input.value = "";

        sendBtn.disabled = true;

        try {

            const res = await fetch("chat.php", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: msg,
                    history: history
                })
            });

            const data = await res.json();

            history = data.history || [];

            addMessage(
                "bot",
                data.reply || "Ingen respons."
            );

        } catch (err) {

            console.error(err);

            addMessage(
                "bot",
                "Kunne ikke kontakte AI."
            );
        }

        sendBtn.disabled = false;
    }

    sendBtn.addEventListener(
        "click",
        sendMessage
    );

    input.addEventListener(
        "keydown",
        e => {

            if (e.key === "Enter") {

                e.preventDefault();
                sendMessage();
            }
        }
    );

    restartBtn.addEventListener(
        "click",
        () => location.reload()
    );
});
