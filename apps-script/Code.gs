function doGet(e) {
  var setNumber = (e && e.parameter && e.parameter.setNumber) || ''
  if (!/^[0-9A-Za-z]+-\d+$/.test(setNumber)) return json({ status: 'error', message: 'setNumber attendu, ex. 75356-1' })
  var cache = CacheService.getScriptCache()
  var cached = cache.get(setNumber)
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON)
  var out = { status: 'success', setNumber: setNumber, nameFr: legoNameFr(setNumber), brickset: brickset(setNumber) }
  var text = JSON.stringify(out)
  cache.put(setNumber, text, 21600)
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON)
}

function legoNameFr(setNumber) {
  var base = setNumber.replace(/-\d+$/, '')
  var res = UrlFetchApp.fetch('https://www.lego.com/fr-fr/service/building-instructions/' + base, { muteHttpExceptions: true })
  if (res.getResponseCode() !== 200) return null
  var re = /"name":"([^"]+)"/g
  var html = res.getContentText()
  var m
  while ((m = re.exec(html))) {
    if (m[1] !== 'The LEGO Group') return m[1].replace(/[™®]/g, '').trim()
  }
  return null
}

function brickset(setNumber) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('BRICKSET_API_KEY')
  if (!apiKey) return null
  var url =
    'https://brickset.com/api/v3.asmx/getSets?apiKey=' +
    encodeURIComponent(apiKey) +
    '&userHash=&params=' +
    encodeURIComponent(JSON.stringify({ setNumber: setNumber }))
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
  var body = JSON.parse(res.getContentText())
  var s = (body.sets || [])[0]
  if (!s) return null
  return { theme: s.theme, subtheme: s.subtheme, launchDate: s.launchDate, minifigs: s.minifigs }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
