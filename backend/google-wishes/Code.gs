/**
 * Private Google Sheets storage and mobile moderation.
 * Deploy this folder in YOUR Apps Script account; never publish the Sheet.
 * Functions ending in "_" are private to Apps Script.
 */
// After changing this address, run activateWishNotifications from the editor.
var WISH_NOTIFICATION_EMAIL_ = 'zamandata98+wedding@gmail.com';

var WISH_HEADERS_ = [
  'ID',
  'Request ID',
  'Created at',
  'Name (JSON text)',
  'Wish (JSON text)',
  'Status',
  'Revision',
  'Updated at',
  'Email notification',
];

// Visible editor commands. Every one checks the signed-in caller before touching private setup.
function initializeWeddingWishes() {
  requireScriptOwner_();
  setup_();
}

function emailModeratorLink() {
  requireScriptOwner_();
  sendAdminLink_();
}

// Updates an existing installation and sends its current private moderation link.
function activateWishNotifications() {
  requireScriptOwner_();
  setup_();
  PropertiesService.getScriptProperties().setProperty('OWNER_EMAIL', WISH_NOTIFICATION_EMAIL_);
  sendAdminLink_();
}

function renewModeratorLink() {
  requireScriptOwner_();
  rotateModeratorKey_();
}

function requireScriptOwner_() {
  var active = '';
  var effective = '';
  try {
    active = Session.getActiveUser().getEmail().trim().toLowerCase();
    effective = Session.getEffectiveUser().getEmail().trim().toLowerCase();
  } catch (error) {
    throw new Error(
      'Authorize Google account email access in the updated manifest, then run this command from the Apps Script editor.',
    );
  }
  if (!active || !effective || active !== effective) {
    throw new Error(
      'Run this command from the Apps Script editor using the account that deployed the app.',
    );
  }
}

function setup_() {
  locked_(function () {
    var properties = PropertiesService.getScriptProperties();
    var sheetId = properties.getProperty('SHEET_ID');
    // In the editor, a script opened from Extensions > Apps Script can use its parent Sheet.
    // Web-app requests always use the stored ID through sheet_(), never active Sheet state.
    var spreadsheet = sheetId
      ? SpreadsheetApp.openById(sheetId)
      : SpreadsheetApp.getActiveSpreadsheet();
    var created = false;
    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create('Zaman & Nimra - Private wedding wishes');
      created = true;
    }
    var sheet = spreadsheet.getSheetByName('Wishes');
    if (!sheet) {
      if (created) {
        sheet = spreadsheet.getSheets()[0];
        sheet.setName('Wishes');
      } else {
        sheet = spreadsheet.insertSheet('Wishes');
      }
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(WISH_HEADERS_);
    } else {
      var headers = sheet.getRange(1, 1, 1, WISH_HEADERS_.length).getValues()[0];
      var matches = WISH_HEADERS_.every(function (header, index) {
        return headers[index] === header;
      });
      if (!matches) {
        throw new Error(
          'The existing Wishes tab has different columns. Rename that tab and run initializeWeddingWishes again. Its data has been kept.',
        );
      }
    }
    sheet.setFrozenRows(1);
    properties.setProperty('SHEET_ID', spreadsheet.getId());
    if (!properties.getProperty('MODERATOR_KEY'))
      properties.setProperty('MODERATOR_KEY', newKey_());
    if (!properties.getProperty('OWNER_EMAIL'))
      properties.setProperty('OWNER_EMAIL', WISH_NOTIFICATION_EMAIL_);
    if (!properties.getProperty('DAILY_LIMIT')) properties.setProperty('DAILY_LIMIT', '100');
    // No key or private Sheet URL is printed to the execution log.
  });
}

function sendAdminLink_() {
  var settings = settings_();
  MailApp.sendEmail({
    to: settings.email,
    subject: 'Your private wedding wishes moderation page',
    body:
      'Save this private link on your phone:\n\n' +
      adminLink_(settings.key) +
      '\n\nThis link gives permission to review and manage wishes. Keep it private. Open it, then tap Approve, Reject or Hide on a wish. Opening the link alone never publishes a wish.',
    name: 'Zaman & Nimra - Wedding Wishes',
  });
}

