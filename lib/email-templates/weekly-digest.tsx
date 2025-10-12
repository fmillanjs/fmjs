interface Update {
  id: number;
  time: string;
  content: string;
  date: string;
}

interface WeeklyDigestEmailProps {
  updates: Update[];
  weekStart: string;
  weekEnd: string;
  unsubscribeUrl: string;
}

export function WeeklyDigestEmail({ updates, weekStart, weekEnd, unsubscribeUrl }: WeeklyDigestEmailProps) {
  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #000;
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
          }
          .date-range {
            color: #6b7280;
            font-size: 14px;
          }
          .update {
            margin-bottom: 24px;
            padding: 16px;
            border-left: 3px solid #000;
            background-color: #f9fafb;
          }
          .update-header {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
          }
          .update-content {
            color: #374151;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
          .unsubscribe {
            color: #6b7280;
            text-decoration: underline;
          }
          .cta {
            text-align: center;
            margin: 32px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Weekly Build Update</h1>
            <p className="date-range">{weekStart} - {weekEnd}</p>
          </div>

          {updates.length === 0 ? (
            <p>No updates this week. Check back next week!</p>
          ) : (
            <>
              <p>Here's what happened this week while building in public:</p>

              {updates.map((update) => (
                <div key={update.id} className="update">
                  <div className="update-header">
                    <span>{update.time}</span>
                    <span>•</span>
                    <span>{update.date}</span>
                  </div>
                  <div className="update-content">{update.content}</div>
                </div>
              ))}

              <div className="cta">
                <a href={process.env.NEXT_PUBLIC_SITE_URL || 'https://fernandomillan.me'} className="cta-button">
                  View Full Journey →
                </a>
              </div>
            </>
          )}

          <div className="footer">
            <p>Thanks for following along! 🚀</p>
            <p>
              <a href={unsubscribeUrl} className="unsubscribe">
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

// Plain HTML version (for Resend which doesn't support JSX in all cases)
export function generateWeeklyDigestHTML({ updates, weekStart, weekEnd, unsubscribeUrl }: WeeklyDigestEmailProps): string {
  const updatesHTML = updates.length === 0
    ? '<p>No updates this week. Check back next week!</p>'
    : `
      <p>Here's what happened this week while building in public:</p>
      ${updates.map(update => `
        <div style="margin-bottom: 24px; padding: 16px; border-left: 3px solid #000; background-color: #f9fafb;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; font-weight: 600;">
            <span>${update.time}</span>
            <span>•</span>
            <span>${update.date}</span>
          </div>
          <div style="color: #374151;">${update.content}</div>
        </div>
      `).join('')}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://fernandomillan.me'}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Full Journey →
        </a>
      </div>
    `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #000;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">Weekly Build Update</h1>
            <p style="color: #6b7280; font-size: 14px;">${weekStart} - ${weekEnd}</p>
          </div>

          ${updatesHTML}

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
            <p>Thanks for following along! 🚀</p>
            <p>
              <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
