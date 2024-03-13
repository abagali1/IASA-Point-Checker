const secret = PropertiesService.getScriptProperties().getProperty('firebaseSecret');
const danceRegex = /:?\sMagic #\d+/;


function getFirebaseUrl(jsonPath) {
  return (
    'https://iasabs-default-rtdb.firebaseio.com/' +
    jsonPath +
    '.json?auth=' +
    secret
  );
}

function syncDb(excelData, root) {
  const options = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(excelData)
  };
  const fireBaseUrl = getFirebaseUrl(root);

  UrlFetchApp.fetch(fireBaseUrl, options);
}

function syncDancers(){
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  const danceSheetName = "IASA Dance Roster";
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
    if(sheetData[i][1] !== ''){
      let data = {};

      if(sheetData[i][0] !== ''){
        dance = sheetData[i][0].replace(danceRegex, '');
      }

      let uniqname = sheetData[i][3].toLowerCase();

      data.firstName = sheetData[i][1];
      data.lastName = sheetData[i][2];
      data.requiredPoints = sheetData[i][9];
      data.currentPoints = sheetData[i][10]

      if(!(dance in dancers)){
        dancers[dance] = {};
      }
      dancers[dance][uniqname] = data;

      if(styleData[i][1] === 'bold'){
        choreos[uniqname] = dance;
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


  const eventStr = 10;
  const numEvents = 13;
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
        data.events.push(Object.fromEntries([[ events[j], sheetData[i][j + eventStr - 1] ]]))
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
