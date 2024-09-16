const secret = PropertiesService.getScriptProperties().getProperty('firebaseSecret');

function getFirebaseUrl(jsonPath) {
  return (
    'https://iasa-point-checker-default-rtdb.firebaseio.com/' +
    jsonPath +
    '.json?auth=' +
    secret
  );
}

function syncDb(excelData, root) {
  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(excelData),
  };
  const fireBaseUrl = getFirebaseUrl(root);

  UrlFetchApp.fetch(fireBaseUrl, options);
}

function syncDancers(){
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  const danceSheetName = "Dancer Points";
  let danceSheet = ss.getSheetByName(danceSheetName);

  const dataSr = 2;
  const sheetRange = danceSheet.getRange(dataSr, 1, danceSheet.getLastRow() - dataSr + 1, danceSheet.getLastColumn());

  const sheetData = sheetRange.getValues();
  const styleData = sheetRange.getFontWeights();
  const sourceLen = sheetData.length;

  let dance = '';
  let dancers = {};
  let choreos = {};
  for(let i=0;i < sourceLen;i++){
    if(sheetData[i][0][0] === '#'){
      dance = sheetData[i][0].slice(3);
    }
    if(dance !== '' && sheetData[i][0] !== 'First Name'){
      let data = {};

      let uniqname = sheetData[i][2].toLowerCase();

      if(uniqname){
        data.firstName = sheetData[i][0];
        data.lastName = sheetData[i][1];
        data.requiredPoints = sheetData[i][7];
        data.currentPoints = sheetData[i][6] == '' ? 0 : sheetData[i][6];

        if(!(dance in dancers)){
          dancers[dance] = {};
        }

        dancers[dance][uniqname] = data;

        if(styleData[i][1] === 'bold'){
          choreos[uniqname] = dance;
        }
      }
    }
  }
  syncDb(dancers, 'dancers');
  syncDb(choreos, 'choreos');
}

function syncMembers(){
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  const danceSheetName = "Members + Points";
  let danceSheet = ss.getSheetByName(danceSheetName);

  const dataSr = 3;
  const sheetRange = danceSheet.getRange(dataSr, 1, danceSheet.getLastRow() - dataSr + 1, danceSheet.getLastColumn());

  const sheetData = sheetRange.getValues();
  const sourceLen = sheetData.length;


  const eventStr = 11;
  const numEvents = 18;
  const events = danceSheet.getRange(1, eventStr, 1, numEvents).getValues()[0];


  let members = {};
  for(let i=0;i < sourceLen;i++){
    if(sheetData[i][1] !== ''){
      let data = {};
      let uniqname = sheetData[i][2].toLowerCase();

      data.firstName = sheetData[i][0];
      data.lastName = sheetData[i][1];
      data.points = sheetData[i][7];

      data.events = [];
      for(let j=0;j < numEvents;j++){
        if(!events[j].includes("Rehersal")){
          data.events.push(Object.fromEntries([[ events[j], sheetData[i][j + eventStr - 1] ]]))
        }
      }
      members[uniqname] = data;
    }
  }
  syncDb(members, 'members');
}


function sync(){
  syncDancers();
  syncMembers();
}
