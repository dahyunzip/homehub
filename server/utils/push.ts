import webpush from 'web-push'
import sequelize from '~/server/utils/db'

let initialized = false

function init() {
  if (initialized) return
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  initialized = true
}

export async function notifyGroup(
  groupId: string,
  excludeUserId: string,
  payload: { title: string; body: string },
) {
  init()

  const [rows] = await sequelize.query(
    `SELECT p.id, p.push_subscription
     FROM profiles p
     JOIN group_members gm ON gm.user_id = p.id
     WHERE gm.group_id = :groupId
       AND p.id != :excludeUserId`,
    { replacements: { groupId, excludeUserId } },
  )

  const members = rows as any[]
  if (members.length === 0) return

  // 알림 DB 저장 (구독 여부 무관, 모든 멤버)
  for (const member of members) {
    await sequelize.query(
      `INSERT INTO notifications (user_id, group_id, title, body)
       VALUES (:userId, :groupId, :title, :body)`,
      { replacements: { userId: member.id, groupId, title: payload.title, body: payload.body } },
    )
  }

  // 웹 푸시 발송 (구독된 멤버만)
  const sends = members
    .filter((m) => m.push_subscription)
    .map(async (row) => {
      try {
        await webpush.sendNotification(row.push_subscription, JSON.stringify(payload))
      } catch (err: any) {
        if (err.statusCode === 410) {
          await sequelize.query(
            `UPDATE profiles SET push_subscription = NULL WHERE id = :id`,
            { replacements: { id: row.id } },
          )
        }
      }
    })

  await Promise.allSettled(sends)
}
