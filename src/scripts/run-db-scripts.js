'use strict';

// db/scripts/**/*.sql 실행기 — 실행 이력(schema_migrations) 기반으로 "아직 실행하지 않은" 스크립트만 순번대로 실행한다.
//   npm run db:scripts                      미실행 스크립트만 실행
//   npm run db:scripts -- --status          실행/미실행 목록만 출력(DB 변경 없음)
//   npm run db:scripts -- --baseline <N>    N번 이하 스크립트를 "실행됨"으로 기록만 함(실행 안 함, 기존 DB 최초 1회)
// 이력이 비어 있는데 이미 테이블이 있는 DB(기존 DB)면 28/29번 스냅샷의 TRUNCATE 사고를 막기 위해 실행을 거부한다.
const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});

const scriptsDirectory = path.resolve(__dirname, '../../db/scripts');

const pool = require('../config/database');

function normalizeSqlForRunner(rawSql) {
  // PG17+ only GUC in pg_dump output can break execution on older servers.
  const withoutTransactionTimeout = rawSql.replace(
    /^\s*SET\s+transaction_timeout\s*=\s*0\s*;\s*$/gim,
    ''
  );

  // pg_dump often clears search_path for restore safety, but this runner executes
  // cumulative scripts in one session where an empty search_path breaks later files.
  return withoutTransactionTimeout.replace(
    /^\s*SELECT\s+pg_catalog\.set_config\('search_path'\s*,\s*''\s*,\s*false\)\s*;\s*$/gim,
    ''
  );
}

function findSqlFiles(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  return entries
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findSqlFiles(fullPath);
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.sql')) {
        return [fullPath];
      }

      return [];
    })
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
}

// 이력 키: db/scripts 기준 상대 경로(OS 무관하게 '/' 구분자)
function toScriptKey(fullPath) {
  return path.relative(scriptsDirectory, fullPath).split(path.sep).join('/');
}

function getScriptNumber(scriptKey) {
  const match = /^(\d+)_/.exec(path.posix.basename(scriptKey));
  return match ? Number(match[1]) : null;
}

function parseArgs(argv) {
  const options = { status: false, baseline: null };

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--status') {
      options.status = true;
    } else if (argv[i] === '--baseline') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 0) {
        throw new Error('--baseline 뒤에 스크립트 번호(정수)를 지정하세요. 예: --baseline 51');
      }
      options.baseline = value;
      i += 1;
    } else {
      throw new Error(`알 수 없는 옵션: ${argv[i]}`);
    }
  }

  return options;
}

