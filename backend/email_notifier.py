import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any

logger = logging.getLogger("EmailNotifier")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "alerts@globalhireai.vercel.app")
FROM_NAME = "GlobalHire AI Job Radar"

def build_job_match_html(candidate: Dict[str, Any], job: Dict[str, Any]) -> str:
    name = candidate.get("full_name") or "Candidate"
    edu = candidate.get("education") or "your qualifications"
    title = job.get("title", "")
    comp = job.get("company_name", "")
    sal = job.get("salary_range") or "Competitive Worldwide Compensation"
    loc = job.get("location", "Worldwide Remote")
    cat = job.get("category", "Tech")
    jtype = job.get("job_type", "Remote")
    job_id = job.get("id", "")
    job_url = f"https://globalhireai.vercel.app/?job={job_id}" if job_id else "https://globalhireai.vercel.app"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Job Match for You</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ECEEE9; margin: 0; padding: 30px 10px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
    
    <!-- Top Header -->
    <div style="background-color: #0A241B; padding: 28px 32px; text-align: left;">
      <span style="background-color: rgba(0, 223, 129, 0.15); color: #00DF81; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px;">
        🎯 AI Profile Match Found
      </span>
      <h1 style="color: #FFFFFF; font-size: 24px; margin: 16px 0 0 0; font-weight: 800;">
        GlobalHire AI Job Radar
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #57685E; margin-top: 0;">
        Hello <strong>{name}</strong>,
      </p>
      <p style="font-size: 15px; color: #17261F; line-height: 1.6;">
        Our automated worldwide job scanner just detected a new high-paying role that closely matches your education (<strong>{edu}</strong>) and profile:
      </p>

      <!-- Job Card -->
      <div style="background: linear-gradient(135deg, #F5F7F3 0%, #FFFFFF 100%); border: 2px solid #BCE8D3; border-radius: 20px; padding: 24px; margin: 24px 0;">
        <span style="font-size: 11px; font-weight: 700; color: #0A5734; background: #D7F5E5; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">
          {cat} • {jtype}
        </span>
        <h2 style="font-size: 20px; font-weight: 800; color: #0A241B; margin: 12px 0 6px 0;">
          {title}
        </h2>
        <p style="font-size: 14px; font-weight: 600; color: #57685E; margin: 0 0 16px 0;">
          🏢 {comp} &nbsp;•&nbsp; 📍 {loc}
        </p>

        <div style="background: #FFFFFF; border-radius: 14px; padding: 12px 16px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 20px;">
          <span style="font-size: 12px; color: #6C7A72;">Compensation / Salary:</span>
          <div style="font-size: 16px; font-weight: 800; color: #084D2E;">{sal}</div>
        </div>

        <a href="{job_url}" style="display: block; text-align: center; background-color: #00DF81; color: #0A241B; font-weight: 800; font-size: 15px; padding: 14px 24px; border-radius: 16px; text-decoration: none; box-shadow: 0 4px 14px rgba(0,223,129,0.35);">
          View Job & Apply Online ↗
        </a>
      </div>

      <p style="font-size: 13px; color: #6C7A72; line-height: 1.5; margin-bottom: 0;">
        💡 <strong>Tip:</strong> New remote roles close quickly. We recommend submitting your CV directly within 24 hours.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #F5F7F3; border-top: 1px solid rgba(0,0,0,0.06); padding: 20px 32px; text-align: center;">
      <p style="font-size: 12px; color: #6C7A72; margin: 0;">
        You received this email because you subscribed to automated job match alerts on <a href="https://globalhireai.vercel.app" style="color: #0A5734; font-weight: 700; text-decoration: none;">GlobalHire AI</a>.
      </p>
      <p style="font-size: 11px; color: #9AA7A0; margin: 6px 0 0 0;">
        To manage alerts, update your preferences at https://globalhireai.vercel.app
      </p>
    </div>

  </div>
</body>
</html>"""
    return html

def send_job_match_email(candidate: Dict[str, Any], job: Dict[str, Any]) -> bool:
    """Sends candidate matching job alert email. Logs gracefully if SMTP not yet configured."""
    to_email = candidate.get("email")
    if not to_email:
        return False

    title = job.get("title", "")
    comp = job.get("company_name", "")
    subject = f"🎯 New Job Match: {title} at {comp} — GlobalHire AI"
    html_content = build_job_match_html(candidate, job)

    if not SMTP_USER or not SMTP_PASS:
        logger.info(f"[Email Queued/Simulated] Match for {to_email} -> {title} (Awaiting SMTP_USER/SMTP_PASS in .env)")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())

        logger.info(f"[Email Sent] Successfully dispatched job alert to {to_email} for '{title}'")
        return True
    except Exception as e:
        logger.error(f"[Email Error] Failed to send alert to {to_email}: {e}")
        return False

