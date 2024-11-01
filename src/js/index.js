'use strict';

const BOARD_EMAIL = "iasaboard24@umich.edu";
const IASA_SZN_START = new Date("2023-09-10T10:00:00+08:00"); // 10AM on 09/16/2024

const firebaseConfig = {
    apiKey: "AIzaSyBs5C4cP1lRjyF6naWcnP2NUUNmQTFzG7g",
    authDomain: "points.michiganiasa.com",
    projectId: "iasa-point-checker",
    appId: "1:423497471980:web:1c841323170e75fecc52c9"
  };

firebase.initializeApp(firebaseConfig);

const provider = new firebase.auth.GoogleAuthProvider(); 
const db = firebase.database();

// https://prathapreddy-mudium.medium.com/how-to-detect-a-clients-browser-name-using-javascript-fd0cab66f9ab
function popupHelpLink() {
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("Edg") > -1) {
        return "https://support.microsoft.com/en-us/microsoft-edge/block-pop-ups-in-microsoft-edge-1d8ba4f8-f385-9a0b-e944-aa47339b6bb5#ID0EDH";
    } else if (userAgent.indexOf("Chrome") > -1) {
        return "https://support.google.com/chrome/answer/95472?hl=en&co=GENIE.Platform%3DDesktop#zippy=%2Callow-pop-ups-and-redirects-from-a-site";
    } else if (userAgent.indexOf("Firefox") > -1) {
        return "https://support.mozilla.org/en-US/kb/pop-blocker-settings-exceptions-troubleshooting";
    } else if (userAgent.indexOf("Safari") > -1) {
        return "https://www.idownloadblog.com/2021/03/30/how-to-allow-pop-ups-in-safari/";
    }

    return null;
}

function hideWrappers(){
    document.getElementById("umichWrapper").style.display = "none";
    document.getElementById("notFoundWrapper").style.display = "none";
    document.getElementById("errorWrapper").style.display = "none";
    document.getElementById("loadingWrapper").style.display = "none";
    document.getElementById("pointsWrapper").style.display = "none";
    document.getElementById("loginWrapper").style.display = "none"
    document.getElementById("enablePopupWrapper").style.display = "none";
}

function setError(e){
    hideWrappers();

    document.getElementById("errorWrapper").style.display = '';
    document.getElementById("errorDetails").innerText = e.message;
}

function umichRequired(){
    hideWrappers();
    document.getElementById("umichWrapper").style.display = '';
    document.getElementById("loginWrapper").style.display = '';
}

function memberNotFound(){
    hideWrappers();
    document.getElementById("notFoundWrapper").style.display = '';
    document.getElementById("loginWrapper").style.display = '';
}

function setLoading(){
    hideWrappers();
    document.getElementById("loadingWrapper").style.display = '';
}

function enablePopups(){
    hideWrappers();

    let helpUrl = popupHelpLink();
    document.querySelector("#enablePopupWrapper h3").innerHTML = helpUrl ? 
        `Please <a href="${helpUrl}" class="underline text-blue-600" target="_blank">enable popups</a> to use the point checker` :
        "Please enable popups to use the point checker";

    document.getElementById("enablePopupWrapper").style.display = '';
    document.getElementById("loginWrapper").style.display = '';
}


function populateDancerPoints(danceName, dancers){
    const template = document.getElementsByTagName("template")[0];
    const clone = template.content.cloneNode(true);


    const table = clone.getElementById("dancerPoints");
    table.style.display = '';
    table.innerHTML = "<tr><th>Dancer Name (uniqname)</th><th>IASA Points (current/needed)</th></tr>"

    clone.getElementById("dancerHeader").innerText = danceName + " Dancers";
    clone.getElementById("dancerHeader").style.display = '';

    for(let uniqname in dancers){
        const row = table.insertRow();

        const dancer = dancers[uniqname];
        if(dancer.currentPoints != "NULL"){
            row.insertCell(0).innerHTML = `${dancer.firstName} ${dancer.lastName} (${uniqname})`;

            const enoughPoints = parseInt(dancer.currentPoints) >= parseInt(dancer.requiredPoints)

            if(enoughPoints){
                row.insertCell(1).innerHTML = `<p class="text-green-600">${dancer.currentPoints}/${dancer.requiredPoints}</p>`; 
            }else{
                row.insertCell(1).innerHTML = `<p class="text-red-400">${dancer.currentPoints}/${dancer.requiredPoints}</p>`;
            }
        }
    }

    document.getElementById("pointsWrapper").insertBefore(clone, document.getElementById("helpMessage"));
}