async function ensureHistoryTable(client) {
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename   VARCHAR(255) PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       baseline   BOOLEAN NOT NULL DEFAULT false
     )`
  );
}

async function getAppliedSet(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((row) => row.filename));
}

async function recordApplied(client, scriptKey, baseline) {
  await client.query(
    `INSERT INTO schema_migrations (filename, baseline) VALUES ($1, $2)
     ON CONFLICT (filename) DO NOTHING`,
    [scriptKey, baseline]
  );
}

// 이력이 없는데 앱 테이블(users)이 이미 있으면 기존 DB로 판단
async function isExistingDatabase(client) {
  const { rows } = await client.query("SELECT to_regclass('public.users') AS name");
  return rows[0].name !== null;
}

async function runBaseline(client, scriptKeys, baselineNumber) {
  const targets = scriptKeys.filter((key) => {
    const number = getScriptNumber(key);
    return number !== null && number <= baselineNumber;
  });

  for (const key of targets) {
    await recordApplied(client, key, true);
  }

  console.log(
    `${baselineNumber}번 이하 ${targets.length}개 스크립트를 "실행됨"으로 기록했습니다(실제 실행 안 함).`
  );
}

async function runPending(client, sqlFiles, applied) {
  const pendingFiles = sqlFiles.filter((file) => !applied.has(toScriptKey(file)));

  if (pendingFiles.length === 0) {
    console.log('새로 실행할 SQL 파일이 없습니다. (DB가 최신 상태)');
    return;
  }

  if (applied.size === 0 && (await isExistingDatabase(client))) {
    console.error('실행 이력(schema_migrations)이 비어 있지만 이미 테이블이 있는 기존 DB입니다.');
    console.error(
      '전체 재실행 시 28/29번 스냅샷 스크립트가 데이터를 TRUNCATE하므로 실행을 중단합니다.'
    );
    console.error('이 DB에 이미 반영된 마지막 번호를 기록한 뒤 다시 실행하세요. 예:');
    console.error('  npm run db:scripts -- --baseline 51');
    process.exitCode = 1;
    return;
  }

  console.log(`미실행 SQL 파일 ${pendingFiles.length}개를 실행합니다.\n`);

  let succeeded = 0;

  for (const sqlFile of pendingFiles) {
    const scriptKey = toScriptKey(sqlFile);
    const sql = normalizeSqlForRunner(fs.readFileSync(sqlFile, 'utf8')).trim();

    if (!sql) {
      console.log(`- 건너뜀: ${scriptKey} (빈 파일, 실행됨으로 기록)`);
      await recordApplied(client, scriptKey, false);
      continue;
    }

    console.log(`▶ 실행: ${scriptKey}`);

    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL search_path TO public');
      await client.query(sql);
      await client.query('COMMIT');
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(`ROLLBACK 실패: ${scriptKey}`);
        console.error(rollbackError);
      }

      console.error(`✗ 실패: ${scriptKey}`);
      console.error(`  오류 코드: ${error.code || '없음'}`);
      console.error(`  오류 내용: ${error.message}`);

      if (error.position) {
        console.error(`  SQL 위치: ${error.position}`);
      }

      // 뒤 스크립트가 앞 스크립트 결과에 의존하므로 첫 실패에서 중단(실패 파일은 기록 안 함 → 수정 후 재실행 시 여기부터)
      console.error(`\n${succeeded}개 성공 후 중단했습니다. 원인을 해결한 뒤 다시 실행하세요.`);
      process.exitCode = 1;
      return;
    }

    // 스크립트 자체에 BEGIN/COMMIT이 있을 수 있어(예: 51번) 이력은 스크립트 커밋 이후 별도로 기록
    await recordApplied(client, scriptKey, false);
    succeeded += 1;
    console.log(`✓ 완료: ${scriptKey}\n`);
  }

  console.log(`\n모든 미실행 SQL 파일(${succeeded}개)이 정상적으로 실행되었습니다.`);
}

function printStatus(scriptKeys, applied) {
  const pending = scriptKeys.filter((key) => !applied.has(key));

  console.log(
    `전체 ${scriptKeys.length}개 / 실행됨 ${scriptKeys.length - pending.length}개 / 미실행 ${pending.length}개`
  );

  if (pending.length > 0) {
    console.log('\n미실행:');
    pending.forEach((key) => console.log(`- ${key}`));
  }
}

async function runScripts() {
  const options = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(scriptsDirectory)) {
    throw new Error(`SQL 스크립트 폴더가 없습니다: ${scriptsDirectory}`);
  }

  const sqlFiles = findSqlFiles(scriptsDirectory);
  const scriptKeys = sqlFiles.map(toScriptKey);

  const client = await pool.connect();

  try {
    await ensureHistoryTable(client);

    if (options.baseline !== null) {
      await runBaseline(client, scriptKeys, options.baseline);
      printStatus(scriptKeys, await getAppliedSet(client));
      return;
    }

    const applied = await getAppliedSet(client);

    if (options.status) {
      printStatus(scriptKeys, applied);
      return;
    }

    await runPending(client, sqlFiles, applied);
  } finally {
    client.release();
    await pool.end();
  }
}

runScripts().catch((error) => {
  console.error('\nSQL 실행 프로그램 자체에서 오류가 발생했습니다.');
  console.error(error);

  process.exitCode = 1;
});
