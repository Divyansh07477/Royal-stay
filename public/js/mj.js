const mjButton = document.getElementById("mjVoiceBtn");

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition;
let isListening = false;
let voices = [];


// =====================================================
// LOAD VOICES
// =====================================================

function loadVoices() {

    voices =
        window.speechSynthesis.getVoices();

    console.log("MJ Voices:", voices);
}

loadVoices();

window.speechSynthesis.onvoiceschanged =
    loadVoices;


// =====================================================
// DARK MODE SYSTEM
// =====================================================

const darkModeToggle =
    document.getElementById("darkModeToggle");


function applyDarkMode(isDark) {

    if (isDark) {

        document.body.classList.add("dark-mode");

        localStorage.setItem(
            "darkMode",
            "true"
        );

        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }

    } else {

        document.body.classList.remove("dark-mode");

        localStorage.setItem(
            "darkMode",
            "false"
        );

        if (darkModeToggle) {
            darkModeToggle.checked = false;
        }
    }
}


// =====================================================
// MANUAL TOGGLE
// =====================================================

if (darkModeToggle) {

    darkModeToggle.addEventListener(
        "change",
        function () {

            applyDarkMode(this.checked);

        }
    );
}


// =====================================================
// LOAD SAVED DARK MODE
// =====================================================

function loadDarkMode() {

    const saved =
        localStorage.getItem("darkMode");

    if (saved === "true") {

        applyDarkMode(true);

    } else {

        applyDarkMode(false);
    }
}


// Load immediately
loadDarkMode();


// =====================================================
// MJ DARK MODE COMMAND
// =====================================================

function setDarkModeFromMJ(enable) {

    applyDarkMode(enable);

    speakMJ(
        enable
            ? "Ji Boss, dark mode on kar diya."
            : "Ji Boss, light mode on kar diya."
    );
}


// =====================================================
// VOICE RECOGNITION
// =====================================================

if (SpeechRecognition && mjButton) {

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "hi-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.maxAlternatives =
        1;


    // =================================================
    // MIC BUTTON
    // =================================================

    mjButton.addEventListener(
        "click",
        () => {

            if (isListening) {
                return;
            }

            window.speechSynthesis.cancel();

            try {

                recognition.start();

                isListening = true;

                mjButton.classList.add(
                    "mj-listening"
                );

                console.log(
                    "MJ: Listening..."
                );

            } catch (error) {

                console.error(
                    "MJ Start Error:",
                    error
                );

            }

        }
    );


    // =================================================
    // MICROPHONE START
    // =================================================

    recognition.onstart =
        () => {

            isListening = true;

            mjButton.classList.add(
                "mj-listening"
            );

            console.log(
                "MJ microphone started"
            );
        };


    // =================================================
    // SPEECH RESULT
    // =================================================

    recognition.onresult =
        async (event) => {

            const message =
                event.results[0][0]
                    .transcript
                    .trim();

            console.log(
                "Boss:",
                message
            );

            isListening = false;

            mjButton.classList.remove(
                "mj-listening"
            );


            if (!message) {

                speakMJ(
                    "Boss, mujhe kuch sunai nahi diya."
                );

                return;
            }


            // =================================================
            // DIRECT COMMAND
            // =================================================

            const handled =
                handleDirectCommand(message);

            if (handled) {

                return;
            }


            // =================================================
            // GEMINI
            // =================================================

            await askMJ(message);

        };


    // =================================================
    // ERROR
    // =================================================

    recognition.onerror =
        (event) => {

            console.error(
                "MJ Voice Error:",
                event.error
            );

            isListening = false;

            mjButton.classList.remove(
                "mj-listening"
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                speakMJ(
                    "Boss, microphone ki permission de dijiye."
                );

            }

            else if (
                event.error ===
                "no-speech"
            ) {

                speakMJ(
                    "Boss, mujhe aapki awaaz sunai nahi di."
                );

            }

            else {

                speakMJ(
                    "Sorry Boss, voice mein thodi problem aa gayi."
                );
            }

        };


    // =================================================
    // RECOGNITION END
    // =================================================

    recognition.onend =
        () => {

            isListening = false;

            mjButton.classList.remove(
                "mj-listening"
            );

            console.log(
                "MJ microphone stopped"
            );

        };

}


// =====================================================
// BROWSER NOT SUPPORTED
// =====================================================

else if (mjButton) {

    mjButton.addEventListener(
        "click",
        () => {

            alert(
                "Boss, is browser mein voice recognition supported nahi hai."
            );

        }
    );
}


// =====================================================
// DIRECT COMMAND HANDLER
// =====================================================

