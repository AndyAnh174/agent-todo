import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.smtp_from_email

    async def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        html_content: Optional[str] = None
    ) -> bool:
        """
        Send email using SMTP
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["From"] = self.from_email
            msg["To"] = to_email
            msg["Subject"] = subject

            # Add text content
            text_part = MIMEText(content, "plain", "utf-8")
            msg.attach(text_part)

            # Add HTML content if provided
            if html_content:
                html_part = MIMEText(html_content, "html", "utf-8")
                msg.attach(html_part)

            # Send email
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_host,
                port=self.smtp_port,
                start_tls=True,
                username=self.smtp_user,
                password=self.smtp_password,
            )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def get_todo_reminder_template(self, todo_title: str, due_time: str = None) -> tuple[str, str]:
        """
        Generate email template for todo reminder
        Returns (subject, content)
        """
        subject = f"🔔 Nhắc nhở: {todo_title}"
        
        content = f"""
Xin chào,

Đây là nhắc nhở về công việc của bạn:

📋 Công việc: {todo_title}
"""
        
        if due_time:
            content += f"⏰ Thời hạn: {due_time}\n"
        
        content += """
Hãy hoàn thành công việc này sớm nhất có thể!

Trân trọng,
Hệ thống Agent TODO
"""
        
        return subject, content

    def get_todo_created_template(self, todo_title: str) -> tuple[str, str]:
        """
        Generate email template for new todo created
        """
        subject = f"✅ Tạo mới: {todo_title}"
        
        content = f"""
Xin chào,

Bạn đã tạo một công việc mới:

📋 Công việc: {todo_title}

Chúc bạn hoàn thành tốt!

Trân trọng,
Hệ thống Agent TODO
"""
        
        return subject, content


# Global email service instance
email_service = EmailService()
