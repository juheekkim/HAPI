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
    '',
  );

  // pg_dump often clears search_path for restore safety, but this runner executes
  // cumulative scripts in one session where an empty search_path breaks later files.
  return withoutTransactionTimeout.replace(
    /^\s*SELECT\s+pg_catalog\.set_config\('search_path'\s*,\s*''\s*,\s*false\)\s*;\s*$/gim,
    '',
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

      if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.sql')
      ) {
        return [fullPath];
      }

      return [];
    })
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
}

async function runScripts() {
  if (!fs.existsSync(scriptsDirectory)) {
    throw new Error(`SQL 스크립트 폴더가 없습니다: ${scriptsDirectory}`);
  }

  const sqlFiles = findSqlFiles(scriptsDirectory);

  if (sqlFiles.length === 0) {
    console.log('실행할 SQL 파일이 없습니다.');
    return;
  }

  const client = await pool.connect();

  const succeededFiles = [];
  const failedFiles = [];
  const skippedFiles = [];

  try {
    console.log(`총 ${sqlFiles.length}개의 SQL 파일을 실행합니다.\n`);

    for (const sqlFile of sqlFiles) {
      const relativePath = path.relative(process.cwd(), sqlFile);
      const sql = normalizeSqlForRunner(
        fs.readFileSync(sqlFile, 'utf8'),
      ).trim();

      if (!sql) {
        console.log(`- 건너뜀: ${relativePath} (빈 파일)`);

        skippedFiles.push(relativePath);
        continue;
      }

      console.log(`▶ 실행: ${relativePath}`);

      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL search_path TO public');
        await client.query(sql);
        await client.query('COMMIT');

        succeededFiles.push(relativePath);

        console.log(`✓ 완료: ${relativePath}\n`);
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(`ROLLBACK 실패: ${relativePath}`);
          console.error(rollbackError);
        }

        failedFiles.push({
          file: relativePath,
          message: error.message,
          code: error.code,
          position: error.position,
        });

        console.error(`✗ 실패: ${relativePath}`);
        console.error(`  오류 코드: ${error.code || '없음'}`);
        console.error(`  오류 내용: ${error.message}`);

        if (error.position) {
          console.error(`  SQL 위치: ${error.position}`);
        }

        console.log('  다음 SQL 파일을 계속 실행합니다.\n');

        // throw하지 않고 다음 파일로 계속 진행
      }
    }

    console.log('\n========== 실행 결과 ==========');
    console.log(`성공: ${succeededFiles.length}개`);
    console.log(`실패: ${failedFiles.length}개`);
    console.log(`건너뜀: ${skippedFiles.length}개`);

    if (failedFiles.length > 0) {
      console.log('\n실패한 SQL 파일:');

      for (const failure of failedFiles) {
        console.log(`- ${failure.file}`);
        console.log(`  ${failure.message}`);
      }

      // 일부 파일이 실패했으므로 프로세스 종료 코드는 실패로 설정
      process.exitCode = 1;
    } else {
      console.log('\n모든 SQL 파일이 정상적으로 실행되었습니다.');
    }
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