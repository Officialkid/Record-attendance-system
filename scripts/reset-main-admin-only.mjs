import { createSqlClient } from './_cap-env.mjs';

async function countTables(sql) {
  const tables = [
    'users',
    'departments',
    'department_memberships',
    'department_invites',
    'department_records',
    'record_visitors',
    'meetings',
    'meeting_action_items',
    'attachments',
    'user_notifications',
    'generated_reports',
  ];

  const counts = {};
  for (const table of tables) {
    const [{ count }] = await sql.unsafe(`select count(*)::int as count from ${table}`);
    counts[table] = count;
  }

  return counts;
}

async function main() {
  const sql = createSqlClient();

  try {
    await sql`delete from calendar_meeting_events where user_id <> 1`;
    await sql`delete from calendar_connections where user_id <> 1`;
    await sql`delete from attachments where uploaded_by_user_id <> 1`;
    await sql`delete from meeting_action_items where owner_user_id <> 1 or meeting_id in (select id from meetings where created_by_user_id <> 1)`;
    await sql`delete from meeting_attendees where user_id <> 1 or meeting_id in (select id from meetings where created_by_user_id <> 1)`;
    await sql`delete from meetings where created_by_user_id <> 1`;
    await sql`delete from record_visitors where record_id in (select id from department_records where handled_by_user_id <> 1)`;
    await sql`delete from record_metrics where record_id in (select id from department_records where handled_by_user_id <> 1)`;
    await sql`delete from department_records where handled_by_user_id <> 1`;
    await sql`delete from generated_reports where generated_by_user_id <> 1 or generated_by_user_id is null`;
    await sql`delete from user_notifications where user_id <> 1`;
    await sql`delete from department_invites`;
    await sql`delete from audit_logs where user_id <> 1`;
    await sql`delete from department_memberships where user_id <> 1`;
    await sql`delete from users where id <> 1`;
    await sql`update users set role = 'admin', system_role = 'main_admin', status = 'active' where id = 1`;

    const users = await sql`
      select id, name, email, role, system_role, status
      from users
      order by id
    `;

    console.log(
      JSON.stringify(
        {
          users,
          counts: await countTables(sql),
        },
        null,
        2
      )
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
