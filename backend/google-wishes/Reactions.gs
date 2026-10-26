/** Anonymous public reactions. The private store never exposes visitor hashes. */
var WISH_REACTION_TYPES_ = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];
var WISH_REACTION_HEADERS_ = ['Wish ID', 'Visitor hash', 'Reaction', 'Updated at'];
var WISH_REACTION_ROW_LIMIT_ = 20000;

function setPublicWishReaction(wishId, browserToken, reaction) {
  var visitor = wishReactionVisitor_(browserToken, true);
  if (
    typeof wishId !== 'string' ||
    !wishReactionUuid_(wishId) ||
    typeof reaction !== 'string' ||
    (reaction !== '' && WISH_REACTION_TYPES_.indexOf(reaction) < 0)
  )
    throw new Error('Please reload the wishes before reacting.');

  return locked_(function () {
    var wish = records_().find(function (entry) {
      return entry.id === wishId && entry.status === 'approved';
    });
    if (!wish) return { status: 'unavailable' };

    var sheet = wishReactionSheet_(false);
    var existing = null;
    wishReactionRows_(sheet).forEach(function (entry) {
      if (entry.id === wishId && entry.visitor === visitor) existing = entry;
    });
    // Repeated requests and removing a reaction that was never set do not write.
    if ((existing ? existing.reaction : '') !== reaction) {
      sheet = wishReactionSheet_(true);
      var now = new Date().toISOString();
      if (existing) {
        sheet.getRange(existing.rowNumber, 3, 1, 2).setValues([[reaction, now]]);
      } else {
        if (sheet.getLastRow() - 1 >= WISH_REACTION_ROW_LIMIT_)
          throw new Error('Reactions are unavailable right now. Please try later.');
        // Only validated IDs, a hexadecimal digest and a fixed enum reach Sheets.
        sheet.appendRow([wishId, visitor, reaction, now]);
      }
      SpreadsheetApp.flush();
    }
    var state = getPublicReactionState_([wishId], browserToken)[wishId];
    return { status: 'ready', id: wishId, counts: state.counts, selected: state.selected };
  });
}

/** Called once by the approved public wall read; omitting a token gives counts only. */
function getPublicReactionState_(approvedIds, browserToken, book) {
  var visitor = wishReactionVisitor_(browserToken, false);
  var result = {};
  approvedIds.forEach(function (id) {
    var counts = {};
    WISH_REACTION_TYPES_.forEach(function (type) {
      counts[type] = 0;
    });
    result[id] = { counts: counts, selected: '' };
  });
  var effective = {};
  wishReactionRows_(wishReactionSheet_(false, book)).forEach(function (entry) {
    if (Object.prototype.hasOwnProperty.call(result, entry.id))
      effective[entry.id + ':' + entry.visitor] = entry;
  });
  // A manually duplicated row still represents one visitor; the last row wins.
  Object.keys(effective).forEach(function (key) {
    var entry = effective[key];
    if (entry.reaction) result[entry.id].counts[entry.reaction]++;
    if (entry.visitor === visitor) result[entry.id].selected = entry.reaction;
  });
  return result;
}

function wishReactionUuid_(value) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
}

function wishReactionVisitor_(token, required) {
  if (!required && (token === undefined || token === null || token === '')) return '';
  if (typeof token !== 'string' || !wishReactionUuid_(token))
    throw new Error('Please reload the wishes before reacting.');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token.toLowerCase())
    .map(function (byte) {
      return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
    })
    .join('');
}

function wishReactionSheet_(create, spreadsheet) {
  spreadsheet = spreadsheet || SpreadsheetApp.openById(settings_().sheetId);
  var sheet = spreadsheet.getSheetByName('WishReactions');
  if (!sheet && !create) return null;
  if (!sheet) sheet = spreadsheet.insertSheet('WishReactions');
  if (sheet.getLastRow() === 0) {
    if (!create) return sheet;
    sheet.appendRow(WISH_REACTION_HEADERS_);
    sheet.setFrozenRows(1);
  } else {
    var headers = sheet.getRange(1, 1, 1, WISH_REACTION_HEADERS_.length).getValues()[0];
    if (
      !WISH_REACTION_HEADERS_.every(function (header, index) {
        return headers[index] === header;
      })
    )
      throw new Error('The reaction store needs to be checked by the family.');
  }
  return sheet;
}

function wishReactionRows_(sheet) {
  var lastRow = sheet ? sheet.getLastRow() : 0;
  if (lastRow < 2) return [];
  return sheet
    .getRange(2, 1, lastRow - 1, WISH_REACTION_HEADERS_.length)
    .getValues()
    .map(function (row, index) {
      return {
        rowNumber: index + 2,
        id: String(row[0]),
        visitor: String(row[1]),
        reaction: String(row[2]),
      };
    })
    .filter(function (entry) {
      return (
        wishReactionUuid_(entry.id) &&
        /^[a-f0-9]{64}$/.test(entry.visitor) &&
        (entry.reaction === '' || WISH_REACTION_TYPES_.indexOf(entry.reaction) >= 0)
      );
    });
}
