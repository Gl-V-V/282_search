const openaiToken = 'ОПЕНАИ ТОКЕН'
const ss = SpreadsheetApp.openById('ID ТАБЛИЦЫ').getSheetByName('ИМЯ ЛИСТА')
const fileID = 'ID ФАЙЛА'

function gptSearch() {
 let file = DriveApp.getFileById(fileID)
 let json = JSON.parse ( file.getBlob().getAs('application/json').getDataAsString() )
 let messages = json.messages
 
 for (i=ss.getLastRow()-1;i<messages.length;i++){
  
  if (messages[i].type === 'message' && messages[i].text != '') {
    let msg = messages[i].text
    let arr = Array.isArray(messages[i].text)
    if (arr) {
      msg = messages[i].text.map(item => typeof item === 'object' ? item.text : item).join('');
    }
    console.log(msg)
    ss.getRange(i+1,1).setValue(messages[i].date)
    ss.getRange(i+1,2).setValue(msg.substring(0, msg.indexOf('\n') != -1 ? msg.indexOf('\n') : 40))
    ss.getRange(i+1,3).setValue(askGPT(msg))
    Utilities.sleep(30000)
    
  }
  if (i+1 >= messages.length){
      deleteTrigger()
      return
      }
 }
}

function askGPT(que) {
  
  const features = `Имеется текст: "${que}". Содержится ли в тексте пропаганда ЛГБТ? Содержится ли в тексте упоминание о геях или лесбиянках? Содержится ли в тексте информация о нетрадиционных отношениях?`
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const options = {
    method: 'post',
    headers: {
      Authorization: `Bearer ${openaiToken}`,
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
    payload: JSON.stringify(
     {
     "model": "gpt-3.5-turbo-16k",
     "messages": [{
                   "role": "user", 
                   "content": features,
                  }],
     "temperature": 0.7
     }),
  };
  const response = UrlFetchApp.fetch(apiUrl, options);
  const content = response.getContentText();
  console.log(content)

  let json = JSON.parse(content)

  if (json.error) {
    return json.error.message
  }

  return json.choices[0].message.content
}

function createTrigger() {
  ScriptApp.newTrigger('gptSearch')
      .timeBased()
      .everyMinutes(10)
      .create();
}

function deleteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'gptSearch') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
