'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyDAPvG4Jm4erdBqMRSZ-Z_-libF38U_jEw",
//   authDomain: "iasabs.firebaseapp.com",
  authDomain: "points.michiganiasa.com",
  projectId: "iasabs",
  appId: "1:889007233830:web:25864097e9e29a66af3fe7"
};

firebase.initializeApp(firebaseConfig);

const provider = new firebase.auth.GoogleAuthProvider(); 
const db = firebase.database();

function hideWrappers(){
    document.getElementById("umichWrapper").style.display = "none";
    document.getElementById("notFoundWrapper").style.display = "none";
    document.getElementById("errorWrapper").style.display = "none";
    document.getElementById("loadingWrapper").style.display = "none";
    document.getElementById("pointsWrapper").style.display = "none";
    document.getElementById("loginWrapper").style.display = "none"
}

function setError(e){
    hideWrappers();

    document.getElementById("errorWrapper").style.display = '';
    document.getElementById("errorDetails").innerText = e.message;
}

function umichRequired(){
    hideWrappers();
    document.getElementById("umichWrapper").style.display = '';
}

function memberNotFound(){
    hideWrappers();
    document.getElementById("notFoundWrapper").style.display = '';
}

function setLoading(){
    hideWrappers();
    document.getElementById("loadingWrapper").style.display = '';
}


function populateDancerPoints(dancers){
    const table = document.getElementById("dancerPoints");
    table.style.display = '';
    document.getElementById("dancerHeader").style.display = '';

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
}

function populateEventsTable(memberData){
    const table = document.getElementById("eventsTable");
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

function setLiaisonData(user, danceName, dancers){
    hideWrappers();
    
    document.getElementById("name").innerText = user.displayName;
    
    document.getElementById("dancerHeader").innerText = danceName + " Dancers";
   
    document.getElementById("points").style.display = "none";
    document.getElementById("pointsWrapper").style.display = "flex"; 

    populateDancerPoints(dancers);
}

function setChoreoData(memberData, danceName, dancers){
    hideWrappers();

    document.getElementById("name").innerText = memberData.firstName + " " + memberData.lastName;

    document.getElementById("dancerHeader").innerText = danceName + " Dancers";

    document.querySelector("p#points span").innerText = memberData.points;
   
    document.getElementById("points").style.display = "inline";
    document.getElementById("pointsWrapper").style.display = "flex"; 

    populateEventsTable(memberData);
    populateDancerPoints(dancers)
}

function reset(){
    hideWrappers();

    document.getElementById("loginWrapper").style.display = "";
}

async function fetchData(user, uniqnameOverride){
    setLoading();
    const uniqname = uniqnameOverride ?? user.email.replace("@umich.edu", '');

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
        const danceName = choreoSnapshot.val();
        
        let dancers;
        try{
            dancers = await db.ref(`/dancers/${danceName}`).get();
        }catch(e){
            return setTimeout(() => setError(e), 0);
        }

        if(isLiaison)
            return setTimeout(() => setLiaisonData(user, danceName, dancers.val()), 0)
        return setTimeout(() => setChoreoData(memberSnapshot.val(), danceName, dancers.val()));            
    }
    if(isMember){
        return setTimeout(() => setMemberData(memberSnapshot.val()), 0);
    }
    return setTimeout(memberNotFound, 0);
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
        setError(error);
    });
}


document.getElementById("login").addEventListener("click", signin)

const choice = new URLSearchParams(window.location.search).get("choice");

if(choice === "Member"){
    fetchData(null, "ysinha");
}else if(choice == "Choreo"){
    fetchData(null, "kodei");
}