function handleDirectCommand(message) {

    const text =
        message
            .toLowerCase()
            .trim();

    console.log(
        "MJ Direct Command:",
        text
    );

// =====================================================
// CREATE HOTEL
// =====================================================

if (
    text.includes("create hotel") ||
      text.includes("create hotel open kar") ||
    text.includes("create a hotel") ||
    text.includes("new hotel") ||
    text.includes("hotel create karo") ||
    text.includes("hotel banana hai") ||
    text.includes("hotel banao") ||
    text.includes("hotel create karna hai") ||
    text.includes("naya hotel banao") ||
    text.includes("naya hotel create karo")
) {

    console.log("MJ: CREATE HOTEL COMMAND DETECTED");

    speakMJ(
        "Create Hotel page open kar rahi hoon, Boss."
    );

    window.location.href = "/listings/new";

    return true;
}

// =====================================================
// MJ CREATOR / BUILDER
// =====================================================

if (
    text === "तुम्हें बिल्ड किसने किया" ||
    text === "तुम्हे बिल्ड किसने किया" ||
    text === "तुमको बिल्ड किसने किया" ||

    text.includes("बिल्ड किसने किया") ||
    text.includes("किसने बनाया") ||
    text.includes("किसने बिल्ड किया") ||
    text.includes("किसने बिल्ड") ||

    text.includes("tumhe kisne banaya") ||
    text.includes("tumhe kisne build kiya") ||
    text.includes("tumko kisne banaya") ||
    text.includes("tumko kisne build kiya") ||
    text.includes("kisne banaya") ||
    text.includes("kisne build kiya") ||
    text.includes("kisne build kya") ||

    text.includes("who built you") ||
    text.includes("who made you") ||
    text.includes("who created you")
) {

    console.log("MJ: CREATOR COMMAND DETECTED");

    speakMJ(
        "Mujhe Divyansh Singh ne build kiya hai. Woh mere Boss hain"
    );

    return true;
}
// =====================================================
// DIVYANSH INTRODUCTION


if (
    text.includes("divyansh singh") ||
    text.includes("divyansh kaun") ||
    text.includes("divyansh kon") ||
    text.includes("divyansh kon he") ||
    text.includes("kya tum divyansh ko jaanti ho") ||
    text.includes("kya tum divyansh ko janti ho") ||
    text.includes("who is divyansh") ||
    text.includes("who is divyansh singh")
) {

    console.log("MJ: DIVYANSH COMMAND DETECTED");

    speakMJ(
        "Divyansh mere boss hain. Main unki MJ hoon, AI assistant, aur woh Royal Stay ke owner hain."
    );

    return true;
}

//owner
if (
    text.includes("royal stay ka owner kon he") ||
    text.includes("royal stay ka owner kaun hai") ||
    text.includes("royal stay kiska hotel he") ||
    text.includes("royal stay kiska hai") ||
    text.includes("royal stay ka malik kon hai") ||
    text.includes("royal stay ka malik kaun hai") ||
    text.includes("who is the owner of royal stay") ||
    text.includes("who owns royal stay")
) {

    console.log("MJ: ROYAL STAY OWNER COMMAND DETECTED");

    speakMJ(
        "Royal Stay ke owner Divyansh Singh hain."
    );

    return true;
}
    // =================================================
    // HOME
    // =================================================

    if (

        text === "home" ||
        text.includes("home kholo") ||
        text.includes("home open") ||
        text.includes("home page") ||
        text.includes("ghar kholo") ||
        text.includes("homepage") ||
        text.includes("होम") ||
        text.includes("होम खोलो")

    ) {

        console.log(
            "MJ: Opening Home"
        );

        speakMJ(
            "Ji Boss, home page open kar rahi hoon."
        );

        setTimeout(
            () => {

                window.location.href =
                    "/";

            },
            300
        );

        return true;
    }


    // =================================================
    // SIGNUP
    // =================================================

    if (

        text.includes("signup") ||
        text.includes("sign up") ||
        text.includes("sign-up") ||
        text.includes("register") ||
        text.includes("registration") ||
        text.includes("signup kholo") ||
        text.includes("signup open") ||
        text.includes("sign up kholo") ||
        text.includes("register kholo") ||
        text.includes("naya account") ||
        text.includes("new account") ||
        text.includes("account banana") ||
        text.includes("account banao") ||
        text.includes("साइन अप") ||
        text.includes("साइनअप") ||
        text.includes("रजिस्टर")

    ) {

        console.log(
            "MJ: Opening Signup"
        );

        speakMJ(
            "Ji Boss, signup page open kar rahi hoon."
        );

        setTimeout(
            () => {

                window.location.href =
                    "/signup";

            },
            300
        );

        return true;
    }


    // =================================================
    // LOGIN
    // =================================================

    if (

        text.includes("login") ||
        text.includes("log in") ||
        text.includes("login kholo") ||
        text.includes("login open") ||
        text.includes("login page") ||
        text.includes("लॉगिन") ||
        text.includes("लॉग इन")

    ) {

        console.log(
            "MJ: Opening Login"
        );

        speakMJ(
            "Ji Boss, login page open kar rahi hoon."
        );

        setTimeout(
            () => {

                window.location.href =
                    "/login";

            },
            300
        );

        return true;
    }


    // =================================================
    // LOGOUT
    // =================================================

    if (

        text.includes("logout") ||
        text.includes("log out") ||
        text.includes("logout karo") ||
        text.includes("लॉगआउट")

    ) {

        speakMJ(
            "Ji Boss, logout kar rahi hoon."
        );

        setTimeout(
            () => {

                window.location.href =
                    "/logout";

            },
            300
        );

        return true;
    }


    // =================================================
    // DARK MODE
    // =================================================

    if (

        text.includes("dark mode") ||
        text.includes("dark mode") ||
        text.includes("darkmode") ||
        text.includes("dark karo") ||
        text.includes("dark kar do") ||
        text.includes("dark on") ||
        text.includes("dark chalu") ||
        text.includes("डार्क मोड") ||
        text.includes("डार्क करो")

    ) {

        console.log(
            "MJ: Dark Mode"
        );
   speakMJ(
            "Ji Boss, dark mode chalu kar rahi hoon."
        );
        setDarkModeFromMJ(true);

        return true;
    }


    // =================================================
    // LIGHT MODE
    // =================================================

    if (

        text.includes("light mode") ||
        text.includes("light mod") ||
        text.includes("lightmode") ||
        text.includes("light karo") ||
        text.includes("light kar do") ||
        text.includes("light on") ||
        text.includes("light chalu") ||
        text.includes("लाइट मोड") ||
        text.includes("लाइट करो")

    ) {

        console.log(
            "MJ: Light Mode"
        );

        speakMJ(
            "Ji Boss, light mode chalu kar rahi hoon."
        );

        setLightModeFromMJ(true);

        return true;
    }


    // =================================================
    // ALL HOTELS
    // =================================================

    if (

        text.includes("all hotels") ||
        text.includes("all hotel") ||
        text.includes("all listings") ||
        text.includes("saare hotels") ||
        text.includes("sare hotels") ||
        text.includes("sab hotels") ||
        text.includes("sabhi hotels") ||
        text.includes("saare hotel") ||
        text.includes("sare hotel") ||
        text.includes("सारे होटल") ||
        text.includes("सभी होटल")

    ) {

        console.log(
            "MJ: Opening All Hotels"
        );

        speakMJ(
            "Ji Boss, saare hotels open kar rahi hoon."
        );

        setTimeout(
            () => {

                window.location.href =
                    "/listings";

            },
            300
        );

        return true;
    }


    // =================================================
    // CATEGORY
    // =================================================

    const categories = {

        mountain:
            "Mountains",

        mountains:
            "Mountains",

        beach:
            "Beaches",

        beaches:
            "Beaches",

        camping:
            "Camping",

        castle:
            "Castle",

        luxury:
            "Luxury",

        pool:
            "Pools",

        pools:
            "Pools",

        arctic:
            "Arctic"

    };


    for (
        const key in categories
    ) {

        if (
            text.includes(key)
        ) {

            const category =
                categories[key];

            console.log(
                "MJ: Opening category:",
                category
            );

            speakMJ(
                `Ji Boss, ${category} category open kar rahi hoon.`
            );

            setTimeout(
                () => {

                    window.location.href =
                        `/listings/category/${category}`;

                },
                300
            );

            return true;
        }
    }


    // =================================================
    // SEARCH / HOTEL NAME
    // =================================================

    const searchWords = [

        "search",
        "find",
        "show",
        "dikhao",
        "dikhाओ",
        "khojo",
        "dhundo",
        "dhundho",
        "hotel",
        "listing",
        "होटल",
        "ढूंढो",
        "दिखाओ"

    ];


    const isSearchCommand =
        searchWords.some(
            word =>
                text.includes(word)
        );


    if (isSearchCommand) {

        console.log(
            "MJ: Hotel Search:",
            message
        );

        // Gemini actual hotel/category identify karega

        askMJ(message);

        return true;
    }


    return false;
}


