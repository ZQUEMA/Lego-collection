function doGet(e) {
  if (e && e.parameter && e.parameter.rb) return rebrickable(e.parameter.rb)
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

function rebrickable(path) {
  if (!allowedRebrickablePath(path)) return json({ rbStatus: 400, body: { detail: 'Chemin Rebrickable refusé' } })
  var apiKey = PropertiesService.getScriptProperties().getProperty('REBRICKABLE_API_KEY')
  if (!apiKey) return json({ rbStatus: 500, body: { detail: 'REBRICKABLE_API_KEY manquant dans les propriétés du script' } })
  var cache = CacheService.getScriptCache()
  var key = 'rb:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, path))
  var cached = cache.get(key)
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON)
  var res = UrlFetchApp.fetch('https://rebrickable.com' + path, {
    headers: { Authorization: 'key ' + apiKey },
    muteHttpExceptions: true
  })
  var status = res.getResponseCode()
  var body
  try {
    body = JSON.parse(res.getContentText())
  } catch (err) {
    body = { detail: res.getContentText().slice(0, 200) }
  }
  var text = JSON.stringify({ rbStatus: status, body: body })
  if (status === 200) {
    try {
      cache.put(key, text, 21600)
    } catch (err) {}
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON)
}

function allowedRebrickablePath(path) {
  var cut = path.indexOf('?')
  var route = cut === -1 ? path : path.slice(0, cut)
  return route.indexOf('/api/v3/lego/') === 0 && /^[A-Za-z0-9_\/.-]+$/.test(route) && route.indexOf('..') === -1 && path.indexOf('#') === -1
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