function rotateModeratorKey_() {
  PropertiesService.getScriptProperties().setProperty('MODERATOR_KEY', newKey_());
  sendAdminLink_();
}

function doGet(e) {
  var admin = Boolean(e && e.parameter && e.parameter.view === 'admin');
  var page = HtmlService.createTemplateFromFile('Index');
  page.pageConfig = JSON.stringify({ admin: admin, maxLength: 500 }).replace(/</g, '\\u003c');
  var output = page.evaluate().setTitle(admin ? 'Manage wedding wishes' : 'Wedding wishes');
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  // The guest widget can be embedded; moderation keeps the default frame protection.
  if (!admin) output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

function getPublicWishes() {
  return records_()
    .filter(function (entry) {
      return entry.status === 'approved';
    })
    .sort(newestFirst_)
    .slice(0, 200)
    .map(function (entry) {
      return { name: entry.name, message: entry.message, createdAt: entry.createdAt };
    });
}

function submitWish(input) {
  input = input || {};
  if (input.website) return { accepted: true };
  var name = text_(input.name, 100, 'Please enter a name of 100 characters or fewer.');
  var message = text_(input.message, 500, 'Please enter a wish of 500 characters or fewer.');
  var requestId = String(input.requestId || '');
  if (!/^[a-f0-9-]{36}$/i.test(requestId))
    throw new Error('Please reload the wish form and try again.');
  var settings = settings_();
  var saved = locked_(function () {
    var records = records_();
    var duplicate = records.find(function (entry) {
      return entry.requestId === requestId;
    });
    if (duplicate) {
      if (duplicate.name !== name || duplicate.message !== message)
        throw new Error('Please reload the form before sending a different wish.');
      return { entry: duplicate, duplicate: true };
    }
    var day = new Date().toISOString().slice(0, 10);
    var today = records.filter(function (entry) {
      return entry.createdAt.slice(0, 10) === day;
    }).length;
    if (today >= settings.dailyLimit)
      throw new Error(
        'We cannot accept more wishes right now. Please try later or contact the family.',
      );
    var now = new Date().toISOString();
    var id = Utilities.getUuid();
    var sheet = sheet_();
    // JSON strings start with a quote, so guest text cannot become a Sheet formula.
    sheet.appendRow([
      id,
      requestId,
      now,
      JSON.stringify(name),
      JSON.stringify(message),
      'pending',
      1,
      now,
      'waiting',
    ]);
    SpreadsheetApp.flush();
    return {
      entry: { id: id, name: name, message: message, rowNumber: sheet.getLastRow() },
      duplicate: false,
    };
  });
  if (!saved.duplicate) {
    var notified = false;
    try {
      if (MailApp.getRemainingDailyQuota() > 0) {
        MailApp.sendEmail({
          to: settings.email,
          subject: 'A new wedding wish is waiting for approval',
          body:
            'From: ' +
            name +
            '\n\n' +
            message +
            '\n\nReview on your phone:\n' +
            adminLink_(settings.key, saved.entry.id) +
            '\n\nThis wish is private until you explicitly tap Approve. You can later hide an approved wish from the same page.',
          name: 'Zaman & Nimra - Wedding Wishes',
        });
        notified = true;
      }
    } catch (error) {
      // Email failure must never discard a saved, pending wish.
      notified = false;
    }
    locked_(function () {
      sheet_()
        .getRange(saved.entry.rowNumber, 9)
        .setValue(notified ? 'sent' : 'unavailable');
    });
  }
  return { accepted: true };
}

function listModeration(key) {
  requireModerator_(key);
  return records_()
    .sort(newestFirst_)
    .map(function (entry) {
      return {
        id: entry.id,
        name: entry.name,
        message: entry.message,
        status: entry.status,
        revision: entry.revision,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        notification: entry.notification,
      };
    });
}

function moderateWish(key, id, action, revision) {
  requireModerator_(key);
  var statuses = { approve: 'approved', reject: 'rejected', hide: 'hidden' };
  if (!Object.prototype.hasOwnProperty.call(statuses, action))
    throw new Error('Choose Approve, Reject or Hide.');
  return locked_(function () {
    var record = records_().find(function (entry) {
      return entry.id === id;
    });
    if (!record) throw new Error('This wish no longer exists. Refresh the list.');
    if (record.revision !== Number(revision))
      throw new Error('This wish has changed. Refresh before deciding again.');
    sheet_()
      .getRange(record.rowNumber, 6, 1, 3)
      .setValues([[statuses[action], record.revision + 1, new Date().toISOString()]]);
    SpreadsheetApp.flush();
    return { id: id, status: statuses[action], revision: record.revision + 1 };
  });
}

function settings_() {
  var properties = PropertiesService.getScriptProperties();
  var settings = {
    sheetId: properties.getProperty('SHEET_ID'),
    key: properties.getProperty('MODERATOR_KEY'),
    email: properties.getProperty('OWNER_EMAIL'),
    dailyLimit: Number(properties.getProperty('DAILY_LIMIT') || 100),
  };
  if (!settings.sheetId || !settings.key || !settings.email)
    throw new Error('Wedding wishes are not ready yet. Please contact the family.');
  if (
    !Number.isInteger(settings.dailyLimit) ||
    settings.dailyLimit < 1 ||
    settings.dailyLimit > 1000
  )
    throw new Error('The wish limit needs to be checked by the family.');
  return settings;
}

function sheet_() {
  var sheet = SpreadsheetApp.openById(settings_().sheetId).getSheetByName('Wishes');
  if (!sheet) throw new Error('The wishes sheet is unavailable. Please contact the family.');
  return sheet;
}

function records_() {
  var sheet = sheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, WISH_HEADERS_.length)
    .getValues()
    .map(function (row, index) {
      return {
        rowNumber: index + 2,
        id: String(row[0]),
        requestId: String(row[1]),
        createdAt: String(row[2]),
        name: JSON.parse(String(row[3])),
        message: JSON.parse(String(row[4])),
        status: String(row[5]),
        revision: Number(row[6]),
        updatedAt: String(row[7]),
        notification: String(row[8]),
      };
    });
}

