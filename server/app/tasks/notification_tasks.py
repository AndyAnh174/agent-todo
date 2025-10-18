from datetime import datetime
from typing import Optional
import logging

from sqlalchemy.orm import Session

from ..celery_app import celery_app
from ..db import get_db
from ..models.notification import Notification, NotificationStatus
from ..models.user import User
from ..services.email_service import email_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def send_notification_email(self, notification_id: str, user_email: str):
    """
    Send notification email task
    """
    try:
        db = next(get_db())
        
        # Get notification
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            logger.error(f"Notification {notification_id} not found")
            return False

        # Get user
        user = db.query(User).filter(User.id == notification.user_id).first()
        if not user:
            logger.error(f"User {notification.user_id} not found")
            return False

        # Send email
        success = await email_service.send_email(
            to_email=user_email,
            subject=notification.subject,
            content=notification.content
        )

        if success:
            # Update notification status
            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.utcnow()
            notification.retry_count = self.request.retries
            db.commit()
            
            logger.info(f"Email sent successfully for notification {notification_id}")
            return True
        else:
            # Mark as failed
            notification.status = NotificationStatus.FAILED
            notification.error_message = "Failed to send email"
            notification.retry_count = self.request.retries
            db.commit()
            
            # Retry if not max retries
            if self.request.retries < self.max_retries:
                raise self.retry(countdown=60 * (2 ** self.request.retries))
            
            return False

    except Exception as e:
        logger.error(f"Error sending notification {notification_id}: {str(e)}")
        
        # Update notification with error
        try:
            db = next(get_db())
            notification = db.query(Notification).filter(Notification.id == notification_id).first()
            if notification:
                notification.status = NotificationStatus.FAILED
                notification.error_message = str(e)
                notification.retry_count = self.request.retries
                db.commit()
        except:
            pass
        
        # Retry if not max retries
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        return False


@celery_app.task
def process_pending_notifications():
    """
    Process all pending notifications that are due
    """
    try:
        db = next(get_db())
        current_time = datetime.utcnow()
        
        # Get pending notifications that are due
        pending_notifications = db.query(Notification).filter(
            Notification.status == NotificationStatus.PENDING,
            Notification.notify_at <= current_time
        ).all()
        
        for notification in pending_notifications:
            # Get user email
            user = db.query(User).filter(User.id == notification.user_id).first()
            if user and user.email:
                # Queue email task
                send_notification_email.delay(notification.id, user.email)
                logger.info(f"Queued notification {notification.id} for user {user.email}")
        
        logger.info(f"Processed {len(pending_notifications)} pending notifications")
        return len(pending_notifications)
        
    except Exception as e:
        logger.error(f"Error processing pending notifications: {str(e)}")
        return 0


@celery_app.task
def retry_failed_notifications():
    """
    Retry failed notifications that haven't exceeded max retries
    """
    try:
        db = next(get_db())
        
        # Get failed notifications with retry_count < 3
        failed_notifications = db.query(Notification).filter(
            Notification.status == NotificationStatus.FAILED,
            Notification.retry_count < 3
        ).all()
        
        for notification in failed_notifications:
            # Get user email
            user = db.query(User).filter(User.id == notification.user_id).first()
            if user and user.email:
                # Reset status and queue for retry
                notification.status = NotificationStatus.PENDING
                db.commit()
                
                # Queue email task
                send_notification_email.delay(notification.id, user.email)
                logger.info(f"Retrying notification {notification.id}")
        
        logger.info(f"Retried {len(failed_notifications)} failed notifications")
        return len(failed_notifications)
        
    except Exception as e:
        logger.error(f"Error retrying failed notifications: {str(e)}")
        return 0