// =====================================================
// SEND MESSAGE TO BACKEND
// =====================================================

async function askMJ(message) {

    console.log(
        "Sending to MJ:",
        message
    );


    try {

        const response =
            await fetch(
                "/api/mj",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                message

                        })

                }
            );


        console.log(
            "MJ HTTP Status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "MJ Response:",
            data
        );


        // =================================================
        // SERVER ERROR
        // =================================================

        if (!response.ok) {

            speakMJ(
                "Sorry Boss, abhi MJ available nahi hai."
            );

            return;
        }


        // =================================================
        // CATEGORY
        // =================================================

        if (

            data.action ===
                "category" &&

            data.url

        ) {

            if (data.reply) {

                speakMJ(
                    data.reply
                );
            }


            setTimeout(
                () => {

                    window.location.href =
                        data.url;

                },
                300
            );

            return;
        }


        // =================================================
        // HOTEL OPEN
        // =================================================

        if (

            data.action ===
                "open" &&

            data.url

        ) {

            console.log(
                "MJ Opening Hotel:",
                data.url
            );


            // =================================================
            // SAVE HOTEL INFORMATION
            // =================================================

            if (data.hotel) {

                const hotel =
                    data.hotel;


                const hotelInfo =

                    `Ji Boss, ${hotel.title}. ` +

                    `Ye ${hotel.category} category ka hotel hai. ` +

                    `Location ${hotel.location}, ${hotel.country} hai. ` +

                    `Iska price ${hotel.price} hai. ` +

                    `${hotel.description || ""}`;


                sessionStorage.setItem(
                    "mjHotelInfo",
                    hotelInfo
                );

            }

            else if (data.reply) {

                sessionStorage.setItem(
                    "mjHotelInfo",
                    data.reply
                );
            }


            // =================================================
            // OPENING MESSAGE
            // =================================================

            if (data.reply) {

                speakMJ(
                    data.reply
                );
            }


            // =================================================
            // OPEN HOTEL
            // =================================================

            setTimeout(
                () => {

                    window.location.href =
                        data.url;

                },
                300
            );

            return;
        }


        // =================================================
        // HOTEL INFORMATION
        // =================================================

        if (
            data.action ===
            "info"
        ) {

            if (data.reply) {

                speakMJ(
                    data.reply
                );
            }

            return;
        }


        // =================================================
        // SEARCH
        // =================================================

        if (
            data.action ===
            "search"
        ) {

            if (data.reply) {

                speakMJ(
                    data.reply
                );
            }

            return;
        }


        // =================================================
        // CHAT
        // =================================================

        if (data.reply) {

            speakMJ(
                data.reply
            );
        }


    }

    catch (error) {

        console.error(
            "MJ Frontend Error:",
            error
        );


        speakMJ(
            "Sorry Boss, server se connection nahi ho paaya."
        );

    }
}


