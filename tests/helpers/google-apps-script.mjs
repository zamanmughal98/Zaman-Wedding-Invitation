import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';

const source = await readFile(
  new URL('../../backend/google-wishes/Code.gs', import.meta.url),
  'utf8',
);

/** Local stand-ins only: these never access Google or send email. */
export function googleBackend({
  key = 'a'.repeat(64),
  quota = 100,
  bound = false,
  initialProperties = {},
  initialTabs = { Sheet1: [] },
  initialize = true,
  activeEmail = 'owner@example.test',
  effectiveEmail = 'owner@example.test',
  identityUnavailable = false,
  serviceUrl = 'https://script.google.com/macros/s/LOCAL_TEST_ONLY/exec',
} = {}) {
  const properties = new Map(Object.entries(initialProperties));
  const tabs = new Map();
  const emails = [];
  const calls = { created: 0, opened: [], inserted: [] };
  let mailError = false;
  let lockAvailable = true;
  function makeSheet(name, initialRows = []) {
    const rows = initialRows.map((row) => [...row]);
    const sheet = {
      rows,
      appendRow(values) {
        rows.push([...values]);
        return sheet;
      },
      setName(value) {
        tabs.delete(name);
        name = value;
        tabs.set(name, sheet);
        return sheet;
      },
      setFrozenRows() {},
      getLastRow() {
        return rows.length;
      },
      getRange(row, column, height = 1, width = 1) {
        return {
          getValues: () =>
            rows
              .slice(row - 1, row - 1 + height)
              .map((values) => values.slice(column - 1, column - 1 + width)),
          setValue(value) {
            rows[row - 1][column - 1] = value;
          },
          setValues(values) {
            values.forEach((items, y) =>
              items.forEach((item, x) => {
                rows[row - 1 + y][column - 1 + x] = item;
              }),
            );
          },
        };
      },
    };
    tabs.set(name, sheet);
    return sheet;
  }
  for (const [name, rows] of Object.entries(initialTabs)) makeSheet(name, rows);
  const spreadsheet = {
    getId: () => initialProperties.SHEET_ID || (bound ? 'bound-sheet' : 'private-sheet'),
    getSheets: () => [...tabs.values()],
    getSheetByName: (name) => tabs.get(name) || null,
    insertSheet(name) {
      calls.inserted.push(name);
      return makeSheet(name);
    },
  };
  const propertyStore = {
    getProperty: (name) => properties.get(name) || null,
    setProperty(name, value) {
      properties.set(name, value);
    },
  };
  const context = vm.createContext({
    Session: {
      getActiveUser: () => ({
        getEmail() {
          if (identityUnavailable) throw new Error('Missing scope');
          return activeEmail;
        },
      }),
      getEffectiveUser: () => ({ getEmail: () => effectiveEmail }),
    },
    PropertiesService: { getScriptProperties: () => propertyStore },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => (bound ? spreadsheet : null),
      create() {
        calls.created++;
        return spreadsheet;
      },
      openById(id) {
        calls.opened.push(id);
        return spreadsheet;
      },
      flush() {},
    },
    LockService: { getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock() {} }) },
    Utilities: {
      getUuid: randomUUID,
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_algorithm, value) => Array.from(createHash('sha256').update(value).digest()),
    },
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail(message) {
        if (mailError) throw new Error('Mail unavailable');
        emails.push(message);
      },
    },
    ScriptApp: {
      getService: () => ({
        getUrl: () => serviceUrl,
      }),
    },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
      createTemplateFromFile() {
        const page = {};
        page.evaluate = () => {
          const output = {
            setTitle() {
              return output;
            },
            addMetaTag() {
              return output;
            },
            setXFrameOptionsMode(mode) {
              output.frame = mode;
              return output;
            },
            page,
          };
          return output;
        };
        return page;
      },
    },
  });
  vm.runInContext(source, context, { filename: 'Code.gs' });
  if (initialize) {
    context.setup_();
    properties.set('MODERATOR_KEY', key);
  }
  return {
    api: context,
    properties,
    tabs,
    emails,
    calls,
    key,
    get rows() {
      return tabs.get('Wishes')?.rows || [];
    },
    get sheet() {
      return tabs.get('Wishes');
    },
    failEmail: () => {
      mailError = true;
    },
    blockLock: () => {
      lockAvailable = false;
    },
  };
}
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const wishInput = (overrides = {}) => ({
  requestId: randomUUID(),
  name: 'A test guest',
  message: 'May Allah bless your new beginning.',
  ...overrides,
});
