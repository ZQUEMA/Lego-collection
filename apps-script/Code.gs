function doGet(e) {
  var setNumber = (e && e.parameter && e.parameter.setNumber) || ''
  if (!/^[0-9A-Za-z]+-\d+$/.test(setNumber)) return json({ status: 'error', message: 'setNumber attendu, ex. 75356-1' })
  var cache = CacheService.getScriptCache()
  var cached = cache.get(setNumber)
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON)
  var apiKey = PropertiesService.getScriptProperties().getProperty('BRICKSET_API_KEY')
  if (!apiKey) return json({ status: 'error', message: 'BRICKSET_API_KEY manquant dans les propriétés du script' })
  var url =
    'https://brickset.com/api/v3.asmx/getSets?apiKey=' +
    encodeURIComponent(apiKey) +
    '&userHash=&params=' +
    encodeURIComponent(JSON.stringify({ setNumber: setNumber }))
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
  var body = JSON.parse(res.getContentText())
  var out = {
    status: body.status,
    message: body.message,
    sets: (body.sets || []).map(function (s) {
      return {
        number: s.number + '-' + s.numberVariant,
        name: s.name,
        theme: s.theme,
        subtheme: s.subtheme,
        year: s.year,
        launchDate: s.launchDate,
        minifigs: s.minifigs
      }
    })
  }
  var text = JSON.stringify(out)
  if (out.status === 'success') cache.put(setNumber, text, 21600)
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON)
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