// =====================================================
// MJ SPEAK
// =====================================================

function speakMJ(text) {

    if (!text) {
        return;
    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        "hi-IN";


    // Fast voice

    utterance.rate =
        1.15;

    utterance.pitch =
        1.08;

    utterance.volume =
        1;


    // =================================================
    // GET VOICES
    // =================================================

    if (!voices.length) {

        voices =
            window.speechSynthesis
                .getVoices();

    }



    // =================================================
    // HINDI FEMALE
    // =================================================

    const hindiFemale =
        voices.find(
            voice =>

                voice.lang
                    .toLowerCase()
                    .startsWith("hi") &&

                /female|woman|google/i
                    .test(
                        voice.name
                    )
        );


    // =================================================
    // ANY HINDI
    // =================================================

    const hindiVoice =
        voices.find(
            voice =>

                voice.lang
                    .toLowerCase()
                    .startsWith("hi")
        );


    // =================================================
    // FEMALE FALLBACK
    // =================================================

    const femaleVoice =
        voices.find(
            voice =>

                /female|woman|google/i
                    .test(
                        voice.name
                    )
        );


    if (hindiFemale) {

        utterance.voice =
            hindiFemale;

        console.log(
            "MJ Voice:",
            hindiFemale.name
        );

    }

    else if (hindiVoice) {

        utterance.voice =
            hindiVoice;

        console.log(
            "MJ Voice:",
            hindiVoice.name
        );

    }

    else if (femaleVoice) {

        utterance.voice =
            femaleVoice;

        console.log(
            "MJ Voice:",
            femaleVoice.name
        );
    }


    window.speechSynthesis.speak(
        utterance
    );
}


// =====================================================
// HOTEL INFORMATION AFTER PAGE LOAD
// =====================================================

window.addEventListener(
    "load",
    () => {

        const hotelInfo =
            sessionStorage.getItem(
                "mjHotelInfo"
            );


        if (!hotelInfo) {
            return;
        }


        console.log(
            "MJ Hotel Information:",
            hotelInfo
        );


        setTimeout(
            () => {

                speakMJ(
                    hotelInfo
                );


                sessionStorage.removeItem(
                    "mjHotelInfo"
                );

            },
            400
        );

    }
);