function requireModerator_(candidate) {
  var key = settings_().key;
  if (typeof candidate !== 'string' || candidate.length !== key.length)
    throw new Error('Use the private moderation link from your email.');
  var expected = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key);
  var actual = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, candidate);
  var difference = 0;
  for (var i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
  if (difference !== 0) throw new Error('Use the private moderation link from your email.');
}

function locked_(operation) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('The wishes page is busy. Please try again.');
  try {
    return operation();
  } finally {
    lock.releaseLock();
  }
}

function text_(value, maxLength, errorMessage) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength)
    throw new Error(errorMessage);
  return value.trim();
}

function newKey_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function newestFirst_(a, b) {
  return b.createdAt.localeCompare(a.createdAt);
}

function adminLink_(key, id) {
  // Explicit deployment URL avoids development/empty URLs returned by Service.getUrl().
  var url = (
    PropertiesService.getScriptProperties().getProperty('WEB_APP_URL') ||
    'https://script.google.com/macros/s/AKfycbzleNjgh9fz45xKNPbJ6tBSVrOiSzY6qvIBoujXUCcOMSmQlZu9wsAqKOuD96isMxvG/exec'
  ).trim();
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))
    throw new Error(
      'Set WEB_APP_URL in Script properties to the public Google web app URL ending in /exec.',
    );
  return (
    url +
    '?view=admin#key=' +
    encodeURIComponent(key) +
    (id ? '&wish=' + encodeURIComponent(id) : '')
  );
}