function populateEventsTable(memberData){
    const table = document.getElementById("eventsTable");
    table.innerHTML = "";
    table.style.display = '';
    document.getElementById('eventsHeader').style.display = '';

    const header = table.createTHead();
    const eventRow = table.insertRow(0);
    const pointRow = table.insertRow();

    const numEvents = memberData.events.length;
    for(let i=0;i<numEvents;i++){
        const val = Object.entries(memberData.events[i])[0];
        eventRow.insertCell(i).innerHTML = val[0];
        pointRow.insertCell(i).innerHTML = val[1] ? "&#9989;" : "&#10060;";
    }

}

function setMemberData(memberData){
    hideWrappers();

    document.getElementById("name").innerText = memberData.firstName + " " + memberData.lastName;
    document.querySelector("p#points span").innerText = memberData.points; 

    document.getElementById("pointsWrapper").style.display = "flex";
    populateEventsTable(memberData);
}

function setLiaisonData(user, danceNames, dancers){
    hideWrappers();

    document.getElementById("name").innerText = user.displayName;

    document.getElementById("points").style.display = "none";
    document.getElementById("pointsWrapper").style.display = "flex"; 

    for(let i=0;i<danceNames.length;i++)
        populateDancerPoints(danceNames[i], dancers[i]);
}

function setChoreoData(memberData, danceNames, dancers){
    hideWrappers();

    document.getElementById("name").innerText = memberData.firstName + " " + memberData.lastName;

    document.querySelector("p#points span").innerText = memberData.points;

    document.getElementById("points").style.display = "inline";
    document.getElementById("pointsWrapper").style.display = "flex"; 

    populateEventsTable(memberData);

    for(let i=0;i<danceNames.length;i++)
        populateDancerPoints(danceNames[i], dancers[i]);
}

function reset(){
    hideWrappers();

    document.getElementById("loginWrapper").style.display = "";
}

async function fetchData(user){
    setLoading();
    const uniqname = user.email.replace("@umich.edu", '');

    const memberRef = db.ref(`/members/${uniqname}`);
    const choreoRef = db.ref(`/choreos/${uniqname}`);

    let memberSnapshot, choreoSnapshot;
    try{
        [memberSnapshot, choreoSnapshot] = await Promise.all([memberRef.get(), choreoRef.get()]);
    }catch(e){
        return setTimeout(() => setError(e), 0);
    }

    const isMember = memberSnapshot.exists();
    const isChoreo = choreoSnapshot.exists();
    const isLiaison = !isMember && isChoreo;

    if(isChoreo){
        const allDanceNames = Object.keys(choreoSnapshot.val());
        const allDancers = []

        for(let i=0;i<allDanceNames.length;i++){
            try{
                const dancers = await db.ref(`/dancers/${allDanceNames[i]}`).get();
                allDancers.push(dancers.val());
            }catch(e){
                return setTimeout(() => setError(e), 0);
            }
        }

        if(isLiaison)
            return setTimeout(() => setLiaisonData(user, allDanceNames, allDancers), 0);
        return setTimeout(() => setChoreoData(memberSnapshot.val(), allDanceNames, allDancers));
    }
    if(isMember){
        return setTimeout(() => setMemberData(memberSnapshot.val()), 0);
    }
    return setTimeout(memberNotFound, 0);
    // ALWAYS call DOM update action in a setTimeout( () => {..}, 0) block for stable DOM state transitions. Read: https://stackoverflow.com/a/779785
}

async function signin(){
    reset();

    firebase.auth()
    .signInWithPopup(provider)
    .then(async (result) => {
        const user = result.user;

        if(!user.email.includes("umich.edu")){
            return setTimeout(umichRequired, 0);
        } 

        await fetchData(user);
    }).catch((error) => {
        if(error.code == "auth/popup-blocked"){
            return setTimeout(enablePopups, 0);
        }else{
            return setTimeout(() => setError(e), 0);
        }
    });
}

var timerInterval;
function timer(){
    let distance = IASA_SZN_START - (new Date().getTime());

    if (distance <= 0) {
        return setTimeout(() => location.reload(), 0);
    }

    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML = days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";
}

window.onload = () => {
    document.getElementById("login").addEventListener("click", signin);
    document.getElementById("helpEmail").textContent = BOARD_EMAIL;
    document.getElementById("helpEmail").href = "mailto:" + BOARD_EMAIL;

    if(Date.now() < IASA_SZN_START){
        document.getElementById("login").style.display = "none";

        timer(); // Start timer immediately and update every 1000 ms (1s)
        timerInterval = setInterval(() => {
            timer();
        }, 1000);
    }else{
        document.getElementById("countdownWrapper").style.display = "none";
    }
}